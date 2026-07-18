<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  useNightSessionQuery,
  useScheduleSessionMutation,
  useStartPickingMutation,
  useCancelSessionMutation,
  useReopenSessionMutation,
  useCurrentUserQuery,
  useUpdateSessionDetailsMutation
} from '@/generated/operations'
import type { NightSession } from '@/generated/operations'
import { useSessionDraftStore } from '@/stores/sessionDraft'
import AppShell from '@/components/layout/AppShell.vue'
import SessionEditor from '@/components/session/SessionEditor.vue'
import RsvpDashboard from '@/components/session/RsvpDashboard.vue'
import GamePicker from '@/components/session/GamePicker.vue'
import SessionSummary from '@/components/session/SessionSummary.vue'
import EmptyState from '@/components/collection/EmptyState.vue'
import PickingSessionHeader from '@/components/session/PickingSessionHeader.vue'
import SessionDetailsEditor from '@/components/session/SessionDetailsEditor.vue'
import Skeleton from '@/components/ui/skeleton/Skeleton.vue'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const draft = useSessionDraftStore()

const sessionId = computed(() => String(route.params.id as string))
const { result, loading, error: queryError, refetch } = useNightSessionQuery(
  () => ({ id: sessionId.value }),
  { errorPolicy: 'all' }
)
const { result: currentUserResult } = useCurrentUserQuery()
const { mutate: schedule, loading: scheduling, error: scheduleError, onDone } = useScheduleSessionMutation()
const { mutate: startPicking, loading: startingPicking, error: startPickingError } = useStartPickingMutation()
const { mutate: cancelSession, loading: cancelling, error: cancelError } = useCancelSessionMutation()
const { mutate: reopenSession, loading: reopening, error: reopenError } = useReopenSessionMutation()
const { mutate: updateDetails, loading: updatingDetails, error: updateDetailsError, onDone: onUpdateDetailsDone } = useUpdateSessionDetailsMutation()

const session = computed(() => result.value?.nightSession)
const currentUser = computed(() => currentUserResult.value?.currentUser)
const isHost = computed(() => session.value?.host?.id === currentUser.value?.id)
const showCancelConfirm = ref(false)
const showDetailsEditor = ref(false)
const pickingHeaderRef = ref<InstanceType<typeof PickingSessionHeader> | null>(null)
const pickAnnouncement = ref('')
const detailsAnnouncement = ref('')
const detailsErrorMessage = computed(() => updateDetailsError?.value?.message ?? null)

const stateBadgeVariant = computed(() => {
  switch (session.value?.state) {
    case 'DRAFT':
      return 'draft'
    case 'INVITED':
      return 'invited'
    case 'PICKING':
      return 'picking'
    case 'COMPLETED':
      return 'completed'
    case 'CANCELLED':
      return 'default'
    default:
      return 'default'
  }
})

watch(session, (s) => {
  if (!s) return
  draft.title = s.title || ''
  draft.description = s.description || ''
  draft.scheduledAt = (s.scheduledAt as string | null) ?? null
  draft.location = s.location || ''
  draft.capacity = s.capacity || null
}, { immediate: true })

onDone(() => {
  draft.reset()
})

