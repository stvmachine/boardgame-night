<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HotItem } from '@/generated/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Icon from '@/components/ui/icon/Icon.vue'

interface Props {
  item: HotItem
}

const props = defineProps<Props>()

const imageFailed = ref(false)

watch(() => props.item.thumbnail, () => { imageFailed.value = false })

const rating = computed(() =>
  props.item.average != null ? props.item.average.toFixed(1) : '—'
)

const weight = computed(() =>
  props.item.averageWeight != null ? props.item.averageWeight.toFixed(1) : '—'
)

const playerLabel = computed(() => {
  if (props.item.minPlayers == null && props.item.maxPlayers == null) return '—'
  if (props.item.minPlayers === props.item.maxPlayers) return String(props.item.minPlayers)
  return `${props.item.minPlayers ?? ''}–${props.item.maxPlayers ?? ''}`
})

const timeLabel = computed(() => {
  if (props.item.minPlaytime == null && props.item.maxPlaytime == null) return '—'
  if (props.item.minPlaytime === props.item.maxPlaytime) return `${props.item.minPlaytime} min`
  return `${props.item.minPlaytime ?? ''}–${props.item.maxPlaytime ?? ''} min`
})

function openBgg() {
  window.open(
    `https://boardgamegeek.com/boardgame/${props.item.id}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openBgg()
  }
}
</script>

<template>
  <Card
    data-testid="trending-card"
    class="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-0 gap-0 overflow-hidden border-outline/50 shadow-lg"
    role="button"
    tabindex="0"
    :aria-label="`Open ${item.name} on BoardGameGeek`"
    @click="openBgg"
    @keydown="handleKeydown"
  >
    <div class="relative overflow-hidden">
      <img
        v-if="item.thumbnail && !imageFailed"
        :src="item.thumbnail"
        :alt="item.name"
        class="w-full aspect-[4/3] object-cover bg-surface-container"
        @error="imageFailed = true"
      />
      <div
        v-else
        class="w-full aspect-[4/3] bg-surface-variant flex items-center justify-center text-on-surface-variant text-sm"
      >
        No image
      </div>
      <!-- Gradient scrim for badge legibility -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/50 pointer-events-none" />
      <!-- Rank badge (top-left) -->
      <div class="absolute top-2 left-2">
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
          #{{ item.rank }}
        </span>
      </div>
      <!-- Rating badge (top-right) -->
      <div v-if="item.average != null" class="absolute top-2 right-2">
        <span class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
          <Icon name="star" class="size-3" /> {{ rating }}
        </span>
      </div>
    </div>
    <CardContent class="p-3 space-y-1">
      <h3
        class="text-sm font-semibold line-clamp-2 leading-tight text-on-surface"
        :title="item.name"
      >
        {{ item.name }}
      </h3>
      <p class="text-xs text-on-surface-variant">
        <span v-if="item.yearPublished">{{ item.yearPublished }}</span>
        <span v-if="item.yearPublished">·</span>
        <span class="inline-flex items-center gap-1">
          <Icon name="fitness_center" class="size-3" /> {{ weight }}
        </span>
        ·
        <span class="inline-flex items-center gap-1">
          <Icon name="groups" class="size-3" /> {{ playerLabel }}
        </span>
        ·
        <span class="inline-flex items-center gap-1">
          <Icon name="schedule" class="size-3" /> {{ timeLabel }}
        </span>
      </p>
    </CardContent>
  </Card>
</template>
