import { formatDate } from './formatters.js'

export const MODULE_STATUS_LABELS = {
    backlog: 'Backlog',
    planned: 'Planejado',
    'in-progress': 'Em Andamento',
    paused: 'Pausado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
}

export const MODULE_STATUS_COLORS = {
    backlog: '#6b7280',
    planned: '#3b82f6',
    'in-progress': '#f59e0b',
    paused: '#a855f7',
    completed: '#22c55e',
    cancelled: '#ef4444',
}

export function moduleStatusLabel(status) {
    return MODULE_STATUS_LABELS[status] || status || 'Sem status'
}

export function moduleStatusColor(status) {
    return MODULE_STATUS_COLORS[status] || '#9ca3af'
}

export function isModuleOpen(module) {
    return !['completed', 'cancelled'].includes(module?.status)
}

export function moduleDateRange(module) {
    const start = module?.start_date
    const end = module?.target_date
    if (!end) return ''
    if (start) return `${formatDate(start)} → ${formatDate(end)}`
    return formatDate(end)
}

export function sortModules(modules) {
    return [...modules].sort((a, b) => {
        const openDiff = Number(isModuleOpen(b)) - Number(isModuleOpen(a))
        if (openDiff) return openDiff

        const dueA = String(a.target_date || '9999-12-31')
        const dueB = String(b.target_date || '9999-12-31')
        if (dueA !== dueB) return dueA.localeCompare(dueB)

        return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
    })
}

export function filterModules(modules, filters) {
    const search = (filters?.search || '').trim().toLowerCase()

    return modules.filter(module => {
        if (filters?.projectId && module.project !== filters.projectId) return false

        if (filters?.memberId) {
            const ids = [module.lead, ...(module.members || [])].filter(Boolean)
            if (!ids.includes(filters.memberId)) return false
        }

        if (search) {
            const inName = (module.name || '').toLowerCase().includes(search)
            const inProject = (module._project?.name || '').toLowerCase().includes(search)
            if (!inName && !inProject) return false
        }

        return true
    })
}
