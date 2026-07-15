<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Group, GroupSpotlightThing } from '@/generated/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { useMemberColor } from '@/composables/useMemberColor'
import EmptyState from '@/components/collection/EmptyState.vue'

interface Props {
  games: GroupSpotlightThing[]
  group: Group
}

const props = defineProps<Props>()

const MAX_VISIBLE_OWNERS = 3

function visibleOwners(game: GroupSpotlightThing) {
  return game.owners.slice(0, MAX_VISIBLE_OWNERS)
}

function overflow(game: GroupSpotlightThing) {
  return Math.max(0, game.owners.length - MAX_VISIBLE_OWNERS)
}

function hasAverage(game: GroupSpotlightThing) {
  return game.average != null && game.average > 0
}

function openGame(game: GroupSpotlightThing) {
  window.open(
    `https://boardgamegeek.com/boardgame/${game.objectid}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function handleKeydown(event: KeyboardEvent, game: GroupSpotlightThing) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openGame(game)
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Shared collection spotlight</CardTitle>
        <RouterLink
          :to="{ path: '/collection', query: { group: group.inviteCode } }"
          class="text-sm font-medium text-primary hover:underline"
        >
          Browse Library
        </RouterLink>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="games.length === 0" class="text-center">
        <EmptyState
          heading="The shared library is empty"
          body="Members’ collections will appear once they bind their BGG usernames."
        />
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="game in games"
          :key="game.id"
          data-testid="spotlight-card"
          class="group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-xl border border-outline bg-surface-container overflow-hidden"
          role="button"
          tabindex="0"
          :aria-label="`Open ${game.name} on BoardGameGeek`"
          @click="openGame(game)"
          @keydown="(e) => handleKeydown(e, game)"
        >
          <div class="aspect-[4/3] bg-surface-variant overflow-hidden">
            <img
              v-if="game.thumbnail"
              :src="game.thumbnail"
              :alt="game.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
              No image
            </div>
          </div>
          <div class="p-3">
            <h3 class="text-sm font-semibold line-clamp-2 leading-tight text-on-surface" :title="game.name">
              {{ game.name }}
            </h3>
            <Badge v-if="hasAverage(game)" variant="invited" class="mt-1">
              {{ game.average?.toFixed(1) }}
            </Badge>
            <AvatarGroup v-if="game.owners.length > 0" class="mt-2">
              <Avatar
                v-for="owner in visibleOwners(game)"
                :key="owner.bggUsername"
                :class="useMemberColor(owner.bggUsername)"
                size="sm"
                :title="owner.bggUsername"
              >
                <AvatarFallback>
                  {{ owner.bggUsername.charAt(0).toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <AvatarGroupCount v-if="overflow(game) > 0">
                +{{ overflow(game) }}
              </AvatarGroupCount>
            </AvatarGroup>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
