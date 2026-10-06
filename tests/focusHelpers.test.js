import { describe, expect, it } from 'vitest'
import {
    FOCUS_CONFIG,
    activityCreditForIssue,
    activityDecay,
    buildMemberProjectFocus,
    endOfDayInTimeZone,
    freshFactor,
    taskScore,
    todayInTimeZone,
} from '../src/utils/focusHelpers.js'

const DAY = FOCUS_CONFIG.msPerDay
const NOW = Date.parse('2026-10-06T12:00:00-03:00')

const member = (id, name) => ({ id, member: { id, full_name: name } })
const project = (id, name) => ({ id, name })

const STATE = {
    backlog: { group: 'backlog', name: 'Backlog' },
    unstarted: { group: 'unstarted', name: 'A Fazer' },
    started: { group: 'started', name: 'Em Andamento' },
    completed: { group: 'completed', name: 'Concluído' },
    cancelled: { group: 'cancelled', name: 'Cancelado' },
}

let seq = 0

function makeIssue({
    id,
    project: proj,
    state = STATE.unstarted,
    priority = 'none',
    updatedBy = null,
    updatedDaysAgo = 0,
    dueDate = null,
    parent = null,
    assignees = [],
    name = 'Tarefa',
} = {}) {
    seq += 1
    return {
        id: id || `issue-${seq}`,
        sequence_id: seq,
        name,
        priority,
        updated_at: new Date(NOW - updatedDaysAgo * DAY).toISOString(),
        updated_by: updatedBy,
        due_date: dueDate,
        parent,
        project: proj.id,
        _project: proj,
        _state: state,
        _assignees: assignees,
    }
}

function creditAge(credit) {
    if (credit >= 1) return 0
    return FOCUS_CONFIG.activity.halfLifeDays * Math.log2(1 / credit)
}

function activityOnlyIssue(proj, owner, credit) {
    return makeIssue({
        project: proj,
        state: STATE.completed,
        updatedBy: owner.id,
        updatedDaysAgo: creditAge(credit),
        assignees: [owner],
        name: `Atividade ${credit}`,
    })
}

function issueSet(proj, owner, credits) {
    const issues = []
    let remaining = Math.round(credits * 10000) / 10000
    while (remaining > 0) {
        const credit = Math.min(remaining, 1)
        issues.push(activityOnlyIssue(proj, owner, credit))
        remaining = Math.round((remaining - credit) * 10000) / 10000
    }
    return issues
}

function focusIds(entry) {
    return entry.focusProjects.map(focus => focus.project.id)
}

function scoreOf(entry, projectId) {
    return entry.focusProjects.find(focus => focus.project.id === projectId)?.score
}

const CH = project('chamados', 'Sistema de Chamados')
const HV2 = project('hunter-v2', 'S Hunter V2')
const TM = project('team-monitor', 'Team Monitor')
const TA = project('tarefas-avulsas', 'Tarefas Avulsas')
const PE = project('plataforma-emails', 'Plataforma de E-mails')

const EMPIRICAL = [
    { project: CH, buckets: { recent: 12, mid: 6, old: 1 }, started: 3, uh: 3, overdue: 2, open: 11 },
    { project: HV2, buckets: { recent: 9, mid: 2, old: 0 }, started: 2, uh: 0, overdue: 0, open: 6 },
    { project: TM, buckets: { recent: 5, mid: 2, old: 0 }, started: 0, uh: 3, overdue: 4, open: 5 },
    { project: TA, buckets: { recent: 4, mid: 0, old: 0 }, started: 0, uh: 0, overdue: 1, open: 1 },
    { project: PE, buckets: { recent: 0, mid: 0, old: 1 }, started: 0, uh: 0, overdue: 0, open: 0 },
]

