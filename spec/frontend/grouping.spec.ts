import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { groupGames, ratingSort } from '@/utils/grouping'
import { useCollapsedGroups } from '@/composables/useCollapsedGroups'
import type { MergedThing } from '@/generated/operations'

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

describe('ratingSort', () => {
  it('returns the correct index for each rating bucket', () => {
    expect(ratingSort('9.0+')).toBe(0)
    expect(ratingSort('8.0–8.9')).toBe(1)
    expect(ratingSort('7.0–7.9')).toBe(2)
    expect(ratingSort('6.0–6.9')).toBe(3)
    expect(ratingSort('Below 6.0')).toBe(4)
    expect(ratingSort('Unrated')).toBe(5)
  })

  it('returns 999 for unknown bucket names', () => {
    expect(ratingSort('unknown')).toBe(999)
    expect(ratingSort('')).toBe(999)
  })
})

describe('groupGames', () => {
  it('sorts rating groups from highest to lowest, with Unrated last', () => {
    const games = [
      makeGame({ id: '1', average: 6.5 }),
      makeGame({ id: '2', average: 8.5 }),
      makeGame({ id: '3', average: 0 }),
      makeGame({ id: '4', average: 9.2 })
    ]

    const groups = groupGames(games, 'rating')
    expect(groups.map(g => g.name)).toEqual([
      '9.0+',
      '8.0–8.9',
      '6.0–6.9',
      'Unrated'
    ])
  })
})

describe('useCollapsedGroups', () => {
  it('toggles a group between collapsed and expanded', () => {
    const { isCollapsed, toggle } = useCollapsedGroups()
    expect(isCollapsed('A')).toBe(false)

    toggle('A')
    expect(isCollapsed('A')).toBe(true)

    toggle('A')
    expect(isCollapsed('A')).toBe(false)
  })

  it('expands all known groups', () => {
    const { isCollapsed, expandAll, collapseAll } = useCollapsedGroups(['A', 'B', 'C'])

    collapseAll(['A', 'B', 'C'])
    expect(isCollapsed('A')).toBe(true)
    expect(isCollapsed('B')).toBe(true)
    expect(isCollapsed('C')).toBe(true)

    expandAll(['A', 'B', 'C'])
    expect(isCollapsed('A')).toBe(false)
    expect(isCollapsed('B')).toBe(false)
    expect(isCollapsed('C')).toBe(false)
  })

  it('reports when all groups are collapsed', () => {
    const groups = useCollapsedGroups(['A', 'B'])
    expect(groups.allCollapsed.value).toBe(false)

    groups.collapseAll(['A', 'B'])
    expect(groups.allCollapsed.value).toBe(true)
  })
})
