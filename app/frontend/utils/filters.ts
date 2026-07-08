import type { MergedThing } from '@/generated/operations'

export function playerCountFilter(game: MergedThing, count: number): boolean {
  if (game.minPlayers == null || game.maxPlayers == null) return false
  return game.minPlayers <= count && count <= game.maxPlayers
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
