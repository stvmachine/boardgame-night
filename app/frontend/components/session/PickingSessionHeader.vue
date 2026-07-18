<script setup lang="ts">
import { computed, ref } from 'vue'
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon/Icon.vue'
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import type { NightSession } from '@/generated/operations'

interface Props {
  session: NightSession
  isHost: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'edit-details'): void
}>()

const editButtonRef = ref<InstanceType<typeof Button> | null>(null)

const goingAttendees = computed(() =>
  props.session.attendances.filter(a => a.response === 'going')
)

const dateDisplay = computed(() => {
  if (!props.session.scheduledAt) return 'Date TBD'
  return new Date(props.session.scheduledAt as string).toLocaleString()
})

const locationDisplay = computed(() => {
  if (!props.session.location) return 'Location TBD'
  return props.session.location
})

const visibleAttendees = computed(() => goingAttendees.value.slice(0, 5))

const groupAriaLabel = computed(() => {
  const names = goingAttendees.value
    .map(a => a.user.displayName || a.user.username)
    .join(', ')
  return `${goingAttendees.value.length} confirmed players: ${names}`
})

function emitEditDetails() {
  emit('edit-details')
}

function focusEditButton() {
  editButtonRef.value?.$el?.focus()
}

defineExpose({
  focusEditButton
})
</script>

<template>
  <div
    data-testid="picking-header"
    class="rounded-xl border border-outline bg-surface-container shadow-card p-4 md:p-6"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap">
      <!-- Title and status -->
      <div class="lg:order-1 lg:w-1/2">
        <h1 class="text-[28px] font-semibold leading-[1.2] text-on-surface">
          {{ session.title }}
        </h1>
        <Badge variant="picking" class="mt-2">
          Picking
        </Badge>
      </div>

      <!-- Host-only Edit Details -->
      <div
        v-if="isHost"
        class="lg:order-1 lg:w-1/2 lg:flex lg:justify-end"
      >
        <Button
          ref="editButtonRef"
          variant="outline"
          class="w-full sm:w-auto h-11"
          @click="emitEditDetails"
        >
          <Icon name="edit" class="mr-2 h-4 w-4" />
          Edit Details
        </Button>
      </div>

      <!-- Date and location metadata -->
      <div class="lg:order-2 lg:w-1/2">
        <p class="text-base text-on-surface">
          {{ dateDisplay }}
        </p>
        <p class="text-base text-on-surface-variant">
          {{ locationDisplay }}
        </p>
      </div>

      <!-- Going attendees -->
      <div class="lg:order-2 lg:w-1/2 lg:flex lg:justify-end">
        <div class="flex items-center gap-2">
          <AvatarGroup
            :aria-label="groupAriaLabel"
            class="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background"
          >
            <span
              v-for="(attendee, index) in visibleAttendees"
              :key="attendee.id"
              aria-hidden="true"
              :class="index === 4 ? 'hidden md:inline-flex' : 'inline-flex'"
            >
              <MemberAvatar
                :username="attendee.user.displayName || attendee.user.username"
                size="sm"
              />
            </span>
            <AvatarGroupCount
              v-if="goingAttendees.length > 4"
              class="inline-flex md:hidden bg-surface-container-high text-on-surface-variant"
            >
              +{{ goingAttendees.length - 4 }}
            </AvatarGroupCount>
            <AvatarGroupCount
              v-if="goingAttendees.length > 5"
              class="hidden md:inline-flex bg-surface-container-high text-on-surface-variant"
            >
              +{{ goingAttendees.length - 5 }}
            </AvatarGroupCount>
          </AvatarGroup>
          <span class="text-sm text-on-surface-variant">
            {{ goingAttendees.length }} going
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
