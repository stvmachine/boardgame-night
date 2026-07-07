<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMergedCollectionQuery } from '../generated/operations'
import { useCollectionFilters } from '../composables/useCollectionFilters'
import GameGrid from '../components/collection/GameGrid.vue'

const route = useRoute()

const usernames = computed(() => {
  const raw = route.query.usernames
  const str = Array.isArray(raw) ? raw[0] : raw
  return String(str ?? '').split(',').map(s => s.trim()).filter(Boolean)
})

const { result, loading } = useMergedCollectionQuery(
  computed(() => ({ usernames: usernames.value })),
  () => ({ fetchPolicy: 'cache-and-network' })
)

const allGames = computed(() => result.value?.mergedCollection.items ?? [])

const {
  query,
  playerCount,
  filteredGames,
} = useCollectionFilters(allGames)
</script>

<template>
  <div class="p-4 md:p-6 space-y-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <input
        v-model="query"
        type="text"
        placeholder="Search games..."
        class="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <select
        v-model="playerCount"
        class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option :value="null">Any players</option>
        <option v-for="n in 10" :key="n" :value="n">{{ n }} players</option>
      </select>
    </div>

    <div v-if="usernames.length === 0" class="text-center py-16">
      <h2 class="text-xl font-semibold text-neutral-800">No collectors selected</h2>
      <p class="text-neutral-600 mt-2">Enter one or more BoardGameGeek usernames to merge collections.</p>
    </div>
    <GameGrid v-else :games="filteredGames" :loading="loading" />
  </div>
</template>
