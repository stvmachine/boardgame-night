<script setup lang="ts">
interface Props {
  heading: string
  body: string
  showClear?: boolean
}

withDefaults(defineProps<Props>(), {
  showClear: false
})

const emit = defineEmits<{
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="text-center py-16 px-4">
    <div class="mx-auto h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h2 class="text-xl font-semibold text-neutral-800">{{ heading }}</h2>
    <p class="text-neutral-600 mt-2 max-w-md mx-auto">{{ body }}</p>
    <button
      v-if="showClear"
      type="button"
      class="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      @click="emit('clear')"
    >
      Clear filters
    </button>
  </div>
</template>
