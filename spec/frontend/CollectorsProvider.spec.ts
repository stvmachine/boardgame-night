import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useCollectorsStore } from '@/stores/collectors'
import CollectorsProvider from '@/components/providers/CollectorsProvider.vue'

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
      { path: '/collection', name: 'collection', component: { template: '<div />' } },
      { path: '/hot', name: 'hot', component: { template: '<div />' } }
    ]
  })
}

async function mountProvider(initialRoute: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createTestRouter()
  await router.push(initialRoute)
  await router.isReady()

  const Wrapper = defineComponent({
    components: { CollectorsProvider, TestComponent },
    template: '<CollectorsProvider><TestComponent /></CollectorsProvider>'
  })

  return mount(Wrapper, { global: { plugins: [pinia, router] } })
}

describe('CollectorsProvider', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hydrates usernames from route.query.usernames', async () => {
    const wrapper = await mountProvider('/collection?usernames=alice,bob')
    const store = wrapper.findComponent(TestComponent).vm.store

    expect(store.usernames).toEqual(['alice', 'bob'])
  })

  it('normalizes and ignores empty usernames from the URL', async () => {
    const wrapper = await mountProvider('/collection?usernames= Alice , BOB ,')
    const store = wrapper.findComponent(TestComponent).vm.store

    expect(store.usernames).toEqual(['alice', 'bob'])
  })

  it('updates the URL when usernames are added on the collection route', async () => {
    const wrapper = await mountProvider('/collection?usernames=alice')
    const store = wrapper.findComponent(TestComponent).vm.store

    store.add('bob')
    await flushPromises()

    expect(wrapper.vm.$router.currentRoute.value.query.usernames).toBe('alice,bob')
  })

  it('removes usernames from the URL when cleared on the collection route', async () => {
    const wrapper = await mountProvider('/collection?usernames=alice')
    const store = wrapper.findComponent(TestComponent).vm.store

    store.remove('alice')
    await flushPromises()

    expect(wrapper.vm.$router.currentRoute.value.query.usernames).toBeUndefined()
  })

  it('does not write usernames to the URL on non-collection routes', async () => {
    const wrapper = await mountProvider('/collection?usernames=alice')
    const store = wrapper.findComponent(TestComponent).vm.store

    await wrapper.vm.$router.push({ name: 'home' })
    store.add('bob')
    await flushPromises()

    expect(wrapper.vm.$router.currentRoute.value.query.usernames).toBeUndefined()
  })

  it('populates the store when navigating to a shared collection link', async () => {
    const wrapper = await mountProvider('/')
    const store = wrapper.findComponent(TestComponent).vm.store
    expect(store.usernames).toEqual([])

    await wrapper.vm.$router.push({ path: '/collection', query: { usernames: 'alice,bob' } })
    await flushPromises()

    expect(store.usernames).toEqual(['alice', 'bob'])
  })
})
