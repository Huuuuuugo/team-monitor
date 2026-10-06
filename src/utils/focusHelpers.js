import { getDueDate, isActive } from './issueHelpers.js'
import { memberName } from './formatters.js'
import { getPlaneSlug } from '../services/planeApi.js'

export const FOCUS_CONFIG = {
    timeZone: 'America/Fortaleza',
    msPerDay: 86400000,
    msPerSecond: 1000,
    neutralFactor: 1,
    dayBoundary: {
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
    },
    ignoredActorIds: [
        'b03ae4e2-65c6-4556-853f-adf6b0e5725f',
    ],
    bucketProjects: [
        'Tarefas Avulsas',
    ],
    activity: {
        windowDays: 30,
        decayBase: 0.5,
        halfLifeDays: 7,
        assigneeFactor: 1,
        otherActorFactor: 0.5,
        subissueFactor: 0.5,
    },
    workload: {
        freshRecentDays: 14,
        freshStaleDays: 30,
        freshRecentFactor: 1,
        freshMidFactor: 0.5,
        freshStaleFactor: 0.25,
        backlogOpenFactor: 0.25,
        blockedFactor: 0.5,
        cycleFactor: 1.5,
        overdueStaleDays: 30,
        overdueRecentFactor: 1,
        overdueStaleFactor: 0.5,
    },
    projectWeights: {
        activity: 6,
        started: 3,
        urgentHigh: 3,
        overdue: 3,
        open: 2,
        bucketFactor: 0.3,
    },
    selection: {
        coverage: 0.7,
        minProjects: 1,
        maxProjects: 3,
        hysteresis: {
            enter: 0.22,
            exit: 0.17,
        },
        percentScale: 100,
    },
    modes: {
        focusedShare: 0.5,
        splitCoverage: 0.7,
        splitMinProjects: 2,
        scatteredMinProjects: 4,
        scatteredMinShare: 0.15,
        scatteredTopCount: 3,
        scatteredTopSum: 0.6,
    },
    task: {
        stateStarted: 50,
        stateUnstarted: 20,
        stateBacklog: 5,
        priority: {
            urgent: 40,
            high: 30,
            medium: 15,
            low: 5,
            none: 0,
        },
        dueOverdue7: 30,
        dueOverdue30: 20,
        dueOverdueOlder: 10,
        dueToday: 20,
        dueSoon3: 10,
        dueSoon7: 5,
        overdue7Days: 7,
        overdue30Days: 30,
        soon3Days: 3,
        soon7Days: 7,
        recencyBonus: 15,
        otherActorFactor: 0.5,
        blockedFactor: 0.5,
    },
    storage: {
        snapshotKey: 'tm-focus-snapshot-v1',
    },
}

const formatterCache = new Map()

function formatterFor(timeZone) {
    if (!formatterCache.has(timeZone)) {
        formatterCache.set(
            timeZone,
            new Intl.DateTimeFormat('en-US', {
                timeZone,
                hour12: false,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })
        )
    }
    return formatterCache.get(timeZone)
}

function partsInTimeZone(date, timeZone) {
    const values = {}
    for (const part of formatterFor(timeZone).formatToParts(date)) {
        values[part.type] = part.value
    }
    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
        hour: Number(values.hour) % 24,
        minute: Number(values.minute),
        second: Number(values.second),
    }
}

function timeZoneOffsetMs(date, timeZone) {
    const parts = partsInTimeZone(date, timeZone)
    const asUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    )
    const floored = Math.floor(date.getTime() / FOCUS_CONFIG.msPerSecond) * FOCUS_CONFIG.msPerSecond
    return asUtc - floored
}

export function todayInTimeZone(date = new Date(), config = FOCUS_CONFIG) {
    const parts = partsInTimeZone(date, config.timeZone)
    const month = String(parts.month).padStart(2, '0')
    const day = String(parts.day).padStart(2, '0')
    return `${parts.year}-${month}-${day}`
}

