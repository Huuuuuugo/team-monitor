<template>
    <v-navigation-drawer
        :model-value="modelValue"
        location="right"
        temporary
        width="400"
        class="module-drawer"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="module-drawer__head">
            <div class="min-width-0">
                <div class="text-subtitle-1 font-weight-bold">
                    {{ module?.name || 'Módulo' }}
                </div>
                <div class="text-caption text-medium-emphasis">{{ summary }}</div>
            </div>
            <v-btn
                icon="mdi-close"
                variant="text"
                size="small"
                aria-label="Fechar"
                @click="$emit('update:modelValue', false)"
            />
        </div>

        <div v-if="module" class="module-drawer__tags">
            <v-chip size="small" variant="tonal" prepend-icon="mdi-folder-outline">
                {{ projectName }}
            </v-chip>
            <v-chip size="small" variant="flat" :style="statusTone">
                {{ statusLabel }}
            </v-chip>
            <v-chip
                v-if="dateRange"
                size="small"
                variant="tonal"
                prepend-icon="mdi-calendar-range"
            >
                {{ dateRange }}
            </v-chip>
            <v-chip
                v-else
                size="small"
                variant="tonal"
                color="error"
                prepend-icon="mdi-alert-circle-outline"
            >
                Sem prazo
            </v-chip>
            <div v-if="owners.length" class="d-flex align-center">
                <MemberAvatar
                    v-for="member in visibleOwners"
                    :key="memberKey(member)"
                    :member="member"
                    :size="24"
                    class="ml-n1"
                />
                <span v-if="extraOwners" class="module-drawer__more-owners">+{{ extraOwners }}</span>
            </div>
            <v-chip
                v-else
                size="small"
                variant="tonal"
                color="error"
                prepend-icon="mdi-account-alert-outline"
            >
                Sem responsável
            </v-chip>
        </div>

        <v-divider />

        <div class="module-drawer__body">
            <div v-if="!module?._issues.length" class="module-drawer__empty">
                Nenhuma tarefa associada a este módulo.
            </div>

            <section v-for="section in sections" :key="section.group">
                <div class="module-drawer__section-head">
                    <span class="module-drawer__dot" :style="{ background: section.color }" />
                    <span class="module-drawer__section-title">{{ section.label }}</span>
                    <v-chip size="x-small" variant="tonal">{{ section.issues.length }}</v-chip>
                </div>
                <IssueCard v-for="issue in section.issues" :key="issue.id" :issue="issue" />
            </section>
        </div>
    </v-navigation-drawer>
</template>

<script>
import IssueCard from '../issue/IssueCard.vue'
import MemberAvatar from '../member/MemberAvatar.vue'
import { memberName } from '../../utils/formatters.js'
import { toneFromColor } from '../../utils/colorTones.js'
import { sortByPriorityThenName } from '../../utils/issueHelpers.js'
import { STATE_GROUP_COLORS, STATE_GROUP_LABELS, STATE_GROUP_ORDER } from '../../utils/priorityColors.js'
import {
    moduleStatusLabel,
    moduleStatusColor,
    moduleDateRange,
} from '../../utils/moduleHelpers.js'

const MAX_OWNERS = 5

export default {
    name: 'ModuleDrawer',

    components: {
        IssueCard,
        MemberAvatar,
    },

    props: {
        modelValue: { type: Boolean, default: false },
        module: { type: Object, default: null },
    },

    emits: ['update:modelValue'],

    computed: {
        projectName() {
            return this.module?._project?.name || '—'
        },

        statusLabel() {
            return moduleStatusLabel(this.module?.status)
        },

        statusTone() {
            return toneFromColor(moduleStatusColor(this.module?.status), this.$vuetify.theme.current.dark)
        },

        dateRange() {
            return moduleDateRange(this.module)
        },

        owners() {
            if (!this.module) return []
            const list = []
            const seen = new Set()
            for (const member of [this.module._lead, ...this.module._members]) {
                const key = member?.member?.id || member?.id
                if (!key || seen.has(key)) continue
                seen.add(key)
                list.push(member)
            }
            return list
        },

        visibleOwners() {
            return this.owners.slice(0, MAX_OWNERS)
        },

        extraOwners() {
            return Math.max(0, this.owners.length - MAX_OWNERS)
        },

        summary() {
            if (!this.module) return ''
            const total = this.module._total
            const completed = this.module._completed
            const open = this.module._open
            return `${total} ${total === 1 ? 'tarefa' : 'tarefas'} · ${completed} ${
                completed === 1 ? 'concluída' : 'concluídas'
            } · ${open} ${open === 1 ? 'aberta' : 'abertas'}`
        },

        sections() {
            if (!this.module) return []
            return STATE_GROUP_ORDER.map(group => ({
                group,
                label: STATE_GROUP_LABELS[group],
                color: STATE_GROUP_COLORS[group],
                issues: sortByPriorityThenName(
                    this.module._issues.filter(issue => issue._state?.group === group)
                ),
            })).filter(section => section.issues.length)
        },
    },

    methods: {
        memberKey(member) {
            return member.member?.id || member.id || memberName(member)
        },
    },
}
</script>

<style scoped>
.module-drawer__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 10px;
}

.module-drawer__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 16px 14px;
}

.module-drawer__body {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 20px;
}

.module-drawer__section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.module-drawer__dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
}

.module-drawer__section-title {
    font-size: 13px;
    font-weight: 600;
}

.module-drawer__empty {
    padding: 8px 0;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.module-drawer__more-owners {
    margin-left: 5px;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}
</style>
