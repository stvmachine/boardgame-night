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
    setUrl('?q=wingspan&players=4&time=2&complexity=3&ratingMin=7&sort=rating_desc&groupBy=players')

    mount(TestComponent)

    const filterStore = useFilterStore()
    expect(filterStore.query).toBe('wingspan')
    expect(filterStore.playerCount).toBe(4)
    expect(filterStore.timeBucket).toBe(2)
    expect(filterStore.complexityBucket).toBe(3)
    expect(filterStore.ratingMin).toBe(7)
    expect(filterStore.sort).toBe('rating_desc')
    expect(filterStore.groupBy).toBe('players')
  })

  it.each(['players', 'rating', 'bestPlayers', 'owner'] as const)(
    'hydrates legacy grouping value %s from group param and maps to groupBy',
    (value) => {
      setUrl(`?group=${value}`)

      mount(TestComponent)

      const filterStore = useFilterStore()
      expect(filterStore.groupBy).toBe(value)
    }
  )

  it('treats non-legacy group value as a reserved group token, not grouping', () => {
    setUrl('?group=NIGHTOWLS')

    mount(TestComponent)

    const filterStore = useFilterStore()
    expect(filterStore.groupBy).toBe('none')
  })

  it('serializes grouping to groupBy, not group', async () => {
    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.groupBy = 'players'

    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).toContain('groupBy=players')
    expect(lastUrl).not.toContain('group=')
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
    expect(lastUrl).toContain('groupBy=complexity')
    expect(lastUrl).not.toContain('group=')
  })

  it('omits default sort and groupBy values from URL', async () => {
    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.sort = 'name_asc'
    filterStore.groupBy = 'none'

    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).not.toContain('sort=')
    expect(lastUrl).not.toContain('groupBy=')
    expect(lastUrl).not.toContain('group=')
  })

  it('preserves a real group token while writing every filter family', async () => {
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob', 'carol'])

    setUrl('?group=NIGHTOWLS')
    mount(TestComponent)

    const filterStore = useFilterStore()
    const writes = [
      () => { filterStore.query = 'catan' },
      () => { filterStore.playerCount = 4 },
      () => { filterStore.timeBucket = 2 },
      () => { filterStore.complexityBucket = 3 },
      () => { filterStore.ratingMin = 7 },
      () => { filterStore.sort = 'rating_desc' },
      () => { filterStore.groupBy = 'players' },
      () => { filterStore.selectedOwners = new Set(['alice']) },
      () => { filterStore.clearFilters() }
    ]

    for (const write of writes) {
      write()
      await nextTick()
      const calls = vi.mocked(window.history.replaceState).mock.calls
      const lastUrl = String(calls[calls.length - 1]?.[2])
      expect(lastUrl).toContain('group=NIGHTOWLS')
    }
  })

  it('migrates legacy group param to groupBy on the next write', async () => {
    setUrl('?group=players')
    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.query = 'azul'
    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).toContain('groupBy=players')
    expect(lastUrl).not.toContain('group=players')
    expect(lastUrl).not.toContain('group=owner')
    expect(lastUrl).toContain('q=azul')
  })

  it('does not remove a real group token when defaulting filters', async () => {
    setUrl('?group=NIGHTOWLS&players=4')
    mount(TestComponent)

    const filterStore = useFilterStore()
    filterStore.playerCount = null
    await nextTick()

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).toContain('group=NIGHTOWLS')
    expect(lastUrl).not.toContain('players=')
  })

  it('keeps collector-owner synchronization from discarding the group token', async () => {
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob'])

    setUrl('?group=NIGHTOWLS')
    mount(TestComponent)

    collectorsStore.set(['alice', 'bob', 'dave'])
    await nextTick()

    const filterStore = useFilterStore()
    expect(filterStore.selectedOwners).toEqual(new Set(['alice', 'bob']))

    const calls = vi.mocked(window.history.replaceState).mock.calls
    const lastUrl = String(calls[calls.length - 1]?.[2])
    expect(lastUrl).toContain('group=NIGHTOWLS')
  })
})
