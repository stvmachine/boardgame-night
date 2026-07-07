import type { MergedThing } from '@/generated/operations'

export type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'rating_asc'
  | 'rating_desc'
  | 'year_asc'
  | 'year_desc'
  | 'weight_asc'
  | 'weight_desc'
  | 'complexity_asc'
  | 'complexity_desc'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'name_desc', label: 'Name: Z–A' },
  { value: 'rating_asc', label: 'Rating: Lowest first' },
  { value: 'rating_desc', label: 'Rating: Highest first' },
  { value: 'year_asc', label: 'Year: Oldest first' },
  { value: 'year_desc', label: 'Year: Newest first' },
  { value: 'weight_asc', label: 'Weight: Light → Heavy' },
  { value: 'weight_desc', label: 'Weight: Heavy → Light' }
]

export function sortGames(games: MergedThing[], sort: SortOption): MergedThing[] {
  const sorted = [...games]

  switch (sort) {
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case 'rating_asc':
      return sorted.sort((a, b) => (a.average ?? 0) - (b.average ?? 0))
    case 'rating_desc':
      return sorted.sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
    case 'year_asc':
      return sorted.sort((a, b) => (a.yearPublished ?? 0) - (b.yearPublished ?? 0))
    case 'year_desc':
      return sorted.sort((a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0))
    case 'weight_asc':
    case 'complexity_asc':
      return sorted.sort((a, b) => (a.averageWeight ?? 0) - (b.averageWeight ?? 0))
    case 'weight_desc':
    case 'complexity_desc':
      return sorted.sort((a, b) => (b.averageWeight ?? 0) - (a.averageWeight ?? 0))
    default:
      return sorted
  }
}
