<script setup lang="ts">
import TrendingGames from '../components/landing/TrendingGames.vue'
</script>

<template>
  <div class="p-4 md:p-6">
    <h1 class="text-2xl font-semibold text-on-surface mb-6">Trending Games</h1>
    <TrendingGames :limit="20" :show-view-all="false" />
  </div>
</template>
