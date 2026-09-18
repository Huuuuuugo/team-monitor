<template>
    <div class="gauge">
        <svg viewBox="-22 0 244 132" class="gauge__svg" role="img" aria-label="Distribuição das tarefas por status">
            <path :d="arc" pathLength="100" class="gauge__track" />

            <path
                v-if="animatedCompleted > 0"
                :d="arc"
                pathLength="100"
                class="gauge__segment gauge__segment--completed"
                :stroke-dasharray="completedDash.array"
                :stroke-dashoffset="completedDash.offset"
            />
            <path
                v-if="animatedInProgress > 0"
                :d="arc"
                pathLength="100"
                class="gauge__segment gauge__segment--progress"
                :stroke-dasharray="inProgressDash.array"
                :stroke-dashoffset="inProgressDash.offset"
            />
            <path
                v-if="animatedBacklog > 0"
                :d="arc"
                pathLength="100"
                class="gauge__segment gauge__segment--backlog"
                :stroke-dasharray="backlogDash.array"
                :stroke-dashoffset="backlogDash.offset"
            />
            <path
                v-if="animatedCancelled > 0"
                :d="arc"
                pathLength="100"
                class="gauge__segment gauge__segment--cancelled"
                :stroke-dasharray="cancelledDash.array"
                :stroke-dashoffset="cancelledDash.offset"
            />

            <g :style="{ opacity: labelOpacity }">
                <circle
                    v-for="tick in scaleTicks"
                    :key="tick.key"
                    :cx="tick.x"
                    :cy="tick.y"
                    r="1.6"
                    class="gauge__tick"
                />

                <text
                    v-if="completedFraction > 0"
                    :x="completedLabel.x"
                    :y="completedLabel.y"
                    class="gauge__value gauge__value--completed"
                    text-anchor="middle"
                    dominant-baseline="middle"
                >
                    {{ completedPercent }}%
                </text>
                <text
                    v-if="inProgressFraction > 0"
                    :x="inProgressLabel.x"
                    :y="inProgressLabel.y"
                    class="gauge__value gauge__value--progress"
                    text-anchor="middle"
                    dominant-baseline="middle"
                >
                    {{ inProgressPercent }}%
                </text>
                <text
                    v-if="backlogFraction > 0"
                    :x="backlogLabel.x"
                    :y="backlogLabel.y"
                    class="gauge__value gauge__value--backlog"
                    text-anchor="middle"
                    dominant-baseline="middle"
                >
                    {{ backlogPercent }}%
                </text>
                <text
                    v-if="cancelledFraction > 0"
                    :x="cancelledLabel.x"
                    :y="cancelledLabel.y"
                    class="gauge__value gauge__value--cancelled"
                    text-anchor="middle"
                    dominant-baseline="middle"
                >
                    {{ cancelledPercent }}%
                </text>
            </g>

            <template v-if="total">
                <path :d="needlePath" class="gauge__needle" />
                <circle :cx="centerX" :cy="centerY" r="8" class="gauge__pivot-outer" />
                <circle :cx="centerX" :cy="centerY" r="3.5" class="gauge__pivot-inner" />
            </template>

            <text
                v-if="!total"
                x="100"
                y="88"
                class="gauge__empty"
                text-anchor="middle"
                dominant-baseline="middle"
            >
                Sem dados
            </text>
        </svg>

        <div class="gauge__legend">
            <div class="gauge__legend-item">
                <span class="gauge__dot gauge__dot--completed"></span>
                <span class="gauge__legend-label">Concluídas</span>
                <span class="gauge__legend-value">{{ completedValue }} · {{ completedPercent }}%</span>
            </div>
            <div class="gauge__legend-item">
                <span class="gauge__dot gauge__dot--progress"></span>
                <span class="gauge__legend-label">Em andamento</span>
                <span class="gauge__legend-value">{{ inProgressValue }} · {{ inProgressPercent }}%</span>
            </div>
            <div class="gauge__legend-item">
                <span class="gauge__dot gauge__dot--backlog"></span>
                <span class="gauge__legend-label">Backlog / A fazer</span>
                <span class="gauge__legend-value">{{ backlogValue }} · {{ backlogPercent }}%</span>
            </div>
            <div class="gauge__legend-item">
                <span class="gauge__dot gauge__dot--cancelled"></span>
                <span class="gauge__legend-label">Canceladas</span>
                <span class="gauge__legend-value">{{ cancelledValue }} · {{ cancelledPercent }}%</span>
            </div>
        </div>

        <div class="gauge__footer">
            <span>Total: {{ total }} tarefas</span>
            <span class="gauge__needle-label">Ponteiro: {{ completedPercent }}% concluído</span>
        </div>
    </div>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'