export function endOfDayInTimeZone(dateKey, config = FOCUS_CONFIG) {
    const [year, month, day] = String(dateKey || '').slice(0, 10).split('-').map(Number)
    if (!year || !month || !day) return null

    const boundary = config.dayBoundary
    const wallUtc = Date.UTC(
        year,
        month - 1,
        day,
        boundary.hour,
        boundary.minute,
        boundary.second,
        boundary.millisecond
    )
    let instant = wallUtc - timeZoneOffsetMs(new Date(wallUtc), config.timeZone)
    instant = wallUtc - timeZoneOffsetMs(new Date(instant), config.timeZone)
    return instant
}

export function daysSince(isoString, now = Date.now(), config = FOCUS_CONFIG) {
    if (!isoString) return null
    const time = new Date(isoString).getTime()
    if (Number.isNaN(time)) return null
    return (now - time) / config.msPerDay
}

function isDueToday(issue, now, config) {
    const due = getDueDate(issue)
    return !!due && String(due).slice(0, 10) === todayInTimeZone(new Date(now), config)
}

function isOverdue(issue, now, config) {
    const due = getDueDate(issue)
    if (!due) return false
    const deadline = endOfDayInTimeZone(due, config)
    return deadline !== null && deadline < now
}

function memberKey(member) {
    if (!member) return null
    return member.member?.id || member.id || null
}

export function activityDecay(days, config = FOCUS_CONFIG) {
    if (days === null || days > config.activity.windowDays) return 0
    const elapsed = Math.max(days, 0)
    return Math.pow(config.activity.decayBase, elapsed / config.activity.halfLifeDays)
}

export function activityCreditForIssue(issue, context) {
    const { memberByActorId, issueById, now, config } = context
    const actorId = issue.updated_by
    if (!actorId || config.ignoredActorIds.includes(actorId)) return 0

    const member = memberByActorId.get(actorId)
    if (!member) return 0

    const decay = activityDecay(daysSince(issue.updated_at, now, config), config)
    if (decay <= 0) return 0

    const key = memberKey(member)
    const assigned = (issue._assignees || []).some(item => memberKey(item) === key)
    const roleFactor = assigned ? config.activity.assigneeFactor : config.activity.otherActorFactor

    let subissueFactor = config.neutralFactor
    const parent = issue.parent && issueById ? issueById.get(issue.parent) : null
    if (parent && parent.project === issue.project && parent.updated_by === actorId) {
        const parentDecay = activityDecay(daysSince(parent.updated_at, now, config), config)
        if (parentDecay > 0) subissueFactor = config.activity.subissueFactor
    }

    return decay * roleFactor * subissueFactor
}

export function freshFactor(updatedAt, now = Date.now(), config = FOCUS_CONFIG) {
    const days = daysSince(updatedAt, now, config)
    if (days === null) return config.workload.freshStaleFactor
    if (days <= config.workload.freshRecentDays) return config.workload.freshRecentFactor
    if (days <= config.workload.freshStaleDays) return config.workload.freshMidFactor
    return config.workload.freshStaleFactor
}

function overdueFactor(issue, now, config) {
    if (!isOverdue(issue, now, config)) return 0
    const deadline = endOfDayInTimeZone(getDueDate(issue), config)
    const days = (now - deadline) / config.msPerDay
    return days > config.workload.overdueStaleDays
        ? config.workload.overdueStaleFactor
        : config.workload.overdueRecentFactor
}

function isBlocked() {
    // TODO: blocked_by/relations exige endpoint extra por issue; o payload atual não traz o dado.
    return false
}

function isInCurrentCycle() {
    // TODO: o app não consulta o endpoint de cycles; ativar fatorCiclo quando cycles existir no workspace.
    return false
}

function isBucketProject(project, config) {
    if (!project) return false
    const keys = config.bucketProjects.map(value => String(value).toLowerCase())
    return (
        keys.includes(String(project.id || '').toLowerCase()) ||
        keys.includes(String(project.name || '').toLowerCase())
    )
}

