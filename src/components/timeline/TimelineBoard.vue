<template>
    <div class="timeline">
        <div class="timeline__toolbar d-flex align-center ga-2 mb-3">
            <v-btn
                icon="mdi-chevron-left"
                variant="text"
                size="small"
                aria-label="Mês anterior"
                @click="monthOffset -= 1"
            />
            <div class="timeline__period">{{ periodLabel }}</div>
            <v-btn
                icon="mdi-chevron-right"
                variant="text"
                size="small"
                aria-label="Próximo mês"
                @click="monthOffset += 1"
            />
            <v-btn size="small" variant="text" class="ml-1" @click="monthOffset = 0">Hoje</v-btn>

            <v-spacer />

            <span class="timeline__count">{{ rows.length }} tarefas com prazo</span>
        </div>

        <div class="timeline__scroll">
            <div class="timeline__inner" :style="{ width: `${totalWidth}px` }">
                <div
                    v-if="todayIndex >= 0"
                    class="timeline__today"
                    :style="{ left: `${todayLeft}px` }"
                ></div>

                <div class="timeline__header" :style="gridStyle">
                    <div class="timeline__month" :style="{ gridColumn: `1 / span ${days.length}` }">
                        {{ monthLabel }}
                    </div>
                    <div
                        v-for="day in days"
                        :key="day.key"
                        class="timeline__day"
                        :class="{
                            'timeline__day--today': day.key === todayKey,
                            'timeline__day--weekend': day.weekend,
                        }"
                    >
                        <span class="timeline__weekday">{{ day.weekday }}</span>
                        <span class="timeline__daynum">{{ day.dayNum }}</span>
                    </div>
                </div>

                <div class="timeline__rows">
                    <TimelineRow
                        v-for="row in rows"
                        :key="row.issue.id"
                        :issue="row.issue"
                        :start-index="row.startIndex"
                        :span="row.span"
                        :day-count="days.length"
                        :column-width="columnWidth"
                        :start-key="row.startKey"
                        :end-key="row.endKey"
                    />

                    <div v-if="!rows.length" class="timeline__empty">
                        Nenhuma tarefa com prazo neste período.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import TimelineRow from './TimelineRow.vue'
import { getDueDate } from '../../utils/issueHelpers.js'

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function dateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

export default {
    name: 'TimelineBoard',

    components: {
        TimelineRow,
    },

    data: () => ({
        monthOffset: 0,
        columnWidth: 64,
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['enrichedIssues']),

        windowStart() {
            const now = new Date()
            return new Date(now.getFullYear(), now.getMonth() + this.monthOffset, 1)
        },

        windowEnd() {
            return new Date(this.windowStart.getFullYear(), this.windowStart.getMonth() + 1, 0)
        },

        days() {
            const days = []
            const total = this.windowEnd.getDate()

            for (let day = 1; day <= total; day += 1) {
                const date = new Date(
                    this.windowStart.getFullYear(),
                    this.windowStart.getMonth(),
                    day
                )
                const weekday = date.getDay()
                days.push({
                    key: dateKey(date),
                    dayNum: String(day).padStart(2, '0'),
                    weekday: WEEKDAYS[weekday],
                    weekend: weekday === 0 || weekday === 6,
                })
            }

            return days
        },

        firstDayKey() {
            return this.days.length ? this.days[0].key : ''
        },

        lastDayKey() {
            return this.days.length ? this.days[this.days.length - 1].key : ''
        },

        todayKey() {
            return dateKey(new Date())
        },

        todayIndex() {
            return this.days.findIndex(day => day.key === this.todayKey)
        },

        todayLeft() {
            return this.todayIndex * this.columnWidth + this.columnWidth / 2
        },

        totalWidth() {
            return this.days.length * this.columnWidth
        },

        gridStyle() {
            return {
                gridTemplateColumns: `repeat(${this.days.length}, ${this.columnWidth}px)`,
            }
        },

        periodLabel() {
            return capitalize(
                this.windowStart.toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                })
            )
        },

        monthLabel() {
            const month = this.windowStart
                .toLocaleDateString('pt-BR', { month: 'short' })
                .replace('.', '')
                .toUpperCase()
            return `${month} ${this.windowStart.getFullYear()}`
        },

        rows() {
            if (!this.days.length) return []

            return this.enrichedIssues
                .map(issue => {
                    const due = getDueDate(issue)
                    if (!due) return null

                    const endKey = String(due).slice(0, 10)
                    const rawStart = issue.start_date
                        ? String(issue.start_date).slice(0, 10)
                        : endKey
                    const startKey = rawStart < endKey ? rawStart : endKey

                    if (startKey > this.lastDayKey || endKey < this.firstDayKey) return null

                    const startIndex = Math.max(0, this.indexOf(startKey))
                    const endIndex = Math.min(this.days.length - 1, this.indexOf(endKey))

                    if (endIndex < 0 || startIndex >= this.days.length) return null

                    return {
                        issue,
                        startKey,
                        endKey,
                        startIndex,
                        span: endIndex - startIndex + 1,
                    }
                })
                .filter(Boolean)
                .sort(
                    (a, b) =>
                        a.startIndex - b.startIndex ||
                        (a.issue.name || '').localeCompare(b.issue.name || '', 'pt-BR')
                )
        },
    },

    methods: {
        indexOf(key) {
            const first = Date.parse(`${this.firstDayKey}T00:00:00Z`)
            const current = Date.parse(`${key}T00:00:00Z`)
            return Math.round((current - first) / 86400000)
        },
    },
}
</script>

<style scoped>
.timeline__period {
    font-size: 14px;
    font-weight: 600;
    min-width: 150px;
    color: rgb(var(--v-theme-on-surface));
}

.timeline__count {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.timeline__scroll {
    overflow: auto;
    max-height: 68vh;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    border-radius: 6px;
    background: rgba(var(--v-theme-on-surface), 0.02);
}

.timeline__inner {
    position: relative;
}

.timeline__today {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(var(--v-theme-primary), 0.55);
    z-index: 2;
    pointer-events: none;
}

.timeline__header {
    display: grid;
    position: sticky;
    top: 0;
    z-index: 3;
    background: rgb(var(--v-theme-surface));
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    border-radius: 6px 6px 0 0;
}

.timeline__month {
    grid-row: 1;
    padding: 10px 12px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.timeline__day {
    grid-row: 2;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding-bottom: 10px;
    border-left: 1px solid rgba(var(--v-theme-on-surface), 0.04);
}

.timeline__day--weekend {
    background: rgba(var(--v-theme-on-surface), 0.02);
}

.timeline__day--today .timeline__daynum {
    color: rgb(var(--v-theme-primary));
}

.timeline__day--today::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgb(var(--v-theme-primary));
}

.timeline__weekday {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(var(--v-theme-on-surface), 0.4);
}

.timeline__daynum {
    font-size: 13px;
    font-weight: 700;
    color: rgba(var(--v-theme-on-surface), 0.75);
}

.timeline__empty {
    padding: 48px;
    text-align: center;
    font-size: 13px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}
</style>
