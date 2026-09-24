<template>
    <div>
        <PageHeader title="Calendário" subtitle="Criações e modificações por dia">
            <template #actions>
                <v-chip v-if="loading && !enrichedIssues.length" size="small" variant="tonal" color="primary">
                    <v-progress-circular indeterminate size="14" width="2" class="mr-2" />
                    Carregando...
                </v-chip>
            </template>
        </PageHeader>

        <div class="calendar-toolbar d-flex align-center flex-wrap ga-3 mb-5">
            <v-btn
                icon="mdi-chevron-left"
                variant="text"
                size="small"
                aria-label="Mês anterior"
                @click="monthOffset -= 1"
            />
            <div class="calendar-toolbar__period">{{ periodLabel }}</div>
            <v-btn
                icon="mdi-chevron-right"
                variant="text"
                size="small"
                aria-label="Próximo mês"
                @click="monthOffset += 1"
            />

            <span class="calendar-toolbar__today">Hoje: {{ todayDate }}</span>

            <v-spacer />

            <div class="calendar-toolbar__summary text-caption">
                <span class="calendar-toolbar__marker calendar-toolbar__marker--filled" />
                {{ monthTotals.created }} criadas
                <span class="mx-2">·</span>
                <span class="calendar-toolbar__marker calendar-toolbar__marker--outline" />
                {{ monthTotals.modified }} modificadas
            </div>
        </div>

        <div class="calendar-guide mb-4">
            <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-help-circle-outline"
                @click="guideOpen = true"
            >
                Clique aqui para saber como ler o calendário
            </v-btn>
        </div>

        <div class="calendar-legend mb-8">
            <div class="calendar-legend__section">
                <div class="calendar-legend__title">O que aconteceu no dia</div>
                <div class="calendar-legend__items">
                    <span class="calendar-legend__item">
                        <span class="calendar-square calendar-square--sample-filled" /> Criada
                    </span>
                    <span class="calendar-legend__item">
                        <span class="calendar-square calendar-square--sample-outline" /> Modificada
                    </span>
                    <span class="calendar-legend__item">
                        <span class="calendar-square calendar-square--sample-filled">
                            <span class="calendar-square__dot" />
                        </span>
                        Criada e modificada
                    </span>
                </div>
            </div>

            <div class="calendar-legend__section calendar-legend__section--status">
                <div class="calendar-legend__title">Status atual da tarefa</div>
                <div class="calendar-legend__items">
                    <span
                        v-for="group in stateGroups"
                        :key="group.value"
                        class="calendar-legend__item"
                    >
                        <span class="calendar-legend__swatch" :style="{ background: group.color }" />
                        {{ group.label }}
                    </span>
                </div>
            </div>
        </div>

        <div class="calendar-scroll">
            <div class="calendar-weekdays">
                <span v-for="label in weekdays" :key="label">{{ label }}</span>
            </div>

            <div class="calendar-grid">
                <CalendarDayCell
                    v-for="day in days"
                    :key="day.key"
                    :day="day"
                    :entries="entriesFor(day)"
                    @select="openDay"
                />
            </div>
        </div>

        <CalendarDayDrawer
            v-model="drawerOpen"
            :day-key="selectedDayKey"
            :groups="selectedGroups"
            :filter="selectedFilter"
            @update:filter="selectedFilter = $event"
        />

        <v-dialog v-model="guideOpen" max-width="520">
            <v-card>
                <v-card-title class="d-flex align-center ga-2">
                    <v-icon color="info">mdi-information-outline</v-icon>
                    Como ler o calendário
                </v-card-title>
                <v-card-text>
                    <ul class="calendar-guide__list">
                        <li>
                            A <strong>cor</strong> de cada quadrado é o
                            <strong>status atual</strong> da tarefa, conforme a legenda de status.
                        </li>
                        <li>
                            O <strong>preenchimento</strong> mostra o que aconteceu no dia:
                            <strong>cheio</strong> = criada, <strong>só contorno</strong> =
                            modificada e <strong>com ponto no centro</strong> = criada e
                            modificada.
                        </li>
                        <li>
                            Dias <strong>com atividade</strong> ficam destacados com a cor do
                            tema; os demais aparecem com a mesma cor, mais suave. O dia atual tem
                            uma borda brilhante.
                        </li>
                        <li>
                            Clique em um quadrado para abrir a tarefa ou clique no dia para ver a
                            lista completa.
                        </li>
                    </ul>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="guideOpen = false">Entendi</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import PageHeader from '../components/layout/PageHeader.vue'
