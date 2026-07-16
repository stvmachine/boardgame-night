<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  variant?: 'grid' | 'list'
}

withDefaults(defineProps<Props>(), {
  variant: 'grid'
})
</script>

<template>
  <div
    data-testid="skeleton-item"
    :class="[
      'rounded-xl border border-outline bg-surface-container p-3 overflow-hidden',
      variant === 'list' ? 'flex flex-row gap-4' : 'flex flex-col space-y-2'
    ]"
  >
    <Skeleton
      data-testid="skeleton-thumbnail"
      :class="[
        'aspect-[4/3] bg-surface-variant',
        variant === 'list' ? 'w-24 rounded-lg flex-shrink-0' : 'w-full'
      ]"
    />
    <div class="flex-1 space-y-2" :class="variant === 'list' ? 'flex flex-col justify-center' : ''">
      <Skeleton class="h-4 w-3/4 bg-surface-variant" />
      <Skeleton class="h-3 w-full bg-surface-variant" />
      <Skeleton class="h-3 w-2/3 bg-surface-variant" />
      <div class="flex gap-2" :class="variant === 'list' ? 'pt-1' : ''">
        <Skeleton class="h-5 w-8 bg-surface-variant" />
        <Skeleton class="h-5 w-8 bg-surface-variant" />
      </div>
    </div>
  </div>
</template>
