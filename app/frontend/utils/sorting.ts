import type { MergedThing } from '@/generated/operations'

export type SortOption = 'name_asc' | 'rating_desc' | 'weight_asc' | 'recently_played'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'rating_desc', label: 'Rating High–Low' },
  { value: 'weight_asc', label: 'Weight Light–Heavy' },
  { value: 'recently_played', label: 'Recently Played' }
]

function compareNames(a: MergedThing, b: MergedThing): number {
  return a.name.localeCompare(b.name) || String(a.id).localeCompare(String(b.id))
}

function lastPlayedTime(thing: MergedThing): number | null {
  const value = thing.lastPlayedAt
  if (value == null) return null

  const time = typeof value === 'string' ? Date.parse(value) : NaN
  return Number.isNaN(time) ? null : time
}

export function sortGames(games: MergedThing[], sort: SortOption): MergedThing[] {
  const sorted = [...games]

  switch (sort) {
    case 'name_asc':
      return sorted.sort(compareNames)

    case 'rating_desc': {
      return sorted.sort((a, b) => {
        const aRating = a.average
        const bRating = b.average

        if (aRating == null && bRating == null) return compareNames(a, b)
        if (aRating == null) return 1
        if (bRating == null) return -1

        return bRating - aRating || compareNames(a, b)
      })
    }

    case 'weight_asc': {
      return sorted.sort((a, b) => {
        const aWeight = a.averageWeight
        const bWeight = b.averageWeight

        if (aWeight == null && bWeight == null) return compareNames(a, b)
        if (aWeight == null) return 1
        if (bWeight == null) return -1

        return aWeight - bWeight || compareNames(a, b)
      })
    }

    case 'recently_played': {
      return sorted.sort((a, b) => {
        const aDate = lastPlayedTime(a)
        const bDate = lastPlayedTime(b)

        if (aDate == null && bDate == null) return compareNames(a, b)
        if (aDate == null) return 1
        if (bDate == null) return -1

        return bDate - aDate || compareNames(a, b)
      })
    }

    default:
      return sorted
  }
}
