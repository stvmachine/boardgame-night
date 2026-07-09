<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNightSessionQuery, useScheduleSessionMutation, useStartPickingMutation, useCurrentUserQuery } from '@/generated/operations'
import { useSessionDraftStore } from '@/stores/sessionDraft'
import AppShell from '@/components/layout/AppShell.vue'
import SessionEditor from '@/components/session/SessionEditor.vue'
import RsvpDashboard from '@/components/session/RsvpDashboard.vue'
import GamePicker from '@/components/session/GamePicker.vue'
import EmptyState from '@/components/collection/EmptyState.vue'

const route = useRoute()
const draft = useSessionDraftStore()

const sessionId = computed(() => String(route.params.id))
const { result, loading, error: queryError } = useNightSessionQuery(() => ({ id: sessionId.value }))
const { result: currentUserResult } = useCurrentUserQuery()
const { mutate: schedule, loading: scheduling, error: scheduleError, onDone } = useScheduleSessionMutation()
const { mutate: startPicking, loading: startingPicking, error: startPickingError } = useStartPickingMutation()

const session = computed(() => result.value?.nightSession)
const currentUser = computed(() => currentUserResult.value?.currentUser)
const isHost = computed(() => session.value?.host?.id === currentUser.value?.id)

const stateBadge = computed(() => {
  switch (session.value?.state) {
    case 'DRAFT':
      return 'bg-neutral-100 text-neutral-700'
    case 'INVITED':
      return 'bg-indigo-100 text-indigo-800'
    case 'PICKING':
      return 'bg-amber-100 text-amber-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-neutral-100 text-neutral-700'
  }
})

watch(session, (s) => {
  if (!s) return
  draft.title = s.title || ''
  draft.description = s.description || ''
  draft.scheduledAt = s.scheduledAt || null
  draft.location = s.location || ''
  draft.capacity = s.capacity || null
}, { immediate: true })

onDone(() => {
  draft.reset()
})

async function handleSchedule(payload: {
  sessionId: string
  scheduledAt: string | null
  location: string | null
  capacity: number | null
}) {
  await schedule({
    sessionId: payload.sessionId,
    scheduledAt: payload.scheduledAt,
    location: payload.location,
    capacity: payload.capacity
  })
}

async function handleStartPicking() {
  await startPicking({ sessionId: sessionId.value })
}

function handlePicked() {
  // Apollo cache updates via mutation result; no manual refetch needed
}

const isActiveState = computed(() => {
  return ['DRAFT', 'INVITED', 'PICKING'].includes(session.value?.state ?? '')
})
</script>

<template>
  <AppShell>
    <div class="p-4 md:p-6">
      <div v-if="loading" class="text-sm text-neutral-500">Loading session...</div>

      <EmptyState
        v-else-if="queryError"
        heading="Couldn’t load this page"
        body="Please check your connection and try again."
      />

      <template v-else-if="session">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold text-neutral-900">{{ session.title }}</h1>
            <p class="text-sm text-neutral-500">Hosted by {{ session.host.displayName }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="session.state === 'INVITED' && isHost"
              type="button"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500"
              :disabled="startingPicking"
              @click="handleStartPicking"
            >
              {{ startingPicking ? 'Starting...' : 'Start picking' }}
            </button>
            <span
              class="rounded-full px-3 py-1 text-xs font-medium"
              :class="stateBadge"
            >
              {{ session.state }}
            </span>
          </div>
        </div>

        <div
          v-if="startPickingError"
          class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {{ startPickingError.message }}
        </div>

        <div v-if="session.state === 'DRAFT'" class="rounded-lg bg-white p-4 shadow-sm">
          <SessionEditor
            :session-id="sessionId"
            :loading="scheduling"
            :error="scheduleError?.message"
            @schedule="handleSchedule"
          />
        </div>

        <RsvpDashboard
          v-else-if="session.state === 'INVITED'"
          :attendances="session.attendances"
          :is-host="isHost"
        />

        <div v-else-if="session.state === 'PICKING'" class="rounded-lg bg-white p-4 shadow-sm">
          <GamePicker
            :session="session"
            @picked="handlePicked"
          />
        </div>

        <div v-else-if="session.state === 'COMPLETED'" class="rounded-lg bg-white p-4 shadow-sm">
          <p class="text-sm text-neutral-600">Session completed — summary view coming in the next step.</p>
        </div>

        <div v-else class="rounded-lg bg-white p-4 shadow-sm">
          <p class="text-sm text-neutral-600">Session is {{ session.state.toLowerCase() }}.</p>
        </div>
      </template>

      <EmptyState
        v-else
        heading="Session not found"
        body="This session doesn’t exist or you don’t have access to it."
      />
    </div>
  </AppShell>
</template>
