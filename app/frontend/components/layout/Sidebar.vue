<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useCollectorsStore } from '@/stores/collectors'
import { useFilterStore } from '@/stores/filters'
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import CollectorsSection from '@/components/layout/CollectorsSection.vue'

const store = useCollectorsStore()
const filterStore = useFilterStore()
const { selectedOwners } = storeToRefs(filterStore)
const route = useRoute()
const router = useRouter()

const newUsername = ref('')

store.syncWithRoute(route.query.usernames as string | string[] | null | undefined)

watch(
  () => store.usernames,
  (usernames) => {
    const query = { ...route.query }
    if (usernames.length) {
      query.usernames = usernames.join(',')
    } else {
      delete query.usernames
    }
    router.replace({ query })
  },
  { deep: true }
)

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

    <CollectorsSection
      :usernames="store.usernames"
      :selected="selectedOwners"
      @toggle="filterStore.toggleOwner"
      @select-all="selectAllOwners"
      @deselect-all="deselectAllOwners"
    />

    <div v-if="store.usernames.length === 0" class="text-sm text-neutral-500">
      No collectors selected.
    </div>

    <ul v-else class="space-y-2">
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
  </div>
</template>
