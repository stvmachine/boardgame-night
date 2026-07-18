import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore, THEME_STORAGE_KEY } from '@/stores/ui'
import type { Theme } from '@/stores/ui'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  vi.restoreAllMocks()
})

describe('uiStore theme', () => {
  it('defaults to light when no stored preference exists', () => {
    const store = useUiStore()
    store.initializeTheme()
    expect(store.theme).toBe('light')
    expect(store.resolvedTheme).toBe('light')
  })

  it('defaults to light when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    const store = useUiStore()
    store.initializeTheme()
    expect(store.theme).toBe('light')
  })

  it('defaults to light when stored value is invalid', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid-value')
    const store = useUiStore()
    store.initializeTheme()
    expect(store.theme).toBe('light')
  })

  it('reads stored dark preference and applies root class', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const store = useUiStore()
    store.initializeTheme()
    expect(store.theme).toBe('dark')
    expect(store.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('reads stored light preference and keeps root light', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    const store = useUiStore()
    store.initializeTheme()
    expect(store.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('setTheme persists to localStorage and updates root', () => {
    const store = useUiStore()
    store.initializeTheme()
    store.setTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(store.theme).toBe('dark')
    expect(store.resolvedTheme).toBe('dark')
  })

  it('setTheme light removes dark class and sets light color-scheme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const store = useUiStore()
    store.initializeTheme()
    store.setTheme('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('setTheme system does not persist dark/light but uses matchMedia', () => {
    // Simulate dark system preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    })
    const store = useUiStore()
    store.initializeTheme()
    store.setTheme('system')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    expect(store.theme).toBe('system')
    expect(store.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('repeated initializeTheme does not multiply listeners', () => {
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener,
        removeEventListener
      }))
    })
    const store = useUiStore()
    // Start with system theme, then initialize twice
    store.setTheme('system')
    addEventListener.mockClear()
    removeEventListener.mockClear()
    store.initializeTheme()
    // After first initializeTheme: old listener cleaned up, new one added
    expect(removeEventListener).toHaveBeenCalledTimes(1)
    expect(addEventListener).toHaveBeenCalledTimes(1)
    store.initializeTheme()
    // After second: old listener cleaned up again, only one new one added
    expect(removeEventListener).toHaveBeenCalledTimes(2)
    expect(addEventListener).toHaveBeenCalledTimes(2)
  })

  it('destroyThemeListener removes the media listener', () => {
    const removeEventListener = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener
      }))
    })
    const store = useUiStore()
    store.setTheme('system')
    store.destroyThemeListener()
    expect(removeEventListener).toHaveBeenCalled()
  })

  it('persists theme when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    const store = useUiStore()
    store.initializeTheme()
    // Should not throw; falls back silently
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('live System media change updates resolvedTheme and root state', () => {
    const captured: Array<(ev: MediaQueryListEvent) => void> = []
    const addEventListener = vi.fn((_type: string, cb: (ev: MediaQueryListEvent) => void) => {
      captured.push(cb)
    })
    const removeEventListener = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,  // start with light OS preference
        addEventListener,
        removeEventListener
      }))
    })
    const store = useUiStore()
    store.setTheme('system')

    // Initially light because matchMedia matches === false
    expect(store.resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')

    // Simulate OS switching to dark
    captured[0]({ matches: true } as MediaQueryListEvent)

    expect(store.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    // Simulate OS switching back to light
    captured[0]({ matches: false } as MediaQueryListEvent)

    expect(store.resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('side effects (sidebar, filters, collectors) remain unchanged', () => {
    const store = useUiStore()
    expect(store.sidebarOpen).toBe(false)
    store.toggleSidebar()
    expect(store.sidebarOpen).toBe(true)
    store.closeSidebar()
    expect(store.sidebarOpen).toBe(false)
    store.openSidebar()
    expect(store.sidebarOpen).toBe(true)
    expect(store.filtersOpen).toBe(true)
    store.toggleFilters()
    expect(store.filtersOpen).toBe(false)
    expect(store.collectorsOpen).toBe(true)
    store.toggleCollectors()
    expect(store.collectorsOpen).toBe(false)
  })
})
