import { ChevronDown, LayoutGrid, List, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { FilterPanel } from '@/components/collection/filter-panel'
import { GameCard, SkeletonGrid } from '@/components/game-card'
import { EmptyState } from '@/components/primitives'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import {
  activeCount,
  applyFilters,
  complexityLabels,
  emptyFilters,
  fromParams,
  groupByLabels,
  sortLabels,
  timeLabels,
  toParams,
  type Filters,
  type GroupBy,
  type SortKey,
} from '@/lib/collection'
import { toGame } from '@/lib/graphql/adapters'
import type { GqlMergedThing } from '@/lib/graphql/types'
import { cn } from '@/lib/utils'
import type { Member, Game } from '@/lib/data'
import { useActiveGroup } from '@/contexts/ActiveGroupContext'
import {
  useCollectionSyncedSubscription,
  useCurrentUserQuery,
  useGroupCollectionQuery,
  useMergedCollectionQuery,
  type GroupCollectionQuery,
  type MergedCollectionQuery,
} from '@/generated/operations'

function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value

  return (
    <div className="relative">
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className="flex h-11 min-w-40 items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-ink-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute top-full left-0 z-40 mt-1 min-w-full rounded-lg border border-line bg-surface-overlay p-1 shadow-modal"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'block w-full rounded-md px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary',
                option.value === value && 'bg-surface-raised text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const COLOR_PALETTE = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
] as const

type CollectionItem =
  | MergedCollectionQuery['mergedCollection']['items'][number]
  | NonNullable<GroupCollectionQuery['group']>['collection']['items'][number]

type CollectionSource =
  | { kind: 'group'; token: string }
  | { kind: 'merged'; usernames: string[] }
  | { kind: 'none' }

export type GameGroup = {
  key: string
  label: string
  games: Game[]
}

export function resolveCollectionSource({
  routeGroupToken,
  routeUsernames,
  activeGroupToken,
  currentUserBgg,
}: {
  routeGroupToken: string
  routeUsernames: string[]
  activeGroupToken: string | null
  currentUserBgg: string | null | undefined
}): CollectionSource {
  const groupToken = routeGroupToken.trim()
  if (groupToken) return { kind: 'group', token: groupToken }
  if (routeUsernames.length > 0) return { kind: 'merged', usernames: routeUsernames }
  if (activeGroupToken?.trim()) return { kind: 'group', token: activeGroupToken.trim() }
  if (currentUserBgg?.trim()) return { kind: 'merged', usernames: [currentUserBgg.trim()] }
  return { kind: 'none' }
}

function ratingBucket(rating: number) {
  if (rating <= 0) return 'Unrated'
  if (rating >= 9) return '9.0+'
  if (rating >= 8) return '8.0–8.9'
  if (rating >= 7) return '7.0–7.9'
  if (rating >= 6) return '6.0–6.9'
  return 'Below 6.0'
}

function groupLabel(game: Game, groupBy: GroupBy) {
  switch (groupBy) {
    case 'players':
      return game.minPlayers === game.maxPlayers
        ? `${game.minPlayers} players`
        : `${game.minPlayers}–${game.maxPlayers} players`
    case 'rating':
      return ratingBucket(game.rating)
    case 'bestPlayers':
      return `Best with ${game.bestAt || game.minPlayers} players`
    case 'owner':
      return [...game.owners].sort((a, b) => a.localeCompare(b)).join(', ') || 'Unknown owner'
    default:
      return 'All Games'
  }
}

function groupOrder(label: string, groupBy: GroupBy) {
  if (groupBy === 'rating') {
    const order = ['9.0+', '8.0–8.9', '7.0–7.9', '6.0–6.9', 'Below 6.0', 'Unrated']
    return order.indexOf(label)
  }
  if (groupBy === 'players' || groupBy === 'bestPlayers') {
    return Number(label.match(/\d+/)?.[0] ?? 0)
  }
  return 0
}

export function groupGames(games: Game[], groupBy: GroupBy): GameGroup[] {
  if (groupBy === 'none') return [{ key: 'all', label: 'All Games', games }]

  const groups = new Map<string, Game[]>()
  for (const game of games) {
    const label = groupLabel(game, groupBy)
    const group = groups.get(label) ?? []
    group.push(game)
    groups.set(label, group)
  }

  return Array.from(groups.entries())
    .map(([label, groupedGames]) => ({ key: label, label, games: groupedGames }))
    .sort((a, b) => {
      if (groupBy === 'players' || groupBy === 'bestPlayers' || groupBy === 'rating') {
        return groupOrder(a.label, groupBy) - groupOrder(b.label, groupBy)
      }
      return a.label.localeCompare(b.label)
    })
}

function normalizeUsernames(value: string) {
  const seen = new Set<string>()
  return value
    .split(',')
    .map((username) => username.trim())
    .filter((username) => {
      const normalized = username.toLocaleLowerCase()
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
}

function stringToColor(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash)
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

function buildMembers(items: CollectionItem[]): Member[] {
  const usernames = new Set<string>()
  for (const item of items) {
    for (const owner of item.owners) usernames.add(owner.bggUsername)
  }

  return Array.from(usernames)
    .sort((a, b) => a.localeCompare(b))
    .map((username) => ({
      id: username,
      name: username,
      bgg: username,
      color: stringToColor(username),
      online: true,
    }))
}

function gamesFromItems(items: CollectionItem[]) {
  return items.map((item) => toGame(item as unknown as GqlMergedThing))
}

export function CollectionBrowser() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeGroup = useActiveGroup()
  const routeUsernamesParam = searchParams.get('usernames') ?? ''
  const routeGroupToken = searchParams.get('group') ?? ''
  const routeUsernames = useMemo(
    () => normalizeUsernames(routeUsernamesParam),
    [routeUsernamesParam],
  )
  const hasPrimarySource =
    routeGroupToken.trim().length > 0 ||
    routeUsernames.length > 0 ||
    Boolean(activeGroup.token?.trim())

  const currentUserQuery = useCurrentUserQuery({ skip: hasPrimarySource })
  const source = useMemo(
    () =>
      resolveCollectionSource({
        routeGroupToken,
        routeUsernames,
        activeGroupToken: activeGroup.token,
        currentUserBgg: currentUserQuery.data?.currentUser?.bggUsername,
      }),
    [
      activeGroup.token,
      currentUserQuery.data?.currentUser?.bggUsername,
      routeGroupToken,
      routeUsernames,
    ],
  )

  const mergedQuery = useMergedCollectionQuery({
    variables: { usernames: source.kind === 'merged' ? source.usernames : [] },
    skip: source.kind !== 'merged',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })
  const groupQuery = useGroupCollectionQuery({
    variables: { token: source.kind === 'group' ? source.token : '' },
    skip: source.kind !== 'group',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const collection =
    source.kind === 'group'
      ? groupQuery.data?.group?.collection
      : source.kind === 'merged'
        ? mergedQuery.data?.mergedCollection
        : undefined
  const items = collection?.items ?? []
  const games = useMemo<Game[]>(() => gamesFromItems(items), [items])
  const members = useMemo(() => buildMembers(items), [items])
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])

  const [filters, setFiltersState] = useState<Filters>(() =>
    fromParams(new URLSearchParams(searchParams.toString())),
  )
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const nextParams = new URLSearchParams(toParams(filters))
    if (routeGroupToken) nextParams.set('group', routeGroupToken)
    if (routeUsernamesParam) nextParams.set('usernames', routeUsernamesParam)

    const queryString = nextParams.toString()
    navigate(queryString ? `/collection?${queryString}` : '/collection', { replace: true })
  }, [filters, navigate, routeGroupToken, routeUsernamesParam])

  const setFilters = (next: Partial<Filters>) =>
    setFiltersState((current) => ({ ...current, ...next }))
  const results = useMemo(() => applyFilters(games, filters), [games, filters])
  const groupedResults = useMemo(
    () => groupGames(results, filters.groupBy),
    [filters.groupBy, results],
  )
  const active = activeCount(filters)

  function refetchCollection() {
    if (source.kind === 'group') return groupQuery.refetch()
    if (source.kind === 'merged') return mergedQuery.refetch()
    return Promise.resolve()
  }

  useCollectionSyncedSubscription({
    variables: {
      username: source.kind === 'merged' ? (source.usernames[0] ?? '') : '',
    },
    skip: source.kind !== 'merged' || source.usernames.length === 0,
    onData: () => {
      void refetchCollection()
    },
    onError: () => {
      // Collection pages remain usable when subscriptions are unavailable.
    },
  })

  function clearAll() {
    setFiltersState({
      ...emptyFilters,
      sort: filters.sort,
      groupBy: filters.groupBy,
      view: filters.view,
    })
  }

  const chips: Array<{ key: string; label: string; clear: () => void }> = [
    ...(filters.q
      ? [{ key: 'q', label: `“${filters.q}”`, clear: () => setFilters({ q: '' }) }]
      : []),
    ...(filters.players
      ? [
          {
            key: 'players',
            label: `${filters.players.min}–${filters.players.max === 10 ? '10+' : filters.players.max} players`,
            clear: () => setFilters({ players: null }),
          },
        ]
      : []),
    ...filters.times.map((time) => ({
      key: `time-${time}`,
      label: timeLabels[time],
      clear: () => setFilters({ times: filters.times.filter((value) => value !== time) }),
    })),
    ...(filters.complexity
      ? [
          {
            key: 'complexity',
            label: complexityLabels[filters.complexity],
            clear: () => setFilters({ complexity: null }),
          },
        ]
      : []),
    ...filters.owners.map((owner) => ({
      key: `owner-${owner}`,
      label: `Owned by ${memberById.get(owner)?.bgg ?? owner}`,
      clear: () => setFilters({ owners: filters.owners.filter((value) => value !== owner) }),
    })),
  ]

  const loading =
    (!hasPrimarySource && currentUserQuery.loading) ||
    (source.kind === 'group' ? groupQuery.loading : source.kind === 'merged' && mergedQuery.loading)
  const error = source.kind === 'group' ? groupQuery.error : mergedQuery.error
  const showCollection = source.kind !== 'none'
  const collectionName =
    source.kind === 'group'
      ? (groupQuery.data?.group?.name ?? activeGroup.name ?? 'Group')
      : source.kind === 'merged'
        ? source.usernames.join(', ')
        : ''
  const sourceCount = source.kind === 'merged' ? source.usernames.length : members.length

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pt-24 pb-24 sm:px-6 md:pb-12">
      <aside className="hidden w-[264px] shrink-0 xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-line bg-surface px-4">
          <div className="flex items-center justify-between border-b border-line py-3">
            <h2 className="text-sm font-semibold text-ink">Filters</h2>
            {active > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <FilterPanel filters={filters} setFilters={setFilters} games={games} members={members} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 text-ink">
            {showCollection ? `${collectionName}'s collection` : 'Merged collection'}
          </h1>
          <p className="text-sm text-ink-secondary">
            {collectionName ? `${collectionName} · ` : ''}
            {sourceCount} {sourceCount === 1 ? 'member' : 'members'} · every shelf in one place
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SelectControl
              label="Sort"
              value={filters.sort}
              options={Object.entries(sortLabels).map(([value, label]) => ({
                value: value as SortKey,
                label,
              }))}
              onChange={(sort) => setFilters({ sort })}
            />

            <SelectControl
              label="Group by"
              value={filters.groupBy}
              options={Object.entries(groupByLabels).map(([value, label]) => ({
                value: value as GroupBy,
                label,
              }))}
              onChange={(groupBy) => setFilters({ groupBy })}
            />

            <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() => setFilters({ view: 'grid' })}
                aria-label="Grid view"
                aria-pressed={filters.view === 'grid'}
                className={cn(
                  'press min-h-9 min-w-9 rounded-md p-2',
                  filters.view === 'grid' ? 'bg-surface-raised text-ink' : 'text-ink-muted',
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setFilters({ view: 'list' })}
                aria-label="List view"
                aria-pressed={filters.view === 'list'}
                className={cn(
                  'press min-h-9 min-w-9 rounded-md p-2',
                  filters.view === 'list' ? 'bg-surface-raised text-ink' : 'text-ink-muted',
                )}
              >
                <List className="size-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setSheetOpen(true)}
              className="xl:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters{active > 0 ? ` (${active})` : ''}
            </Button>
          </div>

          {chips.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={chip.clear}
                    className="press inline-flex items-center gap-1 rounded-full border border-line bg-surface-raised px-2.5 py-1 text-xs text-ink-secondary hover:text-ink"
                  >
                    {chip.label}
                    <X className="size-3" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 text-xs font-medium text-primary hover:underline"
                >
                  Clear all
                </button>
              </li>
            </ul>
          )}

          <p aria-live="polite" className="text-xs text-ink-muted">
            {loading ? 'Loading collection…' : `Showing ${results.length} of ${games.length} games`}
          </p>
        </div>

        {loading ? (
          <SkeletonGrid count={12} variant={filters.view} />
        ) : error ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title="Couldn't load games"
            description="Please check your connection and try again."
            action={
              <Button onClick={() => void refetchCollection()} size="lg">
                Try again
              </Button>
            }
          />
        ) : !showCollection ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title="No group selected"
            description="Open a collection permalink, choose a group, or sign in to browse your games."
            action={
              <LinkButton to="/groups" size="lg">
                Browse groups
              </LinkButton>
            }
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title="No games found"
            description="Try adjusting filters or add a collector to see more games."
            action={
              <Button onClick={clearAll} size="lg">
                Clear filters
              </Button>
            }
          />
        ) : (
          <CollectionResults
            groups={groupedResults}
            groupBy={filters.groupBy}
            view={filters.view}
          />
        )}
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end xl:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"
          />
          <div className="relative flex max-h-[88vh] flex-col rounded-t-2xl border-t border-line bg-surface-overlay shadow-modal">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">
                Filters{active > 0 ? ` (${active} active)` : ''}
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="press rounded-lg p-2 text-ink-secondary hover:bg-surface-raised"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <FilterPanel filters={filters} setFilters={setFilters} games={games} members={members} />
            </div>
            <div className="flex items-center gap-2 border-t border-line px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Button variant="ghost" size="lg" onClick={clearAll} className="flex-1">
                Reset
              </Button>
              <Button size="lg" onClick={() => setSheetOpen(false)} className="flex-[2]">
                Show {results.length} games
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CardList({ games, view }: { games: Game[]; view: Filters['view'] }) {
  return (
    <div
      className={cn(
        view === 'grid'
          ? 'grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))]'
          : 'grid grid-cols-1 gap-4',
      )}
    >
      {games.map((game, index) => (
        <GameCard
          key={game.id}
          game={game}
          variant={view}
          className="fade-up"
          style={{ animationDelay: `${Math.min(index * 80, 640)}ms` }}
        />
      ))}
    </div>
  )
}

function CollectionGroup({ group, view }: { group: GameGroup; view: Filters['view'] }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="grid gap-4">
      <h2 className="text-base font-semibold text-ink">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-lg bg-surface-raised px-3 py-2 text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span>
            {group.label} <span className="text-sm font-normal text-ink-muted">({group.games.length})</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
        </button>
      </h2>
      {open && <CardList games={group.games} view={view} />}
    </section>
  )
}

function CollectionResults({
  groups,
  groupBy,
  view,
}: {
  groups: GameGroup[]
  groupBy: GroupBy
  view: Filters['view']
}) {
  if (groupBy === 'none') return <CardList games={groups[0]?.games ?? []} view={view} />

  return (
    <div className="grid gap-8">
      {groups.map((group) => (
        <CollectionGroup key={group.key} group={group} view={view} />
      ))}
    </div>
  )
}
