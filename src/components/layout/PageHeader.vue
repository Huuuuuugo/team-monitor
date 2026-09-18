<template>
    <div class="page-header mb-5">
        <div class="page-header__crumb">
            <span>{{ breadcrumb }}</span>
            <v-icon size="12">mdi-chevron-right</v-icon>
            <span>{{ title }}</span>
        </div>

        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="min-width-0">
                <h1 class="page-title">{{ title }}</h1>
                <div v-if="subtitle" class="page-subtitle">{{ subtitle }}</div>
            </div>

            <div v-if="$slots.actions" class="d-flex align-center ga-2">
                <slot name="actions" />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PageHeader',

    props: {
        title: { type: String, required: true },
        subtitle: { type: String, default: '' },
        breadcrumb: { type: String, default: 'Projetos' },
    },
}
</script>

<style scoped>
.page-header__crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-bottom: 6px;
}

.page-title {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: rgb(var(--v-theme-on-surface));
}

.page-subtitle {
    font-size: 13px;
    color: rgba(var(--v-theme-on-surface), 0.55);
    margin-top: 4px;
}
</style>
