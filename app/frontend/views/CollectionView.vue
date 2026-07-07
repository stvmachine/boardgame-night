<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMergedCollectionQuery } from '../generated/operations'
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

const games = computed(() => result.value?.mergedCollection.items ?? [])
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="usernames.length === 0" class="text-center py-16">
      <h2 class="text-xl font-semibold text-neutral-800">No collectors selected</h2>
      <p class="text-neutral-600 mt-2">Enter one or more BoardGameGeek usernames to merge collections.</p>
    </div>
    <GameGrid v-else :games="games" :loading="loading" />
  </div>
</template>
