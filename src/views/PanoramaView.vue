<template>
    <div>
        <PageHeader title="Panorama" subtitle="Visão executiva da operação" />

        <v-row dense class="mb-2">
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="openIssues.length"
                    label="Issues abertas"
                    icon="mdi-clipboard-text-outline"
                    color="primary"
                    :hint="hints.openIssues"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="overdueIssues.length"
                    label="Atrasadas"
                    icon="mdi-alert-circle-outline"
                    color="error"
                    :hint="hints.overdue"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="completedTodayCount"
                    label="Concluídas hoje"
                    icon="mdi-check-circle-outline"
                    color="success"
                    :hint="hints.completedToday"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="projects.length"
                    label="Projetos ativos"
                    icon="mdi-folder-multiple-outline"
                    color="info"
                    :hint="hints.projects"
                />
            </v-col>
        </v-row>

        <v-row class="mt-2">
            <v-col cols="12" md="6">
                <v-card variant="flat" class="pa-4 h-100">
                    <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center ga-2">
                        <span>Progresso por projeto</span>
                        <v-tooltip :text="hints.projectProgress" location="top" max-width="340">
                            <template #activator="{ props }">
                                <v-icon
                                    v-bind="props"
                                    size="16"
                                    class="section-hint"
                                    aria-label="O que é Progresso por projeto"
                                >
                                    mdi-help-circle-outline
                                </v-icon>
                            </template>
                        </v-tooltip>
                    </div>
                    <v-skeleton-loader v-if="loading && !projectProgress.length" type="list-item-two-line@4" />
                    <div v-else-if="!projectProgress.length" class="text-body-2 text-medium-emphasis">
                        Nenhum projeto carregado.
                    </div>
                    <ProjectProgress
                        v-for="entry in projectProgress"
                        :key="entry.project.id"
                        :project="entry.project"
                        :total="entry.total"
                        :completed="entry.completed"
                        :percent="entry.percent"
                    />
                </v-card>
            </v-col>

            <v-col cols="12" md="6">
                <v-card variant="flat" class="pa-4 h-100">
                    <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center ga-2">
                        <span>Carga por membro</span>
                        <v-tooltip :text="hints.workload" location="top" max-width="340">
                            <template #activator="{ props }">
                                <v-icon
                                    v-bind="props"
                                    size="16"
                                    class="section-hint"
                                    aria-label="O que é Carga por membro"
                                >
                                    mdi-help-circle-outline
                                </v-icon>
                            </template>
                        </v-tooltip>
                    </div>
                    <v-skeleton-loader v-if="loading && !workload.length" type="list-item-two-line@4" />
                    <div v-else-if="!workload.length" class="text-body-2 text-medium-emphasis">
                        Nenhuma issue aberta atribuída.
                    </div>
                    <MemberWorkload
                        v-for="entry in workload"
                        :key="entry.key"
                        :member="entry.member"
                        :count="entry.count"
                        :percent="entry.percent"
                    />
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import StatCard from '../components/panorama/StatCard.vue'
import ProjectProgress from '../components/panorama/ProjectProgress.vue'
import MemberWorkload from '../components/panorama/MemberWorkload.vue'
import PageHeader from '../components/layout/PageHeader.vue'

export default {
    name: 'PanoramaView',

    components: {
        StatCard,
        ProjectProgress,
        MemberWorkload,
        PageHeader,
    },

    data: () => ({
        hints: {
            openIssues:
                'Tarefas que não estão concluídas nem canceladas (backlog, a fazer e em andamento).',
            overdue:
                'Tarefas abertas com prazo (due_date ou target_date) já vencido. Tarefas concluídas ou canceladas não entram, mesmo com prazo vencido.',
            completedToday:
                'Tarefas com estado do grupo "concluído" cuja última modificação (updated_at) foi hoje. Usa a data de atualização, não o horário exato da mudança de estado.',
            projects:
                'Projetos em que o usuário da API do Plane é membro. Não considera atividade, tarefas ou status do projeto.',
            projectProgress:
                'Percentual de conclusão de todas as tarefas do projeto. O total inclui tarefas concluídas, canceladas e em aberto; a barra mostra quantas estão concluídas. Projetos sem tarefas não aparecem.',
            workload:
                'Quantidade de tarefas abertas por responsável (backlog, a fazer e em andamento). Não inclui concluídas nem canceladas. Tarefas com mais de um responsável contam para cada um, e a barra é relativa ao membro com mais tarefas.',
        },
    }),

    computed: {
        ...mapState(usePlaneDataStore, [
            'projects',
            'enrichedIssues',
            'openIssues',
            'overdueIssues',
            'completedTodayCount',
            'loading',
        ]),

        projectProgress() {
            const map = new Map()

            for (const issue of this.enrichedIssues) {
                const project = issue._project
                if (!project) continue

                const entry = map.get(project.id) || { project, total: 0, completed: 0 }
                entry.total += 1
                if (issue._state?.group === 'completed') entry.completed += 1
                map.set(project.id, entry)
            }

            return [...map.values()]
                .map(entry => ({
                    ...entry,
                    percent: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0,
                }))
                .sort((a, b) => a.percent - b.percent)
        },

        workload() {
            const map = new Map()

            for (const issue of this.openIssues) {
                const members = issue._assignees.length ? issue._assignees : [null]
                for (const member of members) {
                    const key = member ? member.member?.id || member.id : 'unassigned'
                    const entry = map.get(key) || { key, member, count: 0 }
                    entry.count += 1
                    map.set(key, entry)
                }
            }

            const entries = [...map.values()].sort((a, b) => b.count - a.count)
            const max = entries.length ? entries[0].count : 1

            return entries.map(entry => ({
                ...entry,
                percent: max ? Math.round((entry.count / max) * 100) : 0,
            }))
        },
    },
}
</script>

<style scoped>
.section-hint {
    color: rgba(var(--v-theme-on-surface), 0.35);
    cursor: help;
    transition: color 0.15s ease;
}

.section-hint:hover {
    color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
