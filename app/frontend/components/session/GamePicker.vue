<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePickGameMutation } from '@/generated/operations'
import GameCard from '@/components/collection/GameCard.vue'
import EmptyState from '@/components/collection/EmptyState.vue'
import Skeleton from '@/components/ui/skeleton/Skeleton.vue'
import Button from '@/components/ui/button/Button.vue'
import type { NightSession, Suggestion } from '@/generated/operations'

interface Props {
  session?: NightSession | null
  isHost?: boolean
  loading?: boolean
  error?: any
}

const props = withDefaults(defineProps<Props>(), {
  session: null,
  isHost: false,
  loading: false,
  error: null
})

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'picked', gameName: string): void
}>()

const { mutate: pickGame, loading: picking, error: pickError, onDone } = usePickGameMutation()

const selectedSuggestion = ref<Suggestion | null>(null)

const attendeeCount = computed(() => props.session?.attendeeCount ?? 0)
const timeBudgetMinutes = computed(() => props.session?.timeBudgetMinutes ?? 0)
const complexityPreference = computed(() => props.session?.complexityPreference ?? 'Any')

const suggestions = computed(() => {
  const list = props.session?.suggestions ?? []
  return list.slice(0, 8)
})

const hasSuggestions = computed(() => suggestions.value.length > 0)

const heading = computed(() => `Game Suggestions (Filtered for ${attendeeCount.value} Players)`)
const timeChip = computed(() => `Up to ${timeBudgetMinutes.value} min`)
const complexityChip = computed(() => `${complexityPreference.value} complexity`)

onDone(() => {
  const gameName = selectedSuggestion.value?.thing.name
  if (gameName) emit('picked', gameName)
})

function isSelected(suggestion: Suggestion): boolean {
  return selectedSuggestion.value?.thing.id === suggestion.thing.id
}

function isPicking(suggestion: Suggestion): boolean {
  return picking.value && isSelected(suggestion)
}

async function handlePick(suggestion: Suggestion) {
  if (picking.value) return
  selectedSuggestion.value = suggestion
  try {
    await pickGame({ sessionId: props.session?.id ?? '', gameId: suggestion.thing.id })
  } catch {
    // pickError is updated by the mutation composable and stays scoped to selectedSuggestion.
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-2">
      <h2 class="text-xl font-semibold text-on-surface leading-tight">{{ heading }}</h2>
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center rounded-full bg-surface-container-high px-2 py-1 text-sm font-semibold text-on-surface-variant">
          {{ timeChip }}
        </span>
        <span class="inline-flex items-center rounded-full bg-surface-container-high px-2 py-1 text-sm font-semibold text-on-surface-variant">
          {{ complexityChip }}
        </span>
      </div>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <div
        v-for="i in 8"
        :key="i"
        data-testid="suggestion-skeleton"
        class="rounded-xl border border-outline bg-surface-container p-3 space-y-3"
      >
        <Skeleton class="w-full aspect-[4/3]" />
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-1/2" />
        <div class="flex gap-2">
          <Skeleton class="h-6 w-16 rounded-full" />
          <Skeleton class="h-6 w-20 rounded-full" />
        </div>
        <div class="flex flex-wrap gap-2">
          <Skeleton class="h-6 w-24 rounded-full" />
          <Skeleton class="h-6 w-32 rounded-full" />
          <Skeleton class="h-6 w-20 rounded-full" />
        </div>
        <Skeleton class="h-10 w-full" />
      </div>
    </div>

    <div
      v-else-if="error"
      role="alert"
      class="rounded-xl border border-outline bg-surface-container p-6 text-center"
    >
      <h3 class="text-xl font-semibold text-on-surface">Couldn't load suggestions</h3>
      <p class="text-on-surface-variant mt-2">Check your connection and try again.</p>
      <Button
        variant="primary"
        class="mt-4 min-h-[44px]"
        data-testid="retry-suggestions"
        @click="emit('retry')"
      >
        Try again
      </Button>
    </div>

    <template v-else>
      <EmptyState
        v-if="attendeeCount === 0 && !hasSuggestions"
        heading="No confirmed players yet"
        body="Once guests RSVP Going, suggestions will appear here."
      />

      <EmptyState
        v-else-if="attendeeCount > 0 && !hasSuggestions"
        heading="No games fit this night"
        body="The confirmed players don't have an eligible game in the shared collection."
      />

      <div
        v-else
        data-testid="suggestion-grid"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <GameCard
          v-for="suggestion in suggestions"
          :key="suggestion.thing.id"
          :id="suggestion.thing.id"
          :objectid="suggestion.thing.objectid"
          :name="suggestion.thing.name"
          :thumbnail="suggestion.thing.thumbnail"
          :year-published="suggestion.thing.yearPublished"
          :min-players="suggestion.thing.minPlayers"
          :max-players="suggestion.thing.maxPlayers"
          :min-playtime="suggestion.thing.minPlaytime"
          :max-playtime="suggestion.thing.maxPlaytime"
          :average="suggestion.thing.average"
          :average-weight="suggestion.thing.averageWeight"
          :description="suggestion.thing.description"
          :owners="suggestion.thing.owners"
          :score="suggestion.score"
          :confidence="suggestion.confidence"
          :reasons="suggestion.reasons"
        >
          <template #action>
            <div v-if="isHost" class="space-y-2">
              <div
                v-if="pickError && isSelected(suggestion)"
                role="alert"
                class="text-sm text-error"
              >
                Couldn't pick {{ suggestion.thing.name }}. Try again.
              </div>
              <Button
                variant="primary"
                class="w-full min-h-[44px]"
                :aria-busy="isPicking(suggestion)"
                :disabled="picking"
                @click.stop="handlePick(suggestion)"
              >
                {{ isPicking(suggestion) ? 'Picking…' : 'Pick this game' }}
              </Button>
            </div>
            <p v-else class="text-center text-sm text-on-surface-variant">
              The host will choose the game.
            </p>
          </template>
        </GameCard>
      </div>
    </template>
  </div>
</template>
