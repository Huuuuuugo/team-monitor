<template>
    <div
        class="calendar-day"
        :class="{
            'calendar-day--interactive': day.inMonth,
            'calendar-day--active': day.inMonth && entries.length,
            'calendar-day--muted': !day.inMonth,
            'calendar-day--today': day.isToday,
            'calendar-day--future': day.isFuture && !day.isToday,
        }"
        :tabindex="day.inMonth ? 0 : -1"
        :role="day.inMonth ? 'button' : null"
        :aria-label="day.inMonth ? dayAriaLabel : null"
        @click="selectDay"
        @keydown.enter.prevent="selectDay"
        @keydown.space.prevent="selectDay"
    >
        <div class="calendar-day__head">
            <span class="calendar-day__num">{{ day.dayNum }}</span>
        </div>

        <div v-if="day.inMonth && entries.length" class="calendar-day__squares">
            <span
                v-for="entry in visibleEntries"
                :key="entry.issue.id"
                class="calendar-square"
                :style="squareStyle(entry)"
                :aria-label="entryAriaLabel(entry)"
                role="button"
                tabindex="0"
                v-tooltip="entryTooltip(entry)"
                @click.stop="openIssue(entry.issue)"
                @keydown.enter.stop.prevent="openIssue(entry.issue)"
                @keydown.space.stop.prevent="openIssue(entry.issue)"
            >
                <span v-if="entry.created && entry.modified" class="calendar-square__dot" />
            </span>
            <span v-if="overflow" class="calendar-day__more">+{{ overflow }}</span>
        </div>

        <div v-if="day.inMonth" class="calendar-day__footer">
            <template v-if="createdCount || modifiedCount">
                <button
                    v-if="createdCount"
                    type="button"
                    class="calendar-day__stat calendar-day__stat--created"
                    :aria-label="`Ver somente as tarefas criadas neste dia (${createdCount})`"
                    v-tooltip="'Ver somente as tarefas criadas neste dia'"
                    @click.stop="selectFiltered('created')"
                    @keydown.stop
                >
                    <v-icon size="11">mdi-plus-circle-outline</v-icon>
                    {{ createdCount }}
                </button>
                <button
                    v-if="modifiedCount"
                    type="button"
                    class="calendar-day__stat calendar-day__stat--modified"
                    :aria-label="`Ver somente as tarefas modificadas neste dia (${modifiedCount})`"
                    v-tooltip="'Ver somente as tarefas modificadas neste dia'"
                    @click.stop="selectFiltered('modified')"
                    @keydown.stop
                >
                    <v-icon size="11">mdi-pencil-outline</v-icon>
                    {{ modifiedCount }}
                </button>
            </template>
            <span v-else class="calendar-day__stat calendar-day__stat--empty">
                {{ day.isFuture ? '—' : 'Sem atividade' }}
            </span>
        </div>
    </div>
</template>

<script>
import { mapActions } from 'pinia'
import { useUiStore } from '../../stores/ui.js'
import { STATE_GROUP_COLORS } from '../../utils/priorityColors.js'
import { formatTime } from '../../utils/formatters.js'
import { formatDayLabel } from '../../utils/calendarHelpers.js'

const MAX_SQUARES = 8

