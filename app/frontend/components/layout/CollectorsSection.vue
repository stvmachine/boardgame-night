<script setup lang="ts">
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import RefreshButton from '@/components/sidebar/RefreshButton.vue'
import type { UserSyncStatus } from '@/generated/operations'

interface Props {
  usernames: string[]
  selected: Set<string>
  syncStatuses?: UserSyncStatus[]
  cooldownFor?: (username: string) => number
  isRefreshing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  syncStatuses: () => [],
  cooldownFor: () => 0,
  isRefreshing: false
})

const emit = defineEmits<{
  (e: 'toggle', username: string): void
  (e: 'select-all'): void
  (e: 'deselect-all'): void
  (e: 'refresh', username: string): void
}>()

function statusFor(username: string, statuses: UserSyncStatus[]): string {
  return statuses.find(s => s.username === username)?.status ?? 'READY'
}

function isSyncing(username: string): boolean {
  return statusFor(username, props.syncStatuses) === 'SYNCING'
}

function isDisabled(username: string): boolean {
  return isSyncing(username) || props.cooldownFor(username) > 0
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="text-xs text-primary hover:text-primary/80 font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 py-0.5"
        @click="emit('select-all')"
      >
        Select All
      </button>
      <button
        type="button"
        class="text-xs text-on-surface-variant hover:text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 py-0.5"
        @click="emit('deselect-all')"
      >
        Deselect All
      </button>
    </div>

    <div v-if="usernames.length === 0" class="text-sm text-on-surface-variant">
      No collectors selected.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="username in usernames"
        :key="username"
        class="flex items-center gap-2 rounded-md border border-outline bg-surface-container p-2"
      >
        <input
          :id="`owner-${username}`"
          type="checkbox"
          :checked="selected.has(username)"
          :aria-label="username"
          class="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
          @change="emit('toggle', username)"
        />
        <label :for="`owner-${username}`" class="flex items-center gap-2 flex-1 cursor-pointer">
          <MemberAvatar :username="username" size="sm" />
          <span class="text-sm font-medium text-on-surface">{{ username }}</span>
        </label>
        <div class="flex items-center gap-2">
          <span
            v-if="statusFor(username, syncStatuses) === 'SYNCING'"
            class="text-xs font-medium bg-warning-container text-warning px-1.5 py-0.5 rounded"
          >
            Syncing
          </span>
          <RefreshButton
            :username="username"
            :disabled="isDisabled(username)"
            :cooldown-seconds="cooldownFor(username)"
            @refresh="emit('refresh', username)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
