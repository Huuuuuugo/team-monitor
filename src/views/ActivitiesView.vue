<template>
    <div>
        <PageHeader title="Atividades recentes" subtitle="Mudanças de estado de hoje" />

        <RecentActivitiesCard feed />
    </div>
</template>

<script>
import PageHeader from '../components/layout/PageHeader.vue'
import RecentActivitiesCard from '../components/layout/RecentActivitiesCard.vue'

export default {
    name: 'ActivitiesView',

    components: {
        PageHeader,
        RecentActivitiesCard,
    },
}
</script>
