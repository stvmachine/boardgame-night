<script setup lang="ts">
import { ref } from 'vue'
import type { Group, GroupMembership } from '@/generated/types'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

interface Props {
  memberships: GroupMembership[]
  group: Pick<Group, 'id' | 'myRole' | 'owner'>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'remove', membership: GroupMembership): void
  (e: 'updateRole', membership: GroupMembership, role: string): void
}>()

const confirmingRemoveId = ref<string | null>(null)

function roleLabel(role: string): string {
  switch (role) {
    case 'OWNER': return 'Owner'
    case 'ADMIN': return 'Admin'
    case 'MEMBER':
    default: return 'Member'
  }
}

function roleClasses(role: string): string {
  switch (role) {
    case 'OWNER': return 'bg-amber-100 text-amber-800'
    case 'ADMIN': return 'bg-indigo-100 text-indigo-800'
    case 'MEMBER':
    default: return 'bg-neutral-100 text-neutral-700'
  }
}

const canManage = (membership: GroupMembership) => {
  return props.group.myRole === 'OWNER' ||
    (props.group.myRole === 'ADMIN' && membership.user.id !== props.group.owner.id)
}

const canChangeRole = (membership: GroupMembership) => {
  return props.group.myRole === 'OWNER' && membership.user.id !== props.group.owner.id
}

function askRemove(membership: GroupMembership) {
  confirmingRemoveId.value = membership.id
}

function confirmRemove(membership: GroupMembership) {
  emit('remove', membership)
  confirmingRemoveId.value = null
}

function cancelRemove() {
  confirmingRemoveId.value = null
}

function changeRole(membership: GroupMembership, event: Event) {
  const role = (event.target as HTMLSelectElement).value
  emit('updateRole', membership, role)
}
</script>

<template>
  <div class="space-y-2">
    <h3 class="text-sm font-semibold text-neutral-700">Members</h3>
    <ul class="space-y-2">
      <li
        v-for="membership in memberships"
        :key="membership.id"
        class="p-2 bg-white rounded border border-neutral-200"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2">
            <MemberAvatar :username="membership.user.username" size="sm" />
            <span class="text-sm text-neutral-800">{{ membership.user.displayName }}</span>
          </span>

          <div class="flex items-center gap-2">
            <select
              v-if="canChangeRole(membership)"
              :value="membership.role"
              class="text-xs border border-neutral-300 rounded px-2 py-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              @change="changeRole(membership, $event)"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
            <span
              v-else
              class="text-xs font-medium px-2 py-0.5 rounded capitalize"
              :class="roleClasses(membership.role)"
            >
              {{ roleLabel(membership.role) }}
            </span>

            <button
              v-if="canManage(membership)"
              type="button"
              class="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
              @click="askRemove(membership)"
            >
              Remove
            </button>
          </div>
        </div>

        <div
          v-if="confirmingRemoveId === membership.id"
          class="mt-2 p-2 bg-red-50 rounded border border-red-200 text-sm"
        >
          <p class="text-red-800 mb-2">
            Remove member: {{ membership.user.displayName }} will be removed from the group and their games will no longer appear in the shared collection.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
              @click="confirmRemove(membership)"
            >
              Remove
            </button>
            <button
              type="button"
              class="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-medium rounded hover:bg-neutral-50"
              @click="cancelRemove"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
