import { describe, it, expect } from 'vitest'
import {
  emptyFilters,
  applyFilters,
  activeCount,
  fromParams,
  toParams,
  inTimeBucket,
  matches,
  facetCount,
} from '@/lib/collection'
import { games } from '@/lib/data'
import type { Game } from '@/lib/data'

describe('emptyFilters', () => {
  it('returns default filter state', () => {
    expect({ ...emptyFilters }).toEqual({
      q: '',
      players: [],
      times: [],
      weight: [1, 5],
      rating: 0,
      categories: [],
      owners: [],
      sort: 'name',
    })
  })

  it('has expected default values', () => {
    expect(emptyFilters.q).toBe('')
    expect(emptyFilters.players).toEqual([])
    expect(emptyFilters.weight).toEqual([1, 5])
  })
})

describe('inTimeBucket', () => {
  it('classifies under 30m', () => {
    expect(inTimeBucket(25, '<30')).toBe(true)
    expect(inTimeBucket(30, '<30')).toBe(false)
  })

  it('classifies 30–60m', () => {
    expect(inTimeBucket(30, '30-60')).toBe(true)
    expect(inTimeBucket(45, '30-60')).toBe(true)
    expect(inTimeBucket(60, '30-60')).toBe(true)
    expect(inTimeBucket(29, '30-60')).toBe(false)
    expect(inTimeBucket(61, '30-60')).toBe(false)
  })

  it('classifies 60–90m', () => {
    expect(inTimeBucket(61, '60-90')).toBe(true)
    expect(inTimeBucket(90, '60-90')).toBe(true)
    expect(inTimeBucket(60, '60-90')).toBe(false)
    expect(inTimeBucket(91, '60-90')).toBe(false)
  })

  it('classifies 90m+', () => {
    expect(inTimeBucket(91, '90+')).toBe(true)
    expect(inTimeBucket(90, '90+')).toBe(false)
  })
})

describe('matches', () => {
  const game = games[0] // Feathered Realms

  it('matches by title search', () => {
    expect(matches(game, { ...emptyFilters, q: 'feathered' })).toBe(true)
    expect(matches(game, { ...emptyFilters, q: 'zzztop' })).toBe(false)
  })

  it('matches by category search', () => {
    expect(matches(game, { ...emptyFilters, q: 'Engine' })).toBe(true)
    expect(matches(game, { ...emptyFilters, q: 'Party' })).toBe(false)
  })

  it('matches by player count', () => {
    expect(matches(game, { ...emptyFilters, players: [3] })).toBe(true)
    expect(matches(game, { ...emptyFilters, players: [6] })).toBe(false)
  })

  it('matches by time bucket', () => {
    expect(matches(game, { ...emptyFilters, times: ['30-60'] })).toBe(true)
    expect(matches(game, { ...emptyFilters, times: ['<30'] })).toBe(false)
  })

  it('matches by weight range', () => {
    expect(matches(game, { ...emptyFilters, weight: [2, 3] })).toBe(true)
    expect(matches(game, { ...emptyFilters, weight: [3, 5] })).toBe(false)
  })

  it('matches by rating threshold', () => {
    expect(matches(game, { ...emptyFilters, rating: 8 })).toBe(true)
    expect(matches(game, { ...emptyFilters, rating: 9 })).toBe(false)
  })

  it('skips rating check when rating is 0', () => {
    expect(matches(game, { ...emptyFilters, rating: 0 })).toBe(true)
  })

  it('matches by categories', () => {
    expect(matches(game, { ...emptyFilters, categories: ['Strategy'] })).toBe(true)
    expect(matches(game, { ...emptyFilters, categories: ['Party'] })).toBe(false)
  })

  it('matches by owners', () => {
    expect(matches(game, { ...emptyFilters, owners: ['alex'] })).toBe(true)
    expect(matches(game, { ...emptyFilters, owners: ['nobody'] })).toBe(false)
  })
})

