<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

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
</script>

<template>
  <Card
    class="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-0 gap-0 overflow-hidden"
    @click="openBgg"
  >
    <img
      v-if="thumbnail"
      :src="thumbnail"
      :alt="name"
      class="w-full aspect-[4/3] object-cover bg-surface-container"
    />
    <div
      v-else
      class="w-full aspect-[4/3] bg-surface-variant flex items-center justify-center text-on-surface-variant text-sm"
    >
      No image
    </div>
    <CardContent class="p-3">
      <h3 class="text-sm font-semibold line-clamp-2 leading-tight" :title="name">{{ name }}</h3>
      <p v-if="meta" class="text-xs text-on-surface-variant mt-1">{{ meta }}</p>
      <div class="flex items-center gap-2 mt-2">
        <Badge v-if="hasAverage" variant="invited">{{ average?.toFixed(1) }}</Badge>
        <Badge v-if="hasWeight" variant="draft">{{ averageWeight?.toFixed(1) }}</Badge>
      </div>
      <div class="flex -space-x-1 mt-2">
        <MemberAvatar
          v-for="owner in owners"
          :key="owner.bggUsername"
          :username="owner.bggUsername"
          size="xs"
          :title="owner.bggUsername"
        />
      </div>
      <div v-if="$slots.action" class="mt-3">
        <slot name="action" />
      </div>
    </CardContent>
  </Card>
</template>
