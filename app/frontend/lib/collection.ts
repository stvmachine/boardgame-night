import type { Game } from '@/lib/data'

export type PlayerRange = { min: number; max: number }
export type TimeBucket = 1 | 2 | 3 | 4
export type Complexity = 1 | 2 | 3
export type SortKey = 'name' | 'rating' | 'weight' | 'recent'
export type GroupBy = 'none' | 'players' | 'rating' | 'bestPlayers' | 'owner'
export type ViewMode = 'grid' | 'list'

export type Filters = {
  q: string
  players: PlayerRange | null
  times: TimeBucket[]
  complexity: Complexity | null
  owners: string[]
  sort: SortKey
  groupBy: GroupBy
  view: ViewMode
}

export const sortLabels: Record<SortKey, string> = {
  name: 'Name A–Z',
  rating: 'Rating High–Low',
  weight: 'Weight Light–Heavy',
  recent: 'Recently Played',
}

export const timeLabels: Record<TimeBucket, string> = {
  1: 'Under 30 min',
  2: '30–60 min',
  3: '1–2 hrs',
  4: '2+ hrs',
}

export const complexityLabels: Record<Complexity, string> = {
  1: 'Light',
  2: 'Medium',
  3: 'Heavy',
}

export const groupByLabels: Record<GroupBy, string> = {
  none: 'None',
  players: 'Number of Players',
  rating: 'Rating',
  bestPlayers: 'Best player count',
  owner: 'Owner',
}

export const emptyFilters: Filters = {
  q: '',
  players: null,
  times: [],
  complexity: null,
  owners: [],
  sort: 'name',
  groupBy: 'none',
  view: 'grid',
}

export function inTimeBucket(minutes: number, bucket: TimeBucket) {
  if (bucket === 1) return minutes < 30
  if (bucket === 2) return minutes >= 30 && minutes <= 60
  if (bucket === 3) return minutes > 60 && minutes < 120
  return minutes >= 120
}

type Facet = keyof Filters

function isFullPlayerRange(range: PlayerRange) {
  return range.min === 1 && range.max === 10
}

function matchesComplexity(weight: number, complexity: Complexity) {
  if (complexity === 1) return weight < 2
  if (complexity === 2) return weight >= 2 && weight < 3
  return weight >= 3
}

/** AND across facets, OR within a facet. Pass `skip` to exclude one facet (for counts). */
export function matches(game: Game, filters: Filters, skip?: Facet) {
  if (skip !== 'q' && filters.q.trim()) {
    const query = filters.q.trim().toLowerCase()
    const hit =
      game.title.toLowerCase().includes(query) ||
      game.categories.some((category) => category.toLowerCase().includes(query))
    if (!hit) return false
  }

  if (
    skip !== 'players' &&
    filters.players &&
    !isFullPlayerRange(filters.players) &&
    (game.minPlayers > filters.players.min || game.maxPlayers < filters.players.max)
  ) {
    return false
  }

  if (
    skip !== 'times' &&
    filters.times.length > 0 &&
    !filters.times.some((bucket) => inTimeBucket(game.minutes, bucket))
  ) {
    return false
  }

  if (
    skip !== 'complexity' &&
    filters.complexity != null &&
    !matchesComplexity(game.weight, filters.complexity)
  ) {
    return false
  }

  if (
    skip !== 'owners' &&
    filters.owners.length > 0 &&
    !filters.owners.some((owner) => game.owners.includes(owner))
  ) {
    return false
  }

  return true
}

function compareNames(a: Game, b: Game) {
  return a.title.localeCompare(b.title) || String(a.id).localeCompare(String(b.id))
}

function lastPlayedTime(game: Game) {
  const value = (game as Game & { lastPlayedAt?: string | null }).lastPlayedAt
  if (!value) return null

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

export function applyFilters(games: Game[], filters: Filters) {
  const sorted = games.filter((game) => matches(game, filters))

  switch (filters.sort) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating || compareNames(a, b))
    case 'weight':
      return sorted.sort((a, b) => a.weight - b.weight || compareNames(a, b))
    case 'recent':
      return sorted.sort((a, b) => {
        const aDate = lastPlayedTime(a)
        const bDate = lastPlayedTime(b)

        if (aDate == null && bDate == null) return compareNames(a, b)
        if (aDate == null) return 1
        if (bDate == null) return -1
        return bDate - aDate || compareNames(a, b)
      })
    default:
      return sorted.sort(compareNames)
  }
}