describe('applyFilters', () => {
  it('returns all games sorted by name by default', () => {
    const result = applyFilters(games, emptyFilters)
    expect(result).toHaveLength(games.length)
    expect(result[0].title.localeCompare(result[1].title)).toBeLessThanOrEqual(0)
  })

  it('filters by search query', () => {
    const result = applyFilters(games, { ...emptyFilters, q: 'azulejo' })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Azulejo')
  })

  it('filters by player count', () => {
    const result = applyFilters(games, { ...emptyFilters, players: [7] })
    expect(result.length).toBeGreaterThanOrEqual(2)
    result.forEach((g) => {
      expect(g.minPlayers <= 7 && g.maxPlayers >= 7).toBe(true)
    })
  })

  it('filters by time bucket', () => {
    const result = applyFilters(games, { ...emptyFilters, times: ['<30'] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach((g) => expect(g.minutes < 30).toBe(true))
  })

  it('filters by weight range', () => {
    const result = applyFilters(games, { ...emptyFilters, weight: [4, 5] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach((g) => expect(g.weight).toBeGreaterThanOrEqual(4))
  })

  it('filters by rating', () => {
    const result = applyFilters(games, { ...emptyFilters, rating: 8 })
    result.forEach((g) => expect(g.rating).toBeGreaterThanOrEqual(8))
  })

  it('filters by categories', () => {
    const result = applyFilters(games, { ...emptyFilters, categories: ['Party'] })
    result.forEach((g) => expect(g.categories).toContain('Party'))
  })

  it('filters by owners', () => {
    const result = applyFilters(games, { ...emptyFilters, owners: ['riley'] })
    result.forEach((g) => expect(g.owners).toContain('riley'))
  })

  it('sorts by rating descending', () => {
    const result = applyFilters(games, { ...emptyFilters, sort: 'rating' })
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].rating).toBeGreaterThanOrEqual(result[i].rating)
    }
  })

  it('sorts by players ascending', () => {
    const result = applyFilters(games, { ...emptyFilters, sort: 'players' })
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]
      const curr = result[i]
      expect(
        prev.maxPlayers < curr.maxPlayers ||
        (prev.maxPlayers === curr.maxPlayers && prev.minPlayers <= curr.minPlayers),
      ).toBe(true)
    }
  })

  it('sorts by time ascending', () => {
    const result = applyFilters(games, { ...emptyFilters, sort: 'time' })
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].minutes).toBeLessThanOrEqual(result[i].minutes)
    }
  })

  it('sorts by recent (addedAt descending)', () => {
    const result = applyFilters(games, { ...emptyFilters, sort: 'recent' })
    for (let i = 1; i < result.length; i++) {
      const cmp = result[i - 1].addedAt.localeCompare(result[i].addedAt)
      expect(cmp).toBeGreaterThanOrEqual(0)
    }
  })

  it('applies multiple filters together (AND)', () => {
    const result = applyFilters(games, {
      ...emptyFilters,
      players: [4],
      times: ['60-90'],
      categories: ['Strategy'],
    })
    result.forEach((g) => {
      expect(g.minPlayers <= 4 && g.maxPlayers >= 4).toBe(true)
      expect(g.minutes > 60 && g.minutes <= 90).toBe(true)
      expect(g.categories).toContain('Strategy')
    })
  })

  it('returns empty array when no games match', () => {
    const result = applyFilters(games, { ...emptyFilters, q: 'xyznonexistent' })
    expect(result).toHaveLength(0)
  })
})

describe('facetCount', () => {
  it('counts games matching a predicate ignoring one facet', () => {
    const count = facetCount(games, { ...emptyFilters, q: 'party' }, 'q', (g) =>
      g.categories.includes('Party'),
    )
    expect(count).toBeGreaterThan(0)
  })
})

describe('activeCount', () => {
  it('returns 0 when all filters are default', () => {
    expect(activeCount(emptyFilters)).toBe(0)
  })

  it('counts non-empty query', () => {
    expect(activeCount({ ...emptyFilters, q: 'hello' })).toBe(1)
  })

  it('counts selected player values (each value counts)', () => {
    expect(activeCount({ ...emptyFilters, players: [3, 4] })).toBe(2)
  })

  it('counts multiple non-default facets', () => {
    const f = { ...emptyFilters, q: 'game', players: [4], rating: 7, weight: [2, 4] as [number, number] }
    expect(activeCount(f)).toBe(4)
  })

  it('counts weight when different from default [1,5]', () => {
    expect(activeCount({ ...emptyFilters, weight: [2, 4] })).toBe(1)
    expect(activeCount({ ...emptyFilters, weight: [1, 5] })).toBe(0)
  })

  it('does not count default rating=0', () => {
    expect(activeCount({ ...emptyFilters, rating: 0 })).toBe(0)
  })
})

describe('toParams / fromParams round-trip', () => {
  it('serializes and deserializes filters', () => {
    const f = {
      q: 'strategy',
      players: [3, 4],
      times: ['30-60', '60-90'] as Array<'30-60' | '60-90'>,
      weight: [2, 4] as [number, number],
      rating: 7,
      categories: ['Strategy'],
      owners: ['alex'],
      sort: 'rating' as const,
    }

    const paramsStr = toParams(f)
    const sp = new URLSearchParams(paramsStr)
    const restored = fromParams(sp)

    expect(restored).toEqual(f)
  })

  it('handles empty filters round-trip', () => {
    const paramsStr = toParams(emptyFilters)
    const sp = new URLSearchParams(paramsStr)
    const restored = fromParams(sp)
    expect(restored).toEqual(emptyFilters)
  })

  it('handles partial search params', () => {
    const sp = new URLSearchParams('q=hello&players=3,4&sort=rating')
    const result = fromParams(sp)

    expect(result.q).toBe('hello')
    expect(result.players).toEqual([3, 4])
    expect(result.sort).toBe('rating')
    expect(result.weight).toEqual([1, 5])
    expect(result.rating).toBe(0)
  })

  it('handles empty query string', () => {
    const sp = new URLSearchParams('')
    const result = fromParams(sp)
    expect(result).toEqual(emptyFilters)
  })

  it('omits default values from params', () => {
    const paramsStr = toParams(emptyFilters)
    expect(paramsStr).toBe('')
  })
})
