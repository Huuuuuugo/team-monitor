<template>
    <v-card
        variant="flat"
        class="tone-card aside-card"
        :class="{ 'aside-card--plain': feed }"
    >
        <div v-if="!feed" class="aside-card__header">
            <span class="aside-card__title">Atividades recentes</span>
        </div>

        <v-skeleton-loader
            v-if="activitiesPending"
            type="list-item-two-line@3"
            class="aside-skeleton"
        />

        <template v-else>
            <div v-if="!recentChanges.length" class="aside-card__empty">
                Nenhuma mudança de estado hoje.
            </div>

            <template v-else>
                <div class="activity-list">
                    <div
                        v-for="change in recentChanges"
                        :key="change.activity.id"
                        class="activity-item"
                        :class="{ 'activity-item--card': feed }"
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
                </div>

                <div v-if="!feed" class="activity-more">
                    <v-btn variant="text" size="small" block append-icon="mdi-chevron-down">
                        Ver mais
                    </v-btn>
                </div>
            </template>
        </template>
    </v-card>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import { useUiStore } from '../../stores/ui.js'
import MemberAvatar from '../member/MemberAvatar.vue'
import { localDateKey, today } from '../../utils/issueHelpers.js'
import { formatRelative } from '../../utils/formatters.js'

export default {
    name: 'RecentActivitiesCard',

    components: {
        MemberAvatar,
    },

    props: {
        feed: { type: Boolean, default: false },
    },

    data: () => ({
        activitiesLoading: false,
    }),

    computed: {
        ...mapState(usePlaneDataStore, [
            'touchedTodayIssues',
            'activitiesMap',
            'memberMap',
            'loading',
        ]),

        activitiesPending() {
            return this.loading || this.activitiesLoading
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
        loading(value) {
            if (!value) this.maybeLoadRecentActivities()
        },
        touchedTodayIssues() {
            if (!this.loading) this.maybeLoadRecentActivities()
        },
    },

    mounted() {
        this.maybeLoadRecentActivities()
    },

    methods: {
        ...mapActions(useUiStore, ['openModal']),
        ...mapActions(usePlaneDataStore, ['loadActivitiesForIssues']),

        formatRelative,

        maybeLoadRecentActivities() {
            if (this.loading || this.activitiesLoading) return
            if (!this.touchedTodayIssues.length) return
            this.loadRecentActivities()
        },

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

.activity-list {
    display: flex;
    flex-direction: column;
}

.activity-list .activity-item:not(.activity-item--card):not(:last-child) {
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.activity-more {
    margin-top: 8px;
    padding-top: 4px;
}

.aside-card--plain {
    background: transparent !important;
    border: none !important;
    padding: 0;
}

.activity-item--card {
    max-width: 560px;
    padding: 10px 12px;
    margin-bottom: 10px;
    border-radius: 12px;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.activity-item--card:last-child {
    margin-bottom: 0;
}

.activity-item--card:hover {
    border-color: rgba(var(--v-theme-primary), 0.35);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.activity-item--card .activity-item__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.activity-item--card .activity-item__text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.v-theme--dark .activity-item--card {
    background: rgba(var(--v-theme-on-surface), 0.05);
    border-color: rgba(var(--v-theme-on-surface), 0.12);
    box-shadow: none;
}
</style>
