<template>
    <div class="focus-card" :class="{ 'focus-card--idle': !entry.totalScore }">
        <div class="focus-card__head">
            <MemberAvatar :member="entry.member" :size="36" />
            <div class="min-width-0 flex-grow-1">
                <div class="focus-card__name-row">
                    <span class="focus-card__name text-truncate" :title="name">{{ name }}</span>
                    <template v-if="modeMeta">
                        <v-chip size="x-small" variant="tonal" :color="modeMeta.color">
                            {{ modeMeta.label }}
                        </v-chip>
                        <HintIcon :text="modeMeta.hint" :size="14" :aria-label="`O que é ${modeMeta.label}`" />
                    </template>
                </div>
                <div class="focus-card__summary text-truncate">{{ summaryLabel }}</div>
            </div>
            <v-btn
                v-if="entry.allProjects.length"
                size="small"
                variant="tonal"
                color="primary"
                class="text-none flex-shrink-0"
                @click="detailOpen = true"
            >
                Detalhes
            </v-btn>
        </div>

        <div v-if="entry.focusProjects.length" class="focus-card__projects">
            <div v-for="focus in entry.focusProjects" :key="focus.project.id" class="focus-project">
                <div class="focus-project__top">
                    <span class="focus-project__name text-truncate" :title="focus.project.name">
                        <v-icon size="14">mdi-folder-outline</v-icon>
                        <span class="text-truncate">{{ focus.project.name }}</span>
                    </span>
                    <span class="focus-project__percent" :title="percentHint">
                        {{ focus.percent }}%<span class="focus-project__unit"> do foco</span>
                    </span>
                </div>

                <div class="focus-project__bottom">
                    <v-progress-linear
                        :model-value="focus.percent"
                        color="primary"
                        height="5"
                        rounded
                        bg-color="surface-variant"
                        class="focus-project__bar"
                    />
                    <div class="focus-project__metrics">
                        <span
                            v-for="metric in metricsOf(focus)"
                            :key="metric.key"
                            class="focus-metric"
                            :style="{ color: metric.color }"
                            :title="metric.title"
                        >
                            <v-icon size="13">{{ metric.icon }}</v-icon>
                            <span>{{ metric.count }}</span>
                        </span>
                        <span v-if="!metricsOf(focus).length" class="focus-project__muted">
                            {{ fallbackLabel(focus) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="focus-card__empty">Sem atividade ou tarefas abertas no momento.</div>

        <button
            v-if="entry.hiddenProjects"
            type="button"
            class="focus-card__more"
            :title="hiddenTitle"
            @click="detailOpen = true"
        >
            <v-icon size="14">mdi-dots-horizontal-circle-outline</v-icon>
            <span>
                Demais projetos · {{ remainingPercent }}% ({{ entry.hiddenProjects }})
            </span>
        </button>

        <FocusDetailDialog v-model="detailOpen" :entry="entry" />
    </div>
</template>

<script>
import MemberAvatar from '../member/MemberAvatar.vue'
import FocusDetailDialog from './FocusDetailDialog.vue'
import HintIcon from '../common/HintIcon.vue'
import { memberName } from '../../utils/formatters.js'
import { FOCUS_MODE_META, projectMetrics } from '../../utils/focusMetrics.js'

export default {
    name: 'MemberFocusCard',

    components: {
        MemberAvatar,
        FocusDetailDialog,
        HintIcon,
    },

    props: {
        entry: { type: Object, required: true },
    },

    data: () => ({
        detailOpen: false,
        percentHint:
            'Fatia do projeto no foco total da pessoa (soma dos scores de todos os projetos com score).',
    }),

    computed: {
        name() {
            return this.entry.member ? memberName(this.entry.member) : 'Sem responsável'
        },

        summaryLabel() {
            const count = this.entry.openCount
            const projects = this.entry.projectCount
            const parts = [`${count} ${count === 1 ? 'tarefa aberta' : 'tarefas abertas'}`]
            if (projects) {
                parts.push(
                    `${projects} ${projects === 1 ? 'projeto com atividade' : 'projetos com atividade'}`
                )
            }
            return parts.join(' · ')
        },

        modeMeta() {
            return FOCUS_MODE_META[this.entry.focusMode] || null
        },

        remainingPercent() {
            const focused = this.entry.focusProjects.reduce(
                (sum, focus) => sum + focus.percent,
                0
            )
            return Math.max(0, 100 - focused)
        },

        hiddenTitle() {
            const names = (this.entry.allProjects || [])
                .filter(project => !project.focused)
                .map(project => project.project.name)
                .join(', ')
            return names ? `Demais projetos: ${names}. Clique para ver todos.` : ''
        },
    },

    methods: {
        metricsOf(focus) {
            return projectMetrics(focus, this.$vuetify.theme.current.dark)
        },

        fallbackLabel(focus) {
            if (focus.open) {
                return `${focus.open} ${focus.open === 1 ? 'tarefa aberta' : 'tarefas abertas'}`
            }
            return 'somente atualizações'
        },
    },
}
</script>

<style scoped>
.focus-card {
    padding: 12px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    border-radius: 8px;
    background: rgba(var(--v-theme-on-surface), 0.02);
    transition: background 0.15s ease, border-color 0.15s ease;
}

.focus-card:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
    border-color: rgba(var(--v-theme-on-surface), 0.14);
}

.focus-card--idle {
    opacity: 0.55;
}

.focus-card__head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.focus-card__name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.focus-card__name {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.focus-card__summary {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.focus-card__projects {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
}

.focus-project {
    min-width: 0;
}

.focus-project__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.focus-project__name {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    font-size: 12px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.focus-project__percent {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
    white-space: nowrap;
}

.focus-project__unit {
    font-size: 10px;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.focus-project__bottom {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
    min-width: 0;
}

.focus-project__bar {
    flex: 1 1 auto;
    min-width: 60px;
}

.focus-project__metrics {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
}

.focus-metric {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
}

.focus-project__muted {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    white-space: nowrap;
}

.focus-card__empty {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.focus-card__more {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    padding: 2px 0;
    border: none;
    background: none;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    cursor: pointer;
    transition: color 0.15s ease;
}

.focus-card__more:hover {
    color: rgb(var(--v-theme-primary));
}

@media (max-width: 599px) {
    .focus-project__bottom {
        flex-wrap: wrap;
    }
}
</style>
