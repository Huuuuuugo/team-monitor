<template>
    <div>
        <PageHeader title="Módulos" subtitle="Visão agregada das tarefas por módulo" />

        <v-card variant="flat" class="pa-3 mb-4 sticky-filters modulo-filters">
            <v-text-field
                v-model="filters.search"
                label="Buscar por módulo ou projeto"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="mb-3"
            />

            <div class="d-flex flex-wrap align-center ga-2">
                <v-autocomplete
                    v-model="filters.projectId"
                    :items="projectItems"
                    label="Projeto"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="modulo-filters__select"
                />

                <v-autocomplete
                    v-model="filters.memberId"
                    :items="memberItems"
                    label="Responsável"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="modulo-filters__select"
                />

                <v-btn
                    icon="mdi-filter-off-outline"
                    variant="text"
                    class="ml-auto"
                    title="Limpar filtros"
                    aria-label="Limpar filtros"
                    @click="resetFilters"
                />
            </div>
        </v-card>

        <v-skeleton-loader v-if="loading && !modules.length" type="list-item-two-line@6" />

        <div v-else-if="!filteredModules.length" class="modulos-empty">
            <v-icon size="48" color="medium-emphasis">mdi-view-module-outline</v-icon>
            <div class="text-body-2 text-medium-emphasis mt-2">
                {{ modules.length
                    ? 'Nenhum módulo encontrado com os filtros atuais.'
                    : 'Nenhum módulo encontrado nos projetos.' }}
            </div>
        </div>

        <div v-else class="modulos-grid">
            <ModuleCard
                v-for="module in filteredModules"
                :key="module.id"
                :module="module"
                @select="openModule"
            />
        </div>

        <ModuleDrawer v-model="drawerOpen" :module="selectedModule" />
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import PageHeader from '../components/layout/PageHeader.vue'
import ModuleCard from '../components/module/ModuleCard.vue'
import ModuleDrawer from '../components/module/ModuleDrawer.vue'
import { memberName } from '../utils/formatters.js'
import { filterModules, sortModules } from '../utils/moduleHelpers.js'

export default {
    name: 'ModulosView',

    components: {
        PageHeader,
        ModuleCard,
        ModuleDrawer,
    },

    data: () => ({
        filters: { search: '', projectId: null, memberId: null },
        drawerOpen: false,
        selectedModule: null,
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['projects', 'members', 'loading', 'enrichedModules']),

        modules() {
            return this.enrichedModules
        },

        projectItems() {
            return this.projects.map(project => ({ title: project.name, value: project.id }))
        },

        memberItems() {
            return this.members.map(member => ({
                title: memberName(member),
                value: member.member?.id || member.id,
            }))
        },

        filteredModules() {
            return sortModules(filterModules(this.modules, this.filters))
        },
    },

    methods: {
        resetFilters() {
            this.filters = { search: '', projectId: null, memberId: null }
        },

        openModule(module) {
            this.selectedModule = module
            this.drawerOpen = true
        },
    },
}
</script>

<style scoped>
.sticky-filters {
    position: sticky;
    top: 76px;
    z-index: 5;
}

.modulo-filters__select {
    flex: 1 1 190px;
    min-width: 160px;
}

.modulo-filters :deep(.v-field__input),
.modulo-filters :deep(.v-label.v-field-label),
.modulo-filters :deep(.v-field__input::placeholder) {
    font-size: 12px;
}

.modulo-filters :deep(.v-label.v-field-label--floating) {
    font-size: 11px;
}

.modulos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.modulos-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 16px;
    text-align: center;
}
</style>
