import type { MergedThing } from '@/generated/operations'

export type GroupOption = 'none' | 'players' | 'rating' | 'bestPlayers' | 'owner'

export interface GameGroup {
  name: string
  games: MergedThing[]
}

export const GROUP_OPTIONS: { value: GroupOption; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'players', label: 'Number of Players' },
  { value: 'rating', label: 'Rating Range' },
  { value: 'bestPlayers', label: 'Best with X Players' },
  { value: 'owner', label: 'Owner' }
]

export function groupGames(games: MergedThing[], groupBy: GroupOption): GameGroup[] {
  if (groupBy === 'none') {
    return [{ name: 'All Games', games }]
  }

  const groups = new Map<string, MergedThing[]>()

  for (const game of games) {
    const key = groupKey(game, groupBy)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(game)
  }

  const entries = Array.from(groups.entries())
  return entries
    .map(([name, groupGames]) => ({ name, games: groupGames }))
    .sort((a, b) => groupSort(a, b, groupBy))
}

function groupKey(game: MergedThing, groupBy: GroupOption): string {
  switch (groupBy) {
    case 'players':
      return playerRange(game)
    case 'rating':
      return ratingBucket(game)
    case 'bestPlayers':
      return bestPlayers(game)
    case 'owner':
      return game.owners.map(o => o.bggUsername).sort().join(', ') || 'Unknown'
    default:
      return 'All Games'
  }
}

function playerRange(game: MergedThing): string {
  const min = game.minPlayers ?? 1
  const max = game.maxPlayers ?? min
  if (min === max) return `${min} players`
  return `${min}–${max} players`
}

function ratingBucket(game: MergedThing): string {
  const rating = game.average ?? 0
  if (rating === 0) return 'Unrated'
  if (rating >= 9) return '9.0+'
  if (rating >= 8) return '8.0–8.9'
  if (rating >= 7) return '7.0–7.9'
  if (rating >= 6) return '6.0–6.9'
  return 'Below 6.0'
}

function bestPlayers(game: MergedThing): string {
  const min = game.minPlayers ?? 1
  const max = game.maxPlayers ?? min
  // Upper two-thirds of the player range, rounded down
  const best = Math.max(min, Math.floor(min + (max - min) * 0.67))
  return `Best with ${best}`
}

function groupSort(a: GameGroup, b: GameGroup, groupBy: GroupOption): number {
  if (groupBy === 'players') return playerSort(a.name) - playerSort(b.name)
  if (groupBy === 'rating') return ratingSort(a.name) - ratingSort(b.name)
  if (groupBy === 'bestPlayers') return playerSort(a.name) - playerSort(b.name)
  return a.name.localeCompare(b.name)
}

function playerSort(name: string): number {
  const match = name.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

export function ratingSort(name: string): number {
  const order = ['9.0+', '8.0–8.9', '7.0–7.9', '6.0–6.9', 'Below 6.0', 'Unrated']
  const index = order.indexOf(name)
  return index === -1 ? 999 : index
}
