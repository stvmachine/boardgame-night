<script setup lang="ts">
import { computed } from 'vue'
import type { Group, MergedThing } from '@/generated/types'
import GameGrid from '@/components/collection/GameGrid.vue'
import MemberList from './MemberList.vue'

interface Props {
  group: Group
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const allGames = computed(() => (props.group.collection?.items ?? []) as MergedThing[])
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold text-neutral-800">{{ group.name }}</h1>
      <p v-if="group.description" class="text-neutral-600">{{ group.description }}</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside class="lg:col-span-1">
        <MemberList :members="group.members" :group="group" />
      </aside>

      <section class="lg:col-span-3">
        <GameGrid :games="allGames" :loading="loading" />
      </section>
    </div>
  </div>
</template>
