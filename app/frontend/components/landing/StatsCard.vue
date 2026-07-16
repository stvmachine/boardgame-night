<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStatsQuery } from '@/generated/operations'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RouterLink } from 'vue-router'

const { result, loading, error } = useDashboardStatsQuery(() => ({ fetchPolicy: 'cache-and-network' }))
const stats = computed(() => result.value?.dashboardStats ?? null)

const statItems = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Games in your collection', value: stats.value.collectionCount },
    { label: 'Groups', value: stats.value.groupCount },
    { label: 'Nights', value: stats.value.sessionCount }
  ]
})
</script>

<template>
  <Card>
    <CardContent class="p-6 space-y-4">
      <template v-if="loading">
        <h2 class="text-xl font-semibold text-on-surface">Your game nights</h2>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="n in 3" :key="n" class="space-y-2">
            <Skeleton class="h-8 w-16" />
            <Skeleton class="h-4 w-20" />
          </div>
        </div>
      </template>

      <template v-else-if="!stats">
        <div class="space-y-4">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-on-surface">Sign in to see your stats</h2>
            <p class="text-base text-on-surface-variant">
              {{ error ? error.message : 'Track your collection, groups, and upcoming game nights in one place.' }}
            </p>
          </div>
          <Button as-child variant="outline" class="w-full">
            <RouterLink to="/login" class="inline-flex items-center justify-center">Sign in</RouterLink>
          </Button>
        </div>
      </template>

      <template v-else>
        <h2 class="text-xl font-semibold text-on-surface">Your game nights</h2>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="item in statItems" :key="item.label" class="text-center sm:text-left space-y-1">
            <p class="text-[28px] font-semibold leading-tight text-on-surface">{{ item.value }}</p>
            <p class="text-sm font-semibold text-on-surface-variant">{{ item.label }}</p>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