const CENTER_X = 100
const CENTER_Y = 112
const ARC_RADIUS = 78
const LABEL_RADIUS = 104
const TICK_RADIUS = 57
const NEEDLE_LENGTH = 44
const NEEDLE_BASE_RADIUS = 5
const NEEDLE_BASE_HALF = 4.5
const NEEDLE_TIP_RADIUS = 2.4
const SEGMENT_GAP = 1.5
const DASH_EPSILON = 0.01
const TICK_STEPS = 10
const ANIMATION_DURATION_MS = 900

function toCount(value) {
    const number = Number(value)
    return Number.isFinite(number) && number > 0 ? number : 0
}

function pointAt(fraction, radius) {
    const angle = Math.PI - Math.PI * fraction
    return {
        x: CENTER_X + radius * Math.cos(angle),
        y: CENTER_Y - radius * Math.sin(angle),
    }
}

function dashFor(startFraction, endFraction, edge = {}) {
    const start = startFraction * 100
    const length = Math.max((endFraction - startFraction) * 100, 0)

    if (length <= SEGMENT_GAP * 3) {
        return {
            array: `${length} ${100 - length + DASH_EPSILON}`,
            offset: `${-start}`,
        }
    }

    const startInset = edge.first ? 0 : SEGMENT_GAP / 2
    const endInset = edge.last ? 0 : SEGMENT_GAP / 2

    return {
        array: `${length - startInset - endInset} ${100 - length + startInset + endInset + DASH_EPSILON}`,
        offset: `${-(start + startInset)}`,
    }
}

function easeOutCubic(value) {
    return 1 - (1 - value) ** 3
}

