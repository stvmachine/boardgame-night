<script setup lang="ts">
import Icon from '@/components/ui/icon/Icon.vue'
import { useHealthQuery } from '../generated/operations'

const { result, loading, error } = useHealthQuery()
</script>

<template>
  <div class="bg-surface-container rounded-lg p-6 shadow-sm">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <Icon name="progress-activity" class="animate-spin h-8 w-8 text-primary" />
      <p class="text-base text-on-surface-variant">Connecting to server…</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-error text-center">
      <h2 class="text-xl font-semibold mb-2">Couldn't reach the server.</h2>
      <p class="text-base">Make sure Rails is running on localhost:3000, then reload the page.</p>
    </div>

    <!-- Success state -->
    <div v-else class="text-center">
      <h2 class="text-xl font-semibold mb-4">Server Health</h2>
      <span class="inline-block text-sm font-semibold bg-primary-container text-on-primary-container rounded px-3 py-1 font-mono">
        {{ result?.health }}
      </span>
    </div>
  </div>
</template>
