<template>
    <v-dialog
        :model-value="modelValue"
        max-width="780"
        scrollable
        @update:model-value="value => $emit('update:modelValue', value)"
    >
        <v-card>
            <div class="detail-head">
                <MemberAvatar :member="entry.member" :size="40" />
                <div class="min-width-0 flex-grow-1">
                    <div class="detail-head__name-row">
                        <span class="detail-head__name text-truncate">{{ name }}</span>
                        <template v-if="modeMeta">
                            <v-chip size="x-small" variant="tonal" :color="modeMeta.color">
                                {{ modeMeta.label }}
                            </v-chip>
                            <HintIcon
                                :text="modeMeta.hint"
                                :size="14"
                                :aria-label="`O que é ${modeMeta.label}`"
                            />
                        </template>
                    </div>
                    <div class="detail-head__summary text-truncate">{{ summaryLabel }}</div>
                </div>
                <HintIcon :text="percentHint" :size="16" aria-label="Sobre o percentual" />
                <v-btn icon="mdi-close" variant="text" aria-label="Fechar" @click="close" />
            </div>

            <v-divider />

            <v-card-text class="detail-body">
                <section v-for="section in sections" :key="section.key" class="detail-section">
                    <h3 class="detail-section__title">{{ section.title }}</h3>

                    <div
                        v-for="project in section.projects"
                        :key="project.project.id"
                        class="detail-project"
                    >
                        <div class="detail-project__head">
                            <span
                                class="detail-project__name text-truncate"
                                :title="project.project.name"
                            >
                                {{ project.project.name }}
                            </span>
                            <span class="detail-project__percent">{{ project.percent }}% do foco</span>
                            <v-btn
                                icon="mdi-format-list-bulleted"
                                size="x-small"
                                variant="text"
                                color="primary"
                                class="detail-project__action"
                                :title="`Ver tarefas de ${project.project.name} na Lista`"
                                :aria-label="`Ver tarefas de ${project.project.name} na Lista`"
                                @click="openInList(project)"
                            />
                        </div>

                        <v-progress-linear
                            :model-value="project.percent"
                            color="primary"
                            height="4"
                            rounded
                            bg-color="surface-variant"
                            class="detail-project__bar"
                        />

                        <div class="detail-project__metrics">
                            <span
                                v-for="metric in metricsOf(project)"
                                :key="metric.key"
                                class="detail-metric"
                                :title="metric.title"
                            >
                                <v-icon size="14" :style="{ color: metric.color }">
                                    {{ metric.icon }}
                                </v-icon>
                                <span class="detail-metric__text">{{ metric.text }}</span>
                            </span>
                            <span v-if="!metricsOf(project).length" class="detail-project__muted">
                                somente atualizações
                            </span>
                        </div>
                    </div>
                </section>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import { mapActions } from 'pinia'
import { useUiStore } from '../../stores/ui.js'
import MemberAvatar from '../member/MemberAvatar.vue'
import HintIcon from '../common/HintIcon.vue'
import { memberName } from '../../utils/formatters.js'
import { FOCUS_MODE_META, projectMetrics } from '../../utils/focusMetrics.js'

export default {
    name: 'FocusDetailDialog',

    components: {
        MemberAvatar,
        HintIcon,
    },

    props: {
        modelValue: { type: Boolean, default: false },
        entry: { type: Object, required: true },
    },

    emits: ['update:modelValue'],

    data: () => ({
        percentHint:
            'A porcentagem é a fatia do projeto no foco total da pessoa. Os projetos que não aparecem no card continuam contando e entram como "Demais projetos".',
    }),

    computed: {
        name() {
            return this.entry.member ? memberName(this.entry.member) : 'Sem responsável'
        },

        modeMeta() {
            return FOCUS_MODE_META[this.entry.focusMode] || null
        },

        focusPercent() {
            return this.entry.focusProjects.reduce((sum, project) => sum + project.percent, 0)
        },

        otherPercent() {
            return Math.max(0, 100 - this.focusPercent)
        },

        summaryLabel() {
            const parts = [
                `${this.entry.openCount} abertas`,
                `${this.entry.wipTotal} em andamento`,
                this.entry.hiddenProjects
                    ? `em foco ${this.focusPercent}% · demais ${this.otherPercent}%`
                    : `em foco ${this.focusPercent}%`,
            ]
            return parts.join(' · ')
        },

        sections() {
            const sections = []

            if (this.entry.focusProjects.length) {
                sections.push({
                    key: 'focus',
                    title: `Em foco (${this.entry.focusProjects.length})`,
                    projects: this.entry.focusProjects,
                })
            }

            const hidden = (this.entry.allProjects || []).filter(project => !project.focused)
            if (hidden.length) {
                sections.push({
                    key: 'others',
                    title: `Demais projetos (${hidden.length})`,
                    projects: hidden,
                })
            }

            return sections
        },
    },

    methods: {
        ...mapActions(useUiStore, ['setListFilters']),

        close() {
            this.$emit('update:modelValue', false)
        },

        metricsOf(project) {
            const open = project.open
            const openMetric = {
                key: 'open',
                icon: 'mdi-clipboard-text-outline',
                count: open,
                text: `${open} ${open === 1 ? 'aberta' : 'abertas'}`,
                color: 'rgba(var(--v-theme-on-surface), 0.55)',
                title: `${open} ${open === 1 ? 'tarefa aberta' : 'tarefas abertas'}`,
            }
            return [openMetric, ...projectMetrics(project, this.$vuetify.theme.current.dark)]
        },

        openInList(project) {
            const member = this.entry.member
            const memberId = member ? member.member?.id || member.id : null
            this.setListFilters({ projectId: project.project.id, memberId })
            this.close()
            if (this.$route.path !== '/lista') this.$router.push('/lista')
        },
    },
}
</script>

<style scoped>
.detail-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
}

.detail-head__name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.detail-head__name {
    font-size: 15px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

.detail-head__summary {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.detail-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px;
    background: rgb(var(--v-theme-background));
}

.detail-section__title {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.detail-project {
    padding: 10px 12px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    border-radius: 8px;
    background: rgb(var(--v-theme-surface));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.v-theme--dark .detail-project {
    background: rgb(var(--v-theme-surface-variant));
    box-shadow: none;
}

.detail-project + .detail-project {
    margin-top: 8px;
}

.detail-project__head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.detail-project__name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.detail-project__percent {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
    white-space: nowrap;
}

.detail-project__action {
    flex: 0 0 auto;
}

.detail-project__bar {
    margin-top: 6px;
}

.detail-project__metrics {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 8px;
}

.detail-metric {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.detail-metric__text {
    font-size: 12px;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.detail-project__muted {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}
</style>
