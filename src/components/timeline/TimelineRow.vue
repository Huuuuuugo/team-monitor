<template>
    <div class="timeline-row" :style="rowStyle">
        <div
            class="timeline-bar"
            :class="{ 'timeline-bar--muted': muted }"
            :style="barStyle"
            tabindex="0"
            role="button"
            @click="handleClick"
            @keydown.enter.prevent="handleClick"
            @keydown.space.prevent="handleClick"
        >
            <div class="timeline-bar__track" :style="trackStyle">
                <div class="timeline-bar__fill" :style="{ width: `${progressPercent}%` }"></div>
            </div>

            <div class="timeline-bar__content">
                <div class="timeline-bar__text">
                    <div class="timeline-bar__title">{{ issue.name }}</div>
                    <div class="timeline-bar__dates">{{ dateRange }}</div>
                </div>

                <div v-if="assignees.length" class="timeline-bar__avatars">
                    <MemberAvatar
                        v-for="member in assignees"
                        :key="memberKey(member)"
                        :member="member"
                        :size="22"
                        class="ml-n1"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions } from 'pinia'
import { useUiStore } from '../../stores/ui.js'
import MemberAvatar from '../member/MemberAvatar.vue'
import { formatDate, memberName } from '../../utils/formatters.js'
import { STATE_GROUP_COLORS } from '../../utils/priorityColors.js'

export default {
    name: 'TimelineRow',

    components: {
        MemberAvatar,
    },

    props: {
        issue: { type: Object, required: true },
        startIndex: { type: Number, required: true },
        span: { type: Number, required: true },
        dayCount: { type: Number, required: true },
        columnWidth: { type: Number, default: 64 },
        startKey: { type: String, required: true },
        endKey: { type: String, required: true },
    },

    computed: {
        stateGroup() {
            return this.issue._state?.group || ''
        },

        stateColor() {
            return this.issue._state?.color || STATE_GROUP_COLORS[this.stateGroup] || '#9ca3af'
        },

        muted() {
            return ['completed', 'cancelled'].includes(this.stateGroup)
        },

        assignees() {
            return this.issue._assignees || []
        },

        dateRange() {
            if (!this.issue.start_date || this.startKey === this.endKey) {
                return formatDate(this.endKey)
            }
            return `${formatDate(this.startKey)} – ${formatDate(this.endKey)}`
        },

        progressPercent() {
            if (this.muted) return 100

            const start = Date.parse(`${this.startKey}T00:00:00`)
            const end = Date.parse(`${this.endKey}T23:59:59`)
            const now = Date.now()

            if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
            if (now <= start) return 0
            if (now >= end) return 100
            return Math.round(((now - start) / (end - start)) * 100)
        },

        rowStyle() {
            return {
                gridTemplateColumns: `repeat(${this.dayCount}, ${this.columnWidth}px)`,
            }
        },

        barStyle() {
            return {
                gridColumn: `${this.startIndex + 1} / span ${this.span}`,
                backgroundColor: `color-mix(in srgb, ${this.stateColor} 16%, transparent)`,
                borderColor: `color-mix(in srgb, ${this.stateColor} 42%, transparent)`,
            }
        },

        trackStyle() {
            return {
                backgroundColor: `color-mix(in srgb, ${this.stateColor} 55%, transparent)`,
            }
        },
    },

    methods: {
        ...mapActions(useUiStore, ['openModal']),

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
.timeline-row {
    display: grid;
    align-items: center;
    height: 80px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04);
    content-visibility: auto;
    contain-intrinsic-size: auto 80px;
}

.timeline-bar {
    position: relative;
    align-self: center;
    min-width: 150px;
    height: 58px;
    border: 1px solid;
    border-radius: 6px;
    padding: 12px 12px 8px;
    overflow: hidden;
    cursor: pointer;
    transition: filter 0.15s ease;
}

.timeline-bar:hover {
    filter: brightness(1.18);
}

.timeline-bar--muted {
    opacity: 0.6;
}

.timeline-bar__track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
}

.timeline-bar__fill {
    height: 100%;
    background: #22c55e;
}

.timeline-bar__content {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 100%;
    min-width: 0;
}

.timeline-bar__text {
    min-width: 0;
    flex: 1;
}

.timeline-bar__title {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgb(var(--v-theme-on-surface));
}

.timeline-bar__dates {
    font-size: 11px;
    line-height: 1.3;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.timeline-bar__avatars {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
}

.timeline-bar__avatars :deep(.v-avatar) {
    box-shadow: 0 0 0 2px rgba(var(--v-theme-background), 0.9);
}
</style>
