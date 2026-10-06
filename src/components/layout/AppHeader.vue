<template>
    <v-app-bar flat :height="64" color="background" class="topbar">
        <v-btn
            class="d-md-none"
            icon="mdi-menu"
            variant="text"
            aria-label="Abrir menu"
            @click="$emit('toggle-sidebar')"
        />

        <SlugSelect class="topbar__slug d-none d-lg-flex" />

        <div v-if="$vuetify.display.mdAndUp" class="topbar__search">
            <v-text-field
                v-model="search"
                placeholder="O que você está procurando?"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                rounded="pill"
                hide-details
                clearable
                @keydown.enter="submitSearch"
                @click:clear="clearSearch"
            />
        </div>

        <template v-else>
            <v-btn
                icon="mdi-magnify"
                variant="text"
                title="Pesquisar"
                aria-label="Pesquisar"
                @click="openSearch"
            />
            <v-spacer />
        </template>

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

        <v-dialog v-model="searchOpen" max-width="460" location="top">
            <v-card class="pa-4">
                <div class="text-subtitle-1 font-weight-bold mb-3">Pesquisar tarefas</div>

                <v-text-field
                    v-model="search"
                    placeholder="O que você está procurando?"
                    prepend-inner-icon="mdi-magnify"
                    variant="solo-filled"
                    density="comfortable"
                    rounded="lg"
                    flat
                    autofocus
                    hide-details
                    clearable
                    @keydown.enter="submitSearch"
                    @click:clear="clearSearch"
                />

                <div class="d-flex justify-end ga-2 mt-4">
                    <v-btn variant="text" @click="searchOpen = false">Cancelar</v-btn>
                    <v-btn color="primary" variant="flat" @click="submitSearch">Buscar</v-btn>
                </div>
            </v-card>
        </v-dialog>
    </v-app-bar>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from '../../stores/planeData.js'
import { useUiStore } from '../../stores/ui.js'
import SlugSelect from './SlugSelect.vue'
import { formatTime } from '../../utils/formatters.js'

export default {
    name: 'AppHeader',

    components: {
        SlugSelect,
    },

    emits: ['toggle-sidebar'],

    data: () => ({
        search: '',
        searchOpen: false,
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

        openSearch() {
            this.searchOpen = true
        },

        submitSearch() {
            const term = (this.search || '').trim()
            this.listFilters.search = term
            this.searchOpen = false
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
    --topbar-control-height: 38px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.topbar :deep(.v-toolbar__content) {
    gap: 8px;
    padding: 0 20px;
}

.topbar__search {
    flex: 1 1 auto;
    display: flex;
    justify-content: center;
    min-width: 140px;
}

.topbar__search :deep(.v-input) {
    width: 100%;
    max-width: 420px;
}

.topbar__search :deep(.v-field) {
    --v-input-control-height: var(--topbar-control-height);
    height: var(--topbar-control-height);
    font-size: 13px;
}

.topbar__search :deep(.v-field__field) {
    align-items: center;
}

.topbar__search :deep(.v-field__input) {
    font-size: 13px;
    min-height: calc(var(--topbar-control-height) - 4px);
    padding-top: 0;
    padding-bottom: 0;
    align-items: center;
}

.topbar__slug {
    flex: 0 1 290px;
    width: 290px;
    min-width: 190px;
}

@media (max-width: 1280px) {
    .topbar__slug {
        flex-basis: 240px;
        width: 240px;
    }
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
</style>
