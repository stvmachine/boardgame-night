import { ref, computed, type Ref } from 'vue'
import { useDebounce } from '@vueuse/core'
import { createFuseIndex, searchFuse, type FuseSearchableGame } from '@/utils/fuseSearch'
import { playerCountFilter, playtimeFilter, complexityFilter, ratingFilter } from '@/utils/filters'
import type { MergedThing } from '@/generated/operations'

export interface TimeBucket {
  value: number
  label: string
  min: number
  max: number
}

export interface ComplexityBucket {
  value: number
  label: string
  min: number
  max: number
}

export const TIME_BUCKETS: TimeBucket[] = [
  { value: 1, label: '≤30 min', min: 0, max: 30 },
  { value: 2, label: '30–60 min', min: 30, max: 60 },
  { value: 3, label: '60–120 min', min: 60, max: 120 },
  { value: 4, label: '120–180 min', min: 120, max: 180 },
  { value: 5, label: '180–240 min', min: 180, max: 240 },
  { value: 6, label: '240+ min', min: 240, max: Infinity }
]

export const COMPLEXITY_BUCKETS: ComplexityBucket[] = [
  { value: 1, label: 'Light', min: 0, max: 2 },
  { value: 2, label: 'Medium', min: 2, max: 3 },
  { value: 3, label: 'Medium-Heavy', min: 3, max: 4 },
  { value: 4, label: 'Heavy', min: 4, max: Infinity }
]

export interface UseCollectionFiltersOptions {
  initialSelectedOwners?: Set<string> | string[]
  initialTimeBucket?: number | null
  initialComplexityBucket?: number | null
  initialRatingMin?: number | null
  query?: Ref<string>
  playerCount?: Ref<number | null>
  timeBucket?: Ref<number | null>
  complexityBucket?: Ref<number | null>
  ratingMin?: Ref<number | null>
  selectedOwners?: Ref<Set<string>>
}

export function useCollectionFilters(
  games: Ref<MergedThing[]>,
  options: UseCollectionFiltersOptions = {}
) {
  const playerCount = options.playerCount ?? ref<number | null>(null)
  const timeBucket = options.timeBucket ?? ref<number | null>(options.initialTimeBucket ?? null)
  const complexityBucket = options.complexityBucket ?? ref<number | null>(options.initialComplexityBucket ?? null)
  const ratingMin = options.ratingMin ?? ref<number | null>(options.initialRatingMin ?? null)
  const query = options.query ?? ref('')

  const initialOwners = options.initialSelectedOwners
    ? Array.from(options.initialSelectedOwners)
    : []
  const selectedOwners = options.selectedOwners ?? ref<Set<string>>(new Set(initialOwners))

  const debouncedQuery = useDebounce(query, 300)

  const fuseIndex = computed(() => createFuseIndex(games.value as FuseSearchableGame[]))

  const filteredGames = computed(() => {
    let result: MergedThing[] = games.value

    const q = debouncedQuery.value.trim()
    if (q) {
      result = searchFuse(fuseIndex.value, q) as MergedThing[]
    }

    if (playerCount.value != null) {
      result = result.filter(game => playerCountFilter(game, playerCount.value!))
    }

    if (timeBucket.value != null) {
      const bucket = TIME_BUCKETS.find(b => b.value === timeBucket.value)
      if (bucket) {
        result = result.filter(game => playtimeFilter(game, { min: bucket.min, max: bucket.max }))
      }
    }

    if (complexityBucket.value != null) {
      const bucket = COMPLEXITY_BUCKETS.find(b => b.value === complexityBucket.value)
      if (bucket) {
        result = result.filter(game => complexityFilter(game, { min: bucket.min, max: bucket.max }))
      }
    }

    if (ratingMin.value != null) {
      result = result.filter(game => ratingFilter(game, ratingMin.value!))
    }

    if (selectedOwners.value.size > 0) {
      result = result.filter(game =>
        game.owners.some(owner => selectedOwners.value.has(owner.bggUsername))
      )
    }

    return result
  })

  function clearFilters() {
    playerCount.value = null
    timeBucket.value = null
    complexityBucket.value = null
    ratingMin.value = null
    query.value = ''
  }

  function clearOwners() {
    selectedOwners.value.clear()
  }

  function selectAllOwners(owners: string[]) {
    selectedOwners.value = new Set(owners)
  }

  return {
    playerCount,
    timeBucket,
    complexityBucket,
    ratingMin,
    query,
    debouncedQuery,
    selectedOwners,
    filteredGames,
    clearFilters,
    clearOwners,
    selectAllOwners
  }
}
