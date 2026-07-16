import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useCollectionFilters } from '@/composables/useCollectionFilters'
import type { MergedThing } from '@/generated/operations'
import type { PlayerRange } from '@/stores/filters'

function makeGame(overrides: Partial<MergedThing> = {}): MergedThing {
  return {
    __typename: 'MergedThing',
    id: '1',
    name: 'Test Game',
    yearPublished: 2020,
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 60,
    maxPlaytime: 120,
    average: 7.5,
    averageWeight: 2.5,
    isExpansion: false,
    owners: [{ __typename: 'Owner', bggUsername: 'alice', avatar: null }],
    ...overrides
  } as MergedThing
}

describe('useCollectionFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns all games when no filters are active', () => {
    const games = ref([makeGame({ id: '1' }), makeGame({ id: '2', name: 'Azul' })])
    const { filteredGames } = useCollectionFilters(games)

    expect(filteredGames.value).toHaveLength(2)
  })

  it('filters by single-count player range N–N', () => {
    const games = ref([
      makeGame({ id: '1', minPlayers: 2, maxPlayers: 4 }),
      makeGame({ id: '2', minPlayers: 1, maxPlayers: 2 })
    ])
    const { playerRange, filteredGames } = useCollectionFilters(games)
    playerRange.value = { min: 3, max: 3 }

    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].id).toBe('1')
  })

  it('filters by player range and requires the entire range to be supported', () => {
    const games = ref([
      makeGame({ id: '1', minPlayers: 1, maxPlayers: 6 }),
      makeGame({ id: '2', minPlayers: 2, maxPlayers: 3 })
    ])
    const { playerRange, filteredGames } = useCollectionFilters(games)
    playerRange.value = { min: 2, max: 4 }

    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].id).toBe('1')
  })

  it('does not filter by player range when it is null', () => {
    const games = ref([
      makeGame({ id: '1', minPlayers: 2, maxPlayers: 4 }),
      makeGame({ id: '2', minPlayers: 1, maxPlayers: 2 })
    ])
    const { playerRange, filteredGames } = useCollectionFilters(games)
    playerRange.value = null

    expect(filteredGames.value).toHaveLength(2)
  })

  it('filters by multiple time buckets with OR semantics', () => {
    const games = ref([
      makeGame({ id: '1', minPlaytime: 15, maxPlaytime: 30 }),
      makeGame({ id: '2', minPlaytime: 45, maxPlaytime: 60 }),
      makeGame({ id: '3', minPlaytime: 90, maxPlaytime: 120 })
    ])
    const { selectedTimeBuckets, filteredGames } = useCollectionFilters(games)
    selectedTimeBuckets.value = new Set([1, 3]) // ≤30 min and 60–120 min

    expect(filteredGames.value.map(g => g.id)).toEqual(['1', '3'])
  })

  it('does not filter by time when no buckets are selected', () => {
    const games = ref([
      makeGame({ id: '1', minPlaytime: 15, maxPlaytime: 30 }),
      makeGame({ id: '2', minPlaytime: 90, maxPlaytime: 120 })
    ])
    const { selectedTimeBuckets, filteredGames } = useCollectionFilters(games)
    selectedTimeBuckets.value = new Set()

    expect(filteredGames.value).toHaveLength(2)
  })

  it('filters by complexity bucket', () => {
    const games = ref([
      makeGame({ id: '1', averageWeight: 1.5 }),
      makeGame({ id: '2', averageWeight: 2.5 }),
      makeGame({ id: '3', averageWeight: 3.5 })
    ])
    const { complexityBucket, filteredGames } = useCollectionFilters(games)
    complexityBucket.value = 2 // Medium

    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].id).toBe('2')
  })

  it('does not filter by complexity when bucket is null', () => {
    const games = ref([
      makeGame({ id: '1', averageWeight: 1.5 }),
      makeGame({ id: '2', averageWeight: 3.5 })
    ])
    const { complexityBucket, filteredGames } = useCollectionFilters(games)
    complexityBucket.value = null

    expect(filteredGames.value).toHaveLength(2)
  })

  it('filters by search query after debounce', async () => {
    const games = ref([
      makeGame({ id: '1', name: 'Wingspan' }),
      makeGame({ id: '2', name: 'Azul' })
    ])
    const { query, filteredGames } = useCollectionFilters(games)
    query.value = 'Wingspan'

    expect(filteredGames.value).toHaveLength(2)

    vi.advanceTimersByTime(400)
    await vi.runAllTimersAsync()
    await Promise.resolve()

    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Wingspan')
  })

  it('filters by selected owners', () => {
    const games = ref([
      makeGame({ id: '1', owners: [{ __typename: 'Owner', bggUsername: 'alice', avatar: null }] }),
      makeGame({ id: '2', owners: [{ __typename: 'Owner', bggUsername: 'bob', avatar: null }] })
    ])
    const { selectedOwners, filteredGames } = useCollectionFilters(games, {
      initialSelectedOwners: ['alice']
    })

    expect(selectedOwners.value.has('alice')).toBe(true)
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].id).toBe('1')
  })
})
