<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import MobileDrawer from './MobileDrawer.vue'
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex flex-col">
    <header class="h-14 md:h-16 flex items-center justify-between px-4 bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div class="flex items-center gap-2">
        <AppHeader />
        <a href="/" class="text-lg font-semibold text-indigo-600">BoardGame Night</a>
      </div>
      <nav class="hidden md:flex items-center gap-4 text-sm font-medium text-neutral-600">
        <a href="/collection" class="hover:text-indigo-600">Collection</a>
      </nav>
    </header>
    <div class="flex flex-1 pt-14 md:pt-16">
      <aside
        class="hidden md:block fixed left-0 top-14 md:top-16 w-[280px] h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] border-r border-neutral-200 bg-white overflow-y-auto z-30"
      >
        <div class="p-4">
          <slot name="sidebar" />
        </div>
      </aside>
      <MobileDrawer>
        <slot name="sidebar" />
      </MobileDrawer>
      <main class="flex-1 md:ml-[280px] min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
