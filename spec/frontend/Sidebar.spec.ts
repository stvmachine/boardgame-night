import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'
import CollectionFilters from '@/components/collection/CollectionFilters.vue'
import { useCollectorsStore } from '@/stores/collectors'
import { useFilterStore } from '@/stores/filters'

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

  it('renders Filters and Collectors collapsible sections', async () => {
    const wrapper = await mountSidebar()
    const sections = wrapper.findAllComponents(CollapsibleSection)

    expect(sections).toHaveLength(2)
    const titles = sections.map((section) => section.props('title'))
    expect(titles).toContain('Filters')
    expect(titles).toContain('Collectors')
  })

  it('renders CollectionFilters inside the Filters section', async () => {
    const wrapper = await mountSidebar()
    expect(wrapper.findComponent(CollectionFilters).exists()).toBe(true)
  })

  it('shows an active-filter badge on the Filters header when filters are active', async () => {
    const wrapper = await mountSidebar()
    const filterStore = useFilterStore()
    filterStore.query = 'catan'
    await nextTick()

    const badge = wrapper.find('[data-testid="active-filter-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('1')
  })

  it('shows a Clear filters action when filters are active', async () => {
    const wrapper = await mountSidebar()
    const filterStore = useFilterStore()
    filterStore.query = 'catan'
    await nextTick()

    expect(wrapper.find('[data-testid="clear-filters"]').exists()).toBe(true)
  })

  it('clears filters when Clear filters is clicked', async () => {
    const wrapper = await mountSidebar()
    const filterStore = useFilterStore()
    filterStore.query = 'catan'
    filterStore.playerCount = 4
    await nextTick()

    await wrapper.find('[data-testid="clear-filters"]').trigger('click')

    expect(filterStore.query).toBe('')
    expect(filterStore.playerCount).toBeNull()
  })
})
