import { PRIORITY_LABELS } from './priorityColors.js'
import { formatDate } from './formatters.js'

export const ACTIVITY_FIELD_LABELS = {
    state: 'Estado',
    priority: 'Prioridade',
    assignees: 'Responsáveis',
    labels: 'Etiquetas',
    name: 'Título',
    description: 'Descrição',
    target_date: 'Prazo',
    start_date: 'Início',
    due_date: 'Prazo',
    estimate_point: 'Estimativa',
    parent: 'Issue pai',
    module: 'Módulo',
    cycle: 'Ciclo',
    link: 'Link',
    attachment: 'Anexo',
}

export function activityFieldLabel(field) {
    if (!field) return 'Alteração'
    return ACTIVITY_FIELD_LABELS[field] || field
}

function stripHtml(html) {
    return String(html)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function activityValueLabel(field, value) {
    if (value === null || value === undefined || value === '') return '—'

    const text = String(value)

    if (field === 'priority') return PRIORITY_LABELS[text] || text

    if (field === 'target_date' || field === 'start_date' || field === 'due_date') {
        const formatted = formatDate(text)
        return formatted === '—' ? text : formatted
    }

    if (field === 'description') {
        const plain = stripHtml(text)
        if (!plain) return '—'
        return plain.length > 90 ? `${plain.slice(0, 90)}…` : plain
    }

    if (field === 'name') {
        return text.length > 70 ? `${text.slice(0, 70)}…` : text
    }

    return text
}

function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== ''
}

export function activityActionLabel(field, oldValue, newValue) {
    const hadOld = hasValue(oldValue)
    const hasNew = hasValue(newValue)
    const oldLabel = activityValueLabel(field, oldValue)
    const newLabel = activityValueLabel(field, newValue)

    switch (field) {
        case 'state':
            if (!hadOld) return `definiu o estado para ${newLabel}`
            if (!hasNew) return `removeu o estado (era ${oldLabel})`
            return `mudou o estado de ${oldLabel} para ${newLabel}`

        case 'priority':
            if (!hadOld) return `definiu a prioridade para ${newLabel}`
            if (!hasNew) return `removeu a prioridade (era ${oldLabel})`
            return `mudou a prioridade de ${oldLabel} para ${newLabel}`

        case 'assignees':
            if (!hadOld) return `adicionou responsável: ${newLabel}`
            if (!hasNew) return `removeu responsável: ${oldLabel}`
            return `mudou os responsáveis de ${oldLabel} para ${newLabel}`

        case 'labels':
            if (!hadOld) return `adicionou a etiqueta ${newLabel}`
            if (!hasNew) return `removeu a etiqueta ${oldLabel}`
            return `mudou as etiquetas de ${oldLabel} para ${newLabel}`

        case 'name':
            if (!hadOld) return `definiu o título "${newLabel}"`
            if (!hasNew) return `removeu o título (era "${oldLabel}")`
            return `renomeou de "${oldLabel}" para "${newLabel}"`

        case 'description':
            if (!hadOld) return 'adicionou uma descrição'
            if (!hasNew) return 'removeu a descrição'
            return 'atualizou a descrição'

        case 'target_date':
        case 'due_date':
            if (!hadOld) return `definiu o prazo para ${newLabel}`
            if (!hasNew) return `removeu o prazo (era ${oldLabel})`
            return `mudou o prazo de ${oldLabel} para ${newLabel}`

        case 'start_date':
            if (!hadOld) return `definiu o início para ${newLabel}`
            if (!hasNew) return `removeu a data de início (era ${oldLabel})`
            return `mudou o início de ${oldLabel} para ${newLabel}`

        case 'estimate_point':
            if (!hadOld) return `definiu a estimativa para ${newLabel}`
            if (!hasNew) return `removeu a estimativa (era ${oldLabel})`
            return `mudou a estimativa de ${oldLabel} para ${newLabel}`

        default: {
            const name = activityFieldLabel(field).toLowerCase()
            if (!hadOld) return `definiu ${name} para ${newLabel}`
            if (!hasNew) return `removeu ${name} (era ${oldLabel})`
            return `mudou ${name} de ${oldLabel} para ${newLabel}`
        }
    }
}

export const ACTIVITY_FIELD_ICONS = {
    state: 'mdi-swap-horizontal',
    priority: 'mdi-flag-outline',
    assignees: 'mdi-account-outline',
    labels: 'mdi-tag-outline',
    name: 'mdi-pencil-outline',
    description: 'mdi-text-box-outline',
    target_date: 'mdi-calendar-outline',
    start_date: 'mdi-calendar-start-outline',
    due_date: 'mdi-calendar-outline',
    estimate_point: 'mdi-clock-outline',
    parent: 'mdi-file-tree-outline',
    module: 'mdi-view-grid-outline',
    cycle: 'mdi-refresh',
    link: 'mdi-link-variant',
    attachment: 'mdi-paperclip',
}

export function activityFieldIcon(field) {
    return ACTIVITY_FIELD_ICONS[field] || 'mdi-pencil-outline'
}
