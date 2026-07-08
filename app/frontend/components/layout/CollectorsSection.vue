<script setup lang="ts">
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import type { UserSyncStatus } from '@/generated/operations'

interface Props {
  usernames: string[]
  selected: Set<string>
  syncStatuses?: UserSyncStatus[]
}

withDefaults(defineProps<Props>(), {
  syncStatuses: () => []
})

const emit = defineEmits<{
  (e: 'toggle', username: string): void
  (e: 'select-all'): void
  (e: 'deselect-all'): void
}>()

function statusFor(username: string, statuses: UserSyncStatus[]): string {
  return statuses.find(s => s.username === username)?.status ?? 'READY'
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="text-xs text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 py-0.5"
        @click="emit('select-all')"
      >
        Select All
      </button>
      <button
        type="button"
        class="text-xs text-neutral-600 hover:text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 py-0.5"
        @click="emit('deselect-all')"
      >
        Deselect All
      </button>
    </div>

    <div v-if="usernames.length === 0" class="text-sm text-neutral-500">
      No collectors selected.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="username in usernames"
        :key="username"
        class="flex items-center gap-2 rounded-md border border-neutral-200 bg-white p-2"
      >
        <input
          :id="`owner-${username}`"
          type="checkbox"
          :checked="selected.has(username)"
          :aria-label="username"
          class="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
          @change="emit('toggle', username)"
        />
        <label :for="`owner-${username}`" class="flex items-center gap-2 flex-1 cursor-pointer">
          <MemberAvatar :username="username" size="sm" />
          <span class="text-sm font-medium text-neutral-800">{{ username }}</span>
        </label>
        <span
          v-if="statusFor(username, syncStatuses) === 'SYNCING'"
          class="text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded"
        >
          Syncing
        </span>
      </li>
    </ul>
  </div>
</template>
