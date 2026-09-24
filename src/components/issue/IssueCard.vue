<template>
    <v-card
        class="issue-card mb-2"
        :class="{ 'issue-card--overdue': overdue, 'issue-card--compact': compact }"
        variant="flat"
        tabindex="0"
        role="button"
        @click="handleClick"
        @keydown.enter.prevent="handleClick"
        @keydown.space.prevent="handleClick"
    >
        <v-card-text :class="compact ? 'pa-2' : 'pa-3'">
            <div class="d-flex align-center flex-wrap ga-1 mb-2">
                <IssuePriorityChip :priority="issue.priority" />

                <span v-if="issue._state" class="issue-card__tag" :style="stateToneStyle">
                    {{ issue._state.name }}
                </span>

                <v-icon v-if="overdue" color="error" size="15" class="ml-1" title="Atrasado">
                    mdi-alert-circle-outline
                </v-icon>
            </div>

            <div class="issue-card__title">{{ issue.name }}</div>

            <div class="issue-card__meta">
                <span>#{{ issue.sequence_id }}</span>
                <span v-if="showProject && projectName" class="issue-card__meta-item">
                    <v-icon size="12" class="mr-1">mdi-folder-outline</v-icon>{{ projectName }}
                </span>
            </div>

            <div class="issue-card__footer">
                <div class="issue-card__date" :class="dueClass">
                    <v-icon size="14">mdi-calendar-blank-outline</v-icon>
                    <span>{{ dueDate ? formatDate(dueDate) : 'Sem prazo' }}</span>
                </div>

                <div class="issue-card__assignees">
                    <MemberAvatar
                        v-for="member in visibleAssignees"
                        :key="memberKey(member)"
                        :member="member"
                        :size="24"
                        class="ml-n1"
                    />
                    <v-avatar
                        v-if="extraAssignees.length"
                        size="24"
                        color="surface-variant"
                        class="ml-n1"
                        :title="extraAssigneesText"
                    >
                        <span class="text-caption">+{{ extraAssignees.length }}</span>
                    </v-avatar>
                    <span v-if="!assignees.length" class="issue-card__no-assignee">Sem responsável</span>

                    <span
                        v-if="issue._state"
                        class="issue-card__status"
                        :style="{ backgroundColor: statusColor }"
                        :title="issue._state.name"
                    ></span>
                </div>
            </div>

            <div v-if="labels.length" class="issue-card__labels">
                <LabelChip v-for="label in labels" :key="label.id" :label="label" />
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import { mapActions } from 'pinia'
import { useUiStore } from '../../stores/ui.js'
import IssuePriorityChip from './IssuePriorityChip.vue'
import LabelChip from './LabelChip.vue'
import MemberAvatar from '../member/MemberAvatar.vue'
import { getDueDate, isOverdue, isDueToday } from '../../utils/issueHelpers.js'
import { formatDate, memberName } from '../../utils/formatters.js'
import { STATE_GROUP_COLORS, stateGroupTone } from '../../utils/priorityColors.js'

export default {
    name: 'IssueCard',

    components: {
        IssuePriorityChip,
        LabelChip,
        MemberAvatar,
    },

    props: {
        issue: { type: Object, required: true },
        showProject: { type: Boolean, default: true },
        maxAssignees: { type: Number, default: 3 },
        compact: { type: Boolean, default: false },
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
            const tone = stateGroupTone(this.issue._state?.group, this.$vuetify.theme.current.dark)
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

        labels() {
            return this.issue._labels || []
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
    content-visibility: auto;
    contain-intrinsic-size: auto 132px;
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

.issue-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 12px;
    min-width: 0;
}

.issue-card__assignees {
    display: flex;
    align-items: center;
    min-width: 0;
}

.issue-card__date {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.55);
    white-space: nowrap;
}

.issue-card__date--error {
    color: rgb(var(--v-theme-error));
}

.issue-card__date--warning {
    color: rgb(var(--v-theme-warning));
}

.issue-card__no-assignee {
    overflow: hidden;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.issue-card__status {
    display: inline-block;
    flex: 0 0 auto;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 8px;
}

.issue-card__labels {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
}

.issue-card--compact {
    display: flex;
    flex-direction: column;
    height: 164px;
    overflow: hidden;
    contain-intrinsic-size: auto 164px;
}

.issue-card--compact :deep(.v-card-text) {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
}

.issue-card--compact .issue-card__title {
    font-size: 12px;
}

.issue-card--compact .issue-card__tag {
    height: 18px;
    padding: 0 6px;
    font-size: 10px;
}

.issue-card--compact .issue-card__meta {
    gap: 8px;
    margin-top: 3px;
    font-size: 10px;
}

.issue-card--compact .issue-card__footer {
    margin-top: auto;
    padding-top: 8px;
}

.issue-card--compact .issue-card__date {
    font-size: 11px;
}

.issue-card--compact .issue-card__no-assignee {
    font-size: 10px;
}

.issue-card--compact .issue-card__labels {
    gap: 3px;
    margin-top: 6px;
}
</style>
