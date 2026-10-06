<template>
    <div>
        <PageHeader
            title="Foco"
            subtitle="Projetos e tarefas em que cada pessoa está focada agora"
        />

        <v-row dense class="mb-2">
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="focusedMembers"
                    label="Pessoas com foco"
                    icon="mdi-target"
                    color="primary"
                    :hint="hints.focused"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="focusedProjects"
                    label="Projetos em foco"
                    icon="mdi-folder-star-outline"
                    color="info"
                    :hint="hints.focusedProjects"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="urgentHighCount"
                    label="Urgentes e altas"
                    icon="mdi-alert-circle-outline"
                    color="warning"
                    :hint="hints.urgentHigh"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <StatCard
                    :value="overdueIssues.length"
                    label="Atrasadas"
                    icon="mdi-clock-alert-outline"
                    color="error"
                    :hint="hints.overdue"
                />
            </v-col>
        </v-row>

        <v-card variant="flat" class="pa-4 mt-2">
            <div class="d-flex align-center flex-wrap ga-2 mb-3">
                <span class="text-subtitle-1 font-weight-bold">Foco por pessoa</span>
                <v-btn
                    size="small"
                    variant="text"
                    color="primary"
                    prepend-icon="mdi-information-outline"
                    @click="infoOpen = true"
                >
                    Como é calculado
                </v-btn>
            </div>

            <v-skeleton-loader v-if="loading && !memberFocus.length" type="list-item-two-line@5" />
            <div v-else-if="!memberFocus.length" class="text-body-2 text-medium-emphasis">
                Nenhum membro com tarefas carregadas.
            </div>
            <template v-else>
                <MemberFocusCard
                    v-for="entry in memberFocus"
                    :key="entry.key"
                    :entry="entry"
                    class="mb-2"
                />

                <div v-if="unassignedOpen.length" class="focus-unassigned">
                    <v-icon size="16">mdi-account-off-outline</v-icon>
                    <span>
                        Sem responsável · {{ unassignedOpen.length }}
                        {{ unassignedOpen.length === 1 ? 'tarefa aberta' : 'tarefas abertas' }}
                    </span>
                    <HintIcon
                        :text="hints.unassigned"
                        :size="15"
                        aria-label="Sobre tarefas sem responsável"
                    />
                </div>
            </template>
        </v-card>

        <FocusInfoDialog v-model="infoOpen" />
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import StatCard from '../components/panorama/StatCard.vue'
import MemberFocusCard from '../components/foco/MemberFocusCard.vue'
import FocusInfoDialog from '../components/foco/FocusInfoDialog.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import HintIcon from '../components/common/HintIcon.vue'
import {
    buildMemberProjectFocus,
    loadFocusSnapshot,
    saveFocusSnapshot,
} from '../utils/focusHelpers.js'

export default {
    name: 'FocoView',

    components: {
        StatCard,
        MemberFocusCard,
        FocusInfoDialog,
        PageHeader,
        HintIcon,
    },

    data: () => ({
        focusSnapshot: null,
        infoOpen: false,
        hints: {
            focused:
                'Membros com pelo menos um projeto em foco. Veja "Como é calculado" para a regra completa.',
            focusedProjects:
                'Projetos distintos que aparecem como foco de pelo menos uma pessoa.',
            urgentHigh:
                'Tarefas abertas com prioridade Urgente ou Alta. Uma tarefa com vários responsáveis conta apenas uma vez.',
            overdue:
                'Tarefas abertas com prazo (due_date ou target_date) já vencido. Tarefas concluídas ou canceladas não entram, mesmo com prazo vencido.',
            unassigned:
                'Tarefas abertas sem responsável. Elas não entram no foco de nenhuma pessoa até serem atribuídas.',
        },
    }),

    created() {
        this.focusSnapshot = loadFocusSnapshot()
    },

    computed: {
        ...mapState(usePlaneDataStore, [
            'enrichedIssues',
            'openIssues',
            'overdueIssues',
            'members',
            'loading',
        ]),

        teamMembers() {
            const known = new Set()

            for (const issue of this.enrichedIssues) {
                for (const member of issue._assignees || []) {
                    known.add(member.member?.id || member.id)
                }
                if (issue.updated_by) known.add(issue.updated_by)
            }

            return this.members.filter(member => known.has(member.member?.id || member.id))
        },

        memberFocus() {
            return buildMemberProjectFocus(this.enrichedIssues, this.teamMembers, {
                previousFocus: this.focusSnapshot,
            })
        },

        focusedMembers() {
            return this.memberFocus.filter(entry => entry.focusProjects.length).length
        },

        focusedProjects() {
            const ids = new Set()
            for (const entry of this.memberFocus) {
                for (const focus of entry.focusProjects) {
                    ids.add(focus.project.id)
                }
            }
            return ids.size
        },

        urgentHighCount() {
            return this.openIssues.filter(issue => ['urgent', 'high'].includes(issue.priority)).length
        },

        unassignedOpen() {
            return this.openIssues.filter(issue => !(issue._assignees || []).length)
        },
    },

    watch: {
        memberFocus(entries) {
            this.persistFocusSnapshot(entries)
        },
        loading(value) {
            if (!value) this.persistFocusSnapshot(this.memberFocus)
        },
    },

    methods: {
        persistFocusSnapshot(entries) {
            if (this.loading || !entries || !entries.length) return

            const people = {}
            for (const entry of entries) {
                people[entry.key] = entry.focusProjects.map(focus => focus.project.id)
            }
            saveFocusSnapshot(people)
        },
    },
}
</script>

<style scoped>
.focus-unassigned {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    padding: 8px 12px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}
</style>
