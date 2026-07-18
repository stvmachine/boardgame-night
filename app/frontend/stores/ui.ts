import { ref } from 'vue'
import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'boardgame-night:theme'
const ALLOWLIST: Theme[] = ['light', 'dark', 'system']

function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw && ALLOWLIST.includes(raw as Theme)) {
      return raw as Theme
    }
  } catch {
    /* localStorage unavailable — fall back to null */
  }
  return null
}

function resolvePreference(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return theme
}

function applyRoot(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = resolved
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* storage full or disabled — fail silently */
  }
}

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const theme = ref<Theme>('light')
  const resolvedTheme = ref<ResolvedTheme>('light')
  const filtersOpen = ref(true)
  const collectorsOpen = ref(true)

  let mediaQuery: MediaQueryList | null = null
  let mediaListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null = null

  /** Update resolvedTheme and root atomically from the current preference. */
  function syncResolved() {
    const resolved = resolvePreference(theme.value)
    resolvedTheme.value = resolved
    applyRoot(resolved)
  }

  function initializeTheme() {
    const stored = readStoredTheme()
    theme.value = stored ?? 'light'
    syncResolved()
    startSystemListenerIfNeeded()
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  function setTheme(value: Theme) {
    theme.value = value
    persistTheme(value)
    syncResolved()
    startSystemListenerIfNeeded()
  }

  function startSystemListenerIfNeeded() {
    if (mediaListener && mediaQuery) {
      mediaQuery.removeEventListener('change', mediaListener)
      mediaListener = null
      mediaQuery = null
    }

    if (theme.value === 'system' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaListener = (ev: MediaQueryListEvent) => {
        const resolved: ResolvedTheme = ev.matches ? 'dark' : 'light'
        resolvedTheme.value = resolved
        applyRoot(resolved)
      }
      mediaQuery.addEventListener('change', mediaListener)
    }
  }

  function destroyThemeListener() {
    if (mediaListener && mediaQuery) {
      mediaQuery.removeEventListener('change', mediaListener)
      mediaListener = null
      mediaQuery = null
    }
  }

  function toggleFilters() {
    filtersOpen.value = !filtersOpen.value
  }

  function toggleCollectors() {
    collectorsOpen.value = !collectorsOpen.value
  }

  return {
    sidebarOpen,
    theme,
    resolvedTheme,
    filtersOpen,
    collectorsOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    setTheme,
    toggleFilters,
    toggleCollectors,
    initializeTheme,
    destroyThemeListener
  }
})
