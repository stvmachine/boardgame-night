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
import CollectionFilterPanel from '../components/collection/CollectionFilterPanel.vue'
import ActiveFilterChips from '../components/collection/ActiveFilterChips.vue'
import ViewModeToggle from '../components/collection/ViewModeToggle.vue'
import EmptyState from '../components/collection/EmptyState.vue'
import Button from '@/components/ui/button/Button.vue'
import Icon from '@/components/ui/icon/Icon.vue'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

const route = useRoute()
const collectorsStore = useCollectorsStore()
const filterStore = useFilterStore()
const { query, playerRange, selectedTimeBuckets, complexityBucket, ratingMin, selectedOwners, sort, groupBy, view } = storeToRefs(filterStore)
const { usernames } = storeToRefs(collectorsStore)

usePermalink()

const filtersOpen = ref(false)

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
  playerRange,
  selectedTimeBuckets,
  complexityBucket,
  ratingMin,
  selectedOwners
})

const sortedGames = computed(() => sortGames(filteredGames.value, filterStore.sort))
const groupedGames = computed(() => groupGames(sortedGames.value, filterStore.groupBy))

const hasActiveFilters = computed(() => {
  const allOwners = collectorsStore.usernames
  const hasOwnerFilter = selectedOwners.value.size > 0 && selectedOwners.value.size < allOwners.length
  return query.value.trim() !== '' ||
    playerRange.value != null ||
    selectedTimeBuckets.value.size > 0 ||
    complexityBucket.value != null ||
    ratingMin.value != null ||
    hasOwnerFilter
})
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex flex-col xl:flex-row gap-6">
      <aside class="hidden xl:block w-[264px] xl:sticky xl:top-6 xl:self-start space-y-6">
        <CollectionFilterPanel />
      </aside>

      <div class="flex-1 min-w-0 space-y-4">
        <div class="flex flex-wrap items-center gap-3" data-testid="collection-toolbar">
          <Button
            variant="outline"
            class="xl:hidden"
            aria-label="Open filters"
            @click="filtersOpen = true"
          >
            <Icon name="filter_list" class="mr-2 size-4" />
            Filters
          </Button>
          <SortControl v-model="sort" />
          <GroupByToggle v-model="groupBy" />
          <ViewModeToggle v-model="view" />
          <ActiveFilterChips />
        </div>

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
          :view="view"
          :loading="loading"
        />
      </div>
    </div>

    <Sheet v-model:open="filtersOpen">
      <SheetContent side="left" class="w-[300px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Filter the shared collection</SheetDescription>
        </SheetHeader>
        <CollectionFilterPanel v-if="filtersOpen" />
      </SheetContent>
    </Sheet>
  </div>
</template>
