<script setup lang="ts">
import { computed } from 'vue'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { GROUP_OPTIONS, type GroupOption } from '@/utils/grouping'

const groupBy = defineModel<GroupOption>('modelValue', { default: 'none' })

const selectedLabel = computed(() => {
  return GROUP_OPTIONS.find(option => option.value === groupBy.value)?.label ?? 'None'
})
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="group-by" class="text-sm font-semibold text-on-surface">Group by</label>
    <Select v-model="groupBy">
      <SelectTrigger id="group-by" class="w-44">
        <SelectValue data-slot="select-value">{{ selectedLabel }}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in GROUP_OPTIONS"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
