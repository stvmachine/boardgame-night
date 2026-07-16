import type { MergedThing } from '@/generated/operations'

export function playerCountFilter(game: MergedThing, count: number): boolean {
  if (game.minPlayers == null || game.maxPlayers == null) return false
  return game.minPlayers <= count && count <= game.maxPlayers
}

export interface PlayerRange {
  min: number
  max: number
}

export function playerRangeFilter(game: MergedThing, range: PlayerRange | null): boolean {
  if (range == null) return true
  if (game.minPlayers == null || game.maxPlayers == null) return false

  const min = Math.min(range.min, range.max)
  const max = Math.max(range.min, range.max)

  return game.minPlayers <= min && game.maxPlayers >= max
}

export function playtimeFilter(
  game: MergedThing,
  { min, max }: { min: number; max: number }
): boolean {
  if (game.minPlaytime == null || game.maxPlaytime == null) return false
  return game.minPlaytime <= max && game.maxPlaytime >= min
}

export function complexityFilter(
  game: MergedThing,
  { min, max }: { min: number; max: number }
): boolean {
  if (game.averageWeight == null) return false
  const weight = game.averageWeight
  return weight >= min && (max === Infinity ? true : weight <= max)
}

export function ratingFilter(game: MergedThing, min: number): boolean {
  if (game.average == null) return false
  return game.average >= min
}
