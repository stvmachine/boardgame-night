import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterPanel } from '@/components/collection/filter-panel'
import { emptyFilters } from '@/lib/collection'
import type { Member } from '@/lib/data'
import { games } from './fixtures/sample-data'

const members: Member[] = [
  { id: 'alex', name: 'alex', bgg: 'alex', color: '#6366f1' },
  { id: 'sam', name: 'sam', bgg: 'sam', color: '#ec4899' },
]

describe('collection source routing', () => {
  it('prioritizes an explicit group token over every ambient source', async () => {
    const browser = await import('@/components/collection/collection-browser')
    const resolveCollectionSource = Reflect.get(browser, 'resolveCollectionSource')

    expect(resolveCollectionSource).toBeTypeOf('function')
    expect(
      resolveCollectionSource({
        routeGroupToken: 'ROUTE-GROUP',
        routeUsernames: ['route-user'],
        activeGroupToken: 'ACTIVE-GROUP',
        currentUserBgg: 'signed-in-user',
      }),
    ).toEqual({ kind: 'group', token: 'ROUTE-GROUP' })
  })

  it('uses URL usernames before active-group and account fallbacks', async () => {
    const browser = await import('@/components/collection/collection-browser')
    const resolveCollectionSource = Reflect.get(browser, 'resolveCollectionSource')

    expect(
      resolveCollectionSource({
        routeGroupToken: '',
        routeUsernames: ['alice', 'bob'],
        activeGroupToken: 'ACTIVE-GROUP',
        currentUserBgg: 'signed-in-user',
      }),
    ).toEqual({ kind: 'merged', usernames: ['alice', 'bob'] })
  })

  it('falls back to active group, then the signed-in BGG username', async () => {
    const browser = await import('@/components/collection/collection-browser')
    const resolveCollectionSource = Reflect.get(browser, 'resolveCollectionSource')

    expect(
      resolveCollectionSource({
        routeGroupToken: '',
        routeUsernames: [],
        activeGroupToken: 'ACTIVE-GROUP',
        currentUserBgg: 'signed-in-user',
      }),
    ).toEqual({ kind: 'group', token: 'ACTIVE-GROUP' })
    expect(
      resolveCollectionSource({
        routeGroupToken: '',
        routeUsernames: [],
        activeGroupToken: null,
        currentUserBgg: 'signed-in-user',
      }),
    ).toEqual({ kind: 'merged', usernames: ['signed-in-user'] })
  })

  it('publishes the generated authorized GroupCollection query hook', async () => {
    const operations = await import('@/generated/operations')

    expect(Reflect.get(operations, 'GroupCollectionDocument')).toBeDefined()
    expect(Reflect.get(operations, 'useGroupCollectionQuery')).toBeTypeOf('function')
  })
})

describe('collection grouping', () => {
  const groupedGames = [
    { ...games[0], id: 'first', title: 'First', minPlayers: 2, maxPlayers: 4, bestAt: 4, rating: 8.4, owners: ['sam', 'alex'] },
    { ...games[0], id: 'second', title: 'Second', minPlayers: 2, maxPlayers: 4, bestAt: 4, rating: 8.1, owners: ['alex'] },
    { ...games[0], id: 'third', title: 'Third', minPlayers: 1, maxPlayers: 5, bestAt: 3, rating: 7.2, owners: ['riley'] },
  ]

  it.each([
    ['none', ['All Games']],
    ['players', ['1–5 players', '2–4 players']],
    ['rating', ['8.0–8.9', '7.0–7.9']],
    ['bestPlayers', ['Best with 3 players', 'Best with 4 players']],
    ['owner', ['alex', 'alex, sam', 'riley']],
  ] as const)('creates deterministic %s headings', async (groupBy, expectedHeadings) => {
    const browser = await import('@/components/collection/collection-browser')
    const groupGames = Reflect.get(browser, 'groupGames')

    expect(groupGames).toBeTypeOf('function')
    expect(groupGames(groupedGames, groupBy).map((group: { label: string }) => group.label)).toEqual(
      expectedHeadings,
    )
  })

  it('preserves the incoming sort order inside every group', async () => {
    const browser = await import('@/components/collection/collection-browser')
    const groupGames = Reflect.get(browser, 'groupGames')
    const groups = groupGames(groupedGames, 'players') as Array<{
      games: typeof groupedGames
    }>

    expect(groups.find((group) => group.games.length === 2)?.games.map((game) => game.id)).toEqual([
      'first',
      'second',
    ])
  })
})

describe('FilterPanel', () => {
  it('exposes the approved accessible controls and no retired facets', () => {
    render(
      <FilterPanel
        filters={emptyFilters}
        setFilters={vi.fn()}
        games={games}
        members={members}
      />,
    )

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Minimum players' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    )
    expect(screen.getByRole('slider', { name: 'Maximum players' })).toHaveAttribute(
      'aria-valuenow',
      '10',
    )
    expect(screen.getByRole('checkbox', { name: 'Under 30 min' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '30–60 min' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '1–2 hrs' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '2+ hrs' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Heavy' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'alex' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'sam' })).toBeChecked()
    expect(screen.queryByText('Rating')).not.toBeInTheDocument()
    expect(screen.queryByText('Category')).not.toBeInTheDocument()
  })

  it('writes search and owner changes through the shared filter state', async () => {
    const user = userEvent.setup()
    const setFilters = vi.fn()
    render(
      <FilterPanel
        filters={emptyFilters}
        setFilters={setFilters}
        games={games}
        members={members}
      />,
    )

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'wing' },
    })
    expect(setFilters).toHaveBeenLastCalledWith({ q: 'wing' })

    await user.click(screen.getByRole('checkbox', { name: 'sam' }))
    expect(setFilters).toHaveBeenLastCalledWith({ owners: ['alex'] })
  })
})
