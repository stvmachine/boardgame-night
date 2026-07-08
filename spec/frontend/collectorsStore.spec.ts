import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useCollectorsStore } from '@/stores/collectors'

const TestComponent = defineComponent({
  setup() {
    return { store: useCollectorsStore() }
  },
  template: '<div />'
})

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/collection', name: 'collection', component: { template: '<div />' } }
    ]
  })
}

async function createStoreWithRoute(query: Record<string, string> = {}) {
  const router = createTestRouter()
  await router.push({ path: '/collection', query })
  await router.isReady()

  setActivePinia(createPinia())
  const wrapper = mount(TestComponent, {
    global: { plugins: [router] }
  })

  return { store: wrapper.vm.store, router }
}

describe('collectors store URL sync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hydrates usernames from route.query.usernames', async () => {
    const { store } = await createStoreWithRoute({ usernames: 'alice,bob' })

    expect(store.usernames).toEqual(['alice', 'bob'])
  })

  it('ignores empty usernames and normalizes spacing', async () => {
    const { store } = await createStoreWithRoute({ usernames: ' Alice , BOB ' })

    expect(store.usernames).toEqual(['alice', 'bob'])
  })

  it('updates the URL when usernames are added', async () => {
    const { store, router } = await createStoreWithRoute({ usernames: 'alice' })

    store.add('bob')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(router.currentRoute.value.query.usernames).toBe('alice,bob')
  })

  it('removes usernames from the URL when cleared', async () => {
    const { store, router } = await createStoreWithRoute({ usernames: 'alice' })

    store.remove('alice')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(router.currentRoute.value.query.usernames).toBeUndefined()
  })

  it('allows set() to replace the full list and update the URL', async () => {
    const { store, router } = await createStoreWithRoute({ usernames: 'alice' })

    store.set(['bob', 'carol'])
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(store.usernames).toEqual(['bob', 'carol'])
    expect(router.currentRoute.value.query.usernames).toBe('bob,carol')
  })
})