import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { SortOption } from '@/utils/sorting'
import type { GroupOption } from '@/utils/grouping'
import { useCollectorsStore } from '@/stores/collectors'

export type { SortOption, GroupOption }

export interface PlayerRange {
  min: number
  max: number
}

export type ViewMode = 'grid' | 'list'

export const useFilterStore = defineStore('filters', () => {
  // Filter state
  const query = ref('')
  const playerRange = ref<PlayerRange | null>(null)
  const selectedTimeBuckets = ref<Set<number>>(new Set())
  const complexityBucket = ref<number | null>(null)
  const ratingMin = ref<number | null>(null)
  const selectedOwners = ref<Set<string>>(new Set())

  // Legacy compatibility shims for components that have not yet migrated to the
  // new PlayerRange / Set<number> state. They project the canonical new state so
  // existing controls keep functioning without duplicating truth.
  const playerCount = computed({
    get: () => (playerRange.value ? playerRange.value.min : null),
    set: (value: number | null) => {
      playerRange.value = value != null ? { min: value, max: value } : null
    }
  })

  const timeBucket = computed({
    get: () => (selectedTimeBuckets.value.size > 0 ? Array.from(selectedTimeBuckets.value)[0] : null),
    set: (value: number | null) => {
      selectedTimeBuckets.value = value != null ? new Set([value]) : new Set()
    }
  })

  // View state
  const sort = ref<SortOption>('name_asc')
  const groupBy = ref<GroupOption>('none')
  const view = ref<ViewMode>('grid')

  const collectorsStore = useCollectorsStore()

  // Owner toggles
  function toggleOwner(username: string) {
    const next = new Set(selectedOwners.value)
    if (next.has(username)) {
      next.delete(username)
    } else {
      next.add(username)
    }
    selectedOwners.value = next
  }

  function selectAllOwners(usernames: string[]) {
    selectedOwners.value = new Set(usernames)
  }

  function deselectAllOwners() {
    selectedOwners.value = new Set()
  }

  function clearFilters() {
    query.value = ''
    playerRange.value = null
    selectedTimeBuckets.value = new Set()
    complexityBucket.value = null
    ratingMin.value = null
    selectedOwners.value = new Set(collectorsStore.usernames)
  }

  return {
    query,
    playerRange,
    playerCount,
    selectedTimeBuckets,
    timeBucket,
    complexityBucket,
    ratingMin,
    selectedOwners,
    sort,
    groupBy,
    view,
    toggleOwner,
    selectAllOwners,
    deselectAllOwners,
    clearFilters
  }
})
