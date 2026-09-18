import { defineStore } from 'pinia'
import { getPlaneSlug, setPlaneSlug as applyPlaneSlug, isValidSlug } from '../services/planeApi.js'

const THEME_KEY = 'tm-theme'
const SLUGS_STORAGE_KEY = 'tm-plane-slugs'

function envSlugs() {
    return (import.meta.env.VITE_PLANE_SLUGS || '')
        .split(',')
        .map(slug => slug.trim())
        .filter(isValidSlug)
}

function storedSlugs() {
    try {
        const raw = JSON.parse(localStorage.getItem(SLUGS_STORAGE_KEY) || '[]')
        return Array.isArray(raw) ? raw.map(slug => String(slug).trim()).filter(isValidSlug) : []
    } catch {
        return []
    }
}

function initialSlugs() {
    return [...new Set([...envSlugs(), ...storedSlugs(), getPlaneSlug()])]
}

export const useUiStore = defineStore('ui', {
    state: () => ({
        theme: (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) || 'light',
        planeSlug: getPlaneSlug(),
        planeSlugs: initialSlugs(),
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
        setPlaneSlug(slug) {
            const next = applyPlaneSlug(slug)
            this.planeSlug = next
            this.addPlaneSlug(next)
            return next
        },
        addPlaneSlug(slug) {
            const normalized = String(slug || '').trim()
            if (!isValidSlug(normalized) || this.planeSlugs.includes(normalized)) return
            this.planeSlugs = [...this.planeSlugs, normalized]
            this.persistPlaneSlugs()
        },
        persistPlaneSlugs() {
            try {
                const fromEnv = envSlugs()
                const extras = this.planeSlugs.filter(slug => !fromEnv.includes(slug))
                localStorage.setItem(SLUGS_STORAGE_KEY, JSON.stringify(extras))
            } catch (err) {
                console.warn('Não foi possível persistir os slugs:', err)
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
