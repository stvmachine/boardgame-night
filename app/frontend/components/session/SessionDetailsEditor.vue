<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import type { NightSession } from '@/generated/operations'

interface Props {
  open: boolean
  session: NightSession
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', payload: {
    sessionId: string
    title: string
    description: string | null
    scheduledAt: string | null
    location: string | null
    capacity: number | null
  }): void
}>()

const titleInputRef = ref<InstanceType<typeof Input> | null>(null)
const errorSummaryRef = ref<HTMLDivElement | null>(null)

const draft = ref({
  title: '',
  description: '',
  scheduledAt: '',
  location: '',
  capacity: null as number | null
})

const validationErrors = ref<Record<string, string>>({})

const hasErrors = computed(() => Object.keys(validationErrors.value).length > 0)

const canSubmit = computed(() =>
  !props.loading &&
  draft.value.title.trim().length > 0 &&
  draft.value.title.trim().length <= 200 &&
  draft.value.description.length <= 2000 &&
  draft.value.location.length <= 200 &&
  (draft.value.capacity === null || draft.value.capacity > 0)
)

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function initializeDraft() {
  draft.value = {
    title: props.session.title || '',
    description: props.session.description || '',
    scheduledAt: toDatetimeLocal(props.session.scheduledAt as string | null | undefined),
    location: props.session.location || '',
    capacity: props.session.capacity ?? null
  }
  validationErrors.value = {}
}

function clearDraft() {
  draft.value = {
    title: '',
    description: '',
    scheduledAt: '',
    location: '',
    capacity: null
  }
  validationErrors.value = {}
}

function validate(): boolean {
  const errors: Record<string, string> = {}
  const title = draft.value.title.trim()

  if (title.length === 0) {
    errors.title = 'Title is required'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or less'
  }

  if (draft.value.description.length > 2000) {
    errors.description = 'Description must be 2000 characters or less'
  }

  if (draft.value.location.length > 200) {
    errors.location = 'Location must be 200 characters or less'
  }

  if (draft.value.capacity !== null && draft.value.capacity <= 0) {
    errors.capacity = 'Capacity must be at least 1'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

function submit() {
  if (!validate()) return

  emit('save', {
    sessionId: props.session.id,
    title: draft.value.title.trim(),
    description: draft.value.description.trim() || null,
    scheduledAt: fromDatetimeLocal(draft.value.scheduledAt),
    location: draft.value.location.trim() || null,
    capacity: draft.value.capacity ?? null
  })
}

function handleOpenUpdate(value: boolean) {
  emit('update:open', value)
}

function handleCancel() {
  emit('update:open', false)
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    initializeDraft()
    titleInputRef.value?.$el?.focus()
  } else {
    clearDraft()
  }
}, { immediate: true, flush: 'post' })

watch(() => props.error, (err) => {
  if (err) {
    errorSummaryRef.value?.focus()
  }
}, { immediate: true, flush: 'post' })
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenUpdate">
    <DialogContent
      class="w-[calc(100vw-32px)] max-h-[calc(100dvh-32px)] overflow-y-auto sm:max-w-xl"
      @interact-outside.prevent
    >
      <DialogHeader>
        <DialogTitle>Edit session details</DialogTitle>
        <DialogDescription>
          Update the session information. Game preferences stay locked while picking.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div
          v-if="error || hasErrors"
          ref="errorSummaryRef"
          data-testid="details-error"
          class="rounded-md border border-error bg-error-container p-3 text-sm text-on-error-container"
          role="alert"
          tabindex="-1"
        >
          <p class="font-medium">
            Couldn't save session details. Check the fields and try again.
          </p>
          <ul v-if="hasErrors" class="mt-1 list-disc pl-4">
            <li v-for="message in validationErrors" :key="message">
              {{ message }}
            </li>
          </ul>
        </div>

        <div class="space-y-1">
          <label for="session-title" class="text-sm font-medium text-on-surface">
            Title
          </label>
          <Input
            id="session-title"
            ref="titleInputRef"
            v-model="draft.title"
            type="text"
            :class="validationErrors.title ? 'border-error focus:border-error focus:ring-error' : ''"
          />
          <p v-if="validationErrors.title" class="text-sm text-error">
            {{ validationErrors.title }}
          </p>
        </div>

        <div class="space-y-1">
          <label for="session-description" class="text-sm font-medium text-on-surface">
            Description
          </label>
          <textarea
            id="session-description"
            v-model="draft.description"
            rows="3"
            class="border border-outline bg-surface px-3 py-2 text-sm text-on-surface transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary rounded-md w-full min-w-0 outline-none disabled:pointer-events-none disabled:opacity-50 resize-none"
          />
          <p v-if="validationErrors.description" class="text-sm text-error">
            {{ validationErrors.description }}
          </p>
        </div>

        <div class="space-y-1">
          <label for="session-datetime" class="text-sm font-medium text-on-surface">
            Date and time
          </label>
          <input
            id="session-datetime"
            v-model="draft.scheduledAt"
            type="datetime-local"
            class="border border-outline bg-surface px-3 py-2 text-sm text-on-surface transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary rounded-md w-full min-w-0 outline-none disabled:pointer-events-none disabled:opacity-50 h-11"
          />
        </div>

        <div class="space-y-1">
          <label for="session-location" class="text-sm font-medium text-on-surface">
            Location
          </label>
          <Input
            id="session-location"
            v-model="draft.location"
            type="text"
            :class="validationErrors.location ? 'border-error focus:border-error focus:ring-error' : ''"
          />
          <p v-if="validationErrors.location" class="text-sm text-error">
            {{ validationErrors.location }}
          </p>
        </div>

        <div class="space-y-1">
          <label for="session-capacity" class="text-sm font-medium text-on-surface">
            Capacity
          </label>
          <input
            id="session-capacity"
            v-model.number="draft.capacity"
            type="number"
            min="1"
            class="border border-outline bg-surface px-3 py-2 text-sm text-on-surface transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary rounded-md w-full min-w-0 outline-none disabled:pointer-events-none disabled:opacity-50 h-11"
          />
          <p v-if="validationErrors.capacity" class="text-sm text-error">
            {{ validationErrors.capacity }}
          </p>
        </div>

        <DialogFooter>
          <Button
            data-testid="cancel-details"
            type="button"
            variant="outline"
            :disabled="loading"
            @click="handleCancel"
          >
            Cancel
          </Button>
          <Button
            data-testid="save-details"
            type="submit"
            :disabled="!canSubmit || loading"
            :aria-busy="loading"
          >
            {{ loading ? 'Saving…' : 'Save details' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
