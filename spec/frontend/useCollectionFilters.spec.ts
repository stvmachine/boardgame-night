import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useCollectionFilters } from '@/composables/useCollectionFilters'
import type { MergedThing } from '@/generated/operations'

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

  it('filters by player count', () => {
    const games = ref([
      makeGame({ id: '1', minPlayers: 2, maxPlayers: 4 }),
      makeGame({ id: '2', minPlayers: 1, maxPlayers: 2 })
    ])
    const { playerCount, filteredGames } = useCollectionFilters(games)
    playerCount.value = 3

    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].id).toBe('1')
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
