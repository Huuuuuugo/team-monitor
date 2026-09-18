import { defineStore } from 'pinia'
import { apiBase, fetchAll, getPlaneSlug, setPlaneSlug } from '../services/planeApi.js'
import { isCreatedToday, isUpdatedToday, isActive, isOverdue } from '../utils/issueHelpers.js'

const CACHE_KEY_PREFIX = 'tm-plane-cache-v3:'
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CONCURRENT_TASKS = 32

async function runWithConcurrency(items, limit, worker) {
    const queue = [...items]
    const workerCount = Math.min(limit, queue.length)

    const runners = Array.from({ length: workerCount }, async () => {
        while (queue.length) {
            const item = queue.shift()
            await worker(item)
        }
    })

    await Promise.all(runners)
}

function dedupeById(items) {
    const seen = new Map()
    for (const item of items) {
        if (item?.id && !seen.has(item.id)) seen.set(item.id, item)
    }
    return [...seen.values()]
}

export const usePlaneDataStore = defineStore('planeData', {
    state: () => ({
        projects: [],
        issues: [],
        states: [],
        members: [],
        labels: [],
        lastFetchAt: null,
        loading: false,
        error: null,
        partialErrors: [],
        progress: { phase: '', done: 0, total: 0 },
        stateMap: {},
        memberMap: {},
        projectMap: {},
        labelMap: {},
        activitiesMap: {},
        loadedSlug: null,
        loadToken: 0,
    }),

    getters: {
        enrichedIssues: (state) => state.issues.map(issue => ({
            ...issue,
            _state: state.stateMap[issue.state] || null,
            _project: state.projectMap[issue.project] || null,
            _assignees: (issue.assignees || []).map(id => state.memberMap[id]).filter(Boolean),
            _labels: (issue.labels || [])
                .map(label => (label && typeof label === 'object' ? label : state.labelMap[label]))
                .filter(Boolean),
        })),

        openIssues() {
            return this.enrichedIssues.filter(isActive)
        },

        overdueIssues() {
            return this.enrichedIssues.filter(issue => isActive(issue) && isOverdue(issue))
        },

        inProgressOverdueIssues() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'started' && isOverdue(issue))
        },

        createdTodayIssues() {
            return this.enrichedIssues.filter(isCreatedToday)
        },

        updatedTodayIssues() {
            return this.enrichedIssues.filter(issue => isUpdatedToday(issue) && !isCreatedToday(issue))
        },

        touchedTodayIssues() {
            return this.enrichedIssues.filter(isUpdatedToday)
        },

        todayEventCount() {
            return this.createdTodayIssues.length + this.updatedTodayIssues.length
        },

        completedTodayCount: (state) => state.issues.filter(issue =>
            state.stateMap[issue.state]?.group === 'completed' && isUpdatedToday(issue)
        ).length,

        stateOptions: (state) => {
            const seen = new Map()
            for (const item of state.states) {
                if (item?.name && !seen.has(item.name)) seen.set(item.name, item)
            }
            return [...seen.values()].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'))
        },
    },

    actions: {
        async loadAll(force = false) {
            const slug = getPlaneSlug()

            if (!force && this.loadedSlug === slug && this.tryHydrate()) return

            const token = ++this.loadToken
            this.loading = true
            this.error = null
            this.partialErrors = []

            try {
                this.progress = { phase: 'Carregando projetos e membros', done: 0, total: 2 }

                const [projectsRaw, membersRaw] = await Promise.all([
                    fetchAll(`${apiBase()}/projects/`),
                    fetchAll(`${apiBase()}/members/`).catch((err) => {
                        this.partialErrors.push(`Membros: ${err.message}`)
                        return []
                    }),
                ])

                if (token !== this.loadToken) return

                let projects = projectsRaw.filter(project => project.is_member === true)
                if (!projects.length) projects = projectsRaw

                this.projects = projects
                this.members = membersRaw
                this.rebuildMaps()

                const total = projects.length
                this.progress = { phase: 'Carregando projetos', done: 0, total }
                let done = 0

                await runWithConcurrency(projects, MAX_CONCURRENT_TASKS, async (project) => {
                    if (token !== this.loadToken) return
                    try {
                        let issues
                        let fallbackLabels = []
                        try {
                            issues = await fetchAll(
                                `${apiBase()}/projects/${project.id}/issues/?expand=state,labels`
                            )
                        } catch (err) {
                            issues = await fetchAll(`${apiBase()}/projects/${project.id}/issues/`)
                            fallbackLabels = await fetchAll(
                                `${apiBase()}/projects/${project.id}/labels/`
                            ).catch(() => [])
                        }

                        if (token !== this.loadToken) return

                        const expandedStates = new Map()
                        const expandedLabels = new Map()
                        for (const issue of issues) {
                            if (issue.state && typeof issue.state === 'object') {
                                if (issue.state.id) expandedStates.set(issue.state.id, issue.state)
                                issue.state = issue.state.id
                            }
                            if (Array.isArray(issue.labels)) {
                                issue.labels = issue.labels.map(label => {
                                    if (label && typeof label === 'object') {
                                        if (label.id) expandedLabels.set(label.id, label)
                                        return label.id
                                    }
                                    return label
                                })
                            }
                        }

                        let states
                        if (expandedStates.size) {
                            states = [...expandedStates.values()]
                        } else {
                            states = this.states.filter(state => state.project === project.id)
                            if (!states.length) {
                                states = await fetchAll(
                                    `${apiBase()}/projects/${project.id}/states/`
                                )
                            }
                        }

                        const labels = [...fallbackLabels, ...expandedLabels.values()]

                        if (token !== this.loadToken) return

                        this.issues = [
                            ...this.issues.filter(issue => issue.project !== project.id),
                            ...issues,
                        ]
                        this.states = [...this.states, ...states]
                        this.labels = [
                            ...this.labels.filter(label => label.project !== project.id),
                            ...labels,
                        ]
                        this.rebuildMaps()
                    } catch (err) {
                        if (token !== this.loadToken) return
                        this.partialErrors.push(`${project.name}: ${err.message}`)
                    } finally {
                        if (token === this.loadToken) {
                            done += 1
                            this.progress = { phase: 'Carregando projetos', done, total }
                        }
                    }
                })

                if (token !== this.loadToken) return

                const projectIds = new Set(projects.map(project => project.id))
                this.issues = this.issues.filter(issue => projectIds.has(issue.project))
                this.states = dedupeById(this.states)
                this.labels = dedupeById(this.labels)
                this.rebuildMaps()
                this.loadedSlug = slug
                this.lastFetchAt = Date.now()
                this.persistCache()
            } catch (err) {
                if (token !== this.loadToken) return
                console.error('Falha ao carregar dados do Plane:', err)
                this.error = err.message || 'Erro desconhecido ao carregar os dados.'
            } finally {
                if (token === this.loadToken) {
                    this.loading = false
                    this.progress = { phase: '', done: 0, total: 0 }
                }
            }
        },

        async refresh() {
            return this.loadAll(true)
        },

        async switchSlug(slug) {
            const next = setPlaneSlug(slug)
            if (!next) return
            this.resetData()
            await this.loadAll(true)
        },

        resetData() {
            this.loadToken += 1
            this.loading = false
            this.projects = []
            this.issues = []
            this.states = []
            this.members = []
            this.labels = []
            this.lastFetchAt = null
            this.error = null
            this.partialErrors = []
            this.progress = { phase: '', done: 0, total: 0 }
            this.stateMap = {}
            this.memberMap = {}
            this.projectMap = {}
            this.labelMap = {}
            this.activitiesMap = {}
            this.loadedSlug = null
        },

        rebuildMaps() {
            this.projectMap = Object.fromEntries(this.projects.map(project => [project.id, project]))
            this.stateMap = Object.fromEntries(this.states.map(state => [state.id, state]))
            this.labelMap = Object.fromEntries(this.labels.map(label => [label.id, label]))

            const memberMap = {}
            for (const member of this.members) {
                if (member.id) memberMap[member.id] = member
                if (member.member && member.member.id) memberMap[member.member.id] = member
            }
            this.memberMap = memberMap
        },

        tryHydrate() {
            if (this.issues.length) return true

            const slug = getPlaneSlug()

            try {
                const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + slug)
                if (!raw) return false

                const cache = JSON.parse(raw)
                if (!cache.lastFetchAt || Date.now() - cache.lastFetchAt > CACHE_TTL_MS) return false

                this.projects = cache.projects || []
                this.issues = cache.issues || []
                this.states = cache.states || []
                this.members = cache.members || []
                this.labels = cache.labels || []
                this.lastFetchAt = cache.lastFetchAt
                this.loadedSlug = slug
                this.rebuildMaps()
                return true
            } catch (err) {
                console.warn('Cache de sessão indisponível:', err)
                return false
            }
        },

        persistCache() {
            try {
                sessionStorage.setItem(CACHE_KEY_PREFIX + getPlaneSlug(), JSON.stringify({
                    projects: this.projects,
                    issues: this.issues,
                    states: this.states,
                    members: this.members,
                    labels: this.labels,
                    lastFetchAt: this.lastFetchAt,
                }))
            } catch (err) {
                console.warn('Não foi possível gravar o cache de sessão:', err)
            }
        },

        clearError() {
            this.error = null
        },

        clearPartialErrors() {
            this.partialErrors = []
        },

        async loadActivities(issue) {
            if (!issue || !issue.id || !issue.project) return []
            if (this.activitiesMap[issue.id]) return this.activitiesMap[issue.id]

            const slug = getPlaneSlug()

            const data = await fetchAll(
                `${apiBase()}/projects/${issue.project}/issues/${issue.id}/activities/`
            )

            const list = (Array.isArray(data) ? data : [])
                .filter(activity => activity.field)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            if (getPlaneSlug() !== slug) return list

            this.activitiesMap = { ...this.activitiesMap, [issue.id]: list }
            return list
        },

        async loadActivitiesForIssues(issues) {
            const pending = (issues || []).filter(issue => issue && issue.id && !(issue.id in this.activitiesMap))

            await runWithConcurrency(pending, MAX_CONCURRENT_TASKS, async (issue) => {
                try {
                    await this.loadActivities(issue)
                } catch (err) {
                    console.warn(`Falha ao carregar atividades da issue ${issue.id}:`, err)
                    this.activitiesMap = { ...this.activitiesMap, [issue.id]: [] }
                }
            })
        },
    },
})
