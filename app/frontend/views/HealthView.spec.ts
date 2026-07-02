import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { provideApolloClient } from '@vue/apollo-composable'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { ref } from 'vue'
import type { DeepMockProxy } from 'vitest'
import HealthView from './HealthView.vue'

// Mock the generated operations module so we control useHealthQuery
vi.mock('../generated/operations', () => ({
  useHealthQuery: vi.fn()
}))

import { useHealthQuery } from '../generated/operations'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'health', component: HealthView }]
})

function createMockClient() {
  return new ApolloClient({
    link: { request: vi.fn() } as any,
    cache: new InMemoryCache()
  })
}

function mountHealthView() {
  const client = createMockClient()
  setActivePinia(createPinia())
  provideApolloClient(client)
  return mount(HealthView, {
    global: {
      plugins: [mockRouter]
    }
  })
}

describe('HealthView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state with connecting copy', () => {
    vi.mocked(useHealthQuery).mockReturnValue({
      result: ref(undefined),
      loading: ref(true),
      error: ref(undefined)
    } as any)

    const wrapper = mountHealthView()
    expect(wrapper.text()).toContain('Connecting to server')
  })

  it('renders error state with server-unreachable copy', () => {
    vi.mocked(useHealthQuery).mockReturnValue({
      result: ref(undefined),
      loading: ref(false),
      error: ref(new Error('Network error'))
    } as any)

    const wrapper = mountHealthView()
    expect(wrapper.text()).toContain("Couldn't reach the server")
    expect(wrapper.text()).toContain('Make sure Rails is running on localhost:3000')
  })

  it('renders success state with Server Health heading and health value', () => {
    vi.mocked(useHealthQuery).mockReturnValue({
      result: ref({ health: 'ok' }),
      loading: ref(false),
      error: ref(undefined)
    } as any)

    const wrapper = mountHealthView()
    expect(wrapper.text()).toContain('Server Health')
    expect(wrapper.text()).toContain('ok')
  })
})
