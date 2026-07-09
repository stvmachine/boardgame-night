<script setup lang="ts">
import type { Group } from '@/generated/types'

interface Props {
  groups: Group[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'select', group: Group): void }>()

function cardFor(group: Group) {
  return {
    title: group.name,
    description: group.description || 'No description',
    memberCount: group.members?.length ?? 1,
    inviteCode: group.inviteCode
  }
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <article
      v-for="group in props.groups"
      :key="group.id"
      class="bg-white rounded-lg border border-neutral-200 p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
      @click="emit('select', group)"
    >
      <h3 class="text-base font-semibold text-neutral-800">{{ cardFor(group).title }}</h3>
      <p class="text-sm text-neutral-500 mt-1">{{ cardFor(group).description }}</p>
      <div class="mt-3 flex items-center justify-between text-sm">
        <span class="text-neutral-600">{{ cardFor(group).memberCount }} members</span>
        <span class="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{{ cardFor(group).inviteCode }}</span>
      </div>
    </article>
  </div>
</template>
