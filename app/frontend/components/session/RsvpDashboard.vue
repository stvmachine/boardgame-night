<script setup lang="ts">
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import { Badge } from '@/components/ui/badge'
import type { AttendanceFragment } from '@/generated/types'

interface Props {
  attendances: readonly AttendanceFragment[]
  isHost?: boolean
}

defineProps<Props>()

const goingCount = (attendances: readonly AttendanceFragment[]) =>
  attendances.filter(a => a.response === 'going').length

const responseBadgeVariant = (response: string) => {
  if (response === 'going') {
    return 'completed'
  }
  return 'default'
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-lg bg-white p-4 shadow-sm">
      <p class="text-sm text-neutral-600">Attendee count</p>
      <p class="text-3xl font-semibold text-neutral-900">{{ goingCount(attendances) }}</p>
    </div>

    <div v-if="isHost" class="rounded-lg bg-white p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-medium text-neutral-700">Responses</h3>
      <ul v-if="attendances.length > 0" class="space-y-2">
        <li v-for="attendance in attendances" :key="attendance.id" class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <MemberAvatar :username="attendance.user.username" />
            <span class="text-sm text-neutral-900">{{ attendance.user.displayName }}</span>
          </div>
          <Badge :variant="responseBadgeVariant(attendance.response)">
            {{ attendance.response === 'going' ? 'Going' : 'Not going' }}
          </Badge>
        </li>
      </ul>
      <p v-else class="text-sm text-neutral-500">No responses yet.</p>
    </div>
  </div>
</template>