function buildEmpiricalDataset(owner) {
    const issues = []

    for (const spec of EMPIRICAL) {
        const proj = spec.project

        for (let i = 0; i < spec.buckets.recent; i += 1) {
            issues.push(activityOnlyIssueFromAge(proj, owner, 1))
        }
        for (let i = 0; i < spec.buckets.mid; i += 1) {
            issues.push(activityOnlyIssueFromAge(proj, owner, 10))
        }
        for (let i = 0; i < spec.buckets.old; i += 1) {
            issues.push(activityOnlyIssueFromAge(proj, owner, 20))
        }

        let remainingUh = spec.uh
        for (let i = 0; i < spec.overdue; i += 1) {
            const withPriority = remainingUh > 0
            issues.push(
                makeIssue({
                    project: proj,
                    state: STATE.unstarted,
                    assignees: [owner],
                    dueDate: '2026-09-20',
                    priority: withPriority ? (remainingUh % 2 ? 'urgent' : 'high') : 'none',
                })
            )
            if (withPriority) remainingUh -= 1
        }

        for (let i = 0; i < spec.started; i += 1) {
            issues.push(makeIssue({ project: proj, state: STATE.started, assignees: [owner] }))
        }
        for (let i = 0; i < remainingUh; i += 1) {
            issues.push(
                makeIssue({ project: proj, state: STATE.unstarted, assignees: [owner], priority: 'high' })
            )
        }

        const openSoFar = spec.overdue + spec.started + remainingUh
        for (let i = openSoFar; i < spec.open; i += 1) {
            issues.push(makeIssue({ project: proj, state: STATE.unstarted, assignees: [owner] }))
        }
    }

    return issues
}

function activityOnlyIssueFromAge(proj, owner, daysAgo) {
    return makeIssue({
        project: proj,
        state: STATE.completed,
        updatedBy: owner.id,
        updatedDaysAgo: daysAgo,
        assignees: [owner],
        name: `Atividade ${daysAgo}d`,
    })
}

function oldActivityWeight(updatedAt) {
    const days = Math.floor((NOW - new Date(updatedAt).getTime()) / DAY)
    if (days <= 0) return 4
    if (days <= 7) return 3
    if (days <= 14) return 2
    if (days <= 30) return 1
    return 0
}

function buildOldFocus(issues, owner) {
    const map = new Map()

    for (const issue of issues) {
        const proj = issue._project
        const entry =
            map.get(proj.id) ||
            { project: proj, activity: 0, open: 0, started: 0, uh: 0, overdue: 0 }

        if (issue.updated_by === owner.id) entry.activity += oldActivityWeight(issue.updated_at)

        const group = issue._state.group
        if (['backlog', 'unstarted', 'started'].includes(group) && issue._assignees.includes(owner)) {
            entry.open += 1
            if (group === 'started') entry.started += 1
            if (['urgent', 'high'].includes(issue.priority)) entry.uh += 1
            if (issue.due_date && Date.parse(`${issue.due_date}T23:59:59-03:00`) < NOW) entry.overdue += 1
        }

        map.set(proj.id, entry)
    }

    const entries = [...map.values()]
        .map(entry => ({
            ...entry,
            score: 2 * entry.activity + 3 * entry.started + 2 * entry.uh + 2 * entry.overdue + entry.open,
        }))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score)

    const total = entries.reduce((sum, entry) => sum + entry.score, 0)
    for (const entry of entries) entry.percent = Math.round((entry.score / total) * 100)

    const focus = entries.filter(entry => (entry.score / total) * 100 >= 20).slice(0, 2)
    return { entries, focus }
}

