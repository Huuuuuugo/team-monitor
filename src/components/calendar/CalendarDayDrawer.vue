<template>
    <v-navigation-drawer
        :model-value="modelValue"
        location="right"
        temporary
        width="400"
        class="calendar-drawer"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="calendar-drawer__head">
            <div class="min-width-0">
                <div class="text-subtitle-1 font-weight-bold">
                    {{ dayLabel || 'Dia' }}
                </div>
                <div class="text-caption text-medium-emphasis">{{ summary }}</div>
            </div>
            <div class="d-flex align-center ga-1">
                <v-btn
                    v-if="filter"
                    size="small"
                    variant="text"
                    @click="$emit('update:filter', '')"
                >
                    Mostrar todas
                </v-btn>
                <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    aria-label="Fechar"
                    @click="$emit('update:modelValue', false)"
                />
            </div>
        </div>

        <v-divider />

        <div class="calendar-drawer__body">
            <section v-if="showCreated">
                <div class="calendar-drawer__section-head">
                    <span class="calendar-drawer__marker calendar-drawer__marker--filled" />
                    <span class="calendar-drawer__section-title">Criadas neste dia</span>
                    <v-chip size="x-small" variant="tonal">{{ groups.created.length }}</v-chip>
                </div>
                <div v-if="!groups.created.length" class="calendar-drawer__empty">
                    Nenhuma tarefa criada neste dia.
                </div>
                <IssueCard v-for="issue in groups.created" :key="issue.id" :issue="issue" />
            </section>

            <section v-if="showModified">
                <div class="calendar-drawer__section-head">
                    <span class="calendar-drawer__marker calendar-drawer__marker--outline" />
                    <span class="calendar-drawer__section-title">Modificadas neste dia</span>
                    <v-chip size="x-small" variant="tonal">{{ groups.modified.length }}</v-chip>
                </div>
                <div v-if="!groups.modified.length" class="calendar-drawer__empty">
                    Nenhuma tarefa modificada neste dia.
                </div>
                <IssueCard v-for="issue in groups.modified" :key="issue.id" :issue="issue" />
            </section>
        </div>
    </v-navigation-drawer>
</template>

<script>
import IssueCard from '../issue/IssueCard.vue'
import { formatDayLabel } from '../../utils/calendarHelpers.js'

export default {
    name: 'CalendarDayDrawer',

    components: {
        IssueCard,
    },

    props: {
        modelValue: { type: Boolean, default: false },
        dayKey: { type: String, default: '' },
        filter: { type: String, default: '' },
        groups: {
            type: Object,
            default: () => ({ created: [], modified: [], entries: [] }),
        },
    },

    emits: ['update:modelValue', 'update:filter'],

    computed: {
        dayLabel() {
            return formatDayLabel(this.dayKey)
        },

        showCreated() {
            return this.filter !== 'modified'
        },

        showModified() {
            return this.filter !== 'created'
        },

        summary() {
            const created = this.groups.created.length
            const modified = this.groups.modified.length

            if (this.filter === 'created') {
                return `${created} ${created === 1 ? 'tarefa criada' : 'tarefas criadas'}`
            }
            if (this.filter === 'modified') {
                return `${modified} ${modified === 1 ? 'tarefa modificada' : 'tarefas modificadas'}`
            }

            return `${created} ${created === 1 ? 'criada' : 'criadas'} · ${modified} ${
                modified === 1 ? 'modificada' : 'modificadas'
            }`
        },
    },
}
</script>

<style scoped>
.calendar-drawer__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 12px;
}

.calendar-drawer__body {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 20px;
}

.calendar-drawer__section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.calendar-drawer__marker {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    box-sizing: border-box;
    background: rgba(var(--v-theme-on-surface), 0.65);
}

.calendar-drawer__marker--outline {
    background: transparent;
    border: 1.5px solid rgba(var(--v-theme-on-surface), 0.65);
}

.calendar-drawer__section-title {
    font-size: 13px;
    font-weight: 600;
}

.calendar-drawer__empty {
    padding: 4px 0 8px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}
</style>
