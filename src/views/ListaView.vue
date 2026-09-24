<template>
    <div>
        <PageHeader
            title="Lista"
            subtitle="Todas as issues com filtros, ordenação e paginação"
        />

        <v-card variant="flat" class="pa-3 mb-4 sticky-filters lista-filters">
            <v-text-field
                v-model="filters.search"
                label="Buscar por título, descrição ou #"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="mb-3"
            />

            <div class="d-flex flex-wrap align-center ga-2">
                <v-select
                    v-model="filters.projectId"
                    :items="projectItems"
                    label="Projeto"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="lista-filters__select"
                />

                <v-select
                    v-model="filters.memberId"
                    :items="memberItems"
                    label="Responsável"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="lista-filters__select"
                />

                <v-select
                    v-model="filters.stateName"
                    :items="stateItems"
                    label="Estado"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="lista-filters__select"
                />

                <v-select
                    v-model="filters.priority"
                    :items="priorityItems"
                    label="Prioridade"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="lista-filters__select"
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

        <v-card variant="flat">
            <v-data-table
                :headers="headers"
                :items="rows"
                :items-per-page="50"
                :items-per-page-options="[50, 100, 250]"
                :sort-by="sortBy"
                :custom-key-sort="customKeySort"
                :row-props="rowProps"
                item-value="id"
                density="comfortable"
                hover
                @click:row="onRowClick"
            >
                <template #item.sequence_id="{ item }">
                    <span class="text-medium-emphasis">#{{ item.sequence_id }}</span>
                </template>

                <template #item.projectName="{ item }">
                    <span class="text-truncate d-inline-block" style="max-width: 170px">
                        {{ item.projectName }}
                    </span>
                </template>

                <template #item.name="{ item }">
                    <span class="text-truncate d-inline-block" style="max-width: 360px">
                        {{ item.name }}
                    </span>
                </template>

                <template #item.stateName="{ item }">
                    <v-chip size="small" variant="flat" :style="stateTone(item.stateColor)">
                        {{ item.stateName }}
                    </v-chip>
                </template>

                <template #item.labelNames="{ item }">
                    <div v-if="item.labelList.length" class="d-flex flex-wrap ga-1">
                        <LabelChip
                            v-for="label in item.labelList"
                            :key="label.id"
                            :label="label"
                            size="small"
                        />
                    </div>
                    <span v-else class="text-medium-emphasis">—</span>
                </template>

                <template #item.priorityOrder="{ item }">
                    <IssuePriorityChip :priority="item.priority" />
                </template>

                <template #item.assigneeList="{ item }">
                    <div class="d-flex align-center">
                        <MemberAvatar
                            v-for="member in item.assigneeList"
                            :key="memberKey(member)"
                            :member="member"
                            :size="24"
                            class="ml-n1"
                        />
                        <span v-if="!item.assigneeList.length" class="text-medium-emphasis">—</span>
                    </div>
                </template>

                <template #item.dueDate="{ item }">
                    <v-chip
                        v-if="item.dueDate"
                        size="small"
                        variant="tonal"
                        :color="dueColor(item)"
                    >
                        {{ formatDate(item.dueDate) }}
                    </v-chip>
                    <span v-else class="text-medium-emphasis">—</span>
                </template>

                <template #item.updated_at="{ item }">
                    <span :title="formatDateTime(item.updated_at)">{{ formatRelative(item.updated_at) }}</span>
                </template>

                <template #no-data>
                    <div class="text-center py-8">
                        <v-icon size="48" color="medium-emphasis">mdi-text-search</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">
                            Nenhuma issue encontrada com os filtros atuais.
                        </div>
                    </div>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import { useUiStore } from '../stores/ui.js'
import IssuePriorityChip from '../components/issue/IssuePriorityChip.vue'
import LabelChip from '../components/issue/LabelChip.vue'
import MemberAvatar from '../components/member/MemberAvatar.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import { filterIssues, getDueDate, isOverdue, PRIORITY_ORDER } from '../utils/issueHelpers.js'
import { formatDate, formatDateTime, formatRelative, memberName } from '../utils/formatters.js'
import { PRIORITY_LABELS } from '../utils/priorityColors.js'
import { toneFromColor } from '../utils/colorTones.js'

