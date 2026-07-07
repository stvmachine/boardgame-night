import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SortOption } from '@/utils/sorting'
import type { GroupOption } from '@/utils/grouping'

export type { SortOption, GroupOption }

export const useFilterStore = defineStore('filters', () => {
  // Filter state
  const query = ref('')
  const playerCount = ref<number | null>(null)
  const timeBucket = ref<number | null>(null)
  const complexityBucket = ref<number | null>(null)
  const ratingMin = ref<number | null>(null)
  const selectedOwners = ref<Set<string>>(new Set())

  // View state
  const sort = ref<SortOption>('name_asc')
  const groupBy = ref<GroupOption>('none')

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
    playerCount.value = null
    timeBucket.value = null
    complexityBucket.value = null
    ratingMin.value = null
  }

  return {
    query,
    playerCount,
    timeBucket,
    complexityBucket,
    ratingMin,
    selectedOwners,
    sort,
    groupBy,
    toggleOwner,
    selectAllOwners,
    deselectAllOwners,
    clearFilters
  }
})
