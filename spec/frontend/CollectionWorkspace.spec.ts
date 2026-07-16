import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import TimeBucketCheckboxes from '@/components/collection/TimeBucketCheckboxes.vue'
import ComplexityToggleGroup from '@/components/collection/ComplexityToggleGroup.vue'
import OwnerAvatarToggles from '@/components/collection/OwnerAvatarToggles.vue'
import CollectionFilterPanel from '@/components/collection/CollectionFilterPanel.vue'
import ActiveFilterChips from '@/components/collection/ActiveFilterChips.vue'
import PlayerRangeSlider from '@/components/collection/PlayerRangeSlider.vue'
import { useFilterStore } from '@/stores/filters'
import { useCollectorsStore } from '@/stores/collectors'
import { TIME_BUCKETS } from '@/composables/useCollectionFilters'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

describe('TimeBucketCheckboxes', () => {
  function mountCheckboxes(modelValue: Set<number> = new Set()) {
    const onUpdate = vi.fn()
    return {
      wrapper: mount(TimeBucketCheckboxes, {
        props: {
          modelValue,
          'onUpdate:modelValue': onUpdate
        }
      }),
      onUpdate
    }
  }

  it('renders six time bucket labels with full text targets', () => {
    const { wrapper } = mountCheckboxes()
    for (const bucket of TIME_BUCKETS) {
      const label = wrapper.find(`label[for="time-bucket-${bucket.value}"]`)
      expect(label.exists()).toBe(true)
      expect(label.text()).toContain(bucket.label)
    }
  })

  it('toggles a bucket value independently', async () => {
    const { wrapper, onUpdate } = mountCheckboxes()
    const checkbox = wrapper.find('[data-slot="checkbox"]')
    await checkbox.trigger('click')

    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
    expect(lastCall).toBeInstanceOf(Set)
    expect(lastCall.has(TIME_BUCKETS[0].value)).toBe(true)
  })

  it('supports multiple selections with OR semantics', async () => {
    const { wrapper, onUpdate } = mountCheckboxes(new Set([TIME_BUCKETS[0].value]))
    const checkboxes = wrapper.findAll('[data-slot="checkbox"]')
    await checkboxes[1].trigger('click')

    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
    expect(lastCall.has(TIME_BUCKETS[0].value)).toBe(true)
    expect(lastCall.has(TIME_BUCKETS[1].value)).toBe(true)
  })

  it('unchecks an already selected bucket', async () => {
    const { wrapper, onUpdate } = mountCheckboxes(new Set([TIME_BUCKETS[0].value]))
    const checkbox = wrapper.find('[data-slot="checkbox"]')
    await checkbox.trigger('click')

    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
    expect(lastCall.has(TIME_BUCKETS[0].value)).toBe(false)
  })
})

describe('ComplexityToggleGroup', () => {
  function mountGroup(modelValue: number | null = null) {
    const onUpdate = vi.fn()
    return {
      wrapper: mount(ComplexityToggleGroup, {
        props: {
          modelValue,
          'onUpdate:modelValue': onUpdate
        }
      }),
      onUpdate
    }
  }

  it('renders Any, Light, Medium, Heavy options', () => {
    const { wrapper } = mountGroup()
    const buttons = wrapper.findAll('[data-slot="toggle-group-item"]')
    expect(buttons.length).toBe(4)
    expect(buttons[0].text()).toBe('Any')
    expect(buttons[1].text()).toBe('Light')
    expect(buttons[2].text()).toBe('Medium')
    expect(buttons[3].text()).toBe('Heavy')
  })

  it('selects Light and emits value 1', async () => {
    const { wrapper, onUpdate } = mountGroup()
    const buttons = wrapper.findAll('[data-slot="toggle-group-item"]')
    await buttons[1].trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(1)
  })

  it('selects Any (null) from an active selection', async () => {
    const { wrapper, onUpdate } = mountGroup(2)
    const buttons = wrapper.findAll('[data-slot="toggle-group-item"]')
    await buttons[0].trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(null)
  })

  it('exposes a single selected button with aria-pressed', () => {
    const { wrapper } = mountGroup(2)
    const buttons = wrapper.findAll('[data-slot="toggle-group-item"]')
    const pressed = buttons.filter(b => b.attributes('aria-pressed') === 'true')
    expect(pressed.length).toBe(1)
    expect(pressed[0].text()).toBe('Medium')
  })
})

