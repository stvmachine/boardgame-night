import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'
import { usePermalink } from '@/composables/usePermalink'
import { useCollectorsStore } from '@/stores/collectors'
import { useFilterStore } from '@/stores/filters'

const TestComponent = defineComponent({
  setup() {
    usePermalink()
    return {}
  },
  template: '<div />'
})

function setUrl(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true
  })
}

describe('usePermalink', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setUrl('')
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  it('hydrates selectedOwners from owners query param', () => {
    setUrl('?owners=alice,bob')
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob', 'carol'])

    mount(TestComponent)

    const filterStore = useFilterStore()
    expect(filterStore.selectedOwners.has('alice')).toBe(true)
    expect(filterStore.selectedOwners.has('bob')).toBe(true)
    expect(filterStore.selectedOwners.has('carol')).toBe(false)
  })

  it('selects all collectors when owners param is absent', () => {
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob'])

    mount(TestComponent)

    const filterStore = useFilterStore()
    expect(filterStore.selectedOwners).toEqual(new Set(['alice', 'bob']))
  })

  it('hydrates filter state from query params', () => {
    setUrl('?q=wingspan&players=4&time=2&complexity=3&ratingMin=7&sort=rating_desc&group=player_count')

    mount(TestComponent)

    const filterStore = useFilterStore()
    expect(filterStore.query).toBe('wingspan')
    expect(filterStore.playerCount).toBe(4)
    expect(filterStore.timeBucket).toBe(2)
    expect(filterStore.complexityBucket).toBe(3)
    expect(filterStore.ratingMin).toBe(7)
    expect(filterStore.sort).toBe('rating_desc')
    expect(filterStore.groupBy).toBe('player_count')
  })

  it('serializes selected owners to URL when subset is selected', async () => {
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob', 'carol'])

    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.selectedOwners = new Set(['alice'])

    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).toContain('owners=alice')
  })

  it('omits owners param when all collectors are selected', async () => {
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob'])

    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.selectedOwners = new Set(['alice', 'bob'])

    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).not.toContain('owners=')
  })

  it('serializes non-default filter state to URL', async () => {
    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.query = 'azul'
    filterStore.playerCount = 3
    filterStore.sort = 'rating_desc'
    filterStore.groupBy = 'complexity'

    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).toContain('q=azul')
    expect(lastUrl).toContain('players=3')
    expect(lastUrl).toContain('sort=rating_desc')
    expect(lastUrl).toContain('group=complexity')
  })

  it('omits default sort and group values from URL', async () => {
    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.sort = 'name_asc'
    filterStore.groupBy = 'none'

    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).not.toContain('sort=')
    expect(lastUrl).not.toContain('group=')
  })
})
