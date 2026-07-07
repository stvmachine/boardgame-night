<script setup lang="ts">
import { computed } from 'vue'

interface Owner {
  bggUsername: string
  avatar?: string | null
}

interface Props {
  id: string
  name: string
  thumbnail?: string | null
  yearPublished?: number | null
  minPlayers?: number | null
  maxPlayers?: number | null
  minPlaytime?: number | null
  maxPlaytime?: number | null
  average?: number | null
  averageWeight?: number | null
  owners: Owner[]
}

const props = defineProps<Props>()

const meta = computed(() => {
  const parts: string[] = []
  if (props.yearPublished) parts.push(String(props.yearPublished))

  const players = [props.minPlayers, props.maxPlayers].filter((n): n is number => n != null)
  if (players.length) parts.push(`${players.join('–')} players`)

  const playtime = [props.minPlaytime, props.maxPlaytime].filter((n): n is number => n != null)
  if (playtime.length) parts.push(`${playtime.join('–')} min`)

  return parts.join(' · ') || undefined
})

const hasAverage = computed(() => props.average != null && props.average > 0)
const hasWeight = computed(() => props.averageWeight != null && props.averageWeight > 0)

function openBgg() {
  window.open(`https://boardgamegeek.com/boardgame/${props.id}`, '_blank')
}

const PALETTE = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-yellow-500',
  'bg-cyan-500', 'bg-indigo-500', 'bg-lime-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-violet-500', 'bg-sky-500'
]

function colorFor(username: string): string {
  let hash = 0
  for (const char of username) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash = hash & hash
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialFor(username: string): string {
  return username.charAt(0).toUpperCase()
}
</script>

<template>
  <article
    class="bg-white rounded-lg border border-neutral-200 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-200 cursor-pointer"
    @click="openBgg"
  >
    <img
      v-if="thumbnail"
      :src="thumbnail"
      :alt="name"
      class="w-full aspect-[4/3] object-cover bg-neutral-100"
    />
    <div v-else class="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center text-neutral-400 text-sm">
      No image
    </div>
    <div class="p-3">
      <h3 class="text-sm font-semibold line-clamp-2 leading-tight" :title="name">{{ name }}</h3>
      <p v-if="meta" class="text-xs text-neutral-500 mt-1">{{ meta }}</p>
      <div class="flex items-center gap-2 mt-2">
        <span v-if="hasAverage" class="text-xs font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
          {{ average?.toFixed(1) }}
        </span>
        <span v-if="hasWeight" class="text-xs font-medium bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
          {{ averageWeight?.toFixed(1) }}
        </span>
      </div>
      <div class="flex -space-x-1 mt-2">
        <span
          v-for="owner in owners"
          :key="owner.bggUsername"
          :title="owner.bggUsername"
          :class="['inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-medium text-white ring-2 ring-white', colorFor(owner.bggUsername)]"
        >
          {{ initialFor(owner.bggUsername) }}
        </span>
      </div>
    </div>
  </article>
</template>
