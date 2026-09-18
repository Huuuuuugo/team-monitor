<template>
    <aside class="app-aside">
        <StatusGaugeCard class="mb-4" />
        <RecentActivitiesCard />
    </aside>
</template>

<script>
import StatusGaugeCard from '../panorama/StatusGaugeCard.vue'
import RecentActivitiesCard from './RecentActivitiesCard.vue'

export default {
    name: 'AppAside',

    components: {
        StatusGaugeCard,
        RecentActivitiesCard,
    },
}
</script>
