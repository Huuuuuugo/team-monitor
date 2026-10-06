<template>
    <div class="slug-select">
        <span class="slug-select__label">Setor</span>
        <v-select
            :model-value="planeSlug"
            :items="slugOptions"
            item-title="title"
            item-value="value"
            aria-label="Setor"
            title="Setor (workspace do Plane)"
            variant="plain"
            density="compact"
            hide-details
            class="slug-select__field"
            :menu-props="{ maxHeight: 320 }"
            @update:model-value="onSlugChange"
        />
    </div>
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

<style scoped>
.slug-select {
    position: relative;
    display: flex;
    align-items: stretch;
    height: var(--topbar-control-height, 38px);
    min-width: 0;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.38);
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
}

.slug-select__label {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    background: #e8ecef;
    color: rgba(var(--v-theme-on-surface), 0.55);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
}

.slug-select__field {
    flex: 1 1 auto;
    min-width: 0;
}

.slug-select__field :deep(.v-field) {
    --v-input-control-height: calc(var(--topbar-control-height, 38px) - 2px);
    --v-field-padding-start: 79px;
    --v-field-padding-end: 8px;
    height: calc(var(--topbar-control-height, 38px) - 2px);
    min-height: calc(var(--topbar-control-height, 38px) - 2px);
    background: transparent;
    box-shadow: none;
    border-radius: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: 13px;
}

.slug-select__field :deep(.v-field__field) {
    align-items: center;
}

.slug-select__field :deep(.v-field__input) {
    min-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    align-items: center;
    font-size: 13px;
}

.slug-select__field :deep(.v-select__selection-text) {
    color: rgb(var(--v-theme-on-surface));
}

.slug-select__field :deep(.v-field__append-inner.v-field__append-inner) {
    align-self: center;
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
    padding-inline-end: 8px;
}

.slug-select__field :deep(.v-field__append-inner .v-icon) {
    font-size: 18px;
    opacity: 0.55;
}
</style>
