import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'

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
    { path: '/collection', component: { template: '<div>Collection</div>' } },
    { path: '/hot', component: { template: '<div>Hot</div>' } },
    { path: '/groups', component: { template: '<div>Groups</div>' } },
    { path: '/account', component: { template: '<div>Account</div>' } }
  ]
})

function mountAppShell() {
  setActivePinia(createPinia())
  provideApolloClient(createMockClient())
  return mount(AppShell, {
    slots: {
      default: '<div data-testid="main-content">Main</div>'
    },
    global: {
      plugins: [mockRouter]
    }
  })
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders desktop sidebar and main content area', () => {
    const wrapper = mountAppShell()

    expect(wrapper.find('[data-testid="desktop-sidebar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="main-content"]').exists()).toBe(true)
  })

  it('shows mobile navigation toggle', () => {
    const wrapper = mountAppShell()

    expect(wrapper.find('[aria-label="Open navigation"]').exists()).toBe(true)
  })
})