import CalendarDayCell from '../components/calendar/CalendarDayCell.vue'
import CalendarDayDrawer from '../components/calendar/CalendarDayDrawer.vue'
import {
    WEEKDAYS,
    buildMonthGrid,
    capitalize,
    groupIssuesByDay,
} from '../utils/calendarHelpers.js'
import { STATE_GROUP_COLORS, STATE_GROUP_LABELS, STATE_GROUP_ORDER } from '../utils/priorityColors.js'

export default {
    name: 'CalendarioView',

    components: {
        PageHeader,
        CalendarDayCell,
        CalendarDayDrawer,
    },

    data: () => ({
        weekdays: WEEKDAYS,
        monthOffset: 0,
        drawerOpen: false,
        guideOpen: false,
        selectedDayKey: '',
        selectedFilter: '',
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['loading', 'enrichedIssues']),

        windowStart() {
            const now = new Date()
            return new Date(now.getFullYear(), now.getMonth() + this.monthOffset, 1)
        },

        days() {
            return buildMonthGrid(this.windowStart.getFullYear(), this.windowStart.getMonth())
        },

        periodLabel() {
            return capitalize(
                this.windowStart.toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                })
            )
        },

        todayDate() {
            const now = new Date()
            const day = String(now.getDate()).padStart(2, '0')
            const month = now.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
            return `${day} ${month} ${now.getFullYear()}`
        },

        issuesByDay() {
            return groupIssuesByDay(this.enrichedIssues)
        },

        monthTotals() {
            let created = 0
            let modified = 0

            for (const day of this.days) {
                if (!day.inMonth) continue
                const group = this.issuesByDay[day.key]
                if (!group) continue
                created += group.created.length
                modified += group.modified.length
            }

            return { created, modified }
        },

        selectedGroups() {
            return this.groupsFor(this.selectedDayKey)
        },

        stateGroups() {
            return STATE_GROUP_ORDER.map(group => ({
                value: group,
                label: STATE_GROUP_LABELS[group],
                color: STATE_GROUP_COLORS[group],
            }))
        },
    },

    methods: {
        entriesFor(day) {
            return day.inMonth ? this.groupsFor(day.key).entries : []
        },

        groupsFor(key) {
            const group = key ? this.issuesByDay[key] : null
            return {
                created: group?.created || [],
                modified: group?.modified || [],
                entries: group?.entries || [],
            }
        },

        openDay({ day, filter = '' }) {
            this.selectedDayKey = day.key
            this.selectedFilter = filter
            this.drawerOpen = true
        },
    },
}
</script>

<style scoped>
.calendar-toolbar__period {
    min-width: 150px;
    font-size: 14px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.calendar-toolbar__today {
    font-size: 13px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.calendar-toolbar__summary {
    display: inline-flex;
    align-items: center;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.calendar-toolbar__marker {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 6px;
    border-radius: 2px;
    box-sizing: border-box;
}

.calendar-toolbar__marker--filled {
    background: rgba(var(--v-theme-on-surface), 0.65);
}

.calendar-toolbar__marker--outline {
    border: 1.5px solid rgba(var(--v-theme-on-surface), 0.65);
}

.calendar-guide__list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 4px 0 0;
    padding-left: 18px;
    font-size: 12.5px;
    line-height: 1.5;
}

.calendar-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px 28px;
    padding: 16px 18px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    border-radius: 8px;
    background: rgba(var(--v-theme-on-surface), 0.02);
}

.calendar-legend__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.calendar-legend__section--status {
    padding-left: 28px;
    border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.calendar-legend__title {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.calendar-legend__items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
}

.calendar-legend__item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.65);
}

.calendar-legend__swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 3px;
}

.calendar-scroll {
    overflow-x: auto;
    padding-bottom: 4px;
}

.calendar-weekdays,
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(120px, 1fr));
    gap: 6px;
}

.calendar-weekdays {
    margin-bottom: 6px;
}

.calendar-weekdays span {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    text-align: center;
    color: rgba(var(--v-theme-on-surface), 0.4);
}

.calendar-square {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 3px;
    border: 1px solid transparent;
    box-sizing: border-box;
}

.calendar-square--sample-filled {
    background: rgba(var(--v-theme-on-surface), 0.75);
    border-color: rgba(var(--v-theme-on-surface), 0.75);
}

.calendar-square--sample-outline {
    background: transparent;
    border: 1.5px solid rgba(var(--v-theme-on-surface), 0.75);
}

.calendar-square__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgb(var(--v-theme-surface));
}

@media (max-width: 760px) {
    .calendar-legend__section--status {
        padding-left: 0;
        border-left: none;
    }
}
</style>
