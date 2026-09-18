<template>
    <v-app>
        <Sidebar v-model="sidebarOpen" />

        <v-main>
            <div class="app-frame">
                <div class="app-frame__content">
                    <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

                    <v-container fluid class="app-container pa-4 pa-md-6">
                        <v-alert
                            v-if="error"
                            type="error"
                            variant="tonal"
                            class="mb-4"
                            closable
                            @click:close="clearError"
                        >
                            {{ error }}
                            <template #append>
                                <v-btn size="small" variant="text" @click="refresh">Tentar novamente</v-btn>
                            </template>
                        </v-alert>

                        <v-alert
                            v-else-if="partialErrors.length"
                            type="warning"
                            variant="tonal"
                            class="mb-4"
                            closable
                            @click:close="clearPartialErrors"
                        >
                            Alguns dados não puderam ser carregados: {{ partialErrors.join(' · ') }}
                        </v-alert>

                        <SlugSelect class="d-lg-none mb-5" />

                        <router-view />
                    </v-container>
                </div>

                <AppAside v-if="$vuetify.display.lgAndUp" class="app-frame__aside" />
            </div>
        </v-main>

        <IssueModal />

        <v-snackbar
            :model-value="snackbar.show"
            :color="snackbar.color"
            location="bottom right"
            :timeout="4000"
            @update:model-value="onSnackbarChange"
        >
            {{ snackbar.message }}
        </v-snackbar>

        <v-overlay :model-value="showGlobalLoader" persistent class="align-center justify-center">
            <v-card class="pa-6 text-center" width="380">
                <v-progress-circular indeterminate color="primary" size="56" width="5" class="mb-4" />
                <div class="text-h6 mb-1">Carregando dados do Plane</div>
                <div class="text-body-2 text-medium-emphasis">{{ progressLabel }}</div>
            </v-card>
        </v-overlay>
    </v-app>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { usePlaneDataStore } from './stores/planeData.js'
import { useUiStore } from './stores/ui.js'
import Sidebar from './components/layout/Sidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppAside from './components/layout/AppAside.vue'
import SlugSelect from './components/layout/SlugSelect.vue'
import IssueModal from './components/issue/IssueModal.vue'

export default {
    name: 'App',

    components: {
        Sidebar,
        AppHeader,
        AppAside,
        SlugSelect,
        IssueModal,
    },

    data: () => ({
        mediaQuery: null,
        sidebarOpen: false,
    }),

    computed: {
        ...mapState(usePlaneDataStore, ['loading', 'error', 'partialErrors', 'progress', 'issues']),
        ...mapState(useUiStore, ['theme', 'snackbar']),

        showGlobalLoader() {
            return this.loading && this.issues.length === 0 && !this.error
        },

        progressLabel() {
            if (!this.progress.total) return 'Conectando ao proxy...'
            return `${this.progress.phase}... (${this.progress.done}/${this.progress.total})`
        },
    },

    watch: {
        theme: {
            immediate: true,
            handler() {
                this.applyTheme()
            },
        },

        '$route.path'() {
            if (!this.$vuetify.display.mdAndUp) this.sidebarOpen = false
        },
    },

    created() {
        this.sidebarOpen = this.$vuetify.display.mdAndUp
    },

    methods: {
        ...mapActions(usePlaneDataStore, ['loadAll', 'refresh', 'clearError', 'clearPartialErrors']),
        ...mapActions(useUiStore, ['closeSnackbar']),

        applyTheme() {
            const prefersDark = this.mediaQuery ? this.mediaQuery.matches : false
            const resolved = this.theme === 'system' ? (prefersDark ? 'dark' : 'light') : this.theme
            if (this.$vuetify && this.$vuetify.theme && this.$vuetify.theme.global) {
                this.$vuetify.theme.global.name = resolved
            }
        },

        onMediaChange() {
            if (this.theme === 'system') this.applyTheme()
        },

        onSnackbarChange(value) {
            if (!value) this.closeSnackbar()
        },
    },

    mounted() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        this.mediaQuery.addEventListener('change', this.onMediaChange)
        this.applyTheme()
        this.loadAll()
    },

    beforeUnmount() {
        if (this.mediaQuery) this.mediaQuery.removeEventListener('change', this.onMediaChange)
    },
}
</script>

<style>
.v-application {
    font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-frame {
    display: flex;
    align-items: flex-start;
    min-height: 100vh;
}

.app-frame__content {
    flex: 1 1 auto;
    min-width: 0;
}

.app-frame__aside {
    display: none;
}

@media (min-width: 1280px) {
    .app-frame__aside {
        display: block;
        flex: 0 0 300px;
        width: 300px;
        position: sticky;
        top: 84px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        padding: 24px 20px 24px 0;
    }
}

.app-container {
    max-width: 1600px;
    margin: 0 auto;
}

.tone-card {
    background: rgba(var(--v-theme-on-surface), 0.02) !important;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

html .aside-card {
    padding: 20px;
}

.aside-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.aside-card__title {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.aside-card__menu {
    color: rgba(var(--v-theme-on-surface), 0.4);
}

.aside-card__empty {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    padding: 8px 0;
}

.aside-skeleton {
    background: transparent;
}

html .v-card {
    border-radius: 6px;
}

.v-theme--dark .v-card {
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.v-btn:not(.v-btn--icon) {
    border-radius: 6px;
}

html .v-chip {
    border-radius: 4px;
}

html .v-field {
    border-radius: 6px;
}

.v-theme--dark ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.v-theme--dark ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 8px;
}

.v-theme--dark ::-webkit-scrollbar-track {
    background: transparent;
}

.min-width-0 {
    min-width: 0;
}

.issue-description {
    font-size: 14px;
    line-height: 1.6;
    overflow-wrap: anywhere;
}

.issue-description img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
}

.issue-description a {
    color: rgb(var(--v-theme-primary));
}

.issue-description ul,
.issue-description ol {
    padding-left: 20px;
    margin: 8px 0;
}

.issue-description pre,
.issue-description code {
    background: rgba(var(--v-theme-on-surface), 0.06);
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 13px;
}

.issue-description table {
    border-collapse: collapse;
    width: 100%;
}

.issue-description td,
.issue-description th {
    border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
    padding: 4px 8px;
}

.issue-description blockquote {
    border-left: 3px solid rgba(var(--v-theme-on-surface), 0.25);
    margin: 8px 0;
    padding-left: 12px;
    color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
