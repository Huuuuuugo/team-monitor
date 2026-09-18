<template>
    <div class="project-progress mb-4">
        <div class="d-flex align-center justify-space-between mb-1">
            <span class="project-progress__name text-truncate">{{ project.name }}</span>
            <span class="project-progress__count">{{ completed }}/{{ total }}</span>
        </div>
        <v-progress-linear
            :model-value="percent"
            :color="barColor"
            height="6"
            rounded
            bg-color="surface-variant"
        />
        <div class="project-progress__percent">{{ percent }}% concluído</div>
    </div>
</template>

<script>
export default {
    name: 'ProjectProgress',

    props: {
        project: { type: Object, required: true },
        total: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        percent: { type: Number, default: 0 },
    },

    computed: {
        barColor() {
            return this.percent >= 100 ? 'success' : 'primary'
        },
    },
}
</script>

<style scoped>
.project-progress__name {
    font-size: 13px;
    font-weight: 500;
    color: rgb(var(--v-theme-on-surface));
}

.project-progress__count {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-left: 8px;
}

.project-progress__percent {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    margin-top: 4px;
}
</style>