describe('OwnerAvatarToggles', () => {
  const owners = ['alice', 'bob', 'carol']

  function mountToggles(modelValue: Set<string> = new Set()) {
    const onUpdate = vi.fn()
    return {
      wrapper: mount(OwnerAvatarToggles, {
        props: {
          modelValue,
          owners,
          'onUpdate:modelValue': onUpdate
        }
      }),
      onUpdate
    }
  }

  it('renders a button per owner with avatar and username', () => {
    const { wrapper } = mountToggles(new Set(owners))
    const buttons = wrapper.findAll('[aria-pressed]')
    expect(buttons.length).toBe(3)
    for (const username of owners) {
      expect(wrapper.text()).toContain(username)
    }
  })

  it('toggles an owner on click', async () => {
    const { wrapper, onUpdate } = mountToggles(new Set(['alice']))
    const buttons = wrapper.findAll('[aria-pressed]')
    await buttons[1].trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(new Set(['alice', 'bob']))
  })

  it('selects all owners', async () => {
    const { wrapper, onUpdate } = mountToggles(new Set(['alice']))
    await wrapper.find('button[aria-label="Select all owners"]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(new Set(owners))
  })

  it('clears all owners', async () => {
    const { wrapper, onUpdate } = mountToggles(new Set(owners))
    await wrapper.find('button[aria-label="Clear owners"]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(new Set())
  })

  it('exposes aria-pressed matching the selection state', () => {
    const { wrapper } = mountToggles(new Set(['alice', 'carol']))
    const buttons = wrapper.findAll('[aria-pressed]')
    expect(buttons[0].attributes('aria-pressed')).toBe('true')
    expect(buttons[1].attributes('aria-pressed')).toBe('false')
    expect(buttons[2].attributes('aria-pressed')).toBe('true')
  })
})

describe('CollectionFilterPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob'])
  })

  function mountPanel() {
    return mount(CollectionFilterPanel)
  }

  it('renders filter sections in exact Search → Owners → Players → Playing time → Complexity order', () => {
    const wrapper = mountPanel()
    const legends = wrapper.findAll('legend')
    const labels = legends.map(l => l.text())
    expect(labels).toEqual(['Search', 'Owners', 'Players', 'Playing time', 'Complexity'])
  })

  it('binds the search input to the filter store', async () => {
    const wrapper = mountPanel()
    const input = wrapper.find('input[id="filter-search"]')
    await input.setValue('wingspan')
    await nextTick()

    const store = useFilterStore()
    expect(store.query).toBe('wingspan')
  })

  it('binds complexity to the filter store', async () => {
    const wrapper = mountPanel()
    const buttons = wrapper.findAll('[data-slot="toggle-group-item"]')
    await buttons[3].trigger('click') // Heavy
    await nextTick()

    const store = useFilterStore()
    expect(store.complexityBucket).toBe(3)
  })

  it('binds time buckets to the filter store with OR semantics', async () => {
    const wrapper = mountPanel()
    const checkboxes = wrapper.findAll('[data-slot="checkbox"]')
    await checkboxes[0].trigger('click')
    await checkboxes[2].trigger('click')
    await nextTick()

    const store = useFilterStore()
    expect(store.selectedTimeBuckets.has(1)).toBe(true)
    expect(store.selectedTimeBuckets.has(3)).toBe(true)
  })
})

