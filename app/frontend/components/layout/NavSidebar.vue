<script setup lang="ts">
import NavSidebarContent from './NavSidebarContent.vue'
</script>

<template>
  <aside
    data-testid="desktop-sidebar"
    class="hidden md:flex fixed left-0 top-0 w-[280px] h-screen bg-surface-container border-r border-outline flex-col"
  >
    <NavSidebarContent />
  </aside>
</template>
