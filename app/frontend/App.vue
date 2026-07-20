<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import CollectorsProvider from '@/components/providers/CollectorsProvider.vue'
</script>

<template>
  <CollectorsProvider>
    <AppShell>
      <router-view />
    </AppShell>
  </CollectorsProvider>
</template>
