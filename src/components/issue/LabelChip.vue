<template>
    <v-chip
        :size="size"
        variant="tonal"
        class="label-chip font-weight-medium"
        :color="color"
        :title="name"
    >
        {{ name }}
    </v-chip>
</template>

<script>
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
