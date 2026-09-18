<template>
    <v-card
        variant="flat"
        class="tone-card aside-card"
        :class="{ 'aside-card--plain': plain }"
    >
        <div v-if="!plain" class="aside-card__header">
            <span class="aside-card__title">Status das tarefas</span>
            <v-icon size="18" class="aside-card__menu">mdi-dots-horizontal</v-icon>
        </div>

        <v-skeleton-loader
            v-if="loading"
            type="image, text@3"
            class="aside-skeleton"
        />

        <ProgressGauge
            v-else
            :plain="plain"
            :completed="completedCount"
            :in-progress="inProgressCount"
            :backlog="backlogCount"
            :cancelled="cancelledCount"
        />
    </v-card>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import ProgressGauge from './ProgressGauge.vue'

export default {
    name: 'StatusGaugeCard',

    components: {
        ProgressGauge,
    },

    props: {
        plain: { type: Boolean, default: false },
    },

    computed: {
        ...mapState(usePlaneDataStore, ['enrichedIssues', 'loading']),

        completedCount() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'completed').length
        },

        inProgressCount() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'started').length
        },

        backlogCount() {
            return this.enrichedIssues.filter(issue =>
                ['backlog', 'unstarted'].includes(issue._state?.group)
            ).length
        },

        cancelledCount() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'cancelled').length
        },
    },
}
</script>

<style scoped>
.aside-card--plain {
    background: transparent !important;
    border: none !important;
    padding: 0;
}
</style>
