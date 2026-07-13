<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="rounded-xl border border-outline bg-surface-container p-3 space-y-2 overflow-hidden">
    <Skeleton class="aspect-[4/3] w-full" />
    <Skeleton class="h-4 w-3/4" />
    <Skeleton class="h-3 w-1/2" />
    <div class="flex gap-2">
      <Skeleton class="h-5 w-8" />
      <Skeleton class="h-5 w-8" />
    </div>
    <div class="flex -space-x-1 pt-1">
      <Skeleton class="h-5 w-5 rounded-full ring-2 ring-white" />
      <Skeleton class="h-5 w-5 rounded-full ring-2 ring-white" />
    </div>
  </div>
</template>