export default {
    name: 'CalendarDayCell',

    props: {
        day: { type: Object, required: true },
        entries: { type: Array, default: () => [] },
    },

    emits: ['select'],

    computed: {
        visibleEntries() {
            return this.entries.slice(0, MAX_SQUARES)
        },

        overflow() {
            return Math.max(0, this.entries.length - MAX_SQUARES)
        },

        createdCount() {
            return this.entries.filter(entry => entry.created).length
        },

        modifiedCount() {
            return this.entries.filter(entry => entry.modified).length
        },

        dayAriaLabel() {
            const total = this.entries.length
            const suffix = total
                ? `, ${total} ${total === 1 ? 'tarefa' : 'tarefas'}`
                : ', sem tarefas'
            return `${formatDayLabel(this.day.key)}${suffix}`
        },
    },

    methods: {
        ...mapActions(useUiStore, ['openModal']),

        squareStyle(entry) {
            const dark = this.$vuetify.theme.current.dark
            const color = STATE_GROUP_COLORS[entry.issue._state?.group] || '#9ca3af'
            const style = {
                backgroundColor: entry.created
                    ? `color-mix(in srgb, ${color} ${dark ? 86 : 60}%, transparent)`
                    : dark
                        ? `color-mix(in srgb, ${color} 20%, transparent)`
                        : 'transparent',
                borderColor: `color-mix(in srgb, ${color} ${
                    entry.created ? (dark ? 100 : 85) : dark ? 95 : 72
                }%, transparent)`,
            }
            if (dark) {
                style.boxShadow = `0 0 6px color-mix(in srgb, ${color} 40%, transparent)`
            }
            return style
        },

        entryKind(entry) {
            if (entry.created && entry.modified) return 'Criada e modificada'
            return entry.created ? 'Criada' : 'Modificada'
        },

        entryTooltip(entry) {
            const issue = entry.issue
            const project = issue._project?.name ? ` · ${issue._project.name}` : ''
            const events = []
            if (entry.createdTime) events.push(`Criada às ${formatTime(entry.createdTime)}`)
            if (entry.modifiedTime) events.push(`Modificada às ${formatTime(entry.modifiedTime)}`)
            return `#${issue.sequence_id} ${issue.name}${project} — ${events.join(' · ')}`
        },

        entryAriaLabel(entry) {
            return `${this.entryKind(entry)}: #${entry.issue.sequence_id} ${entry.issue.name}`
        },

        selectDay() {
            if (!this.day.inMonth) return
            this.$emit('select', { day: this.day, filter: '' })
        },

        selectFiltered(filter) {
            this.$emit('select', { day: this.day, filter })
        },

        openIssue(issue) {
            this.openModal(issue)
        },
    },
}
</script>

<style scoped>
.calendar-day {
    --day-tint: #0891b2;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 104px;
    padding: 6px 8px 8px;
    border-radius: 6px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    background: color-mix(in srgb, var(--day-tint) 14%, transparent);
    transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.v-theme--dark .calendar-day {
    --day-tint: rgb(var(--v-theme-primary));
}

.calendar-day--active {
    background: color-mix(in srgb, var(--day-tint) 38%, transparent);
}

.calendar-day--muted {
    opacity: 0.3;
    border-style: dashed;
    cursor: default;
    background: rgba(var(--v-theme-on-surface), 0.02);
}

.calendar-day--future {
    opacity: 0.55;
}

.calendar-day--interactive {
    cursor: pointer;
}

.calendar-day--interactive:hover {
    background: color-mix(in srgb, var(--day-tint) 22%, transparent);
    border-color: color-mix(in srgb, var(--day-tint) 40%, transparent);
}

.calendar-day--active.calendar-day--interactive:hover {
    background: color-mix(in srgb, var(--day-tint) 48%, transparent);
}

.calendar-day--interactive:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 1px;
}

.calendar-day--today {
    border-color: var(--day-tint);
    box-shadow:
        0 0 0 1px color-mix(in srgb, var(--day-tint) 60%, transparent),
        0 0 14px color-mix(in srgb, var(--day-tint) 45%, transparent);
}

.calendar-day--today .calendar-day__num {
    color: var(--day-tint);
}

.calendar-day__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.calendar-day__num {
    font-size: 12px;
    font-weight: 700;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.calendar-day__squares {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 4px;
}

.calendar-square {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: transform 0.12s ease, opacity 0.12s ease;
}

.calendar-square__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgb(var(--v-theme-surface));
}

.calendar-square:hover {
    transform: scale(1.2);
}

.calendar-square:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 1px;
}

.calendar-day__more {
    align-self: center;
    font-size: 11px;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.calendar-day__footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    padding-top: 6px;
}

.calendar-day__stat {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px;
    font-family: inherit;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    color: rgba(var(--v-theme-on-surface), 0.6);
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s ease;
}

.calendar-day__stat:hover {
    background: rgba(var(--v-theme-on-surface), 0.08);
}

.calendar-day__stat:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 1px;
}

.calendar-day__stat--created {
    color: rgb(var(--v-theme-success));
}

.calendar-day__stat--modified {
    color: rgb(var(--v-theme-info));
}

.calendar-day__stat--empty {
    padding: 0;
    cursor: default;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.35);
}

.calendar-day__stat--empty:hover {
    background: transparent;
}
</style>
