<script setup lang="ts">
import { useUiStore } from '../../stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="md:hidden">
    <div
      v-if="ui.sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50"
      aria-hidden="true"
      @click="ui.closeSidebar"
    />
    <aside
      :class="[
        'fixed top-0 left-0 z-50 h-full w-[min(320px,85vw)] bg-white shadow-xl transform transition-transform duration-200 ease-out',
        ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
      aria-label="Mobile sidebar"
    >
      <div class="h-14 flex items-center justify-between px-4 border-b border-neutral-200">
        <span class="text-lg font-semibold text-indigo-600">BoardGame Night</span>
        <button
          type="button"
          class="p-2 rounded-md text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close sidebar"
          @click="ui.closeSidebar"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto h-[calc(100%-3.5rem)]">
        <slot />
      </div>
    </aside>
  </div>
</template>
