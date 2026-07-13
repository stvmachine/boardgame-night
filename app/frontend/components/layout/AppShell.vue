<script setup lang="ts">
import NavSidebar from '@/components/layout/NavSidebar.vue'
import NavDrawer from '@/components/layout/NavDrawer.vue'
</script>

<template>
  <div class="min-h-screen bg-surface">
    <NavSidebar />
    <NavDrawer />
    <main class="md:ml-[280px] min-h-screen">
      <slot />
    </main>
  </div>
</template>