function projectScore(entry, config) {
    const weights = config.projectWeights
    let score =
        weights.activity * Math.sqrt(entry.activityRaw) +
        weights.started * Math.sqrt(entry.startedRaw) +
        weights.urgentHigh * Math.sqrt(entry.uhRaw) +
        weights.overdue * Math.sqrt(entry.overdueRaw) +
        weights.open * Math.sqrt(entry.openRaw)
    if (isBucketProject(entry.project, config)) score *= weights.bucketFactor
    return score
}

function selectFocusProjects(scored, previousIds, config) {
    if (!scored.length) return []

    const { selection } = config
    const top = scored[0]
    const selected = [top]

    if (!previousIds || !previousIds.length) {
        let cumulative = top.share
        for (const entry of scored.slice(selection.minProjects)) {
            if (selected.length >= selection.maxProjects || cumulative >= selection.coverage) break
            selected.push(entry)
            cumulative += entry.share
        }
        return selected
    }

    const previous = new Set(previousIds)
    for (const entry of scored.slice(selection.minProjects)) {
        if (selected.length >= selection.maxProjects) break

        if (previous.has(entry.project.id)) {
            if (entry.share >= selection.hysteresis.exit) selected.push(entry)
        } else if (entry.share >= selection.hysteresis.enter) {
            selected.push(entry)
        }
    }
    return selected
}

function focusModeOf(scored, activityTotal, assignedActiveCount, config) {
    const { modes } = config
    if (!scored.length || (activityTotal <= 0 && assignedActiveCount <= 0)) return 'no_data'

    const shares = scored.map(entry => entry.share)
    const topShare = shares[0]
    const top2 = shares.slice(0, modes.splitMinProjects).reduce((sum, share) => sum + share, 0)
    const top3 = shares.slice(0, modes.scatteredTopCount).reduce((sum, share) => sum + share, 0)
    const significant = shares.filter(share => share >= modes.scatteredMinShare).length

    if (topShare >= modes.focusedShare) return 'focused'
    if (significant >= modes.scatteredMinProjects || top3 < modes.scatteredTopSum) return 'scattered'
    if (shares.length >= modes.splitMinProjects && top2 >= modes.splitCoverage) return 'split'
    if (shares.length >= modes.scatteredTopCount && top3 >= modes.splitCoverage) return 'split'
    return 'scattered'
}

function dueTaskScore(issue, now, config) {
    const due = getDueDate(issue)
    if (!due) return 0

    const deadline = endOfDayInTimeZone(due, config)
    if (deadline === null) return 0

    const days = (now - deadline) / config.msPerDay
    if (days > 0) {
        if (days <= config.task.overdue7Days) return config.task.dueOverdue7
        if (days <= config.task.overdue30Days) return config.task.dueOverdue30
        return config.task.dueOverdueOlder
    }

    if (isDueToday(issue, now, config)) return config.task.dueToday
    if (-days <= config.task.soon3Days) return config.task.dueSoon3
    if (-days <= config.task.soon7Days) return config.task.dueSoon7
    return 0
}

function recencyBonus(issue, memberKeyValue, now, config) {
    const actorId = issue.updated_by
    if (!actorId || config.ignoredActorIds.includes(actorId)) return 0

    const decay = activityDecay(daysSince(issue.updated_at, now, config), config)
    if (decay <= 0) return 0

    const base = config.task.recencyBonus * decay
    return actorId === memberKeyValue ? base : base * config.task.otherActorFactor
}

export function taskScore(issue, memberKeyValue, now = Date.now(), config = FOCUS_CONFIG) {
    const group = issue._state?.group
    const fresh = freshFactor(issue.updated_at, now, config)

    let state = 0
    if (group === 'started') state = config.task.stateStarted * fresh
    else if (group === 'unstarted') state = config.task.stateUnstarted
    else if (group === 'backlog') state = config.task.stateBacklog

    let score =
        state +
        (config.task.priority[issue.priority] || 0) +
        dueTaskScore(issue, now, config) +
        recencyBonus(issue, memberKeyValue, now, config)

    if (isBlocked(issue)) score *= config.task.blockedFactor
    return score
}

