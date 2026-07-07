<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMergedCollectionQuery } from '../generated/operations'
import { useCollectionFilters } from '../composables/useCollectionFilters'
import { useFilterStore } from '../stores/filters'
import { useCollectorsStore } from '../stores/collectors'
import { usePermalink } from '../composables/usePermalink'
import { sortGames } from '../utils/sorting'
import { groupGames } from '../utils/grouping'
import GameGrid from '../components/collection/GameGrid.vue'
import CollectionFilters from '../components/collection/CollectionFilters.vue'
import SortControl from '../components/collection/SortControl.vue'
import GroupByToggle from '../components/collection/GroupByToggle.vue'
import EmptyState from '../components/collection/EmptyState.vue'

const collectorsStore = useCollectorsStore()
const filterStore = useFilterStore()
const { query, playerCount, timeBucket, complexityBucket, ratingMin, selectedOwners, sort, groupBy } = storeToRefs(filterStore)
const { usernames } = storeToRefs(collectorsStore)

usePermalink()

const { result, loading } = useMergedCollectionQuery(
  () => ({ usernames: collectorsStore.usernames }),
  () => ({ fetchPolicy: 'cache-and-network' })
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
    <div class="flex flex-col lg:flex-row gap-4 lg:items-start">
      <CollectionFilters
        v-model:query="query"
        v-model:player-count="playerCount"
        v-model:time-bucket="timeBucket"
        v-model:complexity-bucket="complexityBucket"
        v-model:rating-min="ratingMin"
        class="flex-1"
      />
      <div class="flex flex-row gap-4">
        <SortControl v-model="sort" />
        <GroupByToggle v-model="groupBy" />
      </div>
    </div>

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
      :loading="loading"
    />
  </div>
</template>
