import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache, ApolloLink, Observable } from '@apollo/client/core'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

interface Stats {
  collectionCount: number
  groupCount: number
  sessionCount: number
}

function createMockLink(stats: Stats | null = null) {
  return new ApolloLink((operation) => {
    const data = operation.operationName === 'DashboardStats'
      ? { dashboardStats: stats }
      : { hotItems: [] }
    return Observable.of({ data })
  })
}

function createMockClient(stats?: Stats) {
  return new ApolloClient({
    link: createMockLink(stats ?? null),
    cache: new InMemoryCache()
  })
}

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/collection', component: { template: '<div>Collection</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/hot', component: { template: '<div>Hot</div>' } }
  ]
})

async function mountHomeView(stats?: Stats) {
  setActivePinia(createPinia())
  provideApolloClient(createMockClient(stats))
  const wrapper = mount(HomeView, {
    global: {
      plugins: [mockRouter]
    }
  })
  await flushPromises()
  return wrapper
}

describe('Home dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the exact merge hero and signed-out stats prompt', async () => {
    const wrapper = await mountHomeView()

    expect(wrapper.find('h1').text()).toContain('Merge board game collections')
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('Merge collections'))).toBe(true)
    expect(wrapper.text()).toContain('Sign in to see your stats')
  })

  it('renders signed-in dashboard stats', async () => {
    const wrapper = await mountHomeView({ collectionCount: 42, groupCount: 3, sessionCount: 7 })

    await flushPromises()

    expect(wrapper.text()).toContain('Games in your collection')
    expect(wrapper.text()).toContain('Groups')
    expect(wrapper.text()).toContain('Nights')
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('7')
  })
})
