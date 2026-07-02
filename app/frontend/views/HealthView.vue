<script setup lang="ts">
import { useHealthQuery } from '../generated/operations'

const { result, loading, error } = useHealthQuery()
</script>

<template>
  <div class="bg-neutral-100 rounded-lg p-6 shadow-sm">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <svg class="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="text-base text-neutral-600">Connecting to server…</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-destructive text-center">
      <h2 class="text-xl font-semibold mb-2">Couldn't reach the server.</h2>
      <p class="text-base">Make sure Rails is running on localhost:3000, then reload the page.</p>
    </div>

    <!-- Success state -->
    <div v-else class="text-center">
      <h2 class="text-xl font-semibold mb-4">Server Health</h2>
      <span class="inline-block text-sm font-semibold bg-accent/10 text-accent rounded px-3 py-1 font-mono">
        {{ result?.health }}
      </span>
    </div>
  </div>
</template>
