<template>
    <div class="kanban-board d-flex ga-4">
        <KanbanColumn
            v-for="column in columns"
            :key="column.group"
            :label="column.label"
            :color="column.color"
            :issues="column.issues"
        />
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import KanbanColumn from './KanbanColumn.vue'
import { sortByPriorityThenName } from '../../utils/issueHelpers.js'
import { STATE_GROUP_COLORS, STATE_GROUP_LABELS, STATE_GROUP_ORDER } from '../../utils/priorityColors.js'

export default {
    name: 'KanbanBoard',

    components: {
        KanbanColumn,
    },

    computed: {
        ...mapState(usePlaneDataStore, ['enrichedIssues']),

        columns() {
            return STATE_GROUP_ORDER.map(group => ({
                group,
                label: STATE_GROUP_LABELS[group],
                color: STATE_GROUP_COLORS[group],
                issues: sortByPriorityThenName(
                    this.enrichedIssues.filter(issue => issue._state?.group === group)
                ),
            }))
        },
    },
}
</script>

<style scoped>
.kanban-board {
    overflow-x: auto;
    padding-bottom: 8px;
}
</style>