describe('atividade por recência', () => {
    it('decaimento contínuo: 7 dias = metade de 0 dias, sem degrau entre 7 e 8', () => {
        expect(activityDecay(0)).toBeCloseTo(1)
        expect(activityDecay(7)).toBeCloseTo(0.5)
        expect(activityDecay(14)).toBeCloseTo(0.25)

        const before = activityDecay(7 - 0.001)
        const after = activityDecay(7 + 0.001)
        expect(before).toBeGreaterThan(after)
        expect(Math.abs(before - after)).toBeLessThan(0.0001)
        expect(activityDecay(7.9)).toBeGreaterThan(activityDecay(8.1))
        expect(activityDecay(31)).toBe(0)
    })

    it('updated_by não-assignee vale metade; bot vale zero; assunto desconhecido zero', () => {
        const owner = member('m-owner', 'Dono')
        const other = member('m-other', 'Outro')
        const botId = FOCUS_CONFIG.ignoredActorIds[0]
        const bot = member(botId, 'Bot')

        const context = {
            memberByActorId: new Map([
                [owner.id, owner],
                [other.id, other],
                [botId, bot],
            ]),
            issueById: new Map(),
            now: NOW,
            config: FOCUS_CONFIG,
        }

        const proj = project('p', 'Projeto')
        const selfIssue = makeIssue({ project: proj, state: STATE.completed, updatedBy: owner.id, assignees: [owner] })
        const otherIssue = makeIssue({ project: proj, state: STATE.completed, updatedBy: other.id, assignees: [owner] })
        const botIssue = makeIssue({ project: proj, state: STATE.completed, updatedBy: botId, assignees: [owner] })
        const unknownIssue = makeIssue({ project: proj, state: STATE.completed, updatedBy: 'nobody', assignees: [owner] })

        expect(activityCreditForIssue(selfIssue, context)).toBeCloseTo(1)
        expect(activityCreditForIssue(otherIssue, context)).toBeCloseTo(0.5)
        expect(activityCreditForIssue(botIssue, context)).toBe(0)
        expect(activityCreditForIssue(unknownIssue, context)).toBe(0)
    })
})

describe('carga e score do projeto', () => {
    it('80 issues em backlog não passam de 3 issues started recentes', () => {
        const owner = member('m1', 'Dono')
        const big = project('big', 'Backlog Grande')
        const flow = project('flow', 'Fluxo Enxuto')

        const issues = []
        for (let i = 0; i < 80; i += 1) {
            issues.push(makeIssue({ project: big, state: STATE.backlog, assignees: [owner] }))
        }
        for (let i = 0; i < 3; i += 1) {
            issues.push(
                makeIssue({ project: flow, state: STATE.started, assignees: [owner], updatedBy: owner.id })
            )
        }

        const [entry] = buildMemberProjectFocus(issues, [owner], { now: NOW, previousFocus: null })
        const bigScore = scoreOf(entry, big.id)
        const flowScore = scoreOf(entry, flow.id)

        expect(bigScore).toBeDefined()
        expect(flowScore).toBeDefined()
        expect(flowScore).toBeGreaterThan(bigScore)
    })

    it('started estagnado (60 dias) pesa menos que started fresco', () => {
        const owner = member('m1', 'Dono')
        const fresh = project('fresh', 'Fresco')
        const stale = project('stale', 'Estagnado')

        const issues = [
            makeIssue({ project: fresh, state: STATE.started, assignees: [owner], updatedBy: owner.id }),
            makeIssue({
                project: stale,
                state: STATE.started,
                assignees: [owner],
                updatedBy: owner.id,
                updatedDaysAgo: 60,
            }),
        ]

        const [entry] = buildMemberProjectFocus(issues, [owner], {
            now: NOW,
            previousFocus: { [owner.id]: [fresh.id, stale.id] },
        })

        expect(freshFactor(issues[1].updated_at, NOW)).toBe(FOCUS_CONFIG.workload.freshStaleFactor)
        expect(scoreOf(entry, fresh.id)).toBeGreaterThan(scoreOf(entry, stale.id))
    })
})

