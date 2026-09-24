<template>
    <v-tooltip
        :text="text"
        location="top"
        max-width="340"
        :open-on-hover="canHover"
        :open-on-click="!canHover"
    >
        <template #activator="{ props }">
            <v-icon
                v-bind="props"
                :size="size"
                class="hint-icon"
                tabindex="0"
                role="button"
                :aria-label="ariaLabel || text"
            >
                mdi-help-circle-outline
            </v-icon>
        </template>
    </v-tooltip>
</template>

<script>
function detectHover() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export default {
    name: 'HintIcon',

    props: {
        text: { type: String, required: true },
        size: { type: [Number, String], default: 15 },
        ariaLabel: { type: String, default: '' },
    },

    data: () => ({
        canHover: detectHover(),
    }),
}
</script>

<style scoped>
.hint-icon {
    color: rgba(var(--v-theme-on-surface), 0.35);
    cursor: help;
    transition: color 0.15s ease;
}

.hint-icon:hover {
    color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
