<template>
    <v-tooltip :text="`Prioridade: ${label}`" location="top">
        <template #activator="{ props }">
            <v-chip
                v-bind="props"
                size="x-small"
                variant="flat"
                class="priority-chip font-weight-medium"
                :style="toneStyle"
            >
                {{ label }}
            </v-chip>
        </template>
    </v-tooltip>
</template>

<script>
import { PRIORITY_LABELS, PRIORITY_TONES } from '../../utils/priorityColors.js'

export default {
    name: 'IssuePriorityChip',

    props: {
        priority: { type: String, default: 'none' },
    },

    computed: {
        tone() {
            return PRIORITY_TONES[this.priority] || PRIORITY_TONES.none
        },

        toneStyle() {
            return {
                backgroundColor: this.tone.background,
                color: this.tone.color,
            }
        },

        label() {
            return PRIORITY_LABELS[this.priority] || PRIORITY_LABELS.none
        },
    },
}
</script>

<style scoped>
.priority-chip {
    letter-spacing: 0.02em;
}
</style>
