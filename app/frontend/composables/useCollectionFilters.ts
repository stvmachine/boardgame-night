import { ref, computed, type Ref } from 'vue'
import { useDebounce } from '@vueuse/core'
import { createFuseIndex, searchFuse, type FuseSearchableGame } from '@/utils/fuseSearch'
import { playerRangeFilter, playtimeFilter, complexityFilter, ratingFilter } from '@/utils/filters'
import type { MergedThing } from '@/generated/operations'
import type { PlayerRange } from '@/stores/filters'

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
  { value: 3, label: 'Heavy', min: 3, max: Infinity }
]

export interface UseCollectionFiltersOptions {
  initialSelectedOwners?: Set<string> | string[]
  initialPlayerRange?: PlayerRange | null
  initialSelectedTimeBuckets?: Set<number> | number[]
  initialComplexityBucket?: number | null
  initialRatingMin?: number | null
  query?: Ref<string>
  playerRange?: Ref<PlayerRange | null>
  selectedTimeBuckets?: Ref<Set<number>>
  complexityBucket?: Ref<number | null>
  ratingMin?: Ref<number | null>
  selectedOwners?: Ref<Set<string>>
}

export function useCollectionFilters(
  games: Ref<MergedThing[]>,
  options: UseCollectionFiltersOptions = {}
) {
  const playerRange = options.playerRange ?? ref<PlayerRange | null>(options.initialPlayerRange ?? null)
  const selectedTimeBuckets = options.selectedTimeBuckets ?? ref<Set<number>>(
    new Set(options.initialSelectedTimeBuckets ?? [])
  )
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

    if (playerRange.value != null) {
      result = result.filter(game => playerRangeFilter(game, playerRange.value))
    }

    if (selectedTimeBuckets.value.size > 0) {
      result = result.filter(game =>
        Array.from(selectedTimeBuckets.value).some(value => {
          const bucket = TIME_BUCKETS.find(b => b.value === value)
          return bucket ? playtimeFilter(game, { min: bucket.min, max: bucket.max }) : false
        })
      )
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
    playerRange.value = null
    selectedTimeBuckets.value = new Set()
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
    playerRange,
    selectedTimeBuckets,
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
