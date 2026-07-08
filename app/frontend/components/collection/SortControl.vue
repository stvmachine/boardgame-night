<script setup lang="ts">
import { SORT_OPTIONS, type SortOption } from '@/utils/sorting'

const sort = defineModel<SortOption>('modelValue', { default: 'name_asc' })
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="sort-control" class="text-sm font-medium text-neutral-700">Sort</label>
    <select
      id="sort-control"
      v-model="sort"
      class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
