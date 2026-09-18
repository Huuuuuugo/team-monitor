<template>
    <v-select
        :model-value="planeSlug"
        :items="slugOptions"
        item-title="title"
        item-value="value"
        prepend-inner-icon="mdi-domain"
        placeholder="Workspace"
        title="Workspace do Plane"
        aria-label="Workspace do Plane"
        variant="solo-filled"
        density="compact"
        rounded="lg"
        flat
        hide-details
        :menu-props="{ maxHeight: 320 }"
        @update:model-value="onSlugChange"
    />
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import { useUiStore } from '../../stores/ui.js'
import { slugLabel } from '../../utils/formatters.js'

export default {
    name: 'SlugSelect',

    computed: {
        ...mapState(usePlaneDataStore, ['error']),
        ...mapState(useUiStore, ['planeSlug', 'planeSlugs']),

        slugOptions() {
            return this.planeSlugs.map(slug => ({ title: slugLabel(slug), value: slug }))
        },
    },

    methods: {
        ...mapActions(usePlaneDataStore, ['switchSlug']),
        ...mapActions(useUiStore, ['showSnackbar', 'setPlaneSlug', 'resetListFilters', 'closeModal']),

        async onSlugChange(value) {
            const raw = value && typeof value === 'object' ? (value.value ?? value.slug ?? '') : value
            const slug = String(raw || '').trim()
            if (!slug || slug === this.planeSlug) return

            const previous = this.planeSlug
            this.setPlaneSlug(slug)
            this.resetListFilters()
            this.closeModal()

            await this.switchSlug(slug)

            if (this.error) {
                this.showSnackbar(`Workspace "${slugLabel(slug)}" indisponível. Voltando para "${slugLabel(previous)}".`, 'error')
                this.setPlaneSlug(previous)
                await this.switchSlug(previous)
                return
            }

            this.showSnackbar(`Dados carregados para o workspace "${slugLabel(slug)}".`, 'success')
        },
    },
}
</script>
