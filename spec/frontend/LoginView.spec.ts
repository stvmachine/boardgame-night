import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import LoginView from '@/views/LoginView.vue'

function createMockClient() {
  return new ApolloClient({
    link: { request: vi.fn() } as any,
    cache: new InMemoryCache()
  })
}

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: LoginView },
      { path: '/collection', name: 'collection', component: { template: '<div />' } },
      { path: '/account', name: 'account', component: { template: '<div />' }, meta: { requiresAuth: true } }
    ]
  })
}

async function mountLoginView(routeQuery: Record<string, string> = {}) {
  const router = createTestRouter()
  await router.push({ path: '/login', query: routeQuery })
  await router.isReady()
  provideApolloClient(createMockClient())
  return mount(LoginView, { global: { plugins: [router] } })
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders email and password inputs and a submit button', async () => {
    const wrapper = await mountLoginView()
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('renders a link to signup', async () => {
    const wrapper = await mountLoginView()
    const link = wrapper.find('a[href="/signup"]')
    expect(link.exists()).toBe(true)
  })
})