import {
  LayoutGrid,
  List,
  Search,
  SearchX,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useSubscription } from '@apollo/client'
import { FilterPanel } from '@/components/collection/filter-panel'
import { GameCard, SkeletonGrid } from '@/components/game-card'
import { CategoryPill, EmptyState, MemberAvatar } from '@/components/primitives'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import {
  activeCount,
  applyFilters,
  emptyFilters,
  fromParams,
  timeLabels,
  toParams,
  type Filters,
  type SortKey,
} from '@/lib/collection'
import { MERGED_COLLECTION, COLLECTION_SYNCED, CURRENT_USER } from '@/lib/graphql/documents'
import { toGame } from '@/lib/graphql/adapters'
import type { GqlMergedCollection } from '@/lib/graphql/types'
import { cn } from '@/lib/utils'
import type { Member, Game } from '@/lib/data'
import { useActiveGroup } from '@/contexts/ActiveGroupContext'

const COLOR_PALETTE = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
] as const

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

function buildMembersFromCollection(collection: GqlMergedCollection): Member[] {
  const seen = new Set<string>()
  const result: Member[] = []
  for (const item of collection.items) {
    for (const owner of item.owners) {
      if (!seen.has(owner.bggUsername)) {
        seen.add(owner.bggUsername)
        result.push({
          id: owner.bggUsername,
          name: owner.bggUsername,
          bgg: owner.bggUsername,
          color: stringToColor(owner.bggUsername),
          online: true,
        })
      }
    }
  }
  return result
}

const sortLabels: Record<SortKey, string> = {
  name: 'Name (A–Z)',
  rating: 'Rating (high to low)',
  players: 'Player count',
  time: 'Play time',
  recent: 'Recently added',
}

