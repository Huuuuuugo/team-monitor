<template>
    <v-card variant="flat" class="tone-card pa-4 h-100">
        <div class="d-flex align-center justify-space-between">
            <div class="min-width-0">
                <div class="stat-card__value">{{ value }}</div>
                <div class="stat-card__label d-flex align-center ga-1">
                    <span>{{ label }}</span>
                    <HintIcon v-if="hint" :text="hint" :size="15" :aria-label="`O que é ${label}`" />
                </div>
            </div>
            <div class="stat-card__icon" :class="`text-${color}`">
                <v-icon size="22">{{ icon }}</v-icon>
            </div>
        </div>
    </v-card>
</template>

<script>
import HintIcon from '../common/HintIcon.vue'

export default {
    name: 'StatCard',

    components: {
        HintIcon,
    },

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


</style>
