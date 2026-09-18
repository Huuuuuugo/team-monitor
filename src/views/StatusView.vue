<template>
    <div>
        <PageHeader title="Status das tarefas" subtitle="Distribuição das tarefas por status" />

        <StatusGaugeCard plain />
    </div>
</template>

<script>
import PageHeader from '../components/layout/PageHeader.vue'
import StatusGaugeCard from '../components/panorama/StatusGaugeCard.vue'

export default {
    name: 'StatusView',

    components: {
        PageHeader,
        StatusGaugeCard,
    },
}
</script>
