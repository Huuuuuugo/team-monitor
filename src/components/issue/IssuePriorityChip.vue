<template>
    <v-chip
        size="x-small"
        variant="flat"
        class="priority-chip font-weight-medium"
        :style="toneStyle"
        :title="`Prioridade: ${label}`"
    >
        {{ label }}
    </v-chip>
</template>

<script>
import { PRIORITY_LABELS, priorityTone } from '../../utils/priorityColors.js'

export default {
    name: 'IssuePriorityChip',

    props: {
        priority: { type: String, default: 'none' },
    },

    computed: {
        tone() {
            return priorityTone(this.priority, this.$vuetify.theme.current.dark)
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
