<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'
import { TIME_BUCKETS } from '@/composables/useCollectionFilters'

const model = defineModel<Set<number>>({ default: () => new Set() })

function updateBucket(value: number, checked: boolean) {
  const next = new Set(model.value)
  if (checked) {
    next.add(value)
  } else {
    next.delete(value)
  }
  model.value = next
}
</script>

<template>
  <div class="space-y-compact">
    <label
      v-for="bucket in TIME_BUCKETS"
      :key="bucket.value"
      :for="`time-bucket-${bucket.value}`"
      class="flex items-center gap-compact text-on-surface cursor-pointer"
    >
      <Checkbox
        :id="`time-bucket-${bucket.value}`"
        :model-value="model.has(bucket.value)"
        @update:model-value="(checked: boolean) => updateBucket(bucket.value, checked)"
      />
      <span class="text-sm">{{ bucket.label }}</span>
    </label>
  </div>
</template>