export function compareTask(a, b, memberKeyValue, now = Date.now(), config = FOCUS_CONFIG) {
    const scoreDiff = taskScore(b, memberKeyValue, now, config) - taskScore(a, memberKeyValue, now, config)
    if (scoreDiff) return scoreDiff

    const dueA = getDueDate(a)
    const dueB = getDueDate(b)
    if (dueA && dueB && dueA !== dueB) {
        return String(dueA).slice(0, 10).localeCompare(String(dueB).slice(0, 10))
    }
    if (dueA && !dueB) return -1
    if (!dueA && dueB) return 1

    const priorityDiff =
        (config.task.priority[b.priority] || 0) - (config.task.priority[a.priority] || 0)
    if (priorityDiff) return priorityDiff

    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
}

function pickTopIssue(issues, memberKeyValue, now, config) {
    return [...issues].sort((a, b) => compareTask(a, b, memberKeyValue, now, config))[0] || null
}

function snapshotStorageKey(config) {
    let slug = ''
    try {
        slug = getPlaneSlug() || ''
    } catch {
        slug = ''
    }
    return `${config.storage.snapshotKey}:${slug}`
}

export function loadFocusSnapshot(config = FOCUS_CONFIG) {
    try {
        if (typeof sessionStorage === 'undefined') return null
        const raw = sessionStorage.getItem(snapshotStorageKey(config))
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed.people === 'object' ? parsed.people : null
    } catch {
        return null
    }
}

export function saveFocusSnapshot(people, config = FOCUS_CONFIG) {
    try {
        if (typeof sessionStorage === 'undefined') return
        sessionStorage.setItem(
            snapshotStorageKey(config),
            JSON.stringify({ updatedAt: Date.now(), people })
        )
    } catch {
        return
    }
}

