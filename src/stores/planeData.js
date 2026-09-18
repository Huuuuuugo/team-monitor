import { defineStore } from 'pinia'
import { apiBase, fetchAll } from '../services/planeApi.js'
import { isCreatedToday, isUpdatedToday, isActive, isOverdue } from '../utils/issueHelpers.js'

const CACHE_KEY = 'tm-plane-cache-v1'
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
        lastFetchAt: null,
        loading: false,
        error: null,
        partialErrors: [],
        progress: { phase: '', done: 0, total: 0 },
        stateMap: {},
        memberMap: {},
        projectMap: {},
        activitiesMap: {},
    }),

    getters: {
        enrichedIssues: (state) => state.issues.map(issue => ({
            ...issue,
            _state: state.stateMap[issue.state] || null,
            _project: state.projectMap[issue.project] || null,
            _assignees: (issue.assignees || []).map(id => state.memberMap[id]).filter(Boolean),
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
            if (this.loading) return
            if (!force && this.tryHydrate()) return

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

                let projects = projectsRaw.filter(project => project.is_member === true)
                if (!projects.length) projects = projectsRaw

                this.projects = projects
                this.members = membersRaw
                this.rebuildMaps()

                const total = projects.length
                this.progress = { phase: 'Carregando projetos', done: 0, total }
                let done = 0

                await runWithConcurrency(projects, MAX_CONCURRENT_TASKS, async (project) => {
                    try {
                        let issues
                        try {
                            issues = await fetchAll(
                                `${apiBase()}/projects/${project.id}/issues/?expand=state`
                            )
                        } catch (err) {
                            issues = await fetchAll(`${apiBase()}/projects/${project.id}/issues/`)
                        }

                        const expandedStates = new Map()
                        for (const issue of issues) {
                            if (issue.state && typeof issue.state === 'object') {
                                if (issue.state.id) expandedStates.set(issue.state.id, issue.state)
                                issue.state = issue.state.id
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

                        this.issues = [
                            ...this.issues.filter(issue => issue.project !== project.id),
                            ...issues,
                        ]
                        this.states = [...this.states, ...states]
                        this.rebuildMaps()
                    } catch (err) {
                        this.partialErrors.push(`${project.name}: ${err.message}`)
                    } finally {
                        done += 1
                        this.progress = { phase: 'Carregando projetos', done, total }
                    }
                })

                const projectIds = new Set(projects.map(project => project.id))
                this.issues = this.issues.filter(issue => projectIds.has(issue.project))
                this.states = dedupeById(this.states)
                this.rebuildMaps()
                this.lastFetchAt = Date.now()
                this.persistCache()
            } catch (err) {
                console.error('Falha ao carregar dados do Plane:', err)
                this.error = err.message || 'Erro desconhecido ao carregar os dados.'
            } finally {
                this.loading = false
                this.progress = { phase: '', done: 0, total: 0 }
            }
        },

        async refresh() {
            return this.loadAll(true)
        },

        rebuildMaps() {
            this.projectMap = Object.fromEntries(this.projects.map(project => [project.id, project]))
            this.stateMap = Object.fromEntries(this.states.map(state => [state.id, state]))

            const memberMap = {}
            for (const member of this.members) {
                if (member.id) memberMap[member.id] = member
                if (member.member && member.member.id) memberMap[member.member.id] = member
            }
            this.memberMap = memberMap
        },

        tryHydrate() {
            if (this.issues.length) return true

            try {
                const raw = sessionStorage.getItem(CACHE_KEY)
                if (!raw) return false

                const cache = JSON.parse(raw)
                if (!cache.lastFetchAt || Date.now() - cache.lastFetchAt > CACHE_TTL_MS) return false

                this.projects = cache.projects || []
                this.issues = cache.issues || []
                this.states = cache.states || []
                this.members = cache.members || []
                this.lastFetchAt = cache.lastFetchAt
                this.rebuildMaps()
                return true
            } catch (err) {
                console.warn('Cache de sessão indisponível:', err)
                return false
            }
        },

        persistCache() {
            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                    projects: this.projects,
                    issues: this.issues,
                    states: this.states,
                    members: this.members,
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

            const data = await fetchAll(
                `${apiBase()}/projects/${issue.project}/issues/${issue.id}/activities/`
            )

            const list = (Array.isArray(data) ? data : [])
                .filter(activity => activity.field === 'state')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

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
