import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createRouter, createWebHistory } from 'vue-router'
import AccountView from '@/views/AccountView.vue'
import { useUiStore } from '@/stores/ui'

function createMockClient() {
  return new ApolloClient({
    link: { request: vi.fn() } as any,
    cache: new InMemoryCache()
  })
}

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/account', component: AccountView }
  ]
})

vi.mock('@/generated/operations', () => ({
  useBindBggUsernameMutation: vi.fn(() => ({
    mutate: vi.fn(),
    loading: false,
    error: null
  }))
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    currentUser: {
      id: '1',
      username: 'alice',
      displayName: 'Alice',
      email: 'alice@example.com',
      bggUsername: 'alice_bgg'
    },
    isAuthenticated: true,
    signOut: vi.fn()
  }))
}))

function mountAccount() {
  const pinia = createPinia()
  setActivePinia(pinia)
  provideApolloClient(createMockClient())

  // Initialize store with light default
  const store = useUiStore()
  store.initializeTheme()

  return {
    wrapper: mount(AccountView, {
      global: {
        plugins: [pinia, mockRouter],
        stubs: {
          AppShell: { template: '<div><slot /></div>' },
          Icon: { template: '<span class="icon-stub" />' }
        }
      }
    }),
    store
  }
}

describe('AccountView Appearance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
    // Ensure each test starts with a fresh Pinia.
    const freshPinia = createPinia()
    setActivePinia(freshPinia)
  })

  it('renders the Appearance section with heading and helper text', () => {
    const { wrapper } = mountAccount()
    expect(wrapper.text()).toContain('Appearance')
    expect(wrapper.text()).toContain('Choose how the app looks.')
  })

  it('renders exactly three labelled choices: Light, Dark, System', () => {
    const { wrapper } = mountAccount()
    const items = wrapper.findAll('[data-slot="toggle-group-item"]')
    expect(items.length).toBe(3)
    expect(items[0].text()).toContain('Light')
    expect(items[1].text()).toContain('Dark')
    expect(items[2].text()).toContain('System')
  })

  it('has Light selected by default', () => {
    const { wrapper } = mountAccount()
    const items = wrapper.findAll('[data-slot="toggle-group-item"]')
    // In a single-select toggle group, the selected item has data-state="on"
    const selected = items.filter(item => item.attributes('data-state') === 'on')
    expect(selected.length).toBe(1)
    expect(selected[0].text()).toContain('Light')
  })

  it('selects Dark when clicked and persists the preference', () => {
    const { wrapper, store } = mountAccount()
    const items = wrapper.findAll('[data-slot="toggle-group-item"]')
    const darkItem = items[1]

    darkItem.trigger('click')

    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('boardgame-night:theme')).toBe('dark')
  })

  it('selects System when clicked', () => {
    const { wrapper, store } = mountAccount()
    const items = wrapper.findAll('[data-slot="toggle-group-item"]')
    const systemItem = items[2]

    systemItem.trigger('click')

    expect(store.theme).toBe('system')
    expect(localStorage.getItem('boardgame-night:theme')).toBe('system')
  })

  it('every toggle item has aria-label and meets 44px minimum touch target', () => {
    const { wrapper } = mountAccount()
    const items = wrapper.findAll('[data-slot="toggle-group-item"]')
    for (const item of items) {
      expect(item.attributes('aria-label')).toBeTruthy()
      const classes = item.classes()
      const hasMinH = classes.some((c: string) => c.includes('min-h-[44px]'))
      const hasMinW = classes.some((c: string) => c.includes('min-w-[44px]'))
      expect(hasMinH || hasMinW).toBe(true)
    }
  })

  it('renders icons within each toggle item', () => {
    const { wrapper } = mountAccount()
    const icons = wrapper.findAll('.icon-stub')
    expect(icons.length).toBe(3)
  })

  it('renders the Profile section with M3 semantic classes', () => {
    const { wrapper } = mountAccount()
    const profileSection = wrapper.findAll('.rounded-xl.border.border-outline.bg-surface-container')
    expect(profileSection.length).toBeGreaterThanOrEqual(1)
  })

  it('renders existing profile, binding, and logout sections', () => {
    const { wrapper } = mountAccount()
    expect(wrapper.text()).toContain('Profile')
    expect(wrapper.text()).toContain('Display name')
    expect(wrapper.text()).toContain('Bind BGG username')
    expect(wrapper.text()).toContain('Log out')
  })

  it('uses a fieldset with legend for group semantics, not radiogroup role', () => {
    const { wrapper } = mountAccount()
    // The Appearance control uses a native <fieldset>/<legend> for group semantics.
    const fieldset = wrapper.find('fieldset')
    expect(fieldset.exists()).toBe(true)
    const legend = fieldset.find('legend')
    expect(legend.text()).toBe('Appearance')
    // The inner ToggleGroup uses native group semantics (role="group" from reka-ui)
    // and must NOT claim radiogroup when children are toggle buttons.
    const group = wrapper.find('[data-slot="toggle-group"]')
    expect(group.attributes('role')).not.toBe('radiogroup')
  })

  it('clicking already-selected Light does not persist a falsy theme via the guard', async () => {
    const { wrapper, store } = mountAccount()
    const items = wrapper.findAll('[data-slot="toggle-group-item"]')

    // Store the initial state: theme is 'light' after initializeTheme.
    const before = store.theme
    expect(before).toBe('light')

    // Click the Light toggle again. In single-select mode this may deselect,
    // emitting undefined. The guard must prevent that from reaching setTheme.
    await items[0].trigger('click')

    // Theme must remain a valid non-falsy string regardless of reka-ui behavior.
    const after = store.theme
    expect(['light', 'dark', 'system']).toContain(after)
    expect(after).toBeTruthy()
  })

  it('prevents a falsy value when clicking an already-selected item', () => {
    const { wrapper, store } = mountAccount()
    const items = wrapper.findAll('[data-slot="toggle-group-item"]')

    // Select Dark explicitly
    items[1].trigger('click')
    expect(store.theme).toBe('dark')

    // Click the already-selected Dark item — guard must keep theme non-falsy
    items[1].trigger('click')
    expect(store.theme).toBeTruthy()
    expect(['light', 'dark', 'system']).toContain(store.theme)
  })
})
