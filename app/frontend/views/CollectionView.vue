<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useMergedCollectionQuery, useGroupCollectionQuery, useImportCollectionMutation } from '../generated/operations'
import type { MergedThing, GroupCollectionQuery } from '../generated/operations'
import { useCollectionFilters } from '../composables/useCollectionFilters'
import { useFilterStore } from '../stores/filters'
import { useCollectorsStore } from '../stores/collectors'
import { usePermalink } from '../composables/usePermalink'
import { sortGames } from '../utils/sorting'
import { groupGames, type GroupOption } from '../utils/grouping'
import GameGrid from '../components/collection/GameGrid.vue'
import SortControl from '../components/collection/SortControl.vue'
import GroupByToggle from '../components/collection/GroupByToggle.vue'
import CollectionFilters from '../components/collection/CollectionFilters.vue'
import EmptyState from '../components/collection/EmptyState.vue'

const route = useRoute()
const collectorsStore = useCollectorsStore()
const filterStore = useFilterStore()
const { query, playerCount, timeBucket, complexityBucket, ratingMin, selectedOwners, sort, groupBy } = storeToRefs(filterStore)
const { usernames } = storeToRefs(collectorsStore)

usePermalink()

const LEGACY_GROUP_OPTIONS: GroupOption[] = ['players', 'rating', 'bestPlayers', 'owner']

function isLegacyGroup(value: string): value is GroupOption {
  return LEGACY_GROUP_OPTIONS.includes(value as GroupOption)
}

const groupToken = computed(() => {
  const value = route.query.group
  if (typeof value !== 'string') return null
  if (!value) return null
  if (isLegacyGroup(value)) return null
  return value
})

const groupMode = computed(() => groupToken.value != null)

const shouldPoll = ref(false)

const mergedResult = useMergedCollectionQuery(
  () => ({ usernames: collectorsStore.usernames }),
  () => ({
    fetchPolicy: 'cache-and-network',
    enabled: !groupMode.value,
    pollInterval: shouldPoll.value ? 3000 : undefined
  })
)

const groupResult = useGroupCollectionQuery(
  () => ({ token: groupToken.value ?? '' }),
  () => ({
    fetchPolicy: 'cache-and-network',
    enabled: groupMode.value,
    pollInterval: shouldPoll.value ? 3000 : undefined
  })
)

const activeResult = computed(() => groupMode.value ? groupResult.result.value : mergedResult.result.value)
const loading = computed(() => groupMode.value ? groupResult.loading.value : mergedResult.loading.value)
const error = computed(() => groupMode.value ? groupResult.error.value : mergedResult.error.value)

const syncStatuses = computed(() => {
  if (groupMode.value) {
    return groupResult.result.value?.group?.collection?.syncStatuses ?? []
  }
  return mergedResult.result.value?.mergedCollection?.syncStatuses ?? []
})

function normalizeGroupItems(
  items: NonNullable<GroupCollectionQuery['group']>['collection']['items']
): MergedThing[] {
  return items.map(item => ({
    __typename: 'MergedThing',
    ...item,
    image: null,
    isExpansion: false,
    minAge: null,
    bayesAverage: null,
    usersRated: null,
    bestPlayerCount: null,
    polls: []
  })) as MergedThing[]
}

const allGames = computed<MergedThing[]>(() => {
  if (groupMode.value) {
    const items = groupResult.result.value?.group?.collection?.items ?? []
    return normalizeGroupItems(items)
  }
  return mergedResult.result.value?.mergedCollection?.items ?? []
})

watch(
  () => groupResult.result.value?.group?.members,
  (members) => {
    if (!groupMode.value || !members) return
    const bggUsernames = members
      .map(m => m.bggUsername)
      .filter((username): username is string => Boolean(username))
    collectorsStore.set(bggUsernames)
  },
  { immediate: true }
)

const { mutate: importCollection } = useImportCollectionMutation()
const importedUsernames = ref<Set<string>>(new Set())

watch(
  () => syncStatuses.value,
  (statuses) => {
    if (!statuses) return

    shouldPoll.value = statuses.some(
      (s) => s.status === 'QUEUED' || s.status === 'SYNCING'
    )

    for (const status of statuses) {
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
      v-if="error"
      heading="Could not load collection"
      :body="error.message"
    />
    <EmptyState
      v-else-if="usernames.length === 0 && !groupMode && !loading"
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
