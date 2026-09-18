export const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }

export function localDateKey(isoString) {
    if (!isoString) return ''
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export function today() {
    return localDateKey(new Date().toISOString())
}

export function getDueDate(issue) {
    return issue?.due_date || issue?.target_date || null
}

export function isOverdue(issue) {
    const due = getDueDate(issue)
    if (!due) return false
    const deadline = new Date(`${due.slice(0, 10)}T23:59:59.999`)
    return deadline.getTime() < Date.now()
}

export function isDueToday(issue) {
    const due = getDueDate(issue)
    return !!due && due.slice(0, 10) === today()
}

export function isCreatedToday(issue) {
    return localDateKey(issue.created_at) === today()
}

export function isUpdatedToday(issue) {
    return localDateKey(issue.updated_at) === today()
}

export function isActive(issue) {
    const group = issue._state?.group
    return !!group && !['completed', 'cancelled'].includes(group)
}

export function isOpenGroup(group) {
    return ['backlog', 'unstarted', 'started'].includes(group)
}

export function comparePriority(a, b) {
    return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
}

export function sortByPriority(issues) {
    return [...issues].sort(comparePriority)
}

export function sortByPriorityThenName(issues) {
    return [...issues].sort((a, b) =>
        comparePriority(a, b) || (a.name || '').localeCompare(b.name || '', 'pt-BR')
    )
}

export function sortByDueDate(issues) {
    return [...issues].sort((a, b) =>
        String(getDueDate(a) || '9999-12-31').localeCompare(String(getDueDate(b) || '9999-12-31'))
    )
}

export function sortByDateDesc(issues, field) {
    return [...issues].sort((a, b) => new Date(b[field] || 0) - new Date(a[field] || 0))
}

export function groupByAssignee(issues, memberMap) {
    const groups = new Map()

    for (const issue of issues) {
        const ids = issue.assignees && issue.assignees.length ? issue.assignees : [null]
        for (const id of ids) {
            const key = id || '__unassigned__'
            if (!groups.has(key)) {
                groups.set(key, { member: (memberMap || {})[id] || null, issues: [] })
            }
            groups.get(key).issues.push(issue)
        }
    }

    return [...groups.values()].sort((a, b) => {
        if (!a.member && b.member) return 1
        if (a.member && !b.member) return -1
        return b.issues.length - a.issues.length
    })
}

export function filterIssues(issues, filters) {
    const search = (filters?.search || '').trim().toLowerCase()

    return issues.filter(issue => {
        if (filters?.projectId && issue.project !== filters.projectId) return false
        if (filters?.memberId && !(issue.assignees || []).includes(filters.memberId)) return false
        if (filters?.stateName && issue._state?.name !== filters.stateName) return false
        if (filters?.priority && issue.priority !== filters.priority) return false

        if (search) {
            const inName = (issue.name || '').toLowerCase().includes(search)
            const inDescription = (issue.description_html || '').toLowerCase().includes(search)
            const inSequence = String(issue.sequence_id || '') === search.replace('#', '')
            if (!inName && !inDescription && !inSequence) return false
        }

        return true
    })
}
