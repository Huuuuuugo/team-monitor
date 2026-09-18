<template>
    <v-card variant="flat" class="tone-card pa-4 h-100">
        <div class="d-flex align-center justify-space-between">
            <div class="min-width-0">
                <div class="stat-card__value">{{ value }}</div>
                <div class="stat-card__label d-flex align-center ga-1">
                    <span>{{ label }}</span>
                    <v-tooltip v-if="hint" :text="hint" location="top" max-width="320">
                        <template #activator="{ props }">
                            <v-icon
                                v-bind="props"
                                size="15"
                                class="stat-card__hint"
                                :aria-label="`O que é ${label}`"
                            >
                                mdi-help-circle-outline
                            </v-icon>
                        </template>
                    </v-tooltip>
                </div>
            </div>
            <div class="stat-card__icon" :class="`text-${color}`">
                <v-icon size="22">{{ icon }}</v-icon>
            </div>
        </div>
    </v-card>
</template>

<script>
export default {
    name: 'StatCard',

    props: {
        value: { type: [Number, String], default: 0 },
        label: { type: String, required: true },
        icon: { type: String, default: 'mdi-chart-box-outline' },
        color: { type: String, default: 'primary' },
        hint: { type: String, default: '' },
    },
}
</script>

<style scoped>
.stat-card__value {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.1;
    color: rgb(var(--v-theme-on-surface));
}

.stat-card__label {
    font-size: 12px;
    margin-top: 4px;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.stat-card__icon {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, currentColor 14%, transparent);
}

.stat-card__hint {
    color: rgba(var(--v-theme-on-surface), 0.35);
    cursor: help;
    transition: color 0.15s ease;
}

.stat-card__hint:hover {
    color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
