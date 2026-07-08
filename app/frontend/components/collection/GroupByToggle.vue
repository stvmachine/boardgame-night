<script setup lang="ts">
import { GROUP_OPTIONS, type GroupOption } from '@/utils/grouping'

const groupBy = defineModel<GroupOption>('modelValue', { default: 'none' })
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="group-by" class="text-sm font-medium text-neutral-700">Group by</label>
    <select
      id="group-by"
      v-model="groupBy"
      class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option v-for="option in GROUP_OPTIONS" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
