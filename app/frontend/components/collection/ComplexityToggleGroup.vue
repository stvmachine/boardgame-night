<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const model = defineModel<number | null>({ default: null })

const options = [
  { value: 'null', label: 'Any' },
  { value: '1', label: 'Light' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Heavy' }
]

function onUpdate(value: string) {
  model.value = value === 'null' ? null : Number(value)
}
</script>

<template>
  <ToggleGroup
    :model-value="model?.toString() ?? 'null'"
    type="single"
    class="flex w-full rounded-lg border border-outline overflow-hidden"
    @update:model-value="onUpdate"
  >
    <ToggleGroupItem
      v-for="option in options"
      :key="option.label"
      :value="option.value"
      class="flex-1"
    >
      {{ option.label }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