export default {
    name: 'ProgressGauge',

    props: {
        completed: { type: Number, default: 0 },
        inProgress: { type: Number, default: 0 },
        backlog: { type: Number, default: 0 },
        cancelled: { type: Number, default: 0 },
    },

    data: () => ({
        animation: 1,
        animationFrame: null,
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['lastFetchAt']),

        animationKey() {
            return `${this.total}|${this.lastFetchAt}`
        },

        centerX() {
            return CENTER_X
        },

        centerY() {
            return CENTER_Y
        },

        arc() {
            return `M ${CENTER_X - ARC_RADIUS} ${CENTER_Y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${CENTER_X + ARC_RADIUS} ${CENTER_Y}`
        },

        scaleTicks() {
            const ticks = []
            for (let index = 0; index <= TICK_STEPS; index += 1) {
                const fraction = index / TICK_STEPS
                const point = pointAt(fraction, TICK_RADIUS)
                ticks.push({
                    key: index,
                    x: point.x.toFixed(2),
                    y: point.y.toFixed(2),
                })
            }
            return ticks
        },

        completedValue() {
            return toCount(this.completed)
        },

        inProgressValue() {
            return toCount(this.inProgress)
        },

        backlogValue() {
            return toCount(this.backlog)
        },

        cancelledValue() {
            return toCount(this.cancelled)
        },

        total() {
            return (
                this.completedValue +
                this.inProgressValue +
                this.backlogValue +
                this.cancelledValue
            )
        },

        completedFraction() {
            return this.total ? this.completedValue / this.total : 0
        },

        inProgressFraction() {
            return this.total ? this.inProgressValue / this.total : 0
        },

        backlogFraction() {
            return this.total ? this.backlogValue / this.total : 0
        },

        cancelledFraction() {
            return this.total ? this.cancelledValue / this.total : 0
        },

        completedPercent() {
            return Math.round(this.completedFraction * 100)
        },

        inProgressPercent() {
            return Math.round(this.inProgressFraction * 100)
        },

        backlogPercent() {
            return Math.round(this.backlogFraction * 100)
        },

        cancelledPercent() {
            return Math.round(this.cancelledFraction * 100)
        },

        animatedCompleted() {
            return this.completedFraction * this.animation
        },

        animatedInProgress() {
            return this.inProgressFraction * this.animation
        },

        animatedBacklog() {
            return this.backlogFraction * this.animation
        },

        animatedCancelled() {
            return this.cancelledFraction * this.animation
        },

        animatedInProgressStart() {
            return this.animatedCompleted
        },

        animatedBacklogStart() {
            return this.animatedCompleted + this.animatedInProgress
        },

        animatedCancelledStart() {
            return this.animatedBacklogStart + this.animatedBacklog
        },

        completedDash() {
            return dashFor(0, this.animatedCompleted, {
                first: true,
                last:
                    this.inProgressValue === 0 &&
                    this.backlogValue === 0 &&
                    this.cancelledValue === 0,
            })
        },

        inProgressDash() {
            return dashFor(this.animatedInProgressStart, this.animatedBacklogStart, {
                first: this.completedValue === 0,
                last: this.backlogValue === 0 && this.cancelledValue === 0,
            })
        },

        backlogDash() {
            return dashFor(this.animatedBacklogStart, this.animatedCancelledStart, {
                first: this.completedValue === 0 && this.inProgressValue === 0,
                last: this.cancelledValue === 0,
            })
        },

        cancelledDash() {
            return dashFor(this.animatedCancelledStart, this.animation, {
                first:
                    this.completedValue === 0 &&
                    this.inProgressValue === 0 &&
                    this.backlogValue === 0,
                last: true,
            })
        },

        completedLabel() {
            return pointAt(this.completedFraction / 2, LABEL_RADIUS)
        },

        inProgressLabel() {
            return pointAt(
                this.completedFraction + this.inProgressFraction / 2,
                LABEL_RADIUS
            )
        },

        backlogLabel() {
            return pointAt(
                this.completedFraction + this.inProgressFraction + this.backlogFraction / 2,
                LABEL_RADIUS
            )
        },

        cancelledLabel() {
            return pointAt(
                this.completedFraction +
                    this.inProgressFraction +
                    this.backlogFraction +
                    this.cancelledFraction / 2,
                LABEL_RADIUS
            )
        },

        labelOpacity() {
            const value = (this.animation - 0.3) / 0.7
            return Math.min(Math.max(value, 0), 1)
        },

        needlePath() {
            const fraction = this.completedFraction * this.animation
            const angle = Math.PI - Math.PI * fraction
            const dirX = Math.cos(angle)
            const dirY = -Math.sin(angle)
            const perpX = -dirY
            const perpY = dirX

            const baseX = CENTER_X + dirX * NEEDLE_BASE_RADIUS
            const baseY = CENTER_Y + dirY * NEEDLE_BASE_RADIUS
            const shoulderX = CENTER_X + dirX * (NEEDLE_LENGTH - NEEDLE_TIP_RADIUS)
            const shoulderY = CENTER_Y + dirY * (NEEDLE_LENGTH - NEEDLE_TIP_RADIUS)

            const baseLeft = `${(baseX + perpX * NEEDLE_BASE_HALF).toFixed(2)} ${(baseY + perpY * NEEDLE_BASE_HALF).toFixed(2)}`
            const baseRight = `${(baseX - perpX * NEEDLE_BASE_HALF).toFixed(2)} ${(baseY - perpY * NEEDLE_BASE_HALF).toFixed(2)}`
            const tipLeft = `${(shoulderX + perpX * NEEDLE_TIP_RADIUS).toFixed(2)} ${(shoulderY + perpY * NEEDLE_TIP_RADIUS).toFixed(2)}`
            const tipRight = `${(shoulderX - perpX * NEEDLE_TIP_RADIUS).toFixed(2)} ${(shoulderY - perpY * NEEDLE_TIP_RADIUS).toFixed(2)}`

            return `M ${baseLeft} L ${tipLeft} A ${NEEDLE_TIP_RADIUS} ${NEEDLE_TIP_RADIUS} 0 0 0 ${tipRight} L ${baseRight} Z`
        },
    },

    watch: {
        animationKey: {
            immediate: true,
            handler() {
                this.startAnimation()
            },
        },
    },

    beforeUnmount() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame)
    },

    methods: {
        startAnimation() {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame)
                this.animationFrame = null
            }

            if (!this.total) {
                this.animation = 1
                return
            }

            const reduceMotion =
                typeof window !== 'undefined' &&
                typeof window.matchMedia === 'function' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches

            if (reduceMotion || typeof requestAnimationFrame === 'undefined') {
                this.animation = 1
                return
            }

            this.animation = 0
            const startTime = performance.now()

            const step = (now) => {
                const elapsed = Math.min((now - startTime) / ANIMATION_DURATION_MS, 1)
                this.animation = easeOutCubic(elapsed)

                if (elapsed < 1) {
                    this.animationFrame = requestAnimationFrame(step)
                } else {
                    this.animationFrame = null
                }
            }

            this.animationFrame = requestAnimationFrame(step)
        },
    },
}
</script>

