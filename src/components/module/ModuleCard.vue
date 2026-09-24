<template>
    <v-card
        variant="flat"
        class="module-card tone-card"
        :class="{ 'module-card--alert': hasAlert }"
        tabindex="0"
        role="button"
        :aria-label="`Abrir módulo ${module.name}`"
        @click="$emit('select', module)"
        @keydown.enter.prevent="$emit('select', module)"
        @keydown.space.prevent="$emit('select', module)"
    >
        <v-card-text class="pa-4">
            <div class="d-flex align-start ga-3 mb-3">
                <div class="min-width-0 flex-grow-1">
                    <div class="module-card__name">{{ module.name }}</div>
                    <div class="module-card__project">
                        <v-icon size="13">mdi-folder-outline</v-icon>
                        <span class="text-truncate">{{ projectName }}</span>
                    </div>
                </div>
                <v-chip size="x-small" variant="flat" :style="statusTone">
                    {{ statusLabel }}
                </v-chip>
            </div>

            <div class="module-card__progress mb-3">
                <div class="module-card__progress-head">
                    <span>{{ module._completed }} de {{ module._total }} concluídas</span>
                    <span>{{ module._percent }}%</span>
                </div>
                <v-progress-linear :model-value="module._percent" color="success" height="6" rounded />
            </div>

            <div class="module-card__tags d-flex align-center flex-wrap ga-2">
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
                    <span v-if="extraOwners" class="module-card__more-owners">+{{ extraOwners }}</span>
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

                <v-spacer />

                <span class="module-card__tasks">{{ module._total }} tarefas</span>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import MemberAvatar from '../member/MemberAvatar.vue'
import { memberName } from '../../utils/formatters.js'
import { toneFromColor } from '../../utils/colorTones.js'
import {
    moduleStatusLabel,
    moduleStatusColor,
    moduleDateRange,
} from '../../utils/moduleHelpers.js'

const MAX_OWNERS = 4

export default {
    name: 'ModuleCard',

    components: {
        MemberAvatar,
    },

    props: {
        module: { type: Object, required: true },
    },

    emits: ['select'],

    computed: {
        projectName() {
            return this.module._project?.name || '—'
        },

        statusLabel() {
            return moduleStatusLabel(this.module.status)
        },

        statusTone() {
            return toneFromColor(moduleStatusColor(this.module.status), this.$vuetify.theme.current.dark)
        },

        dateRange() {
            return moduleDateRange(this.module)
        },

        owners() {
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

        hasAlert() {
            return this.module._missingDue || this.module._missingOwner
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
.module-card {
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.module-card:hover {
    border-color: rgba(var(--v-theme-primary), 0.35) !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.module-card--alert {
    border-color: rgba(var(--v-theme-error), 0.5) !important;
}

.module-card--alert:hover {
    border-color: rgba(var(--v-theme-error), 0.75) !important;
}

.module-card__name {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: rgb(var(--v-theme-on-surface));
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.module-card__project {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    margin-top: 3px;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.module-card__progress-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 5px;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.module-card__tasks {
    font-size: 11px;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.module-card__more-owners {
    margin-left: 5px;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.v-theme--dark .module-card {
    background: color-mix(in srgb, rgb(var(--v-theme-primary)) 14%, rgb(var(--v-theme-surface))) !important;
    border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 22%, transparent) !important;
}

.v-theme--dark .module-card:hover {
    background: color-mix(in srgb, rgb(var(--v-theme-primary)) 20%, rgb(var(--v-theme-surface))) !important;
    border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 45%, transparent) !important;
}

.v-theme--dark .module-card--alert {
    border-color: rgba(var(--v-theme-error), 0.6) !important;
}

.v-theme--dark .module-card--alert:hover {
    border-color: rgba(var(--v-theme-error), 0.85) !important;
}
</style>
