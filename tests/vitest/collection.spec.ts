import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  activeCount,
  applyFilters,
  emptyFilters,
  fromParams,
  inTimeBucket,
  matches,
  toParams,
} from '@/lib/collection'
import type { Filters } from '@/lib/collection'
import type { Game } from '@/lib/data'
import { games } from './fixtures/sample-data'

const desiredEmptyFilters: Filters = {
  q: '',
  players: null,
  times: [],
  complexity: null,
  owners: [],
  sort: 'name',
  groupBy: 'none',
  view: 'grid',
}

function asCurrentFilters(filters: Filters) {
  return filters
}

function game(overrides: Partial<Game> & { lastPlayedAt?: string | null }): Game {
  return {
    ...games[0],
    ...overrides,
  }
}

describe('landing fixture boundaries', () => {
  it.each([
    'app/frontend/components/landing/hero-flow.tsx',
    'app/frontend/components/landing/chapter-visuals.tsx',
  ])('%s owns its decorative data', (path) => {
    const source = readFileSync(resolve(process.cwd(), path), 'utf8')

    expect(source).not.toMatch(/import\s+\{[^}]+\}\s+from\s+['"]@\/lib\/data['"]/)
  })
})

describe('collection filter contract', () => {
  it('uses only the approved filter state', () => {
    expect(emptyFilters).toEqual(desiredEmptyFilters)
    expect(emptyFilters).not.toHaveProperty('rating')
    expect(emptyFilters).not.toHaveProperty('categories')
    expect(emptyFilters).not.toHaveProperty('weight')
  })

  it('publishes exactly four product-facing sort labels', async () => {
    const collection = await import('@/lib/collection')

    expect(Reflect.get(collection, 'sortLabels')).toEqual({
      name: 'Name A–Z',
      rating: 'Rating High–Low',
      weight: 'Weight Light–Heavy',
      recent: 'Recently Played',
    })
  })

  it('matches games that support the complete requested player range', () => {
    const supportsOneToFive = game({ minPlayers: 1, maxPlayers: 5 })

    expect(
      matches(
        supportsOneToFive,
        asCurrentFilters({ ...desiredEmptyFilters, players: { min: 2, max: 5 } }),
      ),
    ).toBe(true)
    expect(
      matches(
        supportsOneToFive,
        asCurrentFilters({ ...desiredEmptyFilters, players: { min: 2, max: 6 } }),
      ),
    ).toBe(false)
  })

  it('treats an untouched 1–10 range as no restriction', () => {
    expect(
      matches(
        game({ minPlayers: 2, maxPlayers: 4 }),
        asCurrentFilters({ ...desiredEmptyFilters, players: { min: 1, max: 10 } }),
      ),
    ).toBe(true)
    expect(
      toParams(
        asCurrentFilters({ ...desiredEmptyFilters, players: { min: 1, max: 10 } }),
      ),
    ).toBe('')
  })

  it('implements the four approved play-time buckets', () => {
    expect(inTimeBucket(29, 1 as never)).toBe(true)
    expect(inTimeBucket(30, 1 as never)).toBe(false)
    expect(inTimeBucket(30, 2 as never)).toBe(true)
    expect(inTimeBucket(60, 2 as never)).toBe(true)
    expect(inTimeBucket(61, 3 as never)).toBe(true)
    expect(inTimeBucket(119, 3 as never)).toBe(true)
    expect(inTimeBucket(120, 4 as never)).toBe(true)
  })

  it('uses OR semantics within time buckets', () => {
    expect(
      matches(
        game({ minutes: 150 }),
        asCurrentFilters({ ...desiredEmptyFilters, times: [1, 4] }),
      ),
    ).toBe(true)
    expect(
      matches(
        game({ minutes: 75 }),
        asCurrentFilters({ ...desiredEmptyFilters, times: [1, 4] }),
      ),
    ).toBe(false)
  })

  it.each([
    [1, 1.9, true],
    [1, 2, false],
    [2, 2.5, true],
    [2, 3, false],
    [3, 3, true],
    [3, 4.8, true],
  ] as const)('filters complexity bucket %s at weight %s', (complexity, weight, expected) => {
    expect(
      matches(
        game({ weight }),
        asCurrentFilters({ ...desiredEmptyFilters, complexity }),
      ),
    ).toBe(expected)
  })

  it('filters by selected owners and counts only active facets', () => {
    const filters = {
      ...desiredEmptyFilters,
      q: 'feathered',
      owners: ['alex'],
      complexity: 2 as const,
    }

    expect(matches(games[0], asCurrentFilters(filters))).toBe(true)
    expect(activeCount(asCurrentFilters(filters))).toBe(3)
  })
})

describe('collection sorting', () => {
  const unsorted = [
    game({ id: '2', title: 'Beta', rating: 8, weight: 2 }),
    game({ id: '3', title: 'Alpha', rating: 9, weight: 3 }),
    game({ id: '1', title: 'Alpha', rating: 9, weight: 2 }),
  ]

  it('sorts by name with an id tie-breaker', () => {
    expect(applyFilters(unsorted, asCurrentFilters(desiredEmptyFilters)).map(({ id }) => id)).toEqual([
      '1',
      '3',
      '2',
    ])
  })

  it('sorts rating high-to-low with deterministic name and id tie-breakers', () => {
    expect(
      applyFilters(
        unsorted,
        asCurrentFilters({ ...desiredEmptyFilters, sort: 'rating' }),
      ).map(({ id }) => id),
    ).toEqual(['1', '3', '2'])
  })

  it('sorts weight light-to-heavy with deterministic name and id tie-breakers', () => {
    expect(
      applyFilters(
        unsorted,
        asCurrentFilters({ ...desiredEmptyFilters, sort: 'weight' }),
      ).map(({ id }) => id),
    ).toEqual(['1', '2', '3'])
  })

  it('sorts recently played dates descending and null/invalid dates last', () => {
    const withHistory = [
      game({ id: '4', title: 'Zulu', lastPlayedAt: null }),
      game({ id: '3', title: 'Alpha', lastPlayedAt: 'not-a-date' }),
      game({ id: '2', title: 'Beta', lastPlayedAt: '2026-07-10T12:00:00Z' }),
      game({ id: '1', title: 'Alpha', lastPlayedAt: '2026-07-12T12:00:00Z' }),
    ]

    expect(
      applyFilters(
        withHistory,
        asCurrentFilters({ ...desiredEmptyFilters, sort: 'recent' }),
      ).map(({ id }) => id),
    ).toEqual(['1', '2', '3', '4'])
  })
})

describe('collection URL codec', () => {
  it('round-trips the approved filter, sort, grouping, owner, and view state', () => {
    const filters: Filters = {
      q: 'strategy',
      players: { min: 3, max: 5 },
      times: [1, 3],
      complexity: 2,
      owners: ['alex', 'sam'],
      sort: 'weight',
      groupBy: 'owner',
      view: 'list',
    }

    const params = new URLSearchParams(toParams(asCurrentFilters(filters)))

    expect(params.get('players')).toBe('3-5')
    expect(params.get('owners')).toBe('alex,sam')
    expect(params.has('owner')).toBe(false)
    expect(fromParams(params)).toEqual(filters)
  })

  it('round-trips players=4 as a single-value range', () => {
    expect(fromParams(new URLSearchParams('players=4'))).toEqual({
      ...desiredEmptyFilters,
      players: { min: 4, max: 4 },
    })
  })

  it('clamps and orders numeric player ranges', () => {
    expect(fromParams(new URLSearchParams('players=12-0')).players).toEqual({ min: 1, max: 10 })
  })

  it('allowlists enum and numeric values and resets malformed input safely', () => {
    expect(
      fromParams(
        new URLSearchParams(
          'players=nope&time=1,7,wat&complexity=9&sort=unknown&groupBy=bad&view=table',
        ),
      ),
    ).toEqual({
      ...desiredEmptyFilters,
      times: [1],
    })
  })

  it.each([
    ['name_asc', 'name'],
    ['name_desc', 'name'],
    ['rating_asc', 'rating'],
    ['rating_desc', 'rating'],
    ['year_asc', 'name'],
    ['year_desc', 'name'],
    ['weight_asc', 'weight'],
    ['weight_desc', 'weight'],
    ['complexity_asc', 'weight'],
    ['complexity_desc', 'weight'],
    ['recently_played', 'recent'],
  ])('migrates legacy sort %s to %s', (legacy, expected) => {
    expect(fromParams(new URLSearchParams(`sort=${legacy}`)).sort).toBe(expected)
  })

  it('keeps the reserved group token outside the filter codec', () => {
    const params = new URLSearchParams('group=E2ENIGHTOWLS&groupBy=owner')
    const filters = fromParams(params)
    const encoded = new URLSearchParams(toParams(asCurrentFilters(filters)))

    expect(filters.groupBy).toBe('owner')
    expect(encoded.get('groupBy')).toBe('owner')
    expect(encoded.has('group')).toBe(false)
  })

  it('omits default values', () => {
    expect(toParams(asCurrentFilters(desiredEmptyFilters))).toBe('')
  })
})
