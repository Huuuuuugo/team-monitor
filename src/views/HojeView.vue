<template>
    <div>
        <PageHeader title="Hoje" :subtitle="todayLabel" class="text-capitalize">
            <template #actions>
                <v-chip v-if="loading && !enrichedIssues.length" size="small" variant="tonal" color="primary">
                    <v-progress-circular indeterminate size="14" width="2" class="mr-2" />
                    Carregando...
                </v-chip>
            </template>
        </PageHeader>

        <v-card variant="flat" class="tone-card today-block">
            <div class="today-block__head d-flex align-center flex-wrap ga-2 px-3">
                <v-tabs v-model="activeTab" density="comfortable" color="primary" class="today-block__tabs">
                    <v-tab value="progress">
                        <v-icon size="16" class="mr-2">mdi-progress-clock</v-icon>
                        Em andamento
                        <v-chip size="x-small" variant="tonal" class="ml-2">
                            {{ inProgressToday.length }}
                        </v-chip>
                    </v-tab>
                    <v-tab value="due">
                        <v-icon size="16" class="mr-2">mdi-calendar-clock</v-icon>
                        Encerram hoje
                        <v-chip size="x-small" variant="tonal" class="ml-2">
                            {{ dueTodayInProgress.length }}
                        </v-chip>
                    </v-tab>
                </v-tabs>

                <v-spacer />

                <v-btn
                    v-if="currentIssues.length"
                    variant="text"
                    size="small"
                    :prepend-icon="expanded ? 'mdi-arrow-collapse-vertical' : 'mdi-arrow-expand-vertical'"
                    @click="expanded = !expanded"
                >
                    {{ expanded ? 'Recolher' : 'Expandir' }}
                </v-btn>
            </div>

            <v-divider />

            <div class="today-block__body" :class="{ 'today-block__body--expanded': expanded }">
                <v-skeleton-loader
                    v-if="loading && !currentIssues.length"
                    type="list-item-two-line@4"
                />

                <div v-else-if="!currentIssues.length" class="today-block__empty">
                    <v-icon size="44" color="medium-emphasis">{{ emptyIcon }}</v-icon>
                    <div class="text-body-2 text-medium-emphasis mt-2">{{ emptyMessage }}</div>
                </div>

                <div v-else class="today-block__grid">
                    <IssueCard
                        v-for="issue in currentIssues"
                        :key="issue.id"
                        :issue="issue"
                        compact
                        class="today-card"
                    />
                </div>
            </div>
        </v-card>
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import IssueCard from '../components/issue/IssueCard.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import { isDueToday } from '../utils/issueHelpers.js'

export default {
    name: 'HojeView',

    components: {
        IssueCard,
        PageHeader,
    },

    data: () => ({
        activeTab: 'progress',
        expanded: false,
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['loading', 'enrichedIssues']),

        inProgressToday() {
            return this.enrichedIssues
                .filter(issue => issue._state?.group === 'started')
                .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
        },

        dueTodayInProgress() {
            return this.inProgressToday.filter(isDueToday)
        },

        currentIssues() {
            return this.activeTab === 'due' ? this.dueTodayInProgress : this.inProgressToday
        },

        emptyIcon() {
            return this.activeTab === 'due' ? 'mdi-calendar-check-outline' : 'mdi-progress-clock'
        },

        emptyMessage() {
            return this.activeTab === 'due'
                ? 'Nenhuma tarefa em andamento com prazo para hoje.'
                : 'Nenhuma tarefa em andamento.'
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
}
</script>

<style scoped>
.today-block {
    overflow: hidden;
}

.today-block__head {
    padding-top: 8px;
    padding-bottom: 8px;
}

.today-block__tabs {
    flex: 1 1 auto;
    min-width: 0;
}

.today-block__tabs :deep(.v-tab) {
    min-width: 0;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
}

.today-block__body {
    max-height: 392px;
    overflow-y: auto;
    padding: 16px;
}

.today-block__body--expanded {
    max-height: none;
    overflow-y: visible;
}

.today-block__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    align-items: start;
}

.today-block__grid :deep(.issue-card) {
    margin-bottom: 0 !important;
}

.today-card {
    background: color-mix(in srgb, rgb(var(--v-theme-primary)) 8%, rgb(var(--v-theme-surface))) !important;
}

.today-card:hover {
    background: color-mix(in srgb, rgb(var(--v-theme-primary)) 14%, rgb(var(--v-theme-surface))) !important;
}

.v-theme--dark .today-card {
    background: color-mix(in srgb, rgb(var(--v-theme-primary)) 16%, rgb(var(--v-theme-surface))) !important;
}

.v-theme--dark .today-card:hover {
    background: color-mix(in srgb, rgb(var(--v-theme-primary)) 24%, rgb(var(--v-theme-surface))) !important;
}

.today-block__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    text-align: center;
}

@media (max-width: 1279px) {
    .today-block__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 959px) {
    .today-block__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 599px) {
    .today-block__grid {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
