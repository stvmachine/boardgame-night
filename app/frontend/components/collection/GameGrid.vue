<script setup lang="ts">
import { computed } from 'vue'
import type { MergedThing } from '@/generated/operations'
import type { GameGroup } from '@/utils/grouping'
import { useCollapsedGroups } from '@/composables/useCollapsedGroups'
import GameCard from './GameCard.vue'
import ResultsSkeleton from './ResultsSkeleton.vue'
import CollapsibleGroup from './CollapsibleGroup.vue'

import type { GroupOption } from '@/utils/grouping'

interface Props {
  games?: MergedThing[]
  groups?: GameGroup[]
  groupBy?: GroupOption
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  games: () => [],
  groups: () => [],
  groupBy: 'none',
  loading: false
})

const ungroupedGames = computed(() => {
  if (props.games.length > 0) return props.games
  if (props.groups.length > 0 && props.groups[0].name === 'All Games') {
    return props.groups[0].games
  }
  return []
})

const isGrouped = computed(() => {
  return props.groups && props.groups.length > 0 && props.groups[0].name !== 'All Games'
})

const groupNames = computed(() => props.groups.map(g => g.name))
const { isCollapsed, toggle, expandAll, collapseAll } = useCollapsedGroups(groupNames.value)
</script>

<template>
  <div class="space-y-6">
    <template v-if="loading">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <ResultsSkeleton v-for="i in 12" :key="i" />
      </div>
    </template>

    <template v-else-if="isGrouped">
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          @click="expandAll(groupNames)"
        >
          Expand All
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-neutral-100 rounded hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          @click="collapseAll(groupNames)"
        >
          Collapse All
        </button>
      </div>

        <CollapsibleGroup
          v-for="group in groups"
          :key="group.name"
          :group-name="group.name"
          :count="group.games.length"
          :initially-open="!isCollapsed(group.name)"
          @toggle="toggle(group.name)"
        >
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
            >
              <template #action>
                <slot name="game-action" :game="game" />
              </template>
            </GameCard>
          </div>
        </CollapsibleGroup>
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
        >
          <template #action>
            <slot name="game-action" :game="game" />
          </template>
        </GameCard>
      </div>
    </template>
  </div>
</template>
