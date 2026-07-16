<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useHotItemsQuery } from '../../generated/operations'
import { Skeleton } from '@/components/ui/skeleton'
import TrendingGameCard from './TrendingGameCard.vue'

interface Props {
  limit?: number
  showViewAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  limit: 6,
  showViewAll: true
})

const { result, loading } = useHotItemsQuery(() => ({ fetchPolicy: 'cache-first' }))

const items = computed(() => {
  const all = result.value?.hotItems ?? []
  return props.limit ? all.slice(0, props.limit) : all
})
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-on-surface">Trending on BGG</h2>
      <RouterLink
        v-if="showViewAll"
        to="/hot"
        class="text-sm font-medium text-primary hover:underline"
      >
        View all
      </RouterLink>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="i in limit"
        :key="i"
        class="rounded-xl border border-outline bg-surface-container p-0 gap-0 overflow-hidden"
      >
        <Skeleton class="w-full aspect-[4/3] bg-surface-variant" />
        <div class="p-3 space-y-2">
          <Skeleton class="h-4 w-3/4 bg-surface-variant" />
          <Skeleton class="h-3 w-1/2 bg-surface-variant" />
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <TrendingGameCard
        v-for="item in items"
        :key="item.id"
        :item="item"
      />
    </div>
  </section>
</template>
