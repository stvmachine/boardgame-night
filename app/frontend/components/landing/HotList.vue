<script setup lang="ts">
import { useHotItemsQuery } from '../../generated/operations'

const { result, loading } = useHotItemsQuery(() => ({ fetchPolicy: 'cache-first' }))
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-semibold text-neutral-800">Trending on BoardGameGeek</h2>

    <div v-if="loading" class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
      <div v-for="i in 12" :key="i" class="animate-pulse space-y-2">
        <div class="aspect-[4/3] rounded-lg bg-neutral-200" />
        <div class="h-4 rounded bg-neutral-200" />
        <div class="h-3 w-2/3 rounded bg-neutral-200" />
      </div>
    </div>

    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
      <a
        v-for="item in result?.hotItems ?? []"
        :key="item.id"
        :href="`https://boardgamegeek.com/boardgame/${item.id}`"
        target="_blank"
        class="group block rounded-lg border border-neutral-200 bg-white p-2 transition hover:border-indigo-200 hover:shadow-md"
      >
        <img
          v-if="item.thumbnail"
          :src="item.thumbnail"
          :alt="item.name"
          class="aspect-[4/3] w-full rounded object-cover bg-neutral-100"
        />
        <div v-else class="aspect-[4/3] w-full rounded bg-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
          No image
        </div>
        <div class="mt-2">
          <p class="text-sm font-medium leading-tight group-hover:text-indigo-600 line-clamp-2">{{ item.name }}</p>
          <p class="text-xs text-neutral-500 mt-0.5">
            <span v-if="item.yearPublished">{{ item.yearPublished }}</span>
            <span v-if="item.yearPublished" class="mx-1">·</span>
            <span>Rank #{{ item.rank }}</span>
          </p>
        </div>
      </a>
    </div>
  </section>
</template>
