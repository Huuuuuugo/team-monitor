<template>
    <v-dialog
        :model-value="isModalOpen"
        max-width="860"
        scrollable
        :opacity="0.6"
        @update:model-value="onDialogChange"
    >
        <v-card v-if="selectedIssue" class="issue-modal">
            <v-toolbar density="comfortable" class="px-2 issue-modal__toolbar">
                <v-toolbar-title class="text-body-1 font-weight-bold">
                    <span class="text-medium-emphasis mr-2">#{{ selectedIssue.sequence_id }}</span>
                    {{ selectedIssue.name }}
                </v-toolbar-title>
                <v-btn icon="mdi-close" variant="text" aria-label="Fechar detalhes" @click="closeModal" />
            </v-toolbar>

            <v-divider />

            <v-card-text class="pa-5">
                <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-chip
                        v-if="currentState"
                        variant="flat"
                        size="small"
                        class="font-weight-medium"
                        :style="stateToneStyle"
                    >
                        {{ currentState.name }}
                    </v-chip>
                    <IssuePriorityChip :priority="selectedIssue.priority" />
                    <v-chip size="small" variant="tonal" prepend-icon="mdi-calendar">
                        {{ dueDate ? `Prazo: ${formatDate(dueDate)}` : 'Sem prazo' }}
                    </v-chip>
                    <v-chip v-if="overdue" color="error" size="small" variant="tonal" prepend-icon="mdi-alert-circle">
                        Atrasado
                    </v-chip>
                </div>

                <v-row dense>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Projeto</div>
                        <div class="text-body-2 d-flex align-center ga-1 mt-1">
                            <v-icon size="16">mdi-folder-outline</v-icon>
                            {{ projectName }}
                        </div>
                    </v-col>

                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Responsáveis</div>
                        <div v-if="assignees.length" class="d-flex flex-wrap ga-3 mt-1">
                            <div
                                v-for="member in assignees"
                                :key="memberKey(member)"
                                class="d-flex align-center ga-2"
                            >
                                <MemberAvatar :member="member" :size="26" />
                                <span class="text-body-2">{{ memberName(member) }}</span>
                            </div>
                        </div>
                        <div v-else class="text-body-2 text-medium-emphasis mt-1">Sem responsável</div>
                    </v-col>

                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Criada em</div>
                        <div class="text-body-2 mt-1">{{ formatDateTime(selectedIssue.created_at) }}</div>
                    </v-col>

                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Última modificação</div>
                        <div class="text-body-2 mt-1">
                            {{ formatDateTime(selectedIssue.updated_at) }}
                            <span class="text-medium-emphasis">({{ formatRelative(selectedIssue.updated_at) }})</span>
                        </div>
                    </v-col>
                </v-row>

                <v-divider class="my-5" />

                <div class="text-subtitle-2 font-weight-bold mb-2">Descrição</div>
                <div v-if="safeDescription" class="issue-description" v-html="safeDescription"></div>
                <div v-else class="text-body-2 text-medium-emphasis">Sem descrição.</div>

                <v-divider class="my-5" />

                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-subtitle-2 font-weight-bold">Histórico de mudanças de estado</div>
                    <v-progress-circular v-if="activitiesLoading" indeterminate size="16" width="2" />
                </div>

                <v-skeleton-loader
                    v-if="activitiesLoading && !stateActivities.length"
                    type="list-item-two-line@2"
                />

                <v-timeline v-else-if="stateActivities.length" density="compact" side="end">
                    <v-timeline-item
                        v-for="activity in stateActivities"
                        :key="activity.id"
                        dot-color="primary"
                        size="small"
                    >
                        <div class="text-body-2 d-flex align-center flex-wrap ga-1">
                            <span class="font-weight-medium">{{ activity.old_value || '—' }}</span>
                            <v-icon size="14">mdi-arrow-right</v-icon>
                            <span class="font-weight-medium">{{ activity.new_value || '—' }}</span>
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ actorName(activity) }} · {{ formatDateTime(activity.created_at) }}
                        </div>
                    </v-timeline-item>
                </v-timeline>

                <div v-else class="text-body-2 text-medium-emphasis">
                    Nenhuma mudança de estado registrada.
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import DOMPurify from 'dompurify'
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import { useUiStore } from '../../stores/ui.js'
import IssuePriorityChip from './IssuePriorityChip.vue'
import MemberAvatar from '../member/MemberAvatar.vue'
import { getDueDate, isOverdue } from '../../utils/issueHelpers.js'
import { formatDate, formatDateTime, formatRelative, memberName } from '../../utils/formatters.js'
import { STATE_GROUP_TONES } from '../../utils/priorityColors.js'

export default {
    name: 'IssueModal',

    components: {
        IssuePriorityChip,
        MemberAvatar,
    },

    data: () => ({
        activitiesLoading: false,
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['stateMap', 'memberMap', 'activitiesMap']),
        ...mapState(useUiStore, ['isModalOpen', 'selectedIssue']),

        currentState() {
            if (!this.selectedIssue) return null
            return this.selectedIssue._state || this.stateMap[this.selectedIssue.state] || null
        },

        stateToneStyle() {
            const tone = STATE_GROUP_TONES[this.currentState?.group] || STATE_GROUP_TONES.backlog
            return {
                backgroundColor: tone.background,
                color: tone.color,
            }
        },

        dueDate() {
            return getDueDate(this.selectedIssue)
        },

        overdue() {
            return isOverdue(this.selectedIssue)
        },

        projectName() {
            return this.selectedIssue?._project?.name || 'Projeto'
        },

        assignees() {
            if (!this.selectedIssue) return []
            if (this.selectedIssue._assignees) return this.selectedIssue._assignees
            return (this.selectedIssue.assignees || [])
                .map(id => this.memberMap[id])
                .filter(Boolean)
        },

        safeDescription() {
            const html = this.selectedIssue?.description_html || ''
            if (!html) return ''
            return DOMPurify.sanitize(html)
        },

        stateActivities() {
            if (!this.selectedIssue) return []
            return this.activitiesMap[this.selectedIssue.id] || []
        },
    },

    watch: {
        isModalOpen(value) {
            if (value) this.loadHistory()
        },
    },

    methods: {
        ...mapActions(useUiStore, ['closeModal']),
        ...mapActions(usePlaneDataStore, ['loadActivities']),

        formatDate,
        formatDateTime,
        formatRelative,
        memberName,

        memberKey(member) {
            return member.member?.id || member.id || memberName(member)
        },

        actorName(activity) {
            if (activity.actor_detail?.full_name) return activity.actor_detail.full_name
            const member = this.memberMap[activity.actor]
            return member ? memberName(member) : 'Sistema'
        },

        onDialogChange(value) {
            if (!value) this.closeModal()
        },

        async loadHistory() {
            if (!this.selectedIssue || this.activitiesMap[this.selectedIssue.id]) return
            this.activitiesLoading = true
            try {
                await this.loadActivities(this.selectedIssue)
            } catch (err) {
                console.error('Erro ao carregar histórico da issue:', err)
            } finally {
                this.activitiesLoading = false
            }
        },
    },
}
</script>

<style scoped>
.issue-modal {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.v-theme--dark .issue-modal {
    background: #161618;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.75);
}

.issue-modal__toolbar {
    background: transparent !important;
}
</style>