<style scoped>
.gauge__svg {
    width: 100%;
    display: block;
}

.gauge__track {
    fill: none;
    stroke: rgba(var(--v-theme-on-surface), 0.08);
    stroke-width: 20;
}

.gauge__segment {
    fill: none;
    stroke-width: 20;
}

.gauge__segment--completed {
    stroke: #22c55e;
}

.gauge__segment--progress {
    stroke: #eab308;
}

.gauge__segment--backlog {
    stroke: #6b7280;
}

.gauge__segment--cancelled {
    stroke: #ef4444;
}

.gauge__tick {
    fill: rgba(var(--v-theme-on-surface), 0.3);
}

.gauge__needle {
    fill: rgb(var(--v-theme-on-surface));
}

.gauge__pivot-outer {
    fill: rgb(var(--v-theme-on-surface));
}

.gauge__pivot-inner {
    fill: rgb(var(--v-theme-surface));
}

.gauge__empty {
    font-size: 12px;
    fill: rgba(var(--v-theme-on-surface), 0.45);
}

.gauge__value {
    font-size: 12.5px;
    font-weight: 700;
}

.gauge__value--completed {
    fill: #4ade80;
}

.gauge__value--progress {
    fill: #fde047;
}

.gauge__value--backlog {
    fill: #9ca3af;
}

.gauge__value--cancelled {
    fill: #f87171;
}

.gauge__legend {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
}

.gauge__legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.gauge__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 8px;
}

.gauge__dot--completed {
    background: #22c55e;
}

.gauge__dot--progress {
    background: #eab308;
}

.gauge__dot--backlog {
    background: #6b7280;
}

.gauge__dot--cancelled {
    background: #ef4444;
}

.gauge__legend-label {
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.gauge__legend-value {
    margin-left: auto;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.gauge__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.gauge__needle-label {
    color: rgba(var(--v-theme-on-surface), 0.7);
    white-space: nowrap;
}
</style>
