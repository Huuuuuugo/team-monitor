<template>
    <div>
        <PageHeader title="Hoje" :subtitle="todayLabel" class="text-capitalize">
            <template #actions>
                <v-chip v-if="activitiesLoading" size="small" variant="tonal" color="primary">
                    <v-progress-circular indeterminate size="14" width="2" class="mr-2" />
                    Carregando histórico...
                </v-chip>
            </template>
        </PageHeader>

        <v-expansion-panels v-model="openPanels" multiple>
            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon color="success" class="mr-2">mdi-plus-circle-outline</v-icon>
                        <span class="font-weight-bold">Criadas hoje</span>
                        <v-chip size="x-small" variant="tonal" color="success" class="ml-2">
                            {{ createdToday.length }}
                        </v-chip>
                    </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-skeleton-loader v-if="loading && !createdToday.length" type="list-item-two-line@3" />
                    <div v-else-if="!createdToday.length" class="text-center py-6">
                        <v-icon size="44" color="medium-emphasis">mdi-check-circle-outline</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">Nenhuma tarefa criada hoje 🎉</div>
                    </div>
                    <IssueCard v-for="issue in createdToday" :key="issue.id" :issue="issue" />
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon color="info" class="mr-2">mdi-pencil-outline</v-icon>
                        <span class="font-weight-bold">Modificadas hoje</span>
                        <v-chip size="x-small" variant="tonal" color="info" class="ml-2">
                            {{ updatedToday.length }}
                        </v-chip>
                    </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-skeleton-loader v-if="loading && !updatedToday.length" type="list-item-two-line@3" />
                    <div v-else-if="!updatedToday.length" class="text-center py-6">
                        <v-icon size="44" color="medium-emphasis">mdi-pencil-off-outline</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">Nenhuma tarefa modificada hoje.</div>
                    </div>
                    <IssueCard v-for="issue in updatedToday" :key="issue.id" :issue="issue" />
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon color="warning" class="mr-2">mdi-swap-horizontal</v-icon>
                        <span class="font-weight-bold">Mudanças de estado hoje</span>
                        <v-chip size="x-small" variant="tonal" color="warning" class="ml-2">
                            {{ stateChanges.length }}
                        </v-chip>
                    </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-skeleton-loader
                        v-if="activitiesLoading && !stateChanges.length"
                        type="list-item-two-line@3"
                    />
                    <div v-else-if="!stateChanges.length" class="text-center py-6">
                        <v-icon size="44" color="medium-emphasis">mdi-swap-horizontal</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">
                            Nenhuma mudança de estado registrada hoje.
                        </div>
                    </div>

                    <v-card
                        v-for="change in stateChanges"
                        :key="change.activity.id"
                        variant="flat"
                        class="activity-card mb-2"
                        tabindex="0"
                        role="button"
                        @click="openModal(change.issue)"
                        @keydown.enter.prevent="openModal(change.issue)"
                    >
                        <v-card-text class="pa-3">
                            <div class="d-flex align-center flex-wrap ga-3">
                                <div class="flex-grow-1 min-width-0">
                                    <div class="text-body-2 font-weight-medium">{{ change.issue.name }}</div>
                                    <div class="text-caption text-medium-emphasis">
                                        #{{ change.issue.sequence_id }}
                                        <template v-if="change.issue._project">
                                            · {{ change.issue._project.name }}
                                        </template>
                                    </div>
                                </div>

                                <div class="d-flex align-center ga-1">
                                    <v-chip size="small" variant="tonal" :color="stateColor(change.activity.old_value)">
                                        {{ change.activity.old_value || '—' }}
                                    </v-chip>
                                    <v-icon size="16">mdi-arrow-right</v-icon>
                                    <v-chip size="small" variant="tonal" :color="stateColor(change.activity.new_value)">
                                        {{ change.activity.new_value || '—' }}
                                    </v-chip>
                                </div>

                                <div class="text-caption text-medium-emphasis d-flex align-center ga-1">
                                    <v-icon size="14">mdi-account-outline</v-icon>
                                    {{ actorName(change.activity) }} · {{ formatTime(change.activity.created_at) }}
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon color="grey" class="mr-2">mdi-delete-outline</v-icon>
                        <span class="font-weight-bold">Deletadas hoje</span>
                        <v-chip size="x-small" variant="tonal" class="ml-2">0</v-chip>
                    </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-card variant="tonal" color="grey" class="pa-4 d-flex align-center ga-3">
                        <v-icon size="32">mdi-information-outline</v-icon>
                        <div class="text-body-2">
                            O Plane Community Edition não registra issues deletadas via API. Esta seção
                            ficará disponível em versões futuras.
                        </div>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import { useUiStore } from '../stores/ui.js'
import IssueCard from '../components/issue/IssueCard.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import { sortByDateDesc, localDateKey, today } from '../utils/issueHelpers.js'
import { formatTime } from '../utils/formatters.js'

export default {
    name: 'HojeView',

    components: {
        IssueCard,
        PageHeader,
    },

    data: () => ({
        openPanels: [0, 1, 2, 3],
        activitiesLoading: false,
    }),

    computed: {
        ...mapState(usePlaneDataStore, [
            'loading',
            'createdTodayIssues',
            'updatedTodayIssues',
            'touchedTodayIssues',
            'activitiesMap',
            'states',
            'memberMap',
        ]),

        createdToday() {
            return sortByDateDesc(this.createdTodayIssues, 'created_at')
        },

        updatedToday() {
            return sortByDateDesc(this.updatedTodayIssues, 'updated_at')
        },

        statesByName() {
            const map = {}
            for (const state of this.states) {
                if (state?.name && !map[state.name]) map[state.name] = state
            }
            return map
        },

        stateChanges() {
            const changes = []
            const day = today()

            for (const issue of this.touchedTodayIssues) {
                const activities = this.activitiesMap[issue.id] || []
                for (const activity of activities) {
                    if (activity.field === 'state' && localDateKey(activity.created_at) === day) {
                        changes.push({ issue, activity })
                    }
                }
            }

            return changes.sort((a, b) => new Date(b.activity.created_at) - new Date(a.activity.created_at))
        },

        todayLabel() {
            return new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            })
        },
    },

    watch: {
        touchedTodayIssues: {
            immediate: true,
            handler(list) {
                if (list.length) this.loadTodayActivities()
            },
        },
    },

    methods: {
        ...mapActions(useUiStore, ['openModal']),
        ...mapActions(usePlaneDataStore, ['loadActivitiesForIssues']),

        formatTime,

        async loadTodayActivities() {
            if (this.activitiesLoading) return
            this.activitiesLoading = true
            try {
                await this.loadActivitiesForIssues(this.touchedTodayIssues)
            } finally {
                this.activitiesLoading = false
            }
        },

        stateColor(name) {
            return this.statesByName[name]?.color || 'grey'
        },

        actorName(activity) {
            if (activity.actor_detail?.full_name) return activity.actor_detail.full_name
            const member = this.memberMap[activity.actor]
            if (!member) return 'Sistema'
            return member.member?.full_name || member.first_name || member.full_name || 'Membro'
        },
    },
}
</script>

<style scoped>
.activity-card {
    cursor: pointer;
    background: rgba(var(--v-theme-on-surface), 0.02);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    transition: background 0.15s ease, border-color 0.15s ease;
}

.activity-card:hover {
    background: rgba(var(--v-theme-on-surface), 0.06);
    border-color: rgba(var(--v-theme-on-surface), 0.16);
}
</style>
