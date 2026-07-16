<script setup lang="ts">
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import { Button } from '@/components/ui/button'

const model = defineModel<Set<string>>({ default: () => new Set() })

const props = defineProps<{
  owners: string[]
}>()

function toggle(username: string) {
  const next = new Set(model.value)
  if (next.has(username)) {
    next.delete(username)
  } else {
    next.add(username)
  }
  model.value = next
}

function selectAll() {
  model.value = new Set(props.owners)
}

function clear() {
  model.value = new Set()
}
</script>

<template>
  <div class="space-y-compact">
    <div class="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-auto px-1 py-0 text-xs text-primary hover:text-primary/80"
        aria-label="Select all owners"
        @click="selectAll"
      >
        Select all
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-auto px-1 py-0 text-xs text-primary hover:text-primary/80"
        aria-label="Clear owners"
        @click="clear"
      >
        Clear
      </Button>
    </div>

    <div class="flex flex-wrap gap-compact">
      <Button
        v-for="username in owners"
        :key="username"
        type="button"
        :variant="model.has(username) ? 'secondary' : 'outline'"
        size="sm"
        :aria-pressed="model.has(username)"
        :aria-label="`Include games from ${username}`"
        @click="toggle(username)"
      >
        <MemberAvatar :username="username" size="sm" />
        <span class="ml-1.5">{{ username }}</span>
      </Button>
    </div>
  </div>
</template>
