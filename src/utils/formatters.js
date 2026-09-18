export function formatDate(isoString) {
    if (!isoString) return '—'
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(isoString)
    const date = dateOnly ? new Date(`${isoString}T00:00:00`) : new Date(isoString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export function formatDateTime(isoString) {
    if (!isoString) return '—'
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatTime(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelative(isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''

    const diff = Math.floor((Date.now() - date.getTime()) / 1000)

    if (diff < 0) {
        const future = Math.abs(diff)
        if (future < 86400) return 'hoje'
        return `em ${Math.ceil(future / 86400)} dias`
    }

    if (diff < 60) return 'agora mesmo'
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
    if (diff < 172800) return 'ontem'
    return `há ${Math.floor(diff / 86400)} dias`
}

export function formatStatus(status) {
    return {
        backlog: 'Backlog',
        unstarted: 'A Fazer',
        started: 'Em Andamento',
        completed: 'Concluído',
        cancelled: 'Cancelado',
    }[status] || status
}

export function memberName(member) {
    if (!member) return ''
    if (member.member && member.member.full_name) return member.member.full_name
    if (member.first_name) return member.first_name
    if (member.full_name) return member.full_name
    return 'Membro'
}

export function memberAvatar(member) {
    if (!member) return ''
    const source = member.member || member
    return source.avatar_url || source.avatar || ''
}

export function initials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
