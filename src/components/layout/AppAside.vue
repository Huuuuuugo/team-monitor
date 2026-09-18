<template>
    <aside class="app-aside">
        <v-card variant="flat" class="tone-card aside-card mb-4">
            <div class="aside-card__header">
                <span class="aside-card__title">Status das tarefas</span>
                <v-icon size="18" class="aside-card__menu">mdi-dots-horizontal</v-icon>
            </div>

            <ProgressGauge
                :completed="completedCount"
                :in-progress="inProgressCount"
                :backlog="backlogCount"
                :cancelled="cancelledCount"
            />
        </v-card>

        <v-card variant="flat" class="tone-card aside-card">
            <div class="aside-card__header">
                <span class="aside-card__title">Atividades recentes</span>
                <v-progress-circular
                    v-if="activitiesLoading"
                    indeterminate
                    size="14"
                    width="2"
                    color="primary"
                />
            </div>

            <div v-if="!recentChanges.length" class="aside-card__empty">
                Nenhuma mudança de estado hoje.
            </div>

            <div
                v-for="change in recentChanges"
                :key="change.activity.id"
                class="activity-item"
                tabindex="0"
                role="button"
                @click="openModal(change.issue)"
                @keydown.enter.prevent="openModal(change.issue)"
            >
                <MemberAvatar :member="actorMember(change.activity)" :size="26" />

                <div class="activity-item__body">
                    <div class="activity-item__head">
                        <span class="activity-item__name">{{ actorName(change.activity) }}</span>
                        <span class="activity-item__time">
                            {{ formatRelative(change.activity.created_at) }}
                        </span>
                    </div>
                    <div class="activity-item__text">
                        moveu <span class="activity-item__issue">{{ change.issue.name }}</span>
                        de {{ change.activity.old_value || '—' }} para
                        {{ change.activity.new_value || '—' }}
                    </div>
                </div>
            </div>
        </v-card>
    </aside>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import { useUiStore } from '../../stores/ui.js'
import MemberAvatar from '../member/MemberAvatar.vue'
import ProgressGauge from '../panorama/ProgressGauge.vue'
import { localDateKey, today } from '../../utils/issueHelpers.js'
import { formatRelative } from '../../utils/formatters.js'

export default {
    name: 'AppAside',

    components: {
        MemberAvatar,
        ProgressGauge,
    },

    data: () => ({
        activitiesLoading: false,
    }),

    computed: {
        ...mapState(usePlaneDataStore, [
            'enrichedIssues',
            'touchedTodayIssues',
            'activitiesMap',
            'memberMap',
        ]),

        completedCount() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'completed').length
        },

        inProgressCount() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'started').length
        },

        backlogCount() {
            return this.enrichedIssues.filter(issue =>
                ['backlog', 'unstarted'].includes(issue._state?.group)
            ).length
        },

        cancelledCount() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'cancelled').length
        },

        recentChanges() {
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

            return changes
                .sort((a, b) => new Date(b.activity.created_at) - new Date(a.activity.created_at))
                .slice(0, 6)
        },
    },

    watch: {
        touchedTodayIssues: {
            immediate: true,
            handler(list) {
                if (list.length) this.loadRecentActivities()
            },
        },
    },

    methods: {
        ...mapActions(useUiStore, ['openModal']),
        ...mapActions(usePlaneDataStore, ['loadActivitiesForIssues']),

        formatRelative,

        async loadRecentActivities() {
            if (this.activitiesLoading) return
            this.activitiesLoading = true
            try {
                await this.loadActivitiesForIssues(this.touchedTodayIssues)
            } finally {
                this.activitiesLoading = false
            }
        },

        actorMember(activity) {
            return this.memberMap[activity.actor] || null
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
.aside-card {
    padding: 16px;
}

.aside-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.aside-card__title {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.aside-card__menu {
    color: rgba(var(--v-theme-on-surface), 0.4);
}

.aside-card__empty {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    padding: 8px 0;
}

.activity-item {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    cursor: pointer;
    border-radius: 6px;
}

.activity-item:hover {
    background: rgba(var(--v-theme-on-surface), 0.03);
}

.activity-item__body {
    min-width: 0;
    flex: 1;
}

.activity-item__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.activity-item__name {
    font-size: 12px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

.activity-item__time {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    white-space: nowrap;
}

.activity-item__text {
    font-size: 12px;
    line-height: 1.4;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.activity-item__issue {
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.85);
}
</style>
