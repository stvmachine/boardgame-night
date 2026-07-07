<script setup lang="ts">
import type { MergedThing } from '../../generated/operations'
import GameCard from './GameCard.vue'
import ResultsSkeleton from './ResultsSkeleton.vue'

interface Props {
  games: MergedThing[]
  loading?: boolean
}

defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
    <template v-if="!loading">
      <GameCard
        v-for="game in games"
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
    </template>
    <ResultsSkeleton v-for="i in 12" v-else :key="i" />
  </div>
</template>
