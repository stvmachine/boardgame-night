<script setup lang="ts">
import AppShell from './components/layout/AppShell.vue'
import Sidebar from './components/layout/Sidebar.vue'
</script>

<template>
  <AppShell>
    <template #sidebar>
      <Sidebar />
    </template>
    <router-view />
  </AppShell>
</template>
