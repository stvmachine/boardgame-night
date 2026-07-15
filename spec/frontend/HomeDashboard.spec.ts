import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

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
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/hot', component: { template: '<div>Hot</div>' } }
  ]
})

function mountHomeView() {
  setActivePinia(createPinia())
  provideApolloClient(createMockClient())
  return mount(HomeView, {
    global: {
      plugins: [mockRouter]
    }
  })
}

describe('Home dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the exact merge hero and signed-out stats prompt', () => {
    const wrapper = mountHomeView()

    expect(wrapper.find('h1').text()).toContain('Merge board game collections')
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('Merge collections'))).toBe(true)
    expect(wrapper.text()).toContain('Sign in to see your stats')
  })
})
