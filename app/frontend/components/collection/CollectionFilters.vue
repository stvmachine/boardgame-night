<script setup lang="ts">
import { TIME_BUCKETS, COMPLEXITY_BUCKETS } from '@/composables/useCollectionFilters'

const query = defineModel<string>('query', { default: '' })
const playerCount = defineModel<number | null>('playerCount', { default: null })
const timeBucket = defineModel<number | null>('timeBucket', { default: null })
const complexityBucket = defineModel<number | null>('complexityBucket', { default: null })
const ratingMin = defineModel<number | null>('ratingMin', { default: null })

const RATING_OPTIONS = [5, 6, 7, 8, 9]
</script>

<template>
  <div class="space-y-4">
    <div>
      <label for="filter-search" class="text-sm font-medium text-neutral-700">Search</label>
      <input
        id="filter-search"
        v-model="query"
        type="text"
        placeholder="Search games..."
        class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div>
      <label for="filter-players" class="text-sm font-medium text-neutral-700">Players</label>
      <select
        id="filter-players"
        v-model="playerCount"
        class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option :value="null">Any players</option>
        <option v-for="n in 10" :key="n" :value="n">{{ n }} players</option>
      </select>
    </div>

    <div>
      <label for="filter-time" class="text-sm font-medium text-neutral-700">Playing time</label>
      <select
        id="filter-time"
        v-model="timeBucket"
        class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option :value="null">Any time</option>
        <option v-for="bucket in TIME_BUCKETS" :key="bucket.value" :value="bucket.value">{{ bucket.label }}</option>
      </select>
    </div>

    <div>
      <label for="filter-complexity" class="text-sm font-medium text-neutral-700">Complexity</label>
      <select
        id="filter-complexity"
        v-model="complexityBucket"
        class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option :value="null">Any complexity</option>
        <option v-for="bucket in COMPLEXITY_BUCKETS" :key="bucket.value" :value="bucket.value">{{ bucket.label }}</option>
      </select>
    </div>

    <div>
      <label for="filter-rating" class="text-sm font-medium text-neutral-700">Min rating</label>
      <select
        id="filter-rating"
        v-model="ratingMin"
        class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option :value="null">Any rating</option>
        <option v-for="rating in RATING_OPTIONS" :key="rating" :value="rating">{{ rating }}+</option>
      </select>
    </div>
  </div>
</template>
