<template>
    <v-navigation-drawer
        :model-value="modelValue"
        :permanent="$vuetify.display.mdAndUp"
        width="248"
        color="surface"
        class="app-sidebar"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="sidebar-brand">
            <div class="sidebar-brand__mark">M</div>
            <div class="min-width-0">
                <div class="sidebar-brand__name">Monitor de Equipe</div>
                <div class="sidebar-brand__sub">MMaluf Consultoria · Geração Bancária</div>
            </div>
        </div>

        <v-list nav density="comfortable" class="px-2 pt-2">
            <v-list-item
                v-for="item in featuredItems"
                :key="item.to"
                :to="item.to"
                :prepend-icon="item.icon"
                class="sidebar-item"
            >
                <v-list-item-title class="sidebar-item__title">{{ item.label }}</v-list-item-title>
                <template #append>
                    <span
                        v-if="item.badge"
                        class="nav-badge"
                        :class="`nav-badge--${item.badge.color}`"
                    >
                        {{ item.badge.count }}
                    </span>
                </template>
            </v-list-item>
        </v-list>

        <div class="sidebar-label">Menu</div>

        <v-list nav density="comfortable" class="px-2">
            <v-list-item
                v-for="item in menuItems"
                :key="item.to"
                :to="item.to"
                :prepend-icon="item.icon"
                class="sidebar-item"
            >
                <v-list-item-title class="sidebar-item__title">{{ item.label }}</v-list-item-title>
                <template #append>
                    <span
                        v-if="item.badge"
                        class="nav-badge"
                        :class="`nav-badge--${item.badge.color}`"
                    >
                        {{ item.badge.count }}
                    </span>
                </template>
            </v-list-item>
        </v-list>

        <template #append>
            <div v-if="lastFetchAt" class="sidebar-footer">
                <v-icon size="14">mdi-clock-outline</v-icon>
                <span>Atualizado às {{ formatTime(lastFetchAt) }}</span>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script>
import { mapState } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import { useUiStore } from '../../stores/ui.js'
import { filterIssues } from '../../utils/issueHelpers.js'
import { formatTime } from '../../utils/formatters.js'

export default {
    name: 'Sidebar',

    props: {
        modelValue: { type: Boolean, default: false },
    },

    emits: ['update:modelValue'],

    computed: {
        ...mapState(usePlaneDataStore, [
            'lastFetchAt',
            'todayEventCount',
            'inProgressOverdueIssues',
            'enrichedIssues',
        ]),
        ...mapState(useUiStore, ['listFilters']),

        filteredListCount() {
            return filterIssues(this.enrichedIssues, this.listFilters).length
        },

        inProgressCount() {
            return this.enrichedIssues.filter(issue => issue._state?.group === 'started').length
        },

        featuredItems() {
            return [
                {
                    to: '/hoje',
                    label: 'Hoje',
                    icon: 'mdi-calendar-today',
                    badge: this.todayEventCount
                        ? { count: this.todayEventCount, color: 'primary' }
                        : null,
                },
                {
                    to: '/em-andamento',
                    label: 'Em Andamento',
                    icon: 'mdi-progress-clock',
                    badge: this.inProgressOverdueIssues.length
                        ? { count: this.inProgressOverdueIssues.length, color: 'error' }
                        : this.inProgressCount
                            ? { count: this.inProgressCount, color: 'primary' }
                            : null,
                },
            ]
        },

        menuItems() {
            const items = [
                { to: '/panorama', label: 'Panorama', icon: 'mdi-chart-donut', badge: null },
                { to: '/kanban', label: 'Kanban', icon: 'mdi-view-column-outline', badge: null },
                {
                    to: '/lista',
                    label: 'Lista',
                    icon: 'mdi-format-list-bulleted',
                    badge: this.filteredListCount
                        ? { count: this.filteredListCount, color: 'neutral' }
                        : null,
                },
            ]

            if (!this.$vuetify.display.lgAndUp) {
                items.push(
                    { to: '/status', label: 'Status das tarefas', icon: 'mdi-chart-arc', badge: null },
                    { to: '/atividades', label: 'Atividades recentes', icon: 'mdi-history', badge: null },
                )
            }

            return items
        },
    },

    methods: {
        formatTime,
    },
}
</script>

<style scoped>
.app-sidebar :deep(.v-navigation-drawer__content) {
    display: flex;
    flex-direction: column;
}

.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 16px 14px;
}

.sidebar-brand__mark {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 6px;
    background: rgb(var(--v-theme-primary));
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 18px;
    font-weight: 700;
}

.sidebar-brand__name {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    color: rgb(var(--v-theme-on-surface));
}

.sidebar-brand__sub {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-label {
    padding: 16px 20px 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(var(--v-theme-on-surface), 0.4);
}

.sidebar-item {
    border-radius: 6px;
    margin-bottom: 2px;
}

.sidebar-item__title {
    font-size: 13px;
    font-weight: 500;
}

.sidebar-item :deep(.v-list-item__prepend .v-icon) {
    opacity: 0.65;
}

.sidebar-item.v-list-item--active {
    background: rgba(var(--v-theme-on-surface), 0.07);
}

.v-theme--dark .sidebar-item.v-list-item--active {
    color: #fff;
}

.sidebar-item.v-list-item--active :deep(.v-list-item__prepend .v-icon) {
    opacity: 1;
}

.nav-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 4px;
    display: inline-grid;
    place-items: center;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
}

.nav-badge--primary {
    background: rgba(var(--v-theme-primary), 0.18);
    color: rgb(var(--v-theme-primary));
}

.nav-badge--error {
    background: rgba(var(--v-theme-error), 0.18);
    color: rgb(var(--v-theme-error));
}

.nav-badge--neutral {
    background: rgba(var(--v-theme-on-surface), 0.1);
    color: rgba(var(--v-theme-on-surface), 0.75);
}

.sidebar-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 18px;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.45);
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