export default {
    name: 'ListaView',

    components: {
        IssuePriorityChip,
        LabelChip,
        MemberAvatar,
        PageHeader,
    },

    computed: {
        ...mapState(usePlaneDataStore, ['enrichedIssues', 'projects', 'members', 'stateOptions']),
        ...mapState(useUiStore, ['listFilters']),

        filters() {
            return this.listFilters
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

        stateItems() {
            return this.stateOptions.map(state => ({ title: state.name, value: state.name }))
        },

        priorityItems() {
            return Object.entries(PRIORITY_LABELS).map(([value, title]) => ({ title, value }))
        },

        rows() {
            return filterIssues(this.enrichedIssues, this.listFilters).map(issue => ({
                ...issue,
                projectName: issue._project?.name || '—',
                stateName: issue._state?.name || '—',
                stateColor: issue._state?.color || '#9ca3af',
                priorityOrder: PRIORITY_ORDER[issue.priority] ?? 4,
                assigneeList: issue._assignees || [],
                labelList: issue._labels || [],
                labelNames: (issue._labels || []).map(label => label.name).join(', '),
                dueDate: getDueDate(issue),
            }))
        },

        headers() {
            return [
                { title: '#', key: 'sequence_id', width: 70 },
                { title: 'Projeto', key: 'projectName', width: 170 },
                { title: 'Título', key: 'name', minWidth: 260 },
                { title: 'Estado', key: 'stateName', width: 150 },
                { title: 'Etiqueta', key: 'labelNames', width: 180 },
                { title: 'Prioridade', key: 'priorityOrder', width: 130 },
                { title: 'Responsáveis', key: 'assigneeList', sortable: false, width: 130 },
                { title: 'Prazo', key: 'dueDate', width: 130 },
                { title: 'Atualizado', key: 'updated_at', width: 140 },
            ]
        },

        sortBy() {
            return [{ key: 'created_at', order: 'desc' }]
        },

        customKeySort() {
            return {
                priorityOrder: (a, b) => (a.priorityOrder ?? 9) - (b.priorityOrder ?? 9),
                dueDate: (a, b) =>
                    String(a.dueDate || '9999-12-31').localeCompare(String(b.dueDate || '9999-12-31')),
                stateName: (a, b) => String(a.stateName).localeCompare(String(b.stateName), 'pt-BR'),
                labelNames: (a, b) => String(a.labelNames).localeCompare(String(b.labelNames), 'pt-BR'),
                projectName: (a, b) => String(a.projectName).localeCompare(String(b.projectName), 'pt-BR'),
                updated_at: (a, b) => String(a.updated_at).localeCompare(String(b.updated_at)),
                created_at: (a, b) => String(a.created_at).localeCompare(String(b.created_at)),
            }
        },
    },

    methods: {
        ...mapActions(useUiStore, ['resetListFilters', 'openModal']),

        formatDate,
        formatDateTime,
        formatRelative,
        memberName,

        memberKey(member) {
            return member.member?.id || member.id || memberName(member)
        },

        dueColor(item) {
            if (isOverdue(item)) return 'error'
            return 'success'
        },

        stateTone(color) {
            return toneFromColor(color, this.$vuetify.theme.current.dark)
        },

        rowProps({ item }) {
            return {
                tabindex: 0,
                style: 'cursor: pointer',
                onKeydown: (event) => {
                    if (event.key === 'Enter') this.openModal(item)
                },
            }
        },

        onRowClick(event, slotProps) {
            const item = slotProps?.item || event
            if (item && item.id) this.openModal(item)
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

.lista-filters__select {
    flex: 1 1 190px;
    min-width: 160px;
}

.lista-filters :deep(.v-field__input),
.lista-filters :deep(.v-label.v-field-label) {
    font-size: 13px;
}

.lista-filters :deep(.v-label.v-field-label--floating) {
    font-size: 12px;
}
</style>
