export const PRIORITY_COLORS = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
    none: '#9ca3af',
}

export const PRIORITY_LABELS = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
    none: 'Sem prioridade',
}

export const STATE_GROUP_COLORS = {
    backlog: '#6b7280',
    unstarted: '#3b82f6',
    started: '#f59e0b',
    completed: '#22c55e',
    cancelled: '#ef4444',
}

export const STATE_GROUP_LABELS = {
    backlog: 'Backlog',
    unstarted: 'A Fazer',
    started: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
}

export const STATE_GROUP_ORDER = ['backlog', 'unstarted', 'started', 'completed', 'cancelled']

export const PRIORITY_TONES = {
    urgent: { background: 'rgba(244, 63, 94, 0.16)', color: '#fda4af' },
    high: { background: 'rgba(249, 115, 22, 0.16)', color: '#fdba74' },
    medium: { background: 'rgba(234, 179, 8, 0.16)', color: '#fde047' },
    low: { background: 'rgba(59, 110, 246, 0.18)', color: '#93b4fd' },
    none: { background: 'rgba(156, 163, 175, 0.12)', color: '#9ca3af' },
}

export const PRIORITY_TONES_LIGHT = {
    urgent: { background: 'rgba(220, 38, 38, 0.12)', color: '#b91c1c' },
    high: { background: 'rgba(234, 88, 12, 0.14)', color: '#c2410c' },
    medium: { background: 'rgba(202, 138, 4, 0.16)', color: '#854d0e' },
    low: { background: 'rgba(37, 99, 235, 0.12)', color: '#1d4ed8' },
    none: { background: 'rgba(100, 116, 139, 0.14)', color: '#475569' },
}

export function priorityTone(priority, isDark) {
    const tones = isDark ? PRIORITY_TONES : PRIORITY_TONES_LIGHT
    return tones[priority] || tones.none
}

export const STATE_GROUP_TONES = {
    backlog: { background: 'rgba(148, 163, 184, 0.14)', color: '#cbd5e1' },
    unstarted: { background: 'rgba(59, 110, 246, 0.18)', color: '#93b4fd' },
    started: { background: 'rgba(245, 158, 11, 0.16)', color: '#fcd34d' },
    completed: { background: 'rgba(34, 197, 94, 0.16)', color: '#86efac' },
    cancelled: { background: 'rgba(244, 63, 94, 0.16)', color: '#fda4af' },
}

export const STATE_GROUP_TONES_LIGHT = {
    backlog: { background: 'rgba(100, 116, 139, 0.14)', color: '#475569' },
    unstarted: { background: 'rgba(37, 99, 235, 0.12)', color: '#1d4ed8' },
    started: { background: 'rgba(217, 119, 6, 0.16)', color: '#b45309' },
    completed: { background: 'rgba(22, 163, 74, 0.14)', color: '#166534' },
    cancelled: { background: 'rgba(220, 38, 38, 0.12)', color: '#b91c1c' },
}

export function stateGroupTone(group, isDark) {
    const tones = isDark ? STATE_GROUP_TONES : STATE_GROUP_TONES_LIGHT
    return tones[group] || tones.backlog
}
