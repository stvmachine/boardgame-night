import { describe, it, expect } from 'vitest'
import type { MergedThing } from '@/generated/operations'
import { sortGames } from '@/utils/sorting'

function makeGame(overrides: Partial<MergedThing> & { name: string; id: string }): MergedThing {
  return {
    id: overrides.id,
    name: overrides.name,
    objectid: overrides.id,
    yearPublished: null,
    minPlayers: null,
    maxPlayers: null,
    minPlaytime: null,
    maxPlaytime: null,
    minAge: null,
    image: null,
    thumbnail: null,
    description: null,
    average: null,
    bayesAverage: null,
    usersRated: null,
    averageWeight: null,
    isExpansion: false,
    lastPlayedAt: null,
    owners: [],
    ...overrides
  } as MergedThing
}

describe('sortGames', () => {
  describe('name_asc', () => {
    it('sorts alphabetically by name', () => {
      const games = [
        makeGame({ id: '3', name: 'Cascadia' }),
        makeGame({ id: '1', name: 'Azul' }),
        makeGame({ id: '2', name: 'Brass' })
      ]
      const sorted = sortGames(games, 'name_asc')
      expect(sorted.map(g => g.name)).toEqual(['Azul', 'Brass', 'Cascadia'])
    })

    it('uses id as a deterministic tie-breaker', () => {
      const games = [
        makeGame({ id: 'b', name: 'Azul' }),
        makeGame({ id: 'a', name: 'Azul' })
      ]
      const sorted = sortGames(games, 'name_asc')
      expect(sorted.map(g => g.id)).toEqual(['a', 'b'])
    })
  })

  describe('rating_desc', () => {
    it('sorts from highest to lowest rating', () => {
      const games = [
        makeGame({ id: '1', name: 'Azul', average: 7.5 }),
        makeGame({ id: '2', name: 'Brass', average: 8.7 }),
        makeGame({ id: '3', name: 'Cascadia', average: 6.0 })
      ]
      const sorted = sortGames(games, 'rating_desc')
      expect(sorted.map(g => g.name)).toEqual(['Brass', 'Azul', 'Cascadia'])
    })

    it('places missing ratings last and breaks ties by name/id', () => {
      const games = [
        makeGame({ id: '1', name: 'Brass', average: null }),
        makeGame({ id: '2', name: 'Azul', average: 8.0 }),
        makeGame({ id: '3', name: 'Cascadia', average: null })
      ]
      const sorted = sortGames(games, 'rating_desc')
      expect(sorted.map(g => g.name)).toEqual(['Azul', 'Brass', 'Cascadia'])
    })
  })

  describe('weight_asc', () => {
    it('sorts from light to heavy weight', () => {
      const games = [
        makeGame({ id: '1', name: 'Azul', averageWeight: 2.5 }),
        makeGame({ id: '2', name: 'Brass', averageWeight: 1.5 }),
        makeGame({ id: '3', name: 'Cascadia', averageWeight: 3.0 })
      ]
      const sorted = sortGames(games, 'weight_asc')
      expect(sorted.map(g => g.name)).toEqual(['Brass', 'Azul', 'Cascadia'])
    })

    it('places missing weights last and breaks ties by name/id', () => {
      const games = [
        makeGame({ id: '1', name: 'Brass', averageWeight: null }),
        makeGame({ id: '2', name: 'Azul', averageWeight: 1.0 }),
        makeGame({ id: '3', name: 'Cascadia', averageWeight: null })
      ]
      const sorted = sortGames(games, 'weight_asc')
      expect(sorted.map(g => g.name)).toEqual(['Azul', 'Brass', 'Cascadia'])
    })
  })

  describe('recently_played', () => {
    it('sorts most-recent games first', () => {
      const games = [
        makeGame({ id: '1', name: 'Azul', lastPlayedAt: '2026-01-10T00:00:00Z' }),
        makeGame({ id: '2', name: 'Brass', lastPlayedAt: '2026-01-15T00:00:00Z' }),
        makeGame({ id: '3', name: 'Cascadia', lastPlayedAt: '2026-01-12T00:00:00Z' })
      ]
      const sorted = sortGames(games, 'recently_played' as any)
      expect(sorted.map(g => g.name)).toEqual(['Brass', 'Cascadia', 'Azul'])
    })

    it('places games with no history last, then alphabetically', () => {
      const games = [
        makeGame({ id: '1', name: 'Cascadia', lastPlayedAt: null }),
        makeGame({ id: '2', name: 'Azul', lastPlayedAt: '2026-01-15T00:00:00Z' }),
        makeGame({ id: '3', name: 'Brass', lastPlayedAt: null })
      ]
      const sorted = sortGames(games, 'recently_played' as any)
      expect(sorted.map(g => g.name)).toEqual(['Azul', 'Brass', 'Cascadia'])
    })

    it('treats invalid dates as no history', () => {
      const games = [
        makeGame({ id: '1', name: 'Cascadia', lastPlayedAt: 'not-a-date' }),
        makeGame({ id: '2', name: 'Azul', lastPlayedAt: '2026-01-15T00:00:00Z' })
      ]
      const sorted = sortGames(games, 'recently_played' as any)
      expect(sorted.map(g => g.name)).toEqual(['Azul', 'Cascadia'])
    })

    it('breaks equal-date ties by name/id', () => {
      const games = [
        makeGame({ id: '2', name: 'Brass', lastPlayedAt: '2026-01-15T00:00:00Z' }),
        makeGame({ id: '1', name: 'Azul', lastPlayedAt: '2026-01-15T00:00:00Z' })
      ]
      const sorted = sortGames(games, 'recently_played' as any)
      expect(sorted.map(g => g.name)).toEqual(['Azul', 'Brass'])
    })
  })
})