describe('PlayerRangeSlider', () => {
  function mountSlider(modelValue: { min: number; max: number } | null = null) {
    const onUpdate = vi.fn()
    return {
      wrapper: mount(PlayerRangeSlider, {
        props: {
          modelValue,
          'onUpdate:modelValue': onUpdate
        }
      }),
      onUpdate
    }
  }

  it('renders the current player range label', () => {
    const { wrapper } = mountSlider({ min: 3, max: 6 })
    expect(wrapper.text()).toContain('3–6 players')
  })

  it('renders 10+ label when the maximum is 10', () => {
    const { wrapper } = mountSlider({ min: 5, max: 10 })
    expect(wrapper.text()).toContain('5–10+ players')
  })

  it('emits null when the reset button is clicked', async () => {
    const { wrapper, onUpdate } = mountSlider({ min: 3, max: 6 })
    await wrapper.find('button[aria-label="Clear player range"]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(null)
  })
})

describe('ActiveFilterChips', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const collectorsStore = useCollectorsStore()
    collectorsStore.set(['alice', 'bob', 'carol'])
  })

  function mountChips() {
    return mount(ActiveFilterChips)
  }

  it('renders no chips when filters are default', () => {
    const wrapper = mountChips()
    expect(wrapper.find('[data-slot="active-filter-chips"]').exists()).toBe(false)
  })

  it('renders a search chip and removes it', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.query = 'wingspan'
    await nextTick()
    expect(wrapper.text()).toContain('Search: wingspan')
    await wrapper.find('[data-testid="remove-search"]').trigger('click')
    expect(store.query).toBe('')
  })

  it('renders a player range chip and removes it', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.playerRange = { min: 3, max: 6 }
    await nextTick()
    expect(wrapper.text()).toContain('Players: 3–6')
    await wrapper.find('[data-testid="remove-player-range"]').trigger('click')
    expect(store.playerRange).toBeNull()
  })

  it('renders a 10+ label when the player range max is 10', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.playerRange = { min: 1, max: 10 }
    await nextTick()
    expect(wrapper.text()).toContain('Players: 1–10+')
  })

  it('renders a time bucket chip per selected bucket and removes it', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.selectedTimeBuckets = new Set([1])
    await nextTick()
    expect(wrapper.text()).toContain('Time: ≤30 min')
    await wrapper.find('[data-testid="remove-time-1"]').trigger('click')
    expect(store.selectedTimeBuckets.has(1)).toBe(false)
  })

  it('renders a complexity chip and removes it', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.complexityBucket = 2
    await nextTick()
    expect(wrapper.text()).toContain('Complexity: Medium')
    await wrapper.find('[data-testid="remove-complexity"]').trigger('click')
    expect(store.complexityBucket).toBeNull()
  })

  it('renders owner chips only when a subset is selected and removes them', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.selectedOwners = new Set(['alice', 'bob'])
    await nextTick()
    expect(wrapper.text()).toContain('Owner: alice')
    expect(wrapper.text()).toContain('Owner: bob')
    expect(wrapper.text()).not.toContain('Owner: carol')
    await wrapper.find('[data-testid="remove-owner-alice"]').trigger('click')
    expect(store.selectedOwners.has('alice')).toBe(false)
  })

  it('does not render owner chips when all collectors are selected', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.selectedOwners = new Set(['alice', 'bob', 'carol'])
    await nextTick()
    expect(wrapper.find('[data-slot="active-filter-chips"]').exists()).toBe(false)
  })

  it('does not render owner chips when no owners are selected', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.selectedOwners = new Set()
    await nextTick()
    expect(wrapper.find('[data-slot="active-filter-chips"]').exists()).toBe(false)
  })

  it('clears all filter restrictions while preserving sort, grouping, and view', async () => {
    const wrapper = mountChips()
    const store = useFilterStore()
    store.query = 'wingspan'
    store.playerRange = { min: 3, max: 6 }
    store.selectedTimeBuckets = new Set([1])
    store.complexityBucket = 2
    store.selectedOwners = new Set(['alice'])
    store.sort = 'rating_desc'
    store.groupBy = 'players'
    store.view = 'list'
    await nextTick()

    await wrapper.find('[data-testid="clear-all-filters"]').trigger('click')

    expect(store.query).toBe('')
    expect(store.playerRange).toBeNull()
    expect(store.selectedTimeBuckets.size).toBe(0)
    expect(store.complexityBucket).toBeNull()
    expect(store.selectedOwners).toEqual(new Set(['alice', 'bob', 'carol']))
    expect(store.sort).toBe('rating_desc')
    expect(store.groupBy).toBe('players')
    expect(store.view).toBe('list')
  })
})