/** Count games that match if `predicate` is the only constraint for `facet`. */
export function facetCount(
  games: Game[],
  filters: Filters,
  facet: Facet,
  predicate: (game: Game) => boolean,
) {
  return games.filter((game) => matches(game, filters, facet) && predicate(game)).length
}

export function activeCount(filters: Filters) {
  return (
    (filters.q.trim() ? 1 : 0) +
    (filters.players && !isFullPlayerRange(filters.players) ? 1 : 0) +
    filters.times.length +
    (filters.complexity == null ? 0 : 1) +
    filters.owners.length
  )
}

function clampPlayerCount(value: number) {
  return Math.min(10, Math.max(1, Math.trunc(value)))
}

function parsePlayerRange(value: string | null): PlayerRange | null {
  if (!value) return null

  const parts = value.split('-')
  if (parts.length < 1 || parts.length > 2) return null

  const values = parts.map(Number)
  if (values.some((part) => !Number.isFinite(part))) return null

  const first = clampPlayerCount(values[0])
  const second = clampPlayerCount(values[1] ?? values[0])
  return { min: Math.min(first, second), max: Math.max(first, second) }
}

function parseTimes(value: string | null): TimeBucket[] {
  if (!value) return []

  return Array.from(
    new Set(
      value
        .split(',')
        .map(Number)
        .filter((bucket): bucket is TimeBucket => [1, 2, 3, 4].includes(bucket)),
    ),
  )
}

function parseComplexity(value: string | null): Complexity | null {
  if (value === '4') return 3
  if (value === '1' || value === '2' || value === '3') return Number(value) as Complexity
  return null
}

const legacySortMap: Record<string, SortKey> = {
  name: 'name',
  name_asc: 'name',
  name_desc: 'name',
  rating: 'rating',
  rating_asc: 'rating',
  rating_desc: 'rating',
  year_asc: 'name',
  year_desc: 'name',
  weight: 'weight',
  weight_asc: 'weight',
  weight_desc: 'weight',
  complexity_asc: 'weight',
  complexity_desc: 'weight',
  recent: 'recent',
  recently_played: 'recent',
}

function parseGroupBy(value: string | null): GroupBy {
  if (value && ['none', 'players', 'rating', 'bestPlayers', 'owner'].includes(value)) {
    return value as GroupBy
  }
  return 'none'
}

function parseView(value: string | null): ViewMode {
  return value === 'list' ? 'list' : 'grid'
}

function parseOwners(value: string | null) {
  if (!value) return []
  return Array.from(new Set(value.split(',').map((owner) => owner.trim()).filter(Boolean)))
}

export function toParams(filters: Filters) {
  const params = new URLSearchParams()

  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.players && !isFullPlayerRange(filters.players)) {
    const { min, max } = filters.players
    params.set('players', min === max ? String(min) : `${min}-${max}`)
  }
  if (filters.times.length > 0) params.set('time', filters.times.join(','))
  if (filters.complexity != null) params.set('complexity', String(filters.complexity))
  if (filters.owners.length > 0) params.set('owners', filters.owners.join(','))
  if (filters.sort !== 'name') params.set('sort', filters.sort)
  if (filters.groupBy !== 'none') params.set('groupBy', filters.groupBy)
  if (filters.view !== 'grid') params.set('view', filters.view)

  return params.toString()
}

export function fromParams(searchParams: URLSearchParams): Filters {
  return {
    q: searchParams.get('q') ?? '',
    players: parsePlayerRange(searchParams.get('players')),
    times: parseTimes(searchParams.get('time')),
    complexity: parseComplexity(searchParams.get('complexity')),
    owners: parseOwners(searchParams.get('owners')),
    sort: legacySortMap[searchParams.get('sort') ?? 'name'] ?? 'name',
    groupBy: parseGroupBy(searchParams.get('groupBy')),
    view: parseView(searchParams.get('view')),
  }
}
