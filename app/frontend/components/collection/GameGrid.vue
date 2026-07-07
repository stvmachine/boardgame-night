<script setup lang="ts">
import { computed } from 'vue'
import type { MergedThing } from '@/generated/operations'
import type { GameGroup } from '@/utils/grouping'
import GameCard from './GameCard.vue'
import ResultsSkeleton from './ResultsSkeleton.vue'

interface Props {
  games?: MergedThing[]
  groups?: GameGroup[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  games: () => [],
  groups: () => [],
  loading: false
})

const ungroupedGames = computed(() => {
  if (props.games.length > 0) return props.games
  if (props.groups.length > 0 && props.groups[0].name === 'All Games') {
    return props.groups[0].games
  }
  return []
})
</script>

<template>
  <div class="space-y-6">
    <template v-if="loading">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <ResultsSkeleton v-for="i in 12" :key="i" />
      </div>
    </template>

    <template v-else-if="groups && groups.length > 0 && groups[0].name !== 'All Games'">
      <section v-for="group in groups" :key="group.name" class="space-y-2">
        <h3 class="text-lg font-semibold text-neutral-800">
          {{ group.name }}
          <span class="ml-2 text-sm font-normal text-neutral-500">({{ group.games.length }})</span>
        </h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          <GameCard
            v-for="game in group.games"
            :key="game.id"
            :id="game.id"
            :name="game.name"
            :thumbnail="game.thumbnail"
            :year-published="game.yearPublished"
            :min-players="game.minPlayers"
            :max-players="game.maxPlayers"
            :min-playtime="game.minPlaytime"
            :max-playtime="game.maxPlaytime"
            :average="game.average"
            :average-weight="game.averageWeight"
            :owners="game.owners"
          />
        </div>
      </section>
    </template>

    <template v-else>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <GameCard
          v-for="game in ungroupedGames"
          :key="game.id"
          :id="game.id"
          :name="game.name"
          :thumbnail="game.thumbnail"
          :year-published="game.yearPublished"
          :min-players="game.minPlayers"
          :max-players="game.maxPlayers"
          :min-playtime="game.minPlaytime"
          :max-playtime="game.maxPlaytime"
          :average="game.average"
          :average-weight="game.averageWeight"
          :owners="game.owners"
        />
      </div>
    </template>
  </div>
</template>
