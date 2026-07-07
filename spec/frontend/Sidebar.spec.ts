import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import { useCollectorsStore } from '@/stores/collectors'

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/collection', name: 'collection', component: { template: '<div />' } }
    ]
  })
}

async function mountSidebar(routeQuery = {}) {
  const router = createTestRouter()
  await router.push({ path: '/collection', query: routeQuery })
  await router.isReady()

  return mount(Sidebar, {
    global: {
      plugins: [router],
      stubs: { MemberAvatar: true }
    }
  })
}

describe('Sidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders add input and add button', async () => {
    const wrapper = await mountSidebar()
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('button').text()).toContain('Add')
  })

  it('adds a username to the collectors store when add is clicked', async () => {
    const wrapper = await mountSidebar()
    const input = wrapper.find('input')
    await input.setValue('alice')
    await wrapper.find('button').trigger('click')

    const store = useCollectorsStore()
    expect(store.usernames).toContain('alice')
  })

  it('removes a username when remove is clicked', async () => {
    const store = useCollectorsStore()
    store.add('alice')

    const wrapper = await mountSidebar({ usernames: 'alice' })
    await wrapper.find('button.text-red-600').trigger('click')

    expect(store.usernames).not.toContain('alice')
  })
})
