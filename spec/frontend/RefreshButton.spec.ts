import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import RefreshButton from '@/components/sidebar/RefreshButton.vue'
import { useRefreshCollection } from '@/composables/useRefreshCollection'
import type { SyncStatus } from '@/generated/operations'

const mockMutate = vi.hoisted(() => vi.fn())

vi.mock('@/generated/operations', () => ({
  useImportCollectionMutation: () => ({
    mutate: mockMutate,
    loading: ref(false),
    error: ref(null)
  })
}))

describe('RefreshButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockMutate.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('renders an enabled Refresh button and emits refresh with username on click', async () => {
    const wrapper = mount(RefreshButton, {
      props: { username: 'alice', disabled: false, cooldownSeconds: 0 }
    })

    expect(wrapper.text()).toBe('Refresh')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('refresh')).toEqual([['alice']])
  })

  it('renders disabled button with cooldown text', () => {
    const wrapper = mount(RefreshButton, {
      props: { username: 'alice', disabled: true, cooldownSeconds: 300 }
    })

    expect(wrapper.text()).toBe('Refresh (5m 0s)')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('decrements the displayed countdown every second', async () => {
    const wrapper = mount(RefreshButton, {
      props: { username: 'alice', disabled: true, cooldownSeconds: 300 }
    })

    expect(wrapper.text()).toBe('Refresh (5m 0s)')

    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(wrapper.text()).toBe('Refresh (4m 59s)')
  })

  it('uses the username in the aria-label', () => {
    const wrapper = mount(RefreshButton, {
      props: { username: 'alice', disabled: false, cooldownSeconds: 0 }
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe("Refresh alice's collection")
  })
})

describe('useRefreshCollection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockMutate.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('returns 0 from cooldownFor when no cooldown is set', () => {
    const { cooldownFor } = useRefreshCollection()
    expect(cooldownFor('alice')).toBe(0)
  })

  it('triggers the importCollection mutation on refresh', async () => {
    mockMutate.mockResolvedValue({ data: { importCollection: null } })

    const { refresh } = useRefreshCollection()
    await refresh('alice')

    expect(mockMutate).toHaveBeenCalledWith({ username: 'alice' })
  })

  it('sets per-user cooldown from a cooldown error message', async () => {
    mockMutate.mockRejectedValue(new Error('Cooldown active: please wait 600 seconds'))

    const { refresh, cooldownFor, error } = useRefreshCollection()
    await refresh('alice')

    expect(cooldownFor('alice')).toBe(600)
    expect(error.value).toContain('Cooldown active')
  })

  it('tracks per-user cooldown independently', async () => {
    mockMutate.mockRejectedValue(new Error('Cooldown active: please wait 300 seconds'))

    const { refresh, cooldownFor } = useRefreshCollection()
    await refresh('alice')

    expect(cooldownFor('alice')).toBe(300)
    expect(cooldownFor('bob')).toBe(0)
  })

  it('initializes cooldown from sync statuses with a recent lastSyncedAt', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { initFromSyncStatuses, cooldownFor } = useRefreshCollection()
    initFromSyncStatuses([
      {
        username: 'alice',
        status: 'READY' as SyncStatus,
        lastSyncedAt: fiveMinutesAgo,
        error: null,
        gameCount: 10
      }
    ])

    expect(cooldownFor('alice')).toBeGreaterThan(590)
    expect(cooldownFor('alice')).toBeLessThanOrEqual(600)
  })

  it('returns zero cooldown when lastSyncedAt is older than the cooldown window', () => {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString()

    const { initFromSyncStatuses, cooldownFor } = useRefreshCollection()
    initFromSyncStatuses([
      {
        username: 'alice',
        status: 'READY' as SyncStatus,
        lastSyncedAt: twentyMinutesAgo,
        error: null,
        gameCount: 10
      }
    ])

    expect(cooldownFor('alice')).toBe(0)
  })

  it('returns zero cooldown when lastSyncedAt is null', () => {
    const { initFromSyncStatuses, cooldownFor } = useRefreshCollection()
    initFromSyncStatuses([
      {
        username: 'alice',
        status: 'READY' as SyncStatus,
        lastSyncedAt: null,
        error: null,
        gameCount: 10
      }
    ])

    expect(cooldownFor('alice')).toBe(0)
  })
})
