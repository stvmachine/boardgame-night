<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { useMemberColor } from '@/composables/useMemberColor'
import Icon from '@/components/ui/icon/Icon.vue'

interface Owner {
  bggUsername: string
  avatar?: string | null
}

interface Props {
  id?: string
  objectid?: string | null
  name: string
  thumbnail?: string | null
  yearPublished?: number | null
  minPlayers?: number | null
  maxPlayers?: number | null
  minPlaytime?: number | null
  maxPlaytime?: number | null
  average?: number | null
  averageWeight?: number | null
  description?: string | null
  owners: Owner[]
  variant?: 'grid' | 'list'
  score?: number | null
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | null
  reasons?: string[] | null
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  objectid: null,
  variant: 'grid'
})

const MAX_VISIBLE_OWNERS = 3
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const showAllReasons = ref(false)

const plainDescription = computed(() => {
  if (!props.description) return ''
  return props.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
})

const visibleOwners = computed(() => props.owners.slice(0, MAX_VISIBLE_OWNERS))
const ownerOverflow = computed(() => Math.max(0, props.owners.length - MAX_VISIBLE_OWNERS))

const hasAverage = computed(() => props.average != null && props.average > 0)
const hasWeight = computed(() => props.averageWeight != null && props.averageWeight > 0)

const hasScore = computed(() => props.score != null)
const hasConfidence = computed(() => props.confidence != null)
const hasReasons = computed(() => props.reasons != null && props.reasons.length > 0)
const roundedScore = computed(() => props.score != null ? Math.round(props.score) : null)
const hasMoreReasons = computed(() => props.reasons != null && props.reasons.length > 3)
const visibleReasons = computed(() => {
  if (!props.reasons) return []
  return showAllReasons.value ? props.reasons : props.reasons.slice(0, 3)
})
const reasonSectionId = computed(() => `game-card-reasons-${props.id || props.objectid || 'unknown'}`)
const confidenceVariant = computed(() => {
  switch (props.confidence) {
    case 'HIGH': return 'completed'
    case 'MEDIUM': return 'invited'
    case 'LOW': return 'draft'
    default: return 'default'
  }
})
const confidenceLabel = computed(() => {
  switch (props.confidence) {
    case 'HIGH': return 'High confidence'
    case 'MEDIUM': return 'Medium confidence'
    case 'LOW': return 'Low confidence'
    default: return ''
  }
})

const playerLabel = computed(() => {
  if (props.minPlayers == null || props.maxPlayers == null) return '—'
  if (props.minPlayers === props.maxPlayers) return `${props.minPlayers}`
  return `${props.minPlayers}–${props.maxPlayers}`
})

const timeLabel = computed(() => {
  if (props.minPlaytime == null || props.maxPlaytime == null) return '—'
  if (props.minPlaytime === props.maxPlaytime) return `${props.minPlaytime}`
  return `${props.minPlaytime}–${props.maxPlaytime}`
})

const weightLabel = computed(() => {
  if (props.averageWeight == null) return '—'
  return props.averageWeight.toFixed(1)
})

