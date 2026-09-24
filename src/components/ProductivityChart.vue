<template>
    <v-card variant="flat" class="tone-card productivity-card pa-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
            <div>
                <div class="text-subtitle-1 font-weight-bold">Produtividade</div>
                <div class="text-caption text-medium-emphasis d-flex align-center ga-1">
                    <span>Tasks concluídas ao longo do tempo</span>
                    <HintIcon :text="hintText" :size="14" aria-label="Sobre os dados de produtividade" />
                </div>
            </div>

            <v-select
                v-model="selectedMember"
                :items="memberOptions"
                item-title="name"
                item-value="id"
                label="Membro"
                density="compact"
                variant="outlined"
                clearable
                hide-details
                class="productivity-card__member"
            />
        </div>

        <v-tabs v-model="activeTab" density="compact" color="primary" class="productivity-card__tabs mb-4">
            <v-tab value="heatmap">
                <v-icon start size="18">mdi-calendar-month</v-icon>
                Heatmap
            </v-tab>
            <v-tab value="line">
                <v-icon start size="18">mdi-chart-line</v-icon>
                Tendência
            </v-tab>
        </v-tabs>

        <div v-if="loading && !enrichedIssues.length" class="d-flex justify-center py-12">
            <v-progress-circular indeterminate color="primary" />
        </div>

        <v-window v-else v-model="activeTab">
            <v-window-item value="heatmap">
                <div
                    v-if="memberHasNoCompletions"
                    class="text-caption text-medium-emphasis mb-3"
                >
                    Nenhuma task concluída para este membro no período carregado.
                </div>

                <div class="heatmap-scroll">
                    <svg
                        :width="heatmapWidth"
                        :height="heatmapHeight"
                        role="img"
                        :aria-label="`Heatmap de tasks concluídas: ${heatmapTotal} no total`"
                        @mouseleave="clearTooltip"
                    >
                        <text
                            v-for="month in monthLabels"
                            :key="month.key"
                            :x="month.x"
                            y="11"
                            class="heatmap__month"
                        >
                            {{ month.text }}
                        </text>

                        <text
                            v-for="label in weekdayLabels"
                            :key="label.key"
                            x="0"
                            :y="label.y"
                            class="heatmap__weekday"
                        >
                            {{ label.text }}
                        </text>

                        <rect
                            v-for="cell in cells"
                            :key="cell.date"
                            :x="cell.x"
                            :y="cell.y"
                            width="13"
                            height="13"
                            rx="3"
                            :fill="getColor(cell.count)"
                            @mouseenter="onCellEnter(cell, $event)"
                        />
                    </svg>
                </div>

                <div class="d-flex align-center justify-end ga-1 mt-2">
                    <span class="text-caption text-medium-emphasis">Menos</span>
                    <span
                        v-for="index in 5"
                        :key="index"
                        class="heatmap__legend-cell"
                        :style="{ background: legendColor(index - 1) }"
                    />
                    <span class="text-caption text-medium-emphasis">Mais</span>
                </div>
            </v-window-item>

            <v-window-item value="line">
                <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
                    <v-btn-toggle v-model="linePeriod" density="compact" mandatory variant="outlined" divided>
                        <v-btn value="30" size="small">30d</v-btn>
                        <v-btn value="60" size="small">60d</v-btn>
                        <v-btn value="90" size="small">90d</v-btn>
                    </v-btn-toggle>

                    <span class="text-caption text-medium-emphasis">
                        {{ lineTotal }} concluídas no período
                    </span>
                </div>

                <svg
                    :viewBox="`0 0 ${LINE_W} ${LINE_H}`"
                    class="line-svg"
                    role="img"
                    :aria-label="`Tendência de tasks concluídas nos últimos ${linePeriod} dias`"
                    @mousemove="onLineMove"
                    @mouseleave="clearTooltip"
                >
                    <defs>
                        <linearGradient id="productivity-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" :stop-color="lineColor" stop-opacity="0.32" />
                            <stop offset="100%" :stop-color="lineColor" stop-opacity="0" />
                        </linearGradient>
                    </defs>

                    <template v-for="tick in yTicks" :key="`grid-${tick.value}`">
                        <line
                            :x1="LINE_PAD_L"
                            :x2="LINE_W - LINE_PAD_R"
                            :y1="tick.y"
                            :y2="tick.y"
                            class="line-svg__grid"
                        />
                        <text
                            :x="LINE_PAD_L - 8"
                            :y="tick.y + 4"
                            text-anchor="end"
                            class="line-svg__axis"
                        >
                            {{ tick.value }}
                        </text>
                    </template>

                    <path :d="areaPath" fill="url(#productivity-area)" />
                    <path :d="linePath" class="line-svg__line" :style="{ stroke: lineColor }" />

                    <text
                        v-for="label in xLabels"
                        :key="`x-${label.key}`"
                        :x="label.x"
                        :y="LINE_H - 6"
                        text-anchor="middle"
                        class="line-svg__axis"
                    >
                        {{ label.text }}
                    </text>

                    <template v-if="hoveredPoint">
                        <line
                            :x1="hoveredPoint.x"
                            :x2="hoveredPoint.x"
                            :y1="LINE_PAD_T"
                            :y2="LINE_H - LINE_PAD_B"
                            class="line-svg__guide"
                        />
                        <circle
                            :cx="hoveredPoint.x"
                            :cy="hoveredPoint.y"
                            r="5"
                            class="line-svg__point line-svg__point--active"
                            :style="{ fill: lineColor }"
                        />
                    </template>

                    <circle
                        v-for="point in visiblePoints"
                        :key="point.date"
                        :cx="point.x"
                        :cy="point.y"
                        r="4"
                        class="line-svg__point"
                        :style="{ fill: lineColor }"
                    />
                </svg>
            </v-window-item>
        </v-window>

        <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mt-4 text-caption"
            icon="mdi-information"
        >
            Os dados são baseados em <code>updated_at</code> das issues concluídas.
            Confiável para os últimos ~60 dias.
        </v-alert>

        <v-tooltip
            :model-value="tooltip.open"
            :target="tooltip.target"
            :text="tooltip.text"
            location="top"
            max-width="280"
        />
    </v-card>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../stores/planeData.js'
