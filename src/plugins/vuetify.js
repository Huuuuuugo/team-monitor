import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { pt } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi },
    },
    locale: {
        locale: 'pt-BR',
        fallback: 'en',
        messages: { 'pt-BR': pt },
    },
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#4f46e5',
                    secondary: '#6b7280',
                    success: '#22c55e',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                    background: '#f8f9fa',
                    surface: '#ffffff',
                    'surface-variant': '#eceef2',
                },
            },
            dark: {
                colors: {
                    primary: '#3b6ef6',
                    secondary: '#7a7a85',
                    success: '#22c55e',
                    warning: '#f59e0b',
                    error: '#f43f5e',
                    info: '#3b6ef6',
                    background: '#050506',
                    surface: '#0a0a0b',
                    'surface-variant': '#17171a',
                    'on-surface': '#c9c9ce',
                    'on-background': '#c9c9ce',
                },
            },
        },
    },
})
