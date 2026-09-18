<template>
    <div>
        <PageHeader title="Kanban" subtitle="Quadro e timeline das tarefas do time" />

        <v-tabs v-model="activeTab" color="primary" density="comfortable" class="sub-tabs mb-4">
            <v-tab value="board">
                <v-icon start size="18">mdi-view-column-outline</v-icon>
                Board
            </v-tab>
            <v-tab value="timeline">
                <v-icon start size="18">mdi-chart-gantt</v-icon>
                Timeline
            </v-tab>
        </v-tabs>

        <v-skeleton-loader v-if="loading && !enrichedIssues.length" type="image, article@3" />

        <KanbanBoard v-else-if="activeTab === 'board'" />

        <TimelineBoard v-else />
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import KanbanBoard from '../components/kanban/KanbanBoard.vue'
import TimelineBoard from '../components/timeline/TimelineBoard.vue'
import PageHeader from '../components/layout/PageHeader.vue'

export default {
    name: 'KanbanView',

    components: {
        KanbanBoard,
        TimelineBoard,
        PageHeader,
    },

    data: () => ({
        activeTab: 'board',
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['enrichedIssues', 'loading']),
    },
}
</script>

<style scoped>
.sub-tabs :deep(.v-tab) {
    text-transform: none;
    font-weight: 500;
    font-size: 13px;
    min-width: 0;
    padding: 0 14px;
}

.sub-tabs :deep(.v-slide-group__content) {
    gap: 4px;
}
</style>
