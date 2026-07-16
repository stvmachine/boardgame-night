<script setup lang="ts">
import type { PlayerRange } from '@/stores/filters'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: PlayerRange | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: PlayerRange | null): void
}>()

const sliderValue = computed({
  get: () => (props.modelValue ? [props.modelValue.min, props.modelValue.max] : [1, 10]),
  set: (value: number[]) => {
    const [min, max] = value
    if (min === 1 && max === 10) {
      emit('update:modelValue', null)
    } else {
      emit('update:modelValue', { min, max })
    }
  }
})

const label = computed(() => {
  const [min, max] = sliderValue.value
  const maxLabel = max === 10 ? '10+' : String(max)
  if (min === max) return `${min} players`
  return `${min}–${maxLabel} players`
})

function reset() {
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm font-semibold text-on-surface">Players</span>
      <span class="text-sm font-semibold text-on-surface" aria-live="polite">{{ label }}</span>
    </div>
    <Slider
      v-model="sliderValue"
      :min="1"
      :max="10"
      :step="1"
      :thumb-labels="['Minimum players', 'Maximum players']"
    />
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs text-on-surface-variant">1</span>
      <Button
        v-if="modelValue"
        variant="ghost"
        size="sm"
        class="h-auto px-1 py-0 text-xs text-on-surface-variant hover:text-on-surface"
        aria-label="Clear player range"
        @click="reset"
      >
        Reset
      </Button>
      <span class="text-xs text-on-surface-variant">10+</span>
    </div>
  </div>
</template>
