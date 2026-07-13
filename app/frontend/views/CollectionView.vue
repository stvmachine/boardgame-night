<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMergedCollectionQuery, useImportCollectionMutation } from '../generated/operations'
import { useCollectionFilters } from '../composables/useCollectionFilters'
import { useFilterStore } from '../stores/filters'
import { useCollectorsStore } from '../stores/collectors'
import { usePermalink } from '../composables/usePermalink'
import { sortGames } from '../utils/sorting'
import { groupGames } from '../utils/grouping'
import GameGrid from '../components/collection/GameGrid.vue'
import SortControl from '../components/collection/SortControl.vue'
import GroupByToggle from '../components/collection/GroupByToggle.vue'
import CollectionFilters from '../components/collection/CollectionFilters.vue'
import EmptyState from '../components/collection/EmptyState.vue'

const collectorsStore = useCollectorsStore()
const filterStore = useFilterStore()
const { query, playerCount, timeBucket, complexityBucket, ratingMin, selectedOwners, sort, groupBy } = storeToRefs(filterStore)
const { usernames } = storeToRefs(collectorsStore)

usePermalink()

const shouldPoll = ref(false)

const { result, loading } = useMergedCollectionQuery(
  () => ({ usernames: collectorsStore.usernames }),
  () => ({
    fetchPolicy: 'cache-and-network',
    pollInterval: shouldPoll.value ? 3000 : undefined
  })
)

const { mutate: importCollection } = useImportCollectionMutation()
const importedUsernames = ref<Set<string>>(new Set())

watch(
  () => result.value?.mergedCollection.syncStatuses,
  (syncStatuses) => {
    if (!syncStatuses) return

    shouldPoll.value = syncStatuses.some(
      (s) => s.status === 'QUEUED' || s.status === 'SYNCING'
    )

    for (const status of syncStatuses) {
      if (status.status === 'QUEUED' && !importedUsernames.value.has(status.username)) {
        importedUsernames.value.add(status.username)
        importCollection({ username: status.username }).catch(() => {
          // Mutation failed (e.g., cooldown or network). Keep the username tracked
          // so we don't auto-retry and spam the backend; user can retry manually.
        })
      }
    }
  },
  { immediate: true, deep: true }
)

const allGames = computed(() => result.value?.mergedCollection.items ?? [])

const { filteredGames } = useCollectionFilters(allGames, {
  query,
  playerCount,
  timeBucket,
  complexityBucket,
  ratingMin,
  selectedOwners
})

const sortedGames = computed(() => sortGames(filteredGames.value, filterStore.sort))
const groupedGames = computed(() => groupGames(sortedGames.value, filterStore.groupBy))

const hasActiveFilters = computed(() => {
  return query.value.trim() !== '' ||
    playerCount.value != null ||
    timeBucket.value != null ||
    complexityBucket.value != null ||
    ratingMin.value != null
})
</script>

<template>
  <div class="p-4 md:p-6 space-y-4">
    <div class="flex flex-row gap-4 items-start">
      <SortControl v-model="sort" />
      <GroupByToggle v-model="groupBy" />
    </div>

    <CollectionFilters
      v-model:query="query"
      v-model:player-count="playerCount"
      v-model:time-bucket="timeBucket"
      v-model:complexity-bucket="complexityBucket"
      v-model:rating-min="ratingMin"
    />

    <EmptyState
      v-if="usernames.length === 0"
      heading="No collectors selected"
      body="Enter one or more BoardGameGeek usernames to merge collections."
    />
    <EmptyState
      v-else-if="filteredGames.length === 0 && !loading"
      heading="No games found"
      body="Try clearing filters or selecting more collectors."
      :show-clear="hasActiveFilters"
      @clear="filterStore.clearFilters"
    />
    <GameGrid
      v-else
      :groups="groupedGames"
      :group-by="groupBy"
      :loading="loading"
    />
  </div>
</template>
