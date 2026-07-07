import { ref, computed, type Ref } from 'vue'
import { useDebounce } from '@vueuse/core'
import { createFuseIndex, searchFuse, type FuseSearchableGame } from '@/utils/fuseSearch'
import { playerCountFilter, playtimeFilter } from '@/utils/filters'
import type { MergedThing } from '@/generated/operations'

export interface UseCollectionFiltersOptions {
  initialSelectedOwners?: Set<string> | string[]
}

export function useCollectionFilters(
  games: Ref<MergedThing[]>,
  options: UseCollectionFiltersOptions = {}
) {
  const playerCount = ref<number | null>(null)
  const playtimeMin = ref<number | null>(null)
  const playtimeMax = ref<number | null>(null)
  const ratingMin = ref<number | null>(null)
  const weightMin = ref<number | null>(null)
  const weightMax = ref<number | null>(null)
  const query = ref('')

  const initialOwners = options.initialSelectedOwners
    ? Array.from(options.initialSelectedOwners)
    : []
  const selectedOwners = ref<Set<string>>(new Set(initialOwners))

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

    if (playtimeMin.value != null && playtimeMax.value != null) {
      result = result.filter(game =>
        playtimeFilter(game, { min: playtimeMin.value!, max: playtimeMax.value! })
      )
    }

    if (ratingMin.value != null) {
      result = result.filter(game => (game.average ?? 0) >= ratingMin.value!)
    }

    if (weightMin.value != null && weightMax.value != null) {
      result = result.filter(game => {
        const weight = game.averageWeight ?? 0
        return weight >= weightMin.value! && weight <= weightMax.value!
      })
    }

    if (selectedOwners.value.size > 0) {
      result = result.filter(game =>
        game.owners.some(owner => selectedOwners.value.has(owner.bggUsername))
      )
    }

    return result
  })

  return {
    playerCount,
    playtimeMin,
    playtimeMax,
    ratingMin,
    weightMin,
    weightMax,
    query,
    debouncedQuery,
    selectedOwners,
    filteredGames,
  }
}
