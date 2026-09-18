<template>
    <header class="topbar">
        <v-btn
            class="d-md-none"
            icon="mdi-menu"
            variant="text"
            aria-label="Abrir menu"
            @click="$emit('toggle-sidebar')"
        />

        <div class="topbar__search">
            <v-text-field
                v-model="search"
                placeholder="O que você está procurando?"
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                density="compact"
                rounded="lg"
                flat
                hide-details
                clearable
                @keydown.enter="submitSearch"
                @click:clear="clearSearch"
            />
        </div>

        <v-spacer />

        <div v-if="lastFetchAt" class="topbar__updated d-none d-md-flex">
            <v-icon size="14">mdi-clock-outline</v-icon>
            <span>Atualizado às {{ formatTime(lastFetchAt) }}</span>
        </div>

        <v-btn
            icon="mdi-refresh"
            variant="text"
            :loading="loading"
            title="Atualizar dados"
            aria-label="Atualizar dados"
            @click="onRefresh"
        />

        <div class="theme-pill">
            <button
                type="button"
                class="theme-pill__btn"
                :class="{ 'theme-pill__btn--active': effectiveTheme === 'light' }"
                title="Tema claro"
                aria-label="Tema claro"
                @click="setTheme('light')"
            >
                <v-icon size="16">mdi-weather-sunny</v-icon>
            </button>
            <button
                type="button"
                class="theme-pill__btn"
                :class="{ 'theme-pill__btn--active': effectiveTheme === 'dark' }"
                title="Tema escuro"
                aria-label="Tema escuro"
                @click="setTheme('dark')"
            >
                <v-icon size="16">mdi-weather-night</v-icon>
            </button>
        </div>

        <v-btn icon variant="text" class="topbar__bell" aria-label="Notificações">
            <v-badge dot color="primary" offset-x="-2" offset-y="2">
                <v-icon>mdi-bell-outline</v-icon>
            </v-badge>
        </v-btn>

        <div class="topbar__user d-none d-sm-flex">
            <v-avatar size="32" color="primary">
                <span class="text-caption font-weight-medium text-white">GB</span>
            </v-avatar>
            <div class="topbar__user-name d-none d-md-block">
                <div class="topbar__user-title">Equipe GB</div>
                <div class="topbar__user-sub">MMaluf Consultoria</div>
            </div>
        </div>
    </header>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import { useUiStore } from '../../stores/ui.js'
import { formatTime } from '../../utils/formatters.js'

export default {
    name: 'AppHeader',

    emits: ['toggle-sidebar'],

    data: () => ({
        search: '',
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['loading', 'lastFetchAt', 'partialErrors']),
        ...mapState(useUiStore, ['theme', 'listFilters']),

        effectiveTheme() {
            return this.$vuetify.theme.global.name
        },
    },

    watch: {
        'listFilters.search': {
            immediate: true,
            handler(value) {
                if ((value || '') !== this.search) this.search = value || ''
            },
        },
    },

    methods: {
        ...mapActions(usePlaneDataStore, ['refresh']),
        ...mapActions(useUiStore, ['setTheme', 'showSnackbar']),

        formatTime,

        submitSearch() {
            const term = (this.search || '').trim()
            this.listFilters.search = term
            if (this.$route.path !== '/lista') this.$router.push('/lista')
        },

        clearSearch() {
            this.search = ''
            this.listFilters.search = ''
        },

        async onRefresh() {
            await this.refresh()
            if (this.partialErrors.length) {
                this.showSnackbar('Dados atualizados com avisos: alguns projetos falharam.', 'warning')
            } else {
                this.showSnackbar('Dados atualizados com sucesso.', 'success')
            }
        },
    },
}
</script>

<style scoped>
.topbar {
    position: sticky;
    top: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(var(--v-theme-background), 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.topbar__search {
    flex: 1 1 420px;
    max-width: 420px;
    min-width: 120px;
}

.topbar__search :deep(.v-field) {
    background: rgba(var(--v-theme-on-surface), 0.05);
}

.topbar__search :deep(.v-field__input) {
    font-size: 13px;
    min-height: 40px;
}

.topbar__updated {
    align-items: center;
    gap: 6px;
    margin-right: 4px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.45);
}

.theme-pill {
    display: flex;
    gap: 2px;
    padding: 3px;
    border-radius: 6px;
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.theme-pill__btn {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    display: grid;
    place-items: center;
    color: rgba(var(--v-theme-on-surface), 0.5);
    transition: background 0.15s ease, color 0.15s ease;
}

.theme-pill__btn:hover {
    color: rgba(var(--v-theme-on-surface), 0.85);
}

.theme-pill__btn--active {
    background: rgba(var(--v-theme-primary), 0.18);
    color: rgb(var(--v-theme-primary));
}

.topbar__bell {
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.topbar__user {
    align-items: center;
    gap: 10px;
    margin-left: 6px;
    padding-left: 12px;
    border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.topbar__user-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: rgb(var(--v-theme-on-surface));
}

.topbar__user-sub {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}
</style>
