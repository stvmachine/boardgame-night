<script setup lang="ts">
import UsernameForm from '../components/landing/UsernameForm.vue'
import HotList from '../components/landing/HotList.vue'
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-12">
    <section class="text-center space-y-4">
      <h1 class="text-3xl md:text-4xl font-bold text-neutral-900">
        Find the perfect game for your next board game night
      </h1>
      <p class="text-base md:text-lg text-neutral-600">
        Merge your BoardGameGeek collections, filter by players and time, and pick what to play.
      </p>
    </section>

    <section class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <UsernameForm />
    </section>

    <HotList />
  </div>
</template>
