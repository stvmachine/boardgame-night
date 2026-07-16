import { watch } from 'vue'
import { useFilterStore } from '@/stores/filters'
import { useCollectorsStore } from '@/stores/collectors'
import type { SortOption } from '@/utils/sorting'
import type { GroupOption } from '@/utils/grouping'

const LEGACY_GROUP_OPTIONS: GroupOption[] = ['players', 'rating', 'bestPlayers', 'owner']

const LEGACY_SORT_MAP: Record<string, SortOption> = {
  name_asc: 'name_asc',
  name_desc: 'name_asc',
  rating_asc: 'rating_desc',
  rating_desc: 'rating_desc',
  year_asc: 'name_asc',
  year_desc: 'name_asc',
  weight_asc: 'weight_asc',
  weight_desc: 'weight_asc',
  complexity_asc: 'weight_asc',
  complexity_desc: 'weight_asc'
}

function getParams() {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function replaceUrl(params: URLSearchParams) {
  if (typeof window === 'undefined') return
  const queryString = params.toString()
  const newUrl = `${window.location.pathname}${queryString ? '?' + queryString : ''}`
  window.history.replaceState(null, '', newUrl)
}

function isLegacyGroup(value: string): value is GroupOption {
  return LEGACY_GROUP_OPTIONS.includes(value as GroupOption)
}

export function usePermalink() {
  const filterStore = useFilterStore()
  const collectorsStore = useCollectorsStore()
  const params = getParams()

  // Hydrate filter state from URL
  const ownersParam = params.get('owners')
  if (ownersParam) {
    filterStore.selectedOwners = new Set(
      ownersParam.split(',').map(s => s.trim()).filter(Boolean)
    )
  }

  const q = params.get('q')
  if (q) filterStore.query = q

  const players = params.get('players')
  if (players) filterStore.playerCount = Number(players)

  const time = params.get('time')
  if (time) filterStore.timeBucket = Number(time)

  const complexity = params.get('complexity')
  if (complexity) filterStore.complexityBucket = Number(complexity)

  const ratingMin = params.get('ratingMin')
  if (ratingMin) filterStore.ratingMin = Number(ratingMin)

  const sort = params.get('sort')
  if (sort) {
    const mapped = LEGACY_SORT_MAP[sort] ?? 'name_asc'
    filterStore.sort = mapped
    if (sort !== mapped) {
      if (mapped === 'name_asc') {
        params.delete('sort')
      } else {
        params.set('sort', mapped)
      }
      replaceUrl(params)
    }
  }

  const groupBy = params.get('groupBy')
  const group = params.get('group')
  if (groupBy) {
    filterStore.groupBy = groupBy as GroupOption
  } else if (group && isLegacyGroup(group)) {
    filterStore.groupBy = group
  }

  // Initialize selectedOwners to all collectors when no owner filter is present
  if (filterStore.selectedOwners.size === 0 && collectorsStore.usernames.length > 0) {
    filterStore.selectedOwners = new Set(collectorsStore.usernames)
  }

  // Serialize state back to URL
  watch(
    () => [
      Array.from(filterStore.selectedOwners),
      filterStore.query,
      filterStore.playerCount,
      filterStore.timeBucket,
      filterStore.complexityBucket,
      filterStore.ratingMin,
      filterStore.sort,
      filterStore.groupBy
    ],
    () => {
      const params = getParams()
      const allOwners = collectorsStore.usernames
      const selected = Array.from(filterStore.selectedOwners)

      if (selected.length > 0 && selected.length < allOwners.length) {
        params.set('owners', selected.join(','))
      } else {
        params.delete('owners')
      }

      if (filterStore.query.trim()) {
        params.set('q', filterStore.query.trim())
      } else {
        params.delete('q')
      }

      if (filterStore.playerCount != null) {
        params.set('players', String(filterStore.playerCount))
      } else {
        params.delete('players')
      }

      if (filterStore.timeBucket != null) {
        params.set('time', String(filterStore.timeBucket))
      } else {
        params.delete('time')
      }

      if (filterStore.complexityBucket != null) {
        params.set('complexity', String(filterStore.complexityBucket))
      } else {
        params.delete('complexity')
      }

      if (filterStore.ratingMin != null) {
        params.set('ratingMin', String(filterStore.ratingMin))
      } else {
        params.delete('ratingMin')
      }

      if (filterStore.sort !== 'name_asc') {
        params.set('sort', filterStore.sort)
      } else {
        params.delete('sort')
      }

      // Migrate legacy grouping values from `group` to `groupBy`, preserving real group tokens.
      const groupParam = params.get('group')
      if (groupParam && isLegacyGroup(groupParam)) {
        params.delete('group')
      }

      if (filterStore.groupBy !== 'none') {
        params.set('groupBy', filterStore.groupBy)
      } else {
        params.delete('groupBy')
      }

      replaceUrl(params)
    }
  )

  // Keep selectedOwners in sync with the collector list
  watch(
    () => collectorsStore.usernames,
    (newUsernames) => {
      if (newUsernames.length === 0) {
        filterStore.selectedOwners = new Set()
      } else if (filterStore.selectedOwners.size === 0) {
        filterStore.selectedOwners = new Set(newUsernames)
      } else {
        const valid = new Set(newUsernames)
        const next = new Set<string>()
        for (const owner of filterStore.selectedOwners) {
          if (valid.has(owner)) next.add(owner)
        }
        filterStore.selectedOwners = next
      }
    },
    { deep: true }
  )
}
