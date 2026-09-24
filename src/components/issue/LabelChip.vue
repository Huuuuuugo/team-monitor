<template>
    <v-chip
        :size="size"
        variant="flat"
        class="label-chip font-weight-medium"
        :style="toneStyle"
        :title="name"
    >
        {{ name }}
    </v-chip>
</template>

<script>
import { toneFromColor } from '../../utils/colorTones.js'

export default {
    name: 'LabelChip',

    props: {
        label: { type: Object, required: true },
        size: { type: String, default: 'x-small' },
    },

    computed: {
        name() {
            return this.label?.name || ''
        },

        color() {
            return this.label?.color || '#9ca3af'
        },

        toneStyle() {
            return toneFromColor(this.color, this.$vuetify.theme.current.dark)
        },
    },
}
</script>

<style scoped>
.label-chip {
    max-width: 100%;
}

.label-chip :deep(.v-chip__content) {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
