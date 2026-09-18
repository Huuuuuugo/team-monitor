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
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="overdueIssues.length"
                    label="Atrasadas"
                    icon="mdi-alert-circle-outline"
                    color="error"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="completedTodayCount"
                    label="Concluídas hoje"
                    icon="mdi-check-circle-outline"
                    color="success"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="projects.length"
                    label="Projetos ativos"
                    icon="mdi-folder-multiple-outline"
                    color="info"
                />
            </v-col>
        </v-row>

        <v-row class="mt-2">
            <v-col cols="12" md="6">
                <v-card variant="flat" class="pa-4 h-100">
                    <div class="text-subtitle-1 font-weight-bold mb-3">Progresso por projeto</div>
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
                    <div class="text-subtitle-1 font-weight-bold mb-3">Carga por membro</div>
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
