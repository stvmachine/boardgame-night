<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollectorsStore } from '@/stores/collectors'
import { useFilterStore } from '@/stores/filters'
import { useUiStore } from '@/stores/ui'
import { useMergedCollectionQuery } from '@/generated/operations'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import CollectorsSection from '@/components/layout/CollectorsSection.vue'
import CollectionFilters from '@/components/collection/CollectionFilters.vue'
import { useRefreshCollection } from '@/composables/useRefreshCollection'

const store = useCollectorsStore()
const filterStore = useFilterStore()
const uiStore = useUiStore()
const { selectedOwners } = storeToRefs(filterStore)
const { filtersOpen, collectorsOpen } = storeToRefs(uiStore)

const { refresh, isRefreshing, cooldownFor, initFromSyncStatuses } = useRefreshCollection()

const { result } = useMergedCollectionQuery(
  () => ({ usernames: store.usernames }),
  () => ({ fetchPolicy: 'cache-first' })
)

watch(
  () => result.value?.mergedCollection.syncStatuses,
  (syncStatuses) => {
    if (syncStatuses) {
      initFromSyncStatuses(syncStatuses)
    }
  },
  { immediate: true }
)

const newUsername = ref('')

function add() {
  const value = newUsername.value.trim()
  if (value) {
    store.add(value)
    newUsername.value = ''
  }
}

function remove(username: string) {
  store.remove(username)
}

function selectAllOwners() {
  filterStore.selectAllOwners(store.usernames)
}

function deselectAllOwners() {
  filterStore.deselectAllOwners()
}

function handleRefresh(username: string) {
  refresh(username)
}

const activeFilterCount = computed(() => {
  let count = 0
  if (filterStore.query.trim() !== '') count++
  if (filterStore.playerCount != null) count++
  if (filterStore.timeBucket != null) count++
  if (filterStore.complexityBucket != null) count++
  if (filterStore.ratingMin != null) count++
  return count
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <label for="sidebar-username" class="text-sm font-medium text-neutral-700">
        Add collector
      </label>
      <div class="flex gap-2">
        <input
          id="sidebar-username"
          v-model="newUsername"
          type="text"
          placeholder="BGG username"
          class="flex-1 min-w-0 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @keydown.enter="add"
        />
        <button
          type="button"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @click="add"
        >
          Add
        </button>
      </div>
    </div>

    <CollapsibleSection
      title="Filters"
      :default-open="filtersOpen"
      @toggle="uiStore.filtersOpen = $event"
    >
      <template #badge>
        <span
          v-if="activeFilterCount > 0"
          data-testid="active-filter-badge"
          class="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800"
        >
          {{ activeFilterCount }}
        </span>
      </template>
      <CollectionFilters
        v-model:query="filterStore.query"
        v-model:player-count="filterStore.playerCount"
        v-model:time-bucket="filterStore.timeBucket"
        v-model:complexity-bucket="filterStore.complexityBucket"
        v-model:rating-min="filterStore.ratingMin"
      />
      <button
        v-if="activeFilterCount > 0"
        type="button"
        data-testid="clear-filters"
        class="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 py-0.5"
        @click="filterStore.clearFilters"
      >
        Clear filters
      </button>
    </CollapsibleSection>

    <CollapsibleSection
      title="Collectors"
      :default-open="collectorsOpen"
      @toggle="uiStore.collectorsOpen = $event"
    >
      <CollectorsSection
        :usernames="store.usernames"
        :selected="selectedOwners"
        :sync-statuses="result?.mergedCollection.syncStatuses"
        :cooldown-for="cooldownFor"
        :is-refreshing="isRefreshing"
        @toggle="filterStore.toggleOwner"
        @select-all="selectAllOwners"
        @deselect-all="deselectAllOwners"
        @refresh="handleRefresh"
      />

      <div v-if="store.usernames.length === 0" class="mt-3 text-sm text-neutral-500">
        No collectors selected.
      </div>
      <ul v-else class="mt-3 space-y-2">
        <li
          v-for="username in store.usernames"
          :key="username"
          class="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-2"
        >
          <div class="flex items-center gap-2">
            <MemberAvatar :username="username" size="sm" />
            <span class="text-sm font-medium text-neutral-800">{{ username }}</span>
          </div>
          <button
            type="button"
            class="text-sm text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            @click="remove(username)"
          >
            Remove
          </button>
        </li>
      </ul>
    </CollapsibleSection>
  </div>
</template>