import HintIcon from './common/HintIcon.vue'
import { localDateKey } from '../utils/issueHelpers.js'
import { memberName } from '../utils/formatters.js'

const HEAT_CELL = 13
const HEAT_GAP = 3
const HEAT_PITCH = HEAT_CELL + HEAT_GAP
const HEAT_PAD_LEFT = 30
const HEAT_PAD_TOP = 18

const LINE_W = 820
const LINE_H = 240
const LINE_PAD_L = 34
const LINE_PAD_R = 12
const LINE_PAD_T = 14
const LINE_PAD_B = 26

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export default {
    name: 'ProductivityChart',

    components: {
        HintIcon,
    },

    data: () => ({
        activeTab: 'heatmap',
        selectedMember: null,
        linePeriod: '60',
        hoveredIndex: -1,
        tooltip: { open: false, target: [0, 0], text: '' },
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['enrichedIssues', 'loading']),

        LINE_W() {
            return LINE_W
        },

        LINE_H() {
            return LINE_H
        },

        LINE_PAD_L() {
            return LINE_PAD_L
        },

        LINE_PAD_R() {
            return LINE_PAD_R
        },

        LINE_PAD_T() {
            return LINE_PAD_T
        },

        LINE_PAD_B() {
            return LINE_PAD_B
        },

        hintText() {
            return 'As tasks são contadas pelo updated_at (última modificação) das issues concluídas. O Plane CE não guarda o histórico de mudanças de estado, então essa é a melhor aproximação — confiável para os últimos ~60 dias.'
        },

        memberOptions() {
            const seen = new Map()
            for (const issue of this.enrichedIssues) {
                for (const member of issue._assignees || []) {
                    const id = member.member?.id || member.id
                    if (id && !seen.has(id)) seen.set(id, { id, name: memberName(member) })
                }
            }
            return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        },

        completedIssues() {
            const issues = this.enrichedIssues.filter(issue => issue._state?.group === 'completed')
            if (!this.selectedMember) return issues
            return issues.filter(issue =>
                (issue._assignees || []).some(member => (member.member?.id || member.id) === this.selectedMember)
            )
        },

        memberHasNoCompletions() {
            return Boolean(this.selectedMember) && this.completedIssues.length === 0
        },

        completedByDay() {
            const map = {}
            for (const issue of this.completedIssues) {
                const day = localDateKey(issue.updated_at)
                if (day) map[day] = (map[day] || 0) + 1
            }
            return map
        },

        heatmapTotal() {
            return this.completedIssues.length
        },

        // --- Heatmap ---
        heatmap() {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const start = new Date(today)
            start.setDate(start.getDate() - 364)
            start.setDate(start.getDate() - start.getDay())

            const cells = []
            const monthLabels = []
            const cursor = new Date(start)
            let col = 0
            let row = 0
            let lastMonth = -1

            while (cursor <= today) {
                const key = localDateKey(cursor)
                cells.push({
                    date: key,
                    col,
                    row,
                    count: this.completedByDay[key] || 0,
                    x: HEAT_PAD_LEFT + col * HEAT_PITCH,
                    y: HEAT_PAD_TOP + row * HEAT_PITCH,
                })

                if (cursor.getMonth() !== lastMonth) {
                    lastMonth = cursor.getMonth()
                    const isFirst = monthLabels.length === 0
                    const text = isFirst || lastMonth === 0
                        ? `${MONTHS_SHORT[lastMonth]} ${cursor.getFullYear()}`
                        : MONTHS_SHORT[lastMonth]
                    const x = HEAT_PAD_LEFT + col * HEAT_PITCH
                    const previous = monthLabels[monthLabels.length - 1]
                    const minGap = previous ? previous.text.length * 5.5 + 6 : 0

                    if (!previous || x - previous.x >= minGap) {
                        monthLabels.push({
                            key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
                            text,
                            x,
                        })
                    }
                }

                cursor.setDate(cursor.getDate() + 1)
                row += 1
                if (row === 7) {
                    row = 0
                    col += 1
                }
            }

            return { cells, monthLabels, weeks: col + 1 }
        },

        cells() {
            return this.heatmap.cells
        },

        monthLabels() {
            return this.heatmap.monthLabels
        },

        weekdayLabels() {
            return [
                { key: 'mon', text: 'Seg', y: HEAT_PAD_TOP + 1 * HEAT_PITCH + 11 },
                { key: 'wed', text: 'Qua', y: HEAT_PAD_TOP + 3 * HEAT_PITCH + 11 },
                { key: 'fri', text: 'Sex', y: HEAT_PAD_TOP + 5 * HEAT_PITCH + 11 },
            ]
        },

        heatmapWidth() {
            return HEAT_PAD_LEFT + this.heatmap.weeks * HEAT_PITCH
        },

        heatmapHeight() {
            return HEAT_PAD_TOP + 7 * HEAT_PITCH
        },

        // --- Linha ---
        lineDays() {
            const days = Number(this.linePeriod) || 60
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const list = []
            for (let offset = days - 1; offset >= 0; offset -= 1) {
                const date = new Date(today)
                date.setDate(date.getDate() - offset)
                const key = localDateKey(date)
                list.push({ date: key, count: this.completedByDay[key] || 0 })
            }
            return list
        },

        lineTotal() {
            return this.lineDays.reduce((sum, day) => sum + day.count, 0)
        },

        lineNiceScale() {
            const max = Math.max(1, ...this.lineDays.map(day => day.count))
            const rough = max / 4
            const magnitude = 10 ** Math.floor(Math.log10(rough))
            const candidates = [1, 2, 2.5, 5, 10].map(multiplier => multiplier * magnitude)
            const step = candidates.find(candidate => candidate >= rough) || candidates[candidates.length - 1]
            const top = Math.ceil(max / step) * step

            const ticks = []
            for (let value = 0; value <= top + step / 2; value += step) {
                ticks.push(Math.round(value * 100) / 100)
            }

            return { top, ticks }
        },

        lineScaleMax() {
            return this.lineNiceScale.top
        },

        linePoints() {
            const days = this.lineDays
            const innerW = LINE_W - LINE_PAD_L - LINE_PAD_R
            const innerH = LINE_H - LINE_PAD_T - LINE_PAD_B
            const step = days.length > 1 ? innerW / (days.length - 1) : 0

            return days.map((day, index) => ({
                ...day,
                index,
                x: LINE_PAD_L + step * index,
                y: LINE_PAD_T + innerH - (day.count / this.lineScaleMax) * innerH,
            }))
        },

        visiblePoints() {
            return this.linePoints.filter(point => point.count > 0)
        },

        linePath() {
            return this.smoothPath(this.linePoints)
        },

        areaPath() {
            const points = this.linePoints
            if (points.length < 2) return ''
            const baseY = LINE_H - LINE_PAD_B
            const first = points[0]
            const last = points[points.length - 1]
            return `${this.smoothPath(points)} L ${last.x},${baseY} L ${first.x},${baseY} Z`
        },

        yTicks() {
            const innerH = LINE_H - LINE_PAD_T - LINE_PAD_B
            const top = this.lineScaleMax
            return this.lineNiceScale.ticks.map(value => ({
                value,
                y: LINE_PAD_T + innerH * (1 - value / top),
            }))
        },

        xLabels() {
            const points = this.linePoints
            const every = 7
            return points
                .filter((point, index) => index % every === 0 || index === points.length - 1)
                .map(point => ({
                    key: point.date,
                    x: point.x,
                    text: this.formatShortDate(point.date),
                }))
        },

        hoveredPoint() {
            if (this.hoveredIndex < 0) return null
            return this.linePoints[this.hoveredIndex] || null
        },

        lineColor() {
            return this.$vuetify.theme.current.dark ? '#4ade80' : '#16a34a'
        },
    },

    methods: {
        getColor(count) {
            const isDark = this.$vuetify.theme.current.dark
            if (!count) return isDark ? '#2d3748' : '#e4e7ec'
            if (count <= 2) return isDark ? '#276749' : '#9be9a8'
            if (count <= 5) return isDark ? '#2f855a' : '#40c463'
            if (count <= 10) return isDark ? '#38a169' : '#30a14e'
            return isDark ? '#48bb78' : '#216e39'
        },

        legendColor(index) {
            return this.getColor([0, 1, 4, 7, 12][index])
        },

        smoothPath(points) {
            if (!points.length) return ''
            if (points.length < 2) return `M ${points[0].x},${points[0].y}`

            let path = `M ${points[0].x},${points[0].y}`
            for (let index = 1; index < points.length; index += 1) {
                const previous = points[index - 1]
                const current = points[index]
                const controlX = (previous.x + current.x) / 2
                path += ` C ${controlX},${previous.y} ${controlX},${current.y} ${current.x},${current.y}`
            }
            return path
        },

        formatDate(isoDate) {
            if (!isoDate) return ''
            const [year, month, day] = isoDate.split('-')
            return `${day} ${MONTHS_SHORT[Number(month) - 1]} ${year}`
        },

        formatShortDate(isoDate) {
            if (!isoDate) return ''
            const [, month, day] = isoDate.split('-')
            return `${day} ${MONTHS_SHORT[Number(month) - 1]}`
        },

        setTooltip(date, count, event) {
            const label = this.formatDate(date)
            this.tooltip = {
                open: true,
                target: [event.clientX, event.clientY],
                text: count === 0
                    ? `Nenhuma task concluída em ${label}`
                    : `${count} ${count === 1 ? 'task concluída' : 'tasks concluídas'} em ${label}`,
            }
        },

        clearTooltip() {
            this.tooltip = { open: false, target: this.tooltip.target, text: '' }
            this.hoveredIndex = -1
        },

        onCellEnter(cell, event) {
            this.setTooltip(cell.date, cell.count, event)
        },

        onLineMove(event) {
            if (!this.linePoints.length) return

            const rect = event.currentTarget.getBoundingClientRect()
            if (!rect.width) return

            const scaleX = LINE_W / rect.width
            const svgX = (event.clientX - rect.left) * scaleX
            const innerW = LINE_W - LINE_PAD_L - LINE_PAD_R
            const step = this.linePoints.length > 1 ? innerW / (this.linePoints.length - 1) : 0
            const rawIndex = step ? Math.round((svgX - LINE_PAD_L) / step) : 0
            const index = Math.min(Math.max(rawIndex, 0), this.linePoints.length - 1)

            const point = this.linePoints[index]
            if (index === this.hoveredIndex && this.tooltip.open) {
                this.tooltip = { ...this.tooltip, target: [event.clientX, event.clientY] }
                return
            }

            this.hoveredIndex = index
            this.setTooltip(point.date, point.count, event)
        },
    },
}
</script>

<style scoped>
.productivity-card__member {
    max-width: 220px;
    min-width: 160px;
    flex: 0 1 220px;
}

.heatmap-scroll {
    overflow-x: auto;
    padding-bottom: 4px;
}

.heatmap__month {
    font-size: 10px;
    fill: rgba(var(--v-theme-on-surface), 0.5);
}

.heatmap__weekday {
    font-size: 10px;
    fill: rgba(var(--v-theme-on-surface), 0.5);
}

.heatmap__legend-cell {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    display: inline-block;
}

.line-svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
}

.line-svg__grid {
    stroke: rgba(var(--v-theme-on-surface), 0.12);
    stroke-width: 1;
    stroke-dasharray: 4 4;
}

.line-svg__axis {
    font-size: 10px;
    fill: rgba(var(--v-theme-on-surface), 0.5);
}

.line-svg__line {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.line-svg__guide {
    stroke: rgba(var(--v-theme-on-surface), 0.25);
    stroke-width: 1;
    stroke-dasharray: 3 3;
}

.line-svg__point {
    stroke: rgb(var(--v-theme-surface));
    stroke-width: 2;
}

.line-svg__point--active {
    stroke-width: 2.5;
}
</style>
