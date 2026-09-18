<template>
    <v-card
        class="issue-card mb-2"
        :class="{ 'issue-card--overdue': overdue }"
        variant="flat"
        tabindex="0"
        role="button"
        @click="handleClick"
        @keydown.enter.prevent="handleClick"
        @keydown.space.prevent="handleClick"
    >
        <v-card-text class="pa-3">
            <div class="d-flex align-center flex-wrap ga-1 mb-2">
                <IssuePriorityChip :priority="issue.priority" />

                <span v-if="issue._state" class="issue-card__tag" :style="stateToneStyle">
                    {{ issue._state.name }}
                </span>

                <v-tooltip v-if="overdue" text="Atrasado" location="top">
                    <template #activator="{ props }">
                        <v-icon v-bind="props" color="error" size="15" class="ml-1">
                            mdi-alert-circle-outline
                        </v-icon>
                    </template>
                </v-tooltip>
            </div>

            <div class="issue-card__title">{{ issue.name }}</div>

            <div class="issue-card__meta">
                <span>#{{ issue.sequence_id }}</span>
                <span v-if="showProject && projectName" class="issue-card__meta-item">
                    <v-icon size="12" class="mr-1">mdi-folder-outline</v-icon>{{ projectName }}
                </span>
            </div>

            <div class="d-flex align-center justify-space-between mt-3">
                <div class="issue-card__date" :class="dueClass">
                    <v-icon size="14">mdi-calendar-blank-outline</v-icon>
                    <span>{{ dueDate ? formatDate(dueDate) : 'Sem prazo' }}</span>
                </div>

                <div class="d-flex align-center">
                    <MemberAvatar
                        v-for="member in visibleAssignees"
                        :key="memberKey(member)"
                        :member="member"
                        :size="24"
                        class="ml-n1"
                    />
                    <v-tooltip v-if="extraAssignees.length" :text="extraAssigneesText" location="top">
                        <template #activator="{ props }">
                            <v-avatar v-bind="props" size="24" color="surface-variant" class="ml-n1">
                                <span class="text-caption">+{{ extraAssignees.length }}</span>
                            </v-avatar>
                        </template>
                    </v-tooltip>
                    <span v-if="!assignees.length" class="issue-card__no-assignee">Sem responsável</span>

                    <v-tooltip v-if="issue._state" :text="issue._state.name" location="top">
                        <template #activator="{ props }">
                            <span
                                v-bind="props"
                                class="issue-card__status"
                                :style="{ backgroundColor: statusColor }"
                            ></span>
                        </template>
                    </v-tooltip>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import { mapActions } from 'pinia'
import { useUiStore } from '../../stores/ui.js'
import IssuePriorityChip from './IssuePriorityChip.vue'
import MemberAvatar from '../member/MemberAvatar.vue'
import { getDueDate, isOverdue, isDueToday } from '../../utils/issueHelpers.js'
import { formatDate, memberName } from '../../utils/formatters.js'
import { STATE_GROUP_COLORS, STATE_GROUP_TONES } from '../../utils/priorityColors.js'

export default {
    name: 'IssueCard',

    components: {
        IssuePriorityChip,
        MemberAvatar,
    },

    props: {
        issue: { type: Object, required: true },
        showProject: { type: Boolean, default: true },
        maxAssignees: { type: Number, default: 3 },
    },

    computed: {
        overdue() {
            return isOverdue(this.issue)
        },

        dueDate() {
            return getDueDate(this.issue)
        },

        dueClass() {
            if (this.overdue) return 'issue-card__date--error'
            if (isDueToday(this.issue)) return 'issue-card__date--warning'
            return ''
        },

        stateGroupColor() {
            return STATE_GROUP_COLORS[this.issue._state?.group] || '#9ca3af'
        },

        statusColor() {
            return this.issue._state?.color || this.stateGroupColor
        },

        stateToneStyle() {
            const tone = STATE_GROUP_TONES[this.issue._state?.group] || STATE_GROUP_TONES.backlog
            return {
                backgroundColor: tone.background,
                color: tone.color,
            }
        },

        projectName() {
            return this.issue._project?.name || ''
        },

        assignees() {
            return this.issue._assignees || []
        },

        visibleAssignees() {
            return this.assignees.slice(0, this.maxAssignees)
        },

        extraAssignees() {
            return this.assignees.slice(this.maxAssignees)
        },

        extraAssigneesText() {
            return this.extraAssignees.map(memberName).join(', ')
        },
    },

    methods: {
        ...mapActions(useUiStore, ['openModal']),

        formatDate,

        memberKey(member) {
            return member.member?.id || member.id || memberName(member)
        },

        handleClick() {
            this.openModal(this.issue)
        },
    },
}
</script>

<style scoped>
.issue-card {
    cursor: pointer;
    background: rgba(var(--v-theme-on-surface), 0.02);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    transition: background 0.15s ease, border-color 0.15s ease;
}

.issue-card:hover {
    background: rgba(var(--v-theme-on-surface), 0.06);
    border-color: rgba(var(--v-theme-on-surface), 0.16);
}

.issue-card--overdue {
    border-color: rgba(var(--v-theme-error), 0.55);
}

.issue-card__tag {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
}

.issue-card__title {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    color: rgb(var(--v-theme-on-surface));
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.issue-card__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.issue-card__meta-item {
    display: inline-flex;
    align-items: center;
}

.issue-card__date {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.issue-card__date--error {
    color: rgb(var(--v-theme-error));
}

.issue-card__date--warning {
    color: rgb(var(--v-theme-warning));
}

.issue-card__no-assignee {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.issue-card__status {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 8px;
}
</style>
