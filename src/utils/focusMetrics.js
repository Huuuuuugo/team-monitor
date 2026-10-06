import { priorityTone, stateGroupTone } from './priorityColors.js'

export const FOCUS_MODE_META = {
    focused: {
        label: 'Focado',
        color: 'primary',
        hint: 'Concentrado em um projeto principal (50% ou mais do foco).',
    },
    split: {
        label: 'Dividido',
        color: 'info',
        hint: 'Divide o foco entre 2 ou 3 projetos (juntos somam 70% ou mais), sem um dominante.',
    },
    scattered: {
        label: 'Muitas frentes',
        color: 'warning',
        hint: 'Acúmulo em vários projetos (4 ou mais relevantes, ou top 3 abaixo de 60%). Não é julgamento sobre a pessoa: é carga distribuída em várias frentes.',
    },
}

function plural(count, singular, pluralForm) {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

export function projectMetrics(focus, isDark) {
    const metrics = []

    if (focus.started) {
        metrics.push({
            key: 'started',
            icon: 'mdi-progress-clock',
            count: focus.started,
            text: plural(focus.started, 'em andamento', 'em andamento'),
            color: stateGroupTone('started', isDark).color,
            title: plural(focus.started, 'em andamento', 'em andamento'),
        })
    }

    const priorityCount = focus.urgent + focus.high
    if (priorityCount) {
        metrics.push({
            key: 'priority',
            icon: 'mdi-flag-outline',
            count: priorityCount,
            text: plural(priorityCount, 'urgente/alta', 'urgentes/altas'),
            color: priorityTone('urgent', isDark).color,
            title: `${plural(focus.urgent, 'urgente', 'urgentes')} · ${plural(
                focus.high,
                'alta',
                'altas'
            )}`,
        })
    }

    if (focus.overdue) {
        metrics.push({
            key: 'overdue',
            icon: 'mdi-clock-alert-outline',
            count: focus.overdue,
            text: plural(focus.overdue, 'atrasada', 'atrasadas'),
            color: 'rgb(var(--v-theme-error))',
            title: plural(focus.overdue, 'atrasada', 'atrasadas'),
        })
    }

    return metrics
}
