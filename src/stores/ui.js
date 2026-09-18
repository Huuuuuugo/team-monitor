import { defineStore } from 'pinia'

const THEME_KEY = 'tm-theme'

export const useUiStore = defineStore('ui', {
    state: () => ({
        theme: (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) || 'light',
        selectedIssue: null,
        isModalOpen: false,
        listFilters: {
            search: '',
            projectId: null,
            memberId: null,
            stateName: null,
            priority: null,
        },
        listSort: { field: 'created_at', direction: 'desc' },
        listPage: 1,
        snackbar: { show: false, message: '', color: 'success' },
    }),

    actions: {
        openModal(issue) {
            this.selectedIssue = issue
            this.isModalOpen = true
        },
        closeModal() {
            this.isModalOpen = false
            this.selectedIssue = null
        },
        setTheme(theme) {
            this.theme = theme
            try {
                localStorage.setItem(THEME_KEY, theme)
            } catch (err) {
                console.warn('Não foi possível persistir o tema:', err)
            }
        },
        resetListFilters() {
            this.listFilters = {
                search: '',
                projectId: null,
                memberId: null,
                stateName: null,
                priority: null,
            }
            this.listPage = 1
        },
        showSnackbar(message, color = 'success') {
            this.snackbar = { show: true, message, color }
        },
        closeSnackbar() {
            this.snackbar = { ...this.snackbar, show: false }
        },
    },
})