onUpdateDetailsDone(() => {
  showDetailsEditor.value = false
  detailsAnnouncement.value = ''
  nextTick(() => {
    detailsAnnouncement.value = 'Session details updated.'
    pickingHeaderRef.value?.focusEditButton()
  })
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
  await refetch()
}

function handlePicked(gameName: string) {
  pickAnnouncement.value = ''
  nextTick(() => {
    pickAnnouncement.value = `${gameName} selected for this night.`
  })
}

async function handleUpdateDetails(payload: {
  sessionId: string
  title: string
  description: string | null
  scheduledAt: string | null
  location: string | null
  capacity: number | null
}) {
  await updateDetails(payload)
}

async function handleCancel() {
  await cancelSession({ sessionId: sessionId.value })
  showCancelConfirm.value = false
}

async function handleReopen() {
  await reopenSession({ sessionId: sessionId.value })
}

const isActiveState = computed(() => {
  return ['DRAFT', 'INVITED', 'PICKING'].includes(session.value?.state ?? '')
})
</script>

<template>
  <AppShell>
    <div class="p-4 md:p-6">
      <div v-if="loading && !session" class="text-sm text-neutral-500">Loading session...</div>

      <EmptyState
        v-else-if="queryError && !session"
        heading="Couldn’t load this page"
        body="Please check your connection and try again."
      />

      <template v-else-if="session">
        <div
          v-if="session.state !== 'PICKING'"
          class="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 class="text-xl font-semibold text-neutral-900">{{ session.title }}</h1>
            <p class="text-sm text-neutral-500">Hosted by {{ session.host.displayName }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="session.state === 'INVITED' && isHost"
              data-testid="start-picking"
              type="button"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500"
              :disabled="startingPicking"
              @click="handleStartPicking"
            >
              {{ startingPicking ? 'Starting...' : 'Start picking' }}
            </button>
            <button
              v-if="session.state === 'CANCELLED' && isHost"
              data-testid="reopen-session"
              type="button"
              class="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500"
              :disabled="reopening"
              @click="handleReopen"
            >
              {{ reopening ? 'Reopening...' : 'Reopen session' }}
            </button>
            <button
              v-if="isActiveState && isHost"
              type="button"
              class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500"
              :disabled="cancelling"
              @click="showCancelConfirm = true"
            >
              Cancel
            </button>
            <Badge :variant="stateBadgeVariant">
              {{ session.state }}
            </Badge>
          </div>
        </div>

        <div
          v-if="startPickingError"
          class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {{ startPickingError.message }}
        </div>

        <div
          v-if="cancelError"
          class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {{ cancelError.message }}
        </div>

        <div
          v-if="reopenError"
          class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {{ reopenError.message }}
        </div>

        <div
          v-if="showCancelConfirm"
          class="mb-4 rounded-md border border-red-200 bg-red-50 p-4"
        >
          <p class="text-sm font-medium text-red-900">
            Cancel night: This will delete the session and notify invited guests. This action cannot be undone.
          </p>
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500"
              :disabled="cancelling"
              @click="handleCancel"
            >
              {{ cancelling ? 'Cancelling...' : 'Yes, cancel session' }}
            </button>
            <button
              type="button"
              class="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              @click="showCancelConfirm = false"
            >
              Never mind
            </button>
          </div>
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

        <div v-else-if="session.state === 'PICKING'" class="max-w-7xl mx-auto space-y-8">
          <div
            aria-live="polite"
            aria-atomic="true"
            data-testid="live-region"
            class="sr-only"
          >
            {{ pickAnnouncement }} {{ detailsAnnouncement }}
          </div>

          <div v-if="loading && !session" class="rounded-xl border border-outline bg-surface-container shadow-card p-4 md:p-6 space-y-4">
            <Skeleton class="h-8 w-1/2" />
            <Skeleton class="h-6 w-24" />
            <Skeleton class="h-4 w-1/3" />
            <div class="flex items-center gap-2">
              <Skeleton class="h-8 w-8 rounded-full" />
              <Skeleton class="h-4 w-16" />
            </div>
            <Skeleton class="h-11 w-full sm:w-40" />
          </div>

          <PickingSessionHeader
            v-else
            ref="pickingHeaderRef"
            :session="session as NightSession"
            :is-host="isHost"
            @edit-details="showDetailsEditor = true"
          />

          <SessionDetailsEditor
            v-if="isHost"
            v-model:open="showDetailsEditor"
            :session="session as NightSession"
            :loading="updatingDetails"
            :error="detailsErrorMessage"
            @save="handleUpdateDetails"
          />

          <GamePicker
            :session="session as NightSession"
            :is-host="isHost"
            :loading="loading"
            :error="queryError"
            @retry="refetch"
            @picked="handlePicked"
          />
        </div>

        <div v-else-if="session.state === 'COMPLETED'" class="rounded-lg bg-white p-4 shadow-sm">
          <SessionSummary
            :session="session as NightSession"
            @reopen="handleReopen"
          />
        </div>

        <div v-else-if="session.state === 'CANCELLED'" class="rounded-lg bg-white p-4 shadow-sm">
          <div class="space-y-4">
            <p class="text-sm text-red-700">
              This session was cancelled.
              <span v-if="session.previousState">
                It was previously {{ session.previousState.toLowerCase() }}.
              </span>
            </p>
            <button
              v-if="isHost"
              data-testid="reopen-session"
              type="button"
              class="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500"
              :disabled="reopening"
              @click="handleReopen"
            >
              {{ reopening ? 'Reopening...' : 'Reopen session' }}
            </button>
          </div>
        </div>

        <div v-else class="rounded-lg bg-white p-4 shadow-sm">
          <p class="text-sm text-neutral-600">Session is {{ (session.state as unknown as string).toLowerCase() }}.</p>
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
