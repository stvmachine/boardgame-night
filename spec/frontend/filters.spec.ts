import { describe, it, expect } from 'vitest'
import { createFuseIndex, searchFuse } from '@/utils/fuseSearch'
import { playerCountFilter, playerRangeFilter, playtimeFilter } from '@/utils/filters'
import type { MergedThing } from '@/generated/operations'
import type { PlayerRange } from '@/stores/filters'

interface TestGame extends MergedThing {
  originalname?: string
}

function makeGame(overrides: Partial<TestGame> = {}): TestGame {
  return {
    __typename: 'MergedThing',
    id: '1',
    name: 'Test Game',
    originalname: 'Test Game',
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
  } as TestGame
}

describe('fuseSearch', () => {
  const games = [
    makeGame({ id: '1', name: 'Wingspan', originalname: 'Wingspan' }),
    makeGame({ id: '2', name: 'Azul', originalname: 'Azul' }),
    makeGame({ id: '3', name: 'Carcassonne', originalname: 'Carcassonne' })
  ]

  it('returns all games when query is empty', () => {
    const index = createFuseIndex(games)
    const results = searchFuse(index, '')
    expect(results).toHaveLength(3)
  })

  it('finds games by name using fuzzy matching', () => {
    const index = createFuseIndex(games)
    const results = searchFuse(index, 'Wingspan')
    expect(results.map(r => r.name)).toContain('Wingspan')
  })

  it('matches original names', () => {
    const index = createFuseIndex([makeGame({ id: '4', name: 'Dune: Imperium', originalname: 'Dune Imperium' })])
    const results = searchFuse(index, 'Dune')
    expect(results.map(r => r.name)).toContain('Dune: Imperium')
  })
})

describe('filters', () => {
  describe('playerCountFilter', () => {
    it('returns true when count is within the player range', () => {
      const game = makeGame({ minPlayers: 2, maxPlayers: 4 })
      expect(playerCountFilter(game, 3)).toBe(true)
    })

    it('returns true at the boundaries', () => {
      const game = makeGame({ minPlayers: 2, maxPlayers: 4 })
      expect(playerCountFilter(game, 2)).toBe(true)
      expect(playerCountFilter(game, 4)).toBe(true)
    })

    it('returns false when count is outside the range', () => {
      const game = makeGame({ minPlayers: 2, maxPlayers: 4 })
      expect(playerCountFilter(game, 1)).toBe(false)
      expect(playerCountFilter(game, 5)).toBe(false)
    })

    it('returns false when player data is missing', () => {
      const game = makeGame({ minPlayers: null, maxPlayers: null })
      expect(playerCountFilter(game, 3)).toBe(false)
    })
  })

  describe('playerRangeFilter', () => {
    it('is unrestricted when range is null', () => {
      const game = makeGame({ minPlayers: 2, maxPlayers: 4 })
      expect(playerRangeFilter(game, null)).toBe(true)
    })

    it('matches when the game supports the entire selected range', () => {
      const game = makeGame({ minPlayers: 1, maxPlayers: 6 })
      expect(playerRangeFilter(game, { min: 2, max: 4 })).toBe(true)
    })

    it('matches a single-count legacy range N–N when the game supports that count', () => {
      const game = makeGame({ minPlayers: 2, maxPlayers: 4 })
      expect(playerRangeFilter(game, { min: 3, max: 3 })).toBe(true)
    })

    it('returns false when the game does not reach the selected maximum', () => {
      const game = makeGame({ minPlayers: 2, maxPlayers: 4 })
      expect(playerRangeFilter(game, { min: 2, max: 5 })).toBe(false)
    })

    it('returns false when the game does not reach the selected minimum', () => {
      const game = makeGame({ minPlayers: 3, maxPlayers: 5 })
      expect(playerRangeFilter(game, { min: 1, max: 4 })).toBe(false)
    })

    it('returns false when player data is missing', () => {
      const game = makeGame({ minPlayers: null, maxPlayers: null })
      expect(playerRangeFilter(game, { min: 2, max: 4 })).toBe(false)
    })

    it('normalizes a reversed range by swapping the bounds', () => {
      const game = makeGame({ minPlayers: 1, maxPlayers: 6 })
      expect(playerRangeFilter(game, { min: 4, max: 2 })).toBe(true)
    })
  })

  describe('playtimeFilter', () => {
    it('returns true when playtime overlaps the requested range', () => {
      const game = makeGame({ minPlaytime: 60, maxPlaytime: 120 })
      expect(playtimeFilter(game, { min: 90, max: 150 })).toBe(true)
    })

    it('returns false when playtime is completely outside the range', () => {
      const game = makeGame({ minPlaytime: 60, maxPlaytime: 120 })
      expect(playtimeFilter(game, { min: 10, max: 30 })).toBe(false)
    })

    it('returns false when playtime data is missing', () => {
      const game = makeGame({ minPlaytime: null, maxPlaytime: null })
      expect(playtimeFilter(game, { min: 60, max: 120 })).toBe(false)
    })
  })
})
