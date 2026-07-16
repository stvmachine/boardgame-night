<script setup lang="ts">
import { computed } from 'vue'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SORT_OPTIONS, type SortOption } from '@/utils/sorting'

const sort = defineModel<SortOption>('modelValue', { default: 'name_asc' })

const selectedLabel = computed(() => {
  return SORT_OPTIONS.find(option => option.value === sort.value)?.label ?? 'Name A–Z'
})
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="sort-control" class="text-sm font-semibold text-on-surface">Sort</label>
    <Select v-model="sort">
      <SelectTrigger id="sort-control" class="w-44">
        <SelectValue data-slot="select-value">Sort by: {{ selectedLabel }}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in SORT_OPTIONS"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