describe('seleção de projetos em foco', () => {
    const owner = member('m1', 'Dono')
    const p0 = project('p0', 'Principal')
    const p1 = project('p1', 'Secundário')

    function buildWithPrevious(previousIds, creditsP1) {
        const issues = [...issueSet(p0, owner, 16), ...issueSet(p1, owner, creditsP1)]
        return buildMemberProjectFocus(issues, [owner], {
            now: NOW,
            previousFocus: { [owner.id]: previousIds },
        })[0]
    }

    it('histerese: sai só abaixo de 17%; entra só a partir de 22%; oscilar em 18–21% não muda', () => {
        const retained = buildWithPrevious([p0.id, p1.id], 0.771)
        expect(focusIds(retained)).toContain(p1.id)

        const dropped = buildWithPrevious([p0.id, p1.id], 0.6)
        expect(focusIds(dropped)).not.toContain(p1.id)

        const never = [0.771, 1]
        for (const credits of never) {
            const result = buildWithPrevious([p0.id], credits)
            expect(focusIds(result)).not.toContain(p1.id)
        }

        const entered = buildWithPrevious([p0.id], 1.32)
        expect(focusIds(entered)).toContain(p1.id)
    })

    it('cobertura cumulativa sem previousFocus: mínimo 1 e máximo 3 projetos', () => {
        const issues = [
            ...issueSet(p0, owner, 4),
            ...issueSet(p1, owner, 1),
        ]
        const [entry] = buildMemberProjectFocus(issues, [owner], { now: NOW, previousFocus: null })
        expect(entry.focusProjects.length).toBeGreaterThanOrEqual(FOCUS_CONFIG.selection.minProjects)
        expect(entry.focusProjects.length).toBeLessThanOrEqual(FOCUS_CONFIG.selection.maxProjects)
        expect(focusIds(entry)[0]).toBe(p0.id)
    })

    it('allProjects lista todos os projetos com flag focused; focusProjects é o subconjunto', () => {
        const p2 = project('p2', 'Terciário')
        const issues = [
            ...issueSet(p0, owner, 16),
            ...issueSet(p1, owner, 1),
            ...issueSet(p2, owner, 0.25),
        ]
        const [entry] = buildMemberProjectFocus(issues, [owner], { now: NOW, previousFocus: null })

        expect(entry.allProjects).toHaveLength(3)
        expect(entry.allProjects.every(project => Array.isArray(project.issues))).toBe(true)
        expect(entry.allProjects.filter(project => project.focused)).toHaveLength(
            entry.focusProjects.length
        )
        expect(entry.allProjects.some(project => !project.focused)).toBe(true)
    })
})

describe('focusMode', () => {
    const owner = member('m1', 'Dono')

    function entryFor(creditsList) {
        const issues = []
        creditsList.forEach((credits, index) => {
            issues.push(...issueSet(project(`p${index}`, `Projeto ${index}`), owner, credits))
        })
        return buildMemberProjectFocus(issues, [owner], { now: NOW, previousFocus: null })[0]
    }

    it('focused quando o principal tem ≥ 50%', () => {
        expect(entryFor([16, 1]).focusMode).toBe('focused')
    })

    it('split quando 2 ou 3 projetos cobrem ≥ 70% e nenhum passa de 50%', () => {
        expect(entryFor([8, 4, 1]).focusMode).toBe('split')
    })

    it('scattered com 4+ projetos ≥ 15%', () => {
        expect(entryFor([16, 9, 4, 4]).focusMode).toBe('scattered')
    })

    it('scattered no fallback (top 3 entre 60% e 70%)', () => {
        expect(entryFor([16, 1.44, 1.44, 1.44, 1.44, 0.9]).focusMode).toBe('scattered')
    })

    it('no_data sem atividade e sem issues ativas', () => {
        const idle = member('idle', 'Sem Dados')
        const [entry] = buildMemberProjectFocus([], [idle], { now: NOW, previousFocus: null })
        expect(entry.focusMode).toBe('no_data')
        expect(entry.focusProjects).toHaveLength(0)
    })
})

