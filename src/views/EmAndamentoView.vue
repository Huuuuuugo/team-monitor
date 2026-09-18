<template>
    <div>
        <PageHeader
            title="Em Andamento"
            subtitle="Tarefas com status Em Andamento (In Progress)"
        />

        <v-expansion-panels v-model="openPanels" multiple>
            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
                        <span class="font-weight-bold">Atrasadas</span>
                        <v-chip size="x-small" variant="tonal" color="error" class="ml-2">
                            {{ overdue.length }}
                        </v-chip>
                    </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-skeleton-loader v-if="loading && !overdue.length" type="list-item-two-line@3" />
                    <div v-else-if="!overdue.length" class="text-center py-6">
                        <v-icon size="44" color="success">mdi-check-circle-outline</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">
                            Nenhuma tarefa atrasada. Excelente! 🎉
                        </div>
                    </div>
                    <MemberGroup
                        v-for="group in overdueGroups"
                        :key="groupKey(group)"
                        :member="group.member"
                        :issues="group.issues"
                    />
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon color="grey" class="mr-2">mdi-calendar-remove-outline</v-icon>
                        <span class="font-weight-bold">Sem Prazo</span>
                        <v-chip size="x-small" variant="tonal" class="ml-2">{{ noDue.length }}</v-chip>
                    </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-skeleton-loader v-if="loading && !noDue.length" type="list-item-two-line@3" />
                    <div v-else-if="!noDue.length" class="text-center py-6">
                        <v-icon size="44" color="medium-emphasis">mdi-calendar-check-outline</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">
                            Todas as tarefas em andamento possuem prazo definido.
                        </div>
                    </div>
                    <MemberGroup
                        v-for="group in noDueGroups"
                        :key="groupKey(group)"
                        :member="group.member"
                        :issues="group.issues"
                    />
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon color="success" class="mr-2">mdi-check-circle-outline</v-icon>
                        <span class="font-weight-bold">No Prazo</span>
                        <v-chip size="x-small" variant="tonal" color="success" class="ml-2">
                            {{ onTime.length }}
                        </v-chip>
                    </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-skeleton-loader v-if="loading && !onTime.length" type="list-item-two-line@3" />
                    <div v-else-if="!onTime.length" class="text-center py-6">
                        <v-icon size="44" color="medium-emphasis">mdi-clipboard-text-outline</v-icon>
                        <div class="text-body-2 text-medium-emphasis mt-2">
                            Nenhuma tarefa em andamento com prazo futuro.
                        </div>
                    </div>
                    <MemberGroup
                        v-for="group in onTimeGroups"
                        :key="groupKey(group)"
                        :member="group.member"
                        :issues="group.issues"
                    />
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import MemberGroup from '../components/member/MemberGroup.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import {
    isOverdue,
    getDueDate,
    groupByAssignee,
    sortByDueDate,
    sortByPriorityThenName,
    comparePriority,
} from '../utils/issueHelpers.js'

export default {
    name: 'EmAndamentoView',

    components: {
        MemberGroup,
        PageHeader,
    },

    data: () => ({
        openPanels: [0, 1, 2],
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['enrichedIssues', 'memberMap', 'loading']),

        activeIssues() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'started')
        },

        overdue() {
            return sortByDueDate(this.activeIssues.filter(isOverdue))
        },

        noDue() {
            return sortByPriorityThenName(this.activeIssues.filter(issue => !getDueDate(issue)))
        },

        onTime() {
            return this.activeIssues
                .filter(issue => getDueDate(issue) && !isOverdue(issue))
                .sort((a, b) =>
                    String(getDueDate(a)).localeCompare(String(getDueDate(b))) || comparePriority(a, b)
                )
        },

        overdueGroups() {
            return groupByAssignee(this.overdue, this.memberMap)
        },

        noDueGroups() {
            return groupByAssignee(this.noDue, this.memberMap)
        },

        onTimeGroups() {
            return groupByAssignee(this.onTime, this.memberMap)
        },
    },

    methods: {
        groupKey(group) {
            return group.member ? group.member.member?.id || group.member.id : 'unassigned'
        },
    },
}
</script>
