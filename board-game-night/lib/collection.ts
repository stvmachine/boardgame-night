import type { Game } from '@/lib/data'

export type TimeBucket = '<30' | '30-60' | '60-90' | '90+'
export type SortKey = 'name' | 'rating' | 'players' | 'time' | 'recent'

export type Filters = {
  q: string
  players: number[]
  times: TimeBucket[]
  weight: [number, number]
  rating: number
  categories: string[]
  owners: string[]
  sort: SortKey
}

export const emptyFilters: Filters = {
  q: '',
  players: [],
  times: [],
  weight: [1, 5],
  rating: 0,
  categories: [],
  owners: [],
  sort: 'name',
}

export const timeLabels: Record<TimeBucket, string> = {
  '<30': 'Under 30m',
  '30-60': '30–60m',
  '60-90': '60–90m',
  '90+': '90m+',
}

export function inTimeBucket(minutes: number, bucket: TimeBucket) {
  if (bucket === '<30') return minutes < 30
  if (bucket === '30-60') return minutes >= 30 && minutes <= 60
  if (bucket === '60-90') return minutes > 60 && minutes <= 90
  return minutes > 90
}

type Facet = keyof Filters

/** AND across facets, OR within a facet. Pass `skip` to exclude one facet (for counts). */
export function matches(game: Game, f: Filters, skip?: Facet) {
  if (skip !== 'q' && f.q.trim()) {
    const q = f.q.trim().toLowerCase()
    const hit =
      game.title.toLowerCase().includes(q) ||
      game.categories.some((c) => c.toLowerCase().includes(q))
    if (!hit) return false
  }
  if (skip !== 'players' && f.players.length) {
    const hit = f.players.some((p) => p >= game.minPlayers && p <= game.maxPlayers)
    if (!hit) return false
  }
  if (skip !== 'times' && f.times.length) {
    if (!f.times.some((t) => inTimeBucket(game.minutes, t))) return false
  }
  if (skip !== 'weight') {
    if (game.weight < f.weight[0] || game.weight > f.weight[1]) return false
  }
  if (skip !== 'rating' && f.rating > 0) {
    if (game.rating < f.rating) return false
  }
  if (skip !== 'categories' && f.categories.length) {
    if (!f.categories.some((c) => game.categories.includes(c))) return false
  }
  if (skip !== 'owners' && f.owners.length) {
    if (!f.owners.some((o) => game.owners.includes(o))) return false
  }
  return true
}

export function applyFilters(games: Game[], f: Filters) {
  const list = games.filter((g) => matches(g, f))
  const sorted = [...list]
  switch (f.sort) {
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating)
      break
    case 'players':
      sorted.sort((a, b) => a.maxPlayers - b.maxPlayers || a.minPlayers - b.minPlayers)
      break
    case 'time':
      sorted.sort((a, b) => a.minutes - b.minutes)
      break
    case 'recent':
      sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      break
    default:
      sorted.sort((a, b) => a.title.localeCompare(b.title))
  }
  return sorted
}

/** Count of games that would match if `value` were the only extra constraint in `facet`. */
export function facetCount(
  games: Game[],
  f: Filters,
  facet: Facet,
  predicate: (g: Game) => boolean,
) {
  return games.filter((g) => matches(g, f, facet) && predicate(g)).length
}

export function activeCount(f: Filters) {
  return (
    (f.q.trim() ? 1 : 0) +
    f.players.length +
    f.times.length +
    f.categories.length +
    f.owners.length +
    (f.rating > 0 ? 1 : 0) +
    (f.weight[0] !== 1 || f.weight[1] !== 5 ? 1 : 0)
  )
}

export function toParams(f: Filters) {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.players.length) p.set('players', f.players.join(','))
  if (f.times.length) p.set('time', f.times.join(','))
  if (f.weight[0] !== 1 || f.weight[1] !== 5) p.set('weight', f.weight.join('-'))
  if (f.rating) p.set('rating', String(f.rating))
  if (f.categories.length) p.set('cat', f.categories.join(','))
  if (f.owners.length) p.set('owner', f.owners.join(','))
  if (f.sort !== 'name') p.set('sort', f.sort)
  return p.toString()
}

export function fromParams(sp: URLSearchParams): Filters {
  const weightRaw = sp.get('weight')?.split('-').map(Number)
  return {
    q: sp.get('q') ?? '',
    players: (sp.get('players') ?? '')
      .split(',')
      .filter(Boolean)
      .map(Number),
    times: (sp.get('time') ?? '').split(',').filter(Boolean) as TimeBucket[],
    weight:
      weightRaw && weightRaw.length === 2 && weightRaw.every((n) => !Number.isNaN(n))
        ? [weightRaw[0], weightRaw[1]]
        : [1, 5],
    rating: Number(sp.get('rating') ?? 0) || 0,
    categories: (sp.get('cat') ?? '').split(',').filter(Boolean),
    owners: (sp.get('owner') ?? '').split(',').filter(Boolean),
    sort: (sp.get('sort') as SortKey) ?? 'name',
  }
}
