<script setup lang="ts">
import { computed } from 'vue'
import { useSessionDraftStore } from '@/stores/sessionDraft'

const props = defineProps<{
  sessionId: string
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'schedule', payload: {
    sessionId: string
    scheduledAt: string | null
    location: string | null
    capacity: number | null
  }): void
}>()

const draft = useSessionDraftStore()

const canSubmit = computed(() => !props.loading && draft.title.trim().length > 0)

function submit() {
  if (!canSubmit.value) return

  emit('schedule', {
    sessionId: props.sessionId,
    scheduledAt: draft.scheduledAt || null,
    location: draft.location.trim() || null,
    capacity: draft.capacity || null
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div>
      <label for="session-title" class="block text-sm font-medium text-neutral-700">Session title</label>
      <input
        id="session-title"
        v-model="draft.title"
        type="text"
        required
        class="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        placeholder="e.g. Friday Game Night"
      />
    </div>

    <div>
      <label for="session-datetime" class="block text-sm font-medium text-neutral-700">Date / time</label>
      <input
        id="session-datetime"
        v-model="draft.scheduledAt"
        type="datetime-local"
        class="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>

    <div>
      <label for="session-location" class="block text-sm font-medium text-neutral-700">Location</label>
      <input
        id="session-location"
        v-model="draft.location"
        type="text"
        class="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        placeholder="e.g. Alice's place"
      />
    </div>

    <div>
      <label for="session-capacity" class="block text-sm font-medium text-neutral-700">Capacity</label>
      <input
        id="session-capacity"
        v-model.number="draft.capacity"
        type="number"
        min="1"
        class="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        placeholder="e.g. 6"
      />
    </div>

    <button
      type="submit"
      :disabled="!canSubmit"
      class="mt-2 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed"
    >
      Schedule & send invites
    </button>
  </form>
</template>