describe('fuso America/Fortaleza', () => {
    it('23:30 em Fortaleza ainda é o dia anterior em UTC', () => {
        const utcNextDay = new Date('2026-10-07T02:30:00Z')
        expect(todayInTimeZone(utcNextDay)).toBe('2026-10-06')
        expect(endOfDayInTimeZone('2026-10-06')).toBe(Date.parse('2026-10-07T02:59:59.999Z'))
    })

    it('issue com prazo no dia de Fortaleza conta como "hoje" mesmo sendo o dia seguinte em UTC', () => {
        const utcNextDay = new Date('2026-10-07T02:30:00Z')
        const owner = member('m1', 'Dono')
        const proj = project('p', 'Projeto')
        const issue = makeIssue({
            project: proj,
            state: STATE.unstarted,
            assignees: [owner],
            dueDate: '2026-10-06',
        })

        const score = taskScore(issue, owner.id, utcNextDay.getTime())
        expect(score).toBe(FOCUS_CONFIG.task.stateUnstarted + FOCUS_CONFIG.task.dueToday)
    })
})

describe('sensibilidade e regressão sobre o dataset empírico', () => {
    const owner = member('emp', 'Empírico')
    const issues = buildEmpiricalDataset(owner)

    it('sensibilidade: variar cada peso de FOCUS_PROJECT_WEIGHTS em ±50%', () => {
        const baseline = buildMemberProjectFocus(issues, [owner], { now: NOW, previousFocus: null })
        const baselineIds = focusIds(baseline[0])
        const variations = []

        for (const key of Object.keys(FOCUS_CONFIG.projectWeights)) {
            for (const factor of [0.5, 1.5]) {
                const config = structuredClone(FOCUS_CONFIG)
                config.projectWeights[key] *= factor
                const result = buildMemberProjectFocus(issues, [owner], {
                    now: NOW,
                    previousFocus: null,
                    config,
                })
                variations.push({ key, factor, focus: focusIds(result[0]) })
            }
        }

        const sameSet = (a, b) =>
            [...a].sort().join('|') === [...b].sort().join('|')

        console.log(`[sensibilidade] foco baseline: ${baselineIds.join(', ') || '—'}`)
        for (const variation of variations) {
            let note = ''
            if (!sameSet(variation.focus, baselineIds)) note = ' (CONJUNTO MUDOU)'
            else if (variation.focus.join('|') !== baselineIds.join('|')) note = ' (ORDEM MUDOU)'
            console.log(`  ${variation.key} ×${variation.factor}: ${variation.focus.join(', ') || '—'}${note}`)
        }

        const changed = variations.filter(
            variation => !sameSet(variation.focus, baselineIds)
        )
        const reordered = variations.filter(
            variation =>
                sameSet(variation.focus, baselineIds) &&
                variation.focus.join('|') !== baselineIds.join('|')
        )
        const unstable = changed.length + reordered.length
        const ratio = unstable / variations.length
        console.log(
            `[sensibilidade] conjunto mudou em ${changed.length}/${variations.length} ` +
                `e só a ordem em ${reordered.length}/${variations.length} ` +
                `(${(ratio * 100).toFixed(1)}% instáveis)`
        )
        if (ratio > 0.2) {
            console.warn('[sensibilidade] ATENÇÃO: mais de 20% dos casos mudam os projetos em foco')
        }

        expect(variations.length).toBeGreaterThan(0)
    })

    it('regressão: fórmula antiga vs nova lado a lado', () => {
        const old = buildOldFocus(issues, owner)
        const [entry] = buildMemberProjectFocus(issues, [owner], { now: NOW, previousFocus: null })

        console.log('[regressão] projeto | antigo score/% | novo score/%')
        for (const oldEntry of old.entries) {
            const newEntry = entry.focusProjects.find(focus => focus.project.id === oldEntry.project.id)
            const newText = newEntry
                ? `${newEntry.score.toFixed(2)} (${newEntry.percent}%)`
                : `fora do foco (${entry.hiddenProjects} ocultos)`
            console.log(`  ${oldEntry.project.name} | ${oldEntry.score.toFixed(2)} (${oldEntry.percent}%) | ${newText}`)
        }
        console.log(`[regressão] foco antigo: ${old.focus.map(focus => focus.project.name).join(', ') || '—'}`)
        console.log(
            `[regressão] foco novo: ${entry.focusProjects.map(focus => focus.project.name).join(', ') || '—'}`
        )

        expect(entry.focusProjects.length).toBeGreaterThan(0)
    })
})
