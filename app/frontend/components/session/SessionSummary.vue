<script setup lang="ts">
import { computed } from 'vue'
import GameCard from '@/components/collection/GameCard.vue'
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import type { NightSession } from '@/generated/operations'

interface Props {
  session: NightSession
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'reopen'): void
}>()

const goingAttendees = computed(() =>
  props.session.attendances.filter(a => a.response === 'going')
)

const notGoingAttendees = computed(() =>
  props.session.attendances.filter(a => a.response === 'not_going')
)

const dateDisplay = computed(() => {
  if (!props.session.scheduledAt) return 'No date scheduled'
  return new Date(props.session.scheduledAt as string).toLocaleString()
})

const pickedGame = computed(() => props.session.pickedGame)

function responseClass(response: string): string {
  return response === 'going'
    ? 'bg-green-100 text-green-800'
    : 'bg-neutral-100 text-neutral-700'
}

function responseLabel(response: string): string {
  return response === 'going' ? 'Going' : 'Not going'
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-lg bg-white p-4 shadow-sm">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-neutral-900">{{ session.title }}</h2>
        <p class="text-sm text-neutral-500">{{ dateDisplay }}</p>
        <p v-if="session.location" class="text-sm text-neutral-500">
          📍 {{ session.location }}
        </p>
        <p v-if="session.capacity" class="text-sm text-neutral-500">
          Capacity: {{ session.capacity }}
        </p>
      </div>

      <div v-if="pickedGame">
        <h3 class="mb-3 text-sm font-medium text-neutral-700">Picked game</h3>
        <div class="max-w-xs">
          <GameCard
            :id="pickedGame.id"
            :name="pickedGame.name"
            :thumbnail="pickedGame.thumbnail"
            :year-published="pickedGame.yearPublished"
            :min-players="pickedGame.minPlayers"
            :max-players="pickedGame.maxPlayers"
            :min-playtime="pickedGame.minPlaytime"
            :max-playtime="pickedGame.maxPlaytime"
            :average="pickedGame.average"
            :average-weight="pickedGame.averageWeight"
            :owners="pickedGame.owners"
          />
        </div>
      </div>
      <div v-else class="rounded-md bg-neutral-100 p-4 text-sm text-neutral-600">
        No game picked yet.
      </div>
    </div>

    <div class="rounded-lg bg-white p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-medium text-neutral-700">
        Attendees ({{ session.attendeeCount }} going)
      </h3>

      <div class="space-y-3">
        <div v-if="goingAttendees.length > 0">
          <h4 class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Going</h4>
          <ul class="space-y-2">
            <li
              v-for="attendance in goingAttendees"
              :key="attendance.id"
              class="flex items-center justify-between rounded-md border border-neutral-200 p-2"
            >
              <div class="flex items-center gap-2">
                <MemberAvatar
                  :username="attendance.user.displayName || attendance.user.username"
                  size="sm"
                />
                <span class="text-sm text-neutral-900">{{ attendance.user.displayName || attendance.user.username }}</span>
              </div>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="responseClass(attendance.response)"
              >
                {{ responseLabel(attendance.response) }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="notGoingAttendees.length > 0">
          <h4 class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Not going</h4>
          <ul class="space-y-2">
            <li
              v-for="attendance in notGoingAttendees"
              :key="attendance.id"
              class="flex items-center justify-between rounded-md border border-neutral-200 p-2"
            >
              <div class="flex items-center gap-2">
                <MemberAvatar
                  :username="attendance.user.displayName || attendance.user.username"
                  size="sm"
                />
                <span class="text-sm text-neutral-900">{{ attendance.user.displayName || attendance.user.username }}</span>
              </div>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="responseClass(attendance.response)"
              >
                {{ responseLabel(attendance.response) }}
              </span>
            </li>
          </ul>
        </div>

        <div
          v-if="session.attendances.length === 0"
          class="rounded-md bg-neutral-100 p-4 text-sm text-neutral-600"
        >
          No responses yet.
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        type="button"
        class="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        @click="emit('reopen')"
      >
        Reopen session
      </button>
    </div>
  </div>
</template>