export function CollectionBrowser() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { name: groupName, bggUsernames } = useActiveGroup()
  const permalinkUsernamesParam = searchParams.get('usernames') ?? ''
  const groupParam = searchParams.get('group') ?? ''
  const permalinkUsernames = useMemo(() => {
    const seen = new Set<string>()

    return permalinkUsernamesParam
      .split(',')
      .map((username) => username.trim())
      .filter((username) => {
        const normalized = username.toLocaleLowerCase()
        if (!normalized || seen.has(normalized)) return false
        seen.add(normalized)
        return true
      })
  }, [permalinkUsernamesParam])

  // Fall back to logged-in user's own BGG username when no group context exists
  const { data: userData } = useQuery(CURRENT_USER)
  const currentUserBgg = userData?.currentUser?.bggUsername as string | undefined

  const hasPermalinkUsernames = permalinkUsernames.length > 0
  const hasGroupContext = bggUsernames.length > 0
  const hasUserFallback = !hasPermalinkUsernames && !hasGroupContext && !!currentUserBgg
  const usernames = hasPermalinkUsernames
    ? permalinkUsernames
    : hasGroupContext
      ? bggUsernames
      : hasUserFallback
        ? [currentUserBgg]
        : []
  const collectionName = hasPermalinkUsernames
    ? permalinkUsernames.join(', ')
    : hasGroupContext
      ? groupName
      : hasUserFallback
        ? currentUserBgg
        : ''
  const showCollection = hasPermalinkUsernames || hasGroupContext || hasUserFallback

  const { data, loading, refetch } = useQuery(MERGED_COLLECTION, {
    variables: { usernames },
    skip: !showCollection,
  })

  // Subscribe to real-time collection sync updates
  // When a member's BGG import completes, refetch the merged collection
  useSubscription(COLLECTION_SYNCED, {
    variables: { username: usernames[0] || '' },
    skip: !showCollection || usernames.length === 0,
    onData: () => {
      refetch()
    },
    onError: () => {
      // Silently ignore — server may not support subscriptions yet
    },
  })

  const games: Game[] = useMemo(
    () => (data?.mergedCollection?.items ?? []).map(toGame),
    [data],
  )
  const members: Member[] = useMemo(
    () => (data?.mergedCollection ? buildMembersFromCollection(data.mergedCollection) : []),
    [data],
  )
  const memberById = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m]))
    return (id: string) => map.get(id)
  }, [members])

  const [filters, setFiltersState] = useState<Filters>(() =>
    fromParams(new URLSearchParams(searchParams.toString())),
  )
  const [searchDraft, setSearchDraft] = useState(filters.q)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      setFiltersState((f) => (f.q === searchDraft ? f : { ...f, q: searchDraft }))
    }, 300)
    return () => clearTimeout(id)
  }, [searchDraft])

  useEffect(() => {
    const nextParams = new URLSearchParams(toParams(filters))
    if (permalinkUsernamesParam) nextParams.set('usernames', permalinkUsernamesParam)
    if (groupParam) nextParams.set('group', groupParam)

    const qs = nextParams.toString()
    navigate(qs ? `/collection?${qs}` : '/collection', { replace: true })
  }, [filters, groupParam, navigate, permalinkUsernamesParam])

  const setFilters = (next: Partial<Filters>) => setFiltersState((f) => ({ ...f, ...next }))

  const results = useMemo(() => applyFilters(games, filters), [games, filters])
  const active = activeCount(filters)

  function clearAll() {
    setFiltersState({ ...emptyFilters, sort: filters.sort })
    setSearchDraft('')
  }

  const chips: { key: string; label: string; clear: () => void }[] = [
    ...(filters.q
      ? [
          {
            key: 'q',
            label: `"${filters.q}"`,
            clear: () => {
              setSearchDraft('')
              setFilters({ q: '' })
            },
          },
        ]
      : []),
    ...filters.players.map((p) => ({
      key: `p${p}`,
      label: `${p === 6 ? '6+' : p} players`,
      clear: () => setFilters({ players: filters.players.filter((x) => x !== p) }),
    })),
    ...filters.times.map((t) => ({
      key: `t${t}`,
      label: timeLabels[t],
      clear: () => setFilters({ times: filters.times.filter((x) => x !== t) }),
    })),
    ...(filters.weight[0] !== 1 || filters.weight[1] !== 5
      ? [
          {
            key: 'w',
            label: `Weight ${filters.weight[0]}–${filters.weight[1]}`,
            clear: () => setFilters({ weight: [1, 5] as [number, number] }),
          },
        ]
      : []),
    ...(filters.rating
      ? [
          {
            key: 'r',
            label: `${filters.rating}.0+ rating`,
            clear: () => setFilters({ rating: 0 }),
          },
        ]
      : []),
    ...filters.categories.map((c) => ({
      key: `c${c}`,
      label: c,
      clear: () => setFilters({ categories: filters.categories.filter((x) => x !== c) }),
    })),
    ...filters.owners.map((o) => ({
      key: `o${o}`,
      label: `Owned by ${memberById(o)?.name ?? o}`,
      clear: () => setFilters({ owners: filters.owners.filter((x) => x !== o) }),
    })),
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pt-24 pb-24 sm:px-6 md:pb-12">
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-line bg-surface px-4 py-2">
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
          <h1 className="text-h1 text-ink">{showCollection ? `${collectionName}'s collection` : 'Merged collection'}</h1>
          <p className="text-sm text-ink-secondary">
            {collectionName ? `${collectionName} · ` : ''}{usernames.length} {usernames.length === 1 ? 'member' : 'members'} &middot; every shelf in one place
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-primary">
              <Search className="size-4 shrink-0 text-ink-muted" />
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search games..."
                aria-label="Search games"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => setSearchDraft('')}
                  aria-label="Clear search"
                  className="text-ink-muted hover:text-ink"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <label className="sr-only" htmlFor="sort">
              Sort games
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => setFilters({ sort: e.target.value as SortKey })}
              className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink-secondary focus:border-primary focus:outline-none"
            >
              {Object.entries(sortLabels).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                className={cn(
                  'press rounded-md p-1.5',
                  view === 'grid' ? 'bg-surface-raised text-ink' : 'text-ink-muted',
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                aria-label="List view"
                aria-pressed={view === 'list'}
                className={cn(
                  'press rounded-md p-1.5',
                  view === 'list' ? 'bg-surface-raised text-ink' : 'text-ink-muted',
                )}
              >
                <List className="size-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setSheetOpen(true)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters{active > 0 ? ` (${active})` : ''}
            </Button>
          </div>

          {chips.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5">
              {chips.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={c.clear}
                    className="press inline-flex items-center gap-1 rounded-full border border-line bg-surface-raised px-2.5 py-1 text-xs text-ink-secondary hover:text-ink"
                  >
                    {c.label}
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
            {loading
              ? 'Loading collection\u2026'
              : `Showing ${results.length} of ${games.length} games`}
          </p>
        </div>

        {loading ? (
          <SkeletonGrid count={12} />
        ) : !showCollection ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title="No group selected"
            description="Visit a group page first to view its merged collection."
            action={
              <LinkButton to="/groups" size="lg">
                Browse groups
              </LinkButton>
            }
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title="No games match your current filters"
            description="Try widening the player count or clearing a couple of facets — your shelf still has 12 games waiting."
            action={
              <Button onClick={clearAll} size="lg">
                Clear filters
              </Button>
            }
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))]">
            {results.map((g, i) => (
              <GameCard
                key={g.id}
                game={g}
                className="fade-up"
                style={{ animationDelay: `${Math.min(i * 80, 640)}ms` }}
              />
            ))}
          </div>
        ) : (
          <ListView ids={results.map((g) => g.id)} games={games} members={members} />
        )}
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
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
                className="press rounded-lg p-1.5 text-ink-secondary hover:bg-surface-raised"
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

function ListView({ ids, games, members }: { ids: string[]; games: Game[]; members: Member[] }) {
  const rows = ids.map((id) => games.find((g) => g.id === id)!)
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th className="px-3 py-2 font-medium">Game</th>
            <th className="px-3 py-2 font-medium">Players</th>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Weight</th>
            <th className="px-3 py-2 font-medium">Rating</th>
            <th className="px-3 py-2 font-medium">Categories</th>
            <th className="px-3 py-2 font-medium">Owners</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id} className="border-b border-line/60 last:border-b-0 hover:bg-surface-raised">
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="relative size-9 shrink-0 overflow-hidden rounded">
                    <img
                      src={g.cover || '/placeholder.svg'}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-medium text-ink">{g.title}</span>
                </div>
              </td>
              <td className="px-3 py-2 font-mono text-xs text-ink-secondary">
                {g.minPlayers}–{g.maxPlayers}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-ink-secondary">{g.minutes}m</td>
              <td className="px-3 py-2 font-mono text-xs text-ink-secondary">
                {g.weight.toFixed(1)}
              </td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1 font-mono text-xs text-ink">
                  <Star className="size-3 fill-yellow-500 text-star" />
                  {g.rating.toFixed(1)}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="flex flex-wrap gap-1">
                  {g.categories.slice(0, 2).map((c) => (
                    <CategoryPill key={c}>{c}</CategoryPill>
                  ))}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="flex">
                  {g.owners.map((o) => {
                    const m = members.find((x) => x.id === o)
                    return m ? (
                      <span key={o} className="-ml-1.5 first:ml-0">
                        <MemberAvatar member={{ ...m, online: false }} size="sm" />
                      </span>
                    ) : null
                  })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
