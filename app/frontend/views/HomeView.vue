<script setup lang="ts">
import HomeHero from '../components/landing/HomeHero.vue'
import StatsCard from '../components/landing/StatsCard.vue'
import TrendingGames from '../components/landing/TrendingGames.vue'
</script>

<template>
  <div class="p-4 md:p-6 space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8">
        <HomeHero />
      </div>
      <div class="lg:col-span-4">
        <StatsCard />
      </div>
    </div>

    <TrendingGames :limit="6" />
  </div>
</template>
