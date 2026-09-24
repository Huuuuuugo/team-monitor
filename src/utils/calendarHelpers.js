import { localDateKey, today } from './issueHelpers.js'
import { STATE_GROUP_ORDER } from './priorityColors.js'

export const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function dateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function parseDayKey(key) {
    if (!key) return null
    const date = new Date(`${key}T12:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

export function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

export function formatDayLabel(key) {
    const date = parseDayKey(key)
    if (!date) return ''
    return capitalize(
        date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
        })
    )
}

export function buildMonthGrid(year, month) {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
    const todayKey = today()

    const days = []
    for (let index = 0; index < totalCells; index += 1) {
        const date = new Date(year, month, index - firstWeekday + 1)
        const key = dateKey(date)
        const weekday = date.getDay()

        days.push({
            key,
            dayNum: String(date.getDate()).padStart(2, '0'),
            inMonth: date.getMonth() === month,
            weekend: weekday === 0 || weekday === 6,
            isToday: key === todayKey,
            isFuture: key > todayKey,
        })
    }

    return days
}

function groupRank(issue) {
    const index = STATE_GROUP_ORDER.indexOf(issue._state?.group)
    return index === -1 ? STATE_GROUP_ORDER.length : index
}

function byGroupThenTime(timeField) {
    return (a, b) =>
        groupRank(a) - groupRank(b) || new Date(a[timeField] || 0) - new Date(b[timeField] || 0)
}

function ensureDay(days, key) {
    if (!days[key]) days[key] = { created: [], modified: [], entryMap: new Map() }
    return days[key]
}

export function groupIssuesByDay(issues) {
    const days = {}

    for (const issue of issues) {
        const createdKey = localDateKey(issue.created_at)
        const updatedKey = localDateKey(issue.updated_at)

        if (createdKey) {
            const day = ensureDay(days, createdKey)
            day.created.push(issue)
            day.entryMap.set(issue.id, {
                issue,
                created: true,
                modified: updatedKey === createdKey,
                time: issue.created_at,
                createdTime: issue.created_at,
                modifiedTime: updatedKey === createdKey ? issue.updated_at : null,
            })
            if (updatedKey === createdKey) day.modified.push(issue)
        }

        if (updatedKey && updatedKey !== createdKey) {
            const day = ensureDay(days, updatedKey)
            day.modified.push(issue)
            day.entryMap.set(issue.id, {
                issue,
                created: false,
                modified: true,
                time: issue.updated_at,
                createdTime: null,
                modifiedTime: issue.updated_at,
            })
        }
    }

    for (const day of Object.values(days)) {
        day.created.sort(byGroupThenTime('created_at'))
        day.modified.sort(byGroupThenTime('updated_at'))
        day.entries = [...day.entryMap.values()].sort(
            (a, b) =>
                groupRank(a.issue) - groupRank(b.issue) ||
                new Date(a.time || 0) - new Date(b.time || 0)
        )
        delete day.entryMap
    }

    return days
}