export function buildMemberProjectFocus(issues, members, options = {}) {
    const config = options.config || FOCUS_CONFIG
    const now = options.now ?? Date.now()
    const previousFocus = options.previousFocus || null

    const groups = new Map()
    const memberByActorId = new Map()

    const groupOf = (member) => {
        const key = memberKey(member)
        if (!key) return null
        if (!groups.has(key)) groups.set(key, { key, member, projects: new Map() })
        return groups.get(key)
    }

    for (const member of members || []) {
        groupOf(member)
        const key = memberKey(member)
        if (!key) continue
        memberByActorId.set(key, member)
        if (member.id) memberByActorId.set(member.id, member)
        if (member.member?.id) memberByActorId.set(member.member.id, member)
    }

    const allIssues = issues || []
    const issueById = new Map()
    for (const issue of allIssues) {
        if (issue.id) issueById.set(issue.id, issue)
    }

    const projectOf = (group, project) => {
        if (!group) return null
        if (!group.projects.has(project.id)) {
            group.projects.set(project.id, {
                project,
                activityRaw: 0,
                openCount: 0,
                openRaw: 0,
                startedCount: 0,
                startedRaw: 0,
                urgentCount: 0,
                highCount: 0,
                uhRaw: 0,
                overdueCount: 0,
                overdueRaw: 0,
                wip: 0,
                issues: [],
            })
        }
        return group.projects.get(project.id)
    }

    const activityContext = { memberByActorId, issueById, now, config }

    for (const issue of allIssues) {
        const project = issue._project
        if (!project) continue

        const member = issue.updated_by ? memberByActorId.get(issue.updated_by) : null
        if (member) {
            const credit = activityCreditForIssue(issue, activityContext)
            if (credit > 0) {
                const entry = projectOf(groupOf(member), project)
                if (entry) entry.activityRaw += credit
            }
        }

        if (!isActive(issue)) continue

        const assignees = issue._assignees || []
        if (!assignees.length) continue

        const group = issue._state?.group
        const fresh = freshFactor(issue.updated_at, now, config)
        const blockedFactor = isBlocked(issue) ? config.workload.blockedFactor : config.neutralFactor
        const cycleFactor = isInCurrentCycle(issue) ? config.workload.cycleFactor : config.neutralFactor
        const overdueFactorValue = overdueFactor(issue, now, config)

        for (const member of assignees) {
            const entry = projectOf(groupOf(member), project)
            if (!entry) continue

            entry.openCount += 1
            entry.issues.push(issue)

            if (group === 'backlog') {
                entry.openRaw += blockedFactor * cycleFactor * config.workload.backlogOpenFactor
                continue
            }

            entry.openRaw += blockedFactor * cycleFactor

            if (group === 'started') {
                entry.startedCount += 1
                entry.startedRaw += blockedFactor * fresh
                entry.wip += 1
            }

            if (issue.priority === 'urgent') {
                entry.urgentCount += 1
                entry.uhRaw += blockedFactor * fresh
            }
            if (issue.priority === 'high') {
                entry.highCount += 1
                entry.uhRaw += blockedFactor * fresh
            }

            if (overdueFactorValue > 0) {
                entry.overdueCount += 1
                entry.overdueRaw += blockedFactor * overdueFactorValue
            }
        }
    }

    const entries = [...groups.values()].map(group => {
        const scored = [...group.projects.values()]
            .map(entry => ({ ...entry, score: projectScore(entry, config) }))
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score)

        const totalScore = scored.reduce((sum, entry) => sum + entry.score, 0)
        for (const entry of scored) {
            entry.share = totalScore > 0 ? entry.score / totalScore : 0
        }

        const previousIds = previousFocus ? previousFocus[group.key] : null
        const selected = selectFocusProjects(scored, previousIds, config)
        const selectedIds = new Set(selected.map(entry => entry.project.id))

        const toProjectPayload = (entry) => ({
            project: entry.project,
            activity: entry.activityRaw,
            activity_raw: entry.activityRaw,
            open: entry.openCount,
            open_raw: entry.openRaw,
            started: entry.startedCount,
            started_raw: entry.startedRaw,
            urgent: entry.urgentCount,
            high: entry.highCount,
            uh_raw: entry.uhRaw,
            overdue: entry.overdueCount,
            overdue_raw: entry.overdueRaw,
            issues: entry.issues,
            score: entry.score,
            percent: Math.round(entry.share * config.selection.percentScale),
            percent_raw: entry.share * config.selection.percentScale,
            focused: selectedIds.has(entry.project.id),
            topIssue: pickTopIssue(entry.issues, group.key, now, config),
        })

        const allProjects = scored.map(toProjectPayload)
        const focusProjects = allProjects.filter(entry => entry.focused)

        const activityTotal = scored.reduce((sum, entry) => sum + entry.activityRaw, 0)
        const assignedActiveCount = scored.reduce((sum, entry) => sum + entry.openCount, 0)
        const wipTotal = scored.reduce((sum, entry) => sum + entry.wip, 0)
        const concentration = scored.reduce((sum, entry) => sum + entry.share * entry.share, 0)

        return {
            key: group.key,
            member: group.member,
            totalScore,
            allProjects,
            focusProjects,
            hiddenProjects: Math.max(scored.length - focusProjects.length, 0),
            projectCount: scored.length,
            openCount: assignedActiveCount,
            focusMode: focusModeOf(scored, activityTotal, assignedActiveCount, config),
            concentration,
            wipTotal,
            activityTotal,
        }
    })

    return entries
        .sort((a, b) => {
            const dataA = a.focusMode !== 'no_data'
            const dataB = b.focusMode !== 'no_data'
            if (dataA !== dataB) return dataA ? -1 : 1

            if (dataA) {
                if (a.activityTotal !== b.activityTotal) return b.activityTotal - a.activityTotal
                if (a.totalScore !== b.totalScore) return b.totalScore - a.totalScore
            }

            return memberName(a.member).localeCompare(memberName(b.member), 'pt-BR')
        })
        .map(({ activityTotal, ...entry }) => entry)
}