function openBgg() {
  if (!props.objectid) return
  window.open(
    `https://boardgamegeek.com/boardgame/${props.objectid}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function isInsideAction(target: HTMLElement | null): boolean {
  return target?.closest('[data-slot="game-card-action"]') != null
}

function handleKeydown(event: KeyboardEvent) {
  if (isInsideAction(event.target as HTMLElement | null)) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openBgg()
  }
}

function handleClick(event: MouseEvent) {
  if (isInsideAction(event.target as HTMLElement | null)) return
  openBgg()
}
</script>

<template>
  <Card
    data-testid="game-card"
    :class="[
      'cursor-pointer hover:shadow-md transition-all duration-300 p-0 gap-0 overflow-hidden motion-reduce:hover:translate-y-0',
      variant === 'list' ? 'flex-row' : 'flex-col hover:-translate-y-1'
    ]"
    tabindex="0"
    role="button"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <template v-if="variant === 'list'">
      <img
        :src="thumbnail || TRANSPARENT_PIXEL"
        :alt="name"
        class="w-24 aspect-[4/3] object-cover bg-surface-variant rounded-lg flex-shrink-0 m-3"
      />
      <CardContent class="p-3 flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-semibold text-on-surface line-clamp-1" :title="name">{{ name }}</h3>
          <div class="flex items-center gap-2 flex-shrink-0">
            <Badge v-if="hasAverage" variant="invited">{{ average?.toFixed(1) }}</Badge>
            <Badge v-if="hasWeight" variant="draft">{{ averageWeight?.toFixed(1) }}</Badge>
          </div>
        </div>
        <p
          v-if="plainDescription"
          data-testid="game-description"
          class="text-sm text-on-surface-variant line-clamp-3 mt-1"
        >
          {{ plainDescription }}
        </p>
        <div v-if="hasScore || hasConfidence || hasReasons" class="space-y-2 mt-2">
          <div v-if="hasScore || hasConfidence" class="flex items-center gap-2">
            <span
              v-if="hasScore"
              data-testid="suggestion-score"
              class="rounded-full bg-surface-container-high px-2 py-0.5 text-sm font-semibold tabular-nums text-primary"
            >
              Score {{ roundedScore }}
            </span>
            <Badge v-if="hasConfidence" :variant="confidenceVariant">{{ confidenceLabel }}</Badge>
          </div>
          <div v-if="hasReasons" :id="reasonSectionId" class="flex flex-wrap gap-2">
            <span
              v-for="reason in visibleReasons"
              :key="reason"
              data-testid="reason-chip"
              class="inline-flex items-center rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant"
            >
              {{ reason }}
            </span>
            <button
              v-if="hasMoreReasons"
              type="button"
              data-testid="show-more-reasons"
              :aria-expanded="showAllReasons"
              :aria-controls="reasonSectionId"
              class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
              @click.stop="showAllReasons = !showAllReasons"
              @keydown.stop="() => {}"
            >
              Show more reasons
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between mt-2">
          <div
            data-testid="game-card-footer"
            class="grid grid-cols-3 gap-4 text-sm font-semibold text-on-surface-variant"
          >
            <span class="flex items-center gap-1">
              <Icon name="groups" class="size-3" /> {{ playerLabel }}
            </span>
            <span class="flex items-center gap-1">
              <Icon name="schedule" class="size-3" /> {{ timeLabel }}
            </span>
            <span class="flex items-center gap-1">
              <Icon name="fitness_center" class="size-3" /> {{ weightLabel }}
            </span>
          </div>
          <AvatarGroup class="flex -space-x-1 *:data-[slot=avatar]:ring-white">
            <Avatar
              v-for="owner in visibleOwners"
              :key="owner.bggUsername"
              :class="useMemberColor(owner.bggUsername)"
              size="xs"
              :title="owner.bggUsername"
            >
              <AvatarFallback>{{ owner.bggUsername.charAt(0).toUpperCase() }}</AvatarFallback>
            </Avatar>
            <AvatarGroupCount
              v-if="ownerOverflow > 0"
              class="bg-surface-container-high text-on-surface-variant ring-white"
            >
              +{{ ownerOverflow }}
            </AvatarGroupCount>
          </AvatarGroup>
        </div>
        <div v-if="$slots.action" data-slot="game-card-action" class="mt-3" @click.stop>
          <slot name="action" />
        </div>
      </CardContent>
    </template>

    <template v-else>
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
      <CardContent class="p-3 space-y-2">
        <h3 class="text-sm font-semibold line-clamp-2 leading-tight text-on-surface" :title="name">{{ name }}</h3>
        <p
          v-if="plainDescription"
          data-testid="game-description"
          class="text-sm text-on-surface-variant line-clamp-2"
        >
          {{ plainDescription }}
        </p>
        <div v-if="hasScore || hasConfidence || hasReasons" class="space-y-2">
          <div v-if="hasScore || hasConfidence" class="flex items-center gap-2">
            <span
              v-if="hasScore"
              data-testid="suggestion-score"
              class="rounded-full bg-surface-container-high px-2 py-0.5 text-sm font-semibold tabular-nums text-primary"
            >
              Score {{ roundedScore }}
            </span>
            <Badge v-if="hasConfidence" :variant="confidenceVariant">{{ confidenceLabel }}</Badge>
          </div>
          <div v-if="hasReasons" :id="reasonSectionId" class="flex flex-wrap gap-2">
            <span
              v-for="reason in visibleReasons"
              :key="reason"
              data-testid="reason-chip"
              class="inline-flex items-center rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant"
            >
              {{ reason }}
            </span>
            <button
              v-if="hasMoreReasons"
              type="button"
              data-testid="show-more-reasons"
              :aria-expanded="showAllReasons"
              :aria-controls="reasonSectionId"
              class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
              @click.stop="showAllReasons = !showAllReasons"
              @keydown.stop="() => {}"
            >
              Show more reasons
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Badge v-if="hasAverage" variant="invited">{{ average?.toFixed(1) }}</Badge>
          <Badge v-if="hasWeight" variant="draft">{{ averageWeight?.toFixed(1) }}</Badge>
        </div>
        <AvatarGroup class="flex -space-x-1 *:data-[slot=avatar]:ring-white">
          <Avatar
            v-for="owner in visibleOwners"
            :key="owner.bggUsername"
            :class="useMemberColor(owner.bggUsername)"
            size="xs"
            :title="owner.bggUsername"
          >
            <AvatarFallback>{{ owner.bggUsername.charAt(0).toUpperCase() }}</AvatarFallback>
          </Avatar>
          <AvatarGroupCount
            v-if="ownerOverflow > 0"
            class="bg-surface-container-high text-on-surface-variant ring-white"
          >
            +{{ ownerOverflow }}
          </AvatarGroupCount>
        </AvatarGroup>
        <div
          data-testid="game-card-footer"
          class="grid grid-cols-3 gap-1 text-sm font-semibold text-on-surface-variant pt-2 border-t border-outline"
        >
          <div class="flex items-center gap-1">
            <Icon name="groups" class="size-3" /> {{ playerLabel }}
          </div>
          <div class="flex items-center gap-1">
            <Icon name="schedule" class="size-3" /> {{ timeLabel }}
          </div>
          <div class="flex items-center gap-1">
            <Icon name="fitness_center" class="size-3" /> {{ weightLabel }}
          </div>
        </div>
        <div v-if="$slots.action" data-slot="game-card-action" class="mt-3" @click.stop>
          <slot name="action" />
        </div>
      </CardContent>
    </template>
  </Card>
</template>
