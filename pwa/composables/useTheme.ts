import { ref, computed, watchEffect } from 'vue'

export interface Theme {
    id: string
    name: string
    icon: string
    colors: {
        primary: string
        secondary: string
        accent: string
        background: string
        surface: string
        gradientFrom: string
        gradientTo: string
    }
}

const THEMES: Theme[] = [
    {
        id: 'default',
        name: 'Cosmic',
        icon: '🌌',
        colors: {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#EC4899',
            background: '#0f0f1a',
            surface: '#1a1a2e',
            gradientFrom: '#3B82F6',
            gradientTo: '#8B5CF6'
        }
    },
    {
        id: 'ocean',
        name: 'Ocean',
        icon: '🌊',
        colors: {
            primary: '#06B6D4',
            secondary: '#0891B2',
            accent: '#22D3EE',
            background: '#0c1a1f',
            surface: '#164e63',
            gradientFrom: '#06B6D4',
            gradientTo: '#0891B2'
        }
    },
    {
        id: 'sunset',
        name: 'Sunset',
        icon: '🌅',
        colors: {
            primary: '#F97316',
            secondary: '#EC4899',
            accent: '#FBBF24',
            background: '#1a0f0f',
            surface: '#2e1a1a',
            gradientFrom: '#F97316',
            gradientTo: '#EC4899'
        }
    },
    {
        id: 'forest',
        name: 'Forest',
        icon: '🌲',
        colors: {
            primary: '#22C55E',
            secondary: '#10B981',
            accent: '#84CC16',
            background: '#0f1a0f',
            surface: '#1a2e1a',
            gradientFrom: '#22C55E',
            gradientTo: '#10B981'
        }
    },
    {
        id: 'midnight',
        name: 'Midnight',
        icon: '🌙',
        colors: {
            primary: '#A855F7',
            secondary: '#7C3AED',
            accent: '#C084FC',
            background: '#0f0f1a',
            surface: '#1e1a2e',
            gradientFrom: '#A855F7',
            gradientTo: '#7C3AED'
        }
    }
]

const currentThemeId = ref('default')

export function useTheme() {
    const currentTheme = computed(() =>
        THEMES.find(t => t.id === currentThemeId.value) || THEMES[0]
    )

    function setTheme(themeId: string) {
        const theme = THEMES.find(t => t.id === themeId)
        if (!theme) return

        currentThemeId.value = themeId

        // Save preference
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ilytat-theme', themeId)
        }

        // Apply CSS variables
        applyTheme(theme)
    }

    function applyTheme(theme: Theme) {
        const root = document.documentElement
        root.style.setProperty('--color-primary', theme.colors.primary)
        root.style.setProperty('--color-secondary', theme.colors.secondary)
        root.style.setProperty('--color-accent', theme.colors.accent)
        root.style.setProperty('--color-background', theme.colors.background)
        root.style.setProperty('--color-surface', theme.colors.surface)
        root.style.setProperty('--color-gradient-from', theme.colors.gradientFrom)
        root.style.setProperty('--color-gradient-to', theme.colors.gradientTo)
    }

    function initTheme() {
        // Load saved preference
        if (typeof localStorage !== 'undefined') {
            const savedTheme = localStorage.getItem('ilytat-theme')
            if (savedTheme && THEMES.find(t => t.id === savedTheme)) {
                currentThemeId.value = savedTheme
            }
        }
        applyTheme(currentTheme.value)
    }

    return {
        themes: THEMES,
        currentTheme,
        currentThemeId,
        setTheme,
        initTheme
    }
}
