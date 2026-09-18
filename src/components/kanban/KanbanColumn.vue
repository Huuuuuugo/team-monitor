<template>
    <v-card class="kanban-column d-flex flex-column tone-card" variant="flat">
        <div class="kanban-column__header d-flex align-center ga-2 pa-3">
            <span class="kanban-column__dot" :style="{ backgroundColor: color }"></span>
            <span class="kanban-column__label">{{ label }}</span>
            <span class="kanban-column__count">{{ issues.length }}</span>
            <v-spacer />
            <v-icon size="18" class="kanban-column__action">mdi-plus</v-icon>
            <v-icon size="18" class="kanban-column__action">mdi-dots-horizontal</v-icon>
        </div>

        <div class="kanban-column__new">
            <v-icon size="15">mdi-plus</v-icon>
            <span>Novo</span>
        </div>

        <div class="kanban-column__body flex-grow-1 pa-2">
            <IssueCard v-for="issue in visibleIssues" :key="issue.id" :issue="issue" />
            <div v-if="!issues.length" class="kanban-column__empty">
                Nenhuma tarefa
            </div>
            <v-btn
                v-else-if="hasMore"
                variant="text"
                size="small"
                block
                class="kanban-column__more"
                @click="showMore"
            >
                Ver mais ({{ issues.length - visibleCount }})
            </v-btn>
        </div>
    </v-card>
</template>

<script>
import IssueCard from '../issue/IssueCard.vue'

const PAGE_SIZE = 25

export default {
    name: 'KanbanColumn',

    components: {
        IssueCard,
    },

    props: {
        label: { type: String, required: true },
        color: { type: String, default: '#9ca3af' },
        issues: { type: Array, default: () => [] },
    },

    data: () => ({
        visibleCount: PAGE_SIZE,
    }),

    computed: {
        visibleIssues() {
            return this.issues.slice(0, this.visibleCount)
        },

        hasMore() {
            return this.issues.length > this.visibleCount
        },
    },

    methods: {
        showMore() {
            this.visibleCount += PAGE_SIZE
        },
    },
}
</script>

<style scoped>
.kanban-column {
    min-width: 300px;
    width: 300px;
    max-height: calc(100vh - 260px);
}

.kanban-column__header {
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.kanban-column__dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
}

.kanban-column__label {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.kanban-column__count {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 4px;
    display: inline-grid;
    place-items: center;
    font-size: 11px;
    font-weight: 600;
    background: rgba(var(--v-theme-on-surface), 0.08);
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.kanban-column__action {
    color: rgba(var(--v-theme-on-surface), 0.4);
}

.kanban-column__new {
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 8px 8px 0;
    padding: 7px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.kanban-column__new:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.kanban-column__body {
    overflow-y: auto;
}

.kanban-column__empty {
    text-align: center;
    padding: 24px 8px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.kanban-column__more {
    margin-top: 4px;
    font-size: 12px;
    text-transform: none;
    color: rgba(var(--v-theme-on-surface), 0.55);
}
</style>
