<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGroupQuery, usePickGameMutation } from '@/generated/operations'
import { useCollectionFilters } from '@/composables/useCollectionFilters'
import { useFilterStore } from '@/stores/filters'
import GameGrid from '@/components/collection/GameGrid.vue'
import EmptyState from '@/components/collection/EmptyState.vue'
import type { NightSession, MergedThing } from '@/generated/operations'

interface Props {
  session: NightSession
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'picked'): void
}>()

const filterStore = useFilterStore()
const { query } = storeToRefs(filterStore)

const groupToken = computed(() => props.session.group.inviteCode ?? '')
const attendeeCount = computed(() => props.session.attendeeCount)

const { result, loading } = useGroupQuery(
  () => ({ token: groupToken.value }),
  () => ({ fetchPolicy: 'cache-and-network' })
)

const allGames = computed(() => result.value?.group?.collection.items ?? [])

const { filteredGames } = useCollectionFilters(allGames, { query })

const { mutate: pickGame, loading: picking, error: pickError } = usePickGameMutation()

function isInRange(game: MergedThing): boolean {
  const min = game.minPlayers ?? 1
  const max = game.maxPlayers ?? 99
  return attendeeCount.value >= min && attendeeCount.value <= max
}

async function handlePick(gameId: string) {
  await pickGame({
    sessionId: props.session.id,
    gameId
  })
  emit('picked')
}

const hasActiveFilters = computed(() => query.value.trim() !== '')
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-neutral-900">Pick a game</h2>
        <p class="text-sm text-neutral-500">
          Showing games from the group collection
          <span v-if="attendeeCount > 0">
            — filtered for {{ attendeeCount }} attending player{{ attendeeCount === 1 ? '' : 's' }}
          </span>
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="query"
        type="text"
        placeholder="Search games..."
        class="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div
      v-if="pickError"
      class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      role="alert"
    >
      {{ pickError.message }}
    </div>

    <EmptyState
      v-if="!loading && filteredGames.length === 0 && !hasActiveFilters"
      heading="No games in the group collection"
      body="Group members need to import their BoardGameGeek collections before games appear here."
    />

    <EmptyState
      v-else-if="!loading && filteredGames.length === 0 && hasActiveFilters"
      heading="No games match your search"
      body="Try a different search term."
      :show-clear="true"
      @clear="filterStore.clearFilters"
    />

    <GameGrid
      v-else
      :games="filteredGames"
      :loading="loading"
    >
      <template #game-action="{ game }">
        <div class="space-y-2">
          <span
            v-if="!isInRange(game)"
            class="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
          >
            Outside player count range
          </span>
          <button
            type="button"
            class="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500"
            :disabled="picking"
            @click.stop="handlePick(game.id)"
          >
            {{ picking ? 'Picking...' : 'Pick this game' }}
          </button>
        </div>
      </template>
    </GameGrid>
  </div>
</template>
