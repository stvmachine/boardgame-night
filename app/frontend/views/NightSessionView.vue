<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNightSessionQuery, useScheduleSessionMutation } from '@/generated/operations'
import { useSessionDraftStore } from '@/stores/sessionDraft'
import AppShell from '@/components/layout/AppShell.vue'
import SessionEditor from '@/components/session/SessionEditor.vue'
import RsvpDashboard from '@/components/session/RsvpDashboard.vue'
import EmptyState from '@/components/collection/EmptyState.vue'

const route = useRoute()
const draft = useSessionDraftStore()

const sessionId = computed(() => String(route.params.id))
const { result, loading, error: queryError } = useNightSessionQuery(() => ({ id: sessionId.value }))
const { mutate: schedule, loading: scheduling, error: scheduleError, onDone } = useScheduleSessionMutation()

const session = computed(() => result.value?.nightSession)
const isHost = computed(() => session.value?.host?.id === route.params.id)

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
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-neutral-900">{{ session.title }}</h1>
            <p class="text-sm text-neutral-500">Hosted by {{ session.host.displayName }}</p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-medium"
            :class="stateBadge"
          >
            {{ session.state }}
          </span>
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
