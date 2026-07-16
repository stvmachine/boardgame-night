<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import Icon from '@/components/ui/icon/Icon.vue'
import type { ViewMode } from '@/stores/filters'

const model = defineModel<ViewMode>({ default: 'grid' })
</script>

<template>
  <ToggleGroup
    v-model="model"
    type="single"
    class="flex"
  >
    <ToggleGroupItem value="grid" aria-label="Grid view" class="min-h-11 min-w-11">
      <Icon name="grid_view" class="size-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="list" aria-label="List view" class="min-h-11 min-w-11">
      <Icon name="view_list" class="size-4" />
    </ToggleGroupItem>
  </ToggleGroup>
</template>
