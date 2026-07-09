<script setup lang="ts">
import type { Group, User } from '@/generated/types'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

interface Props {
  members: User[]
  group: Pick<Group, 'myRole' | 'owner'>
}

const props = defineProps<Props>()

function roleLabel(role: string): string {
  switch (role) {
    case 'owner': return 'Owner'
    case 'admin': return 'Admin'
    case 'member':
    default: return 'Member'
  }
}

function roleClasses(role: string): string {
  switch (role) {
    case 'owner': return 'bg-amber-100 text-amber-800'
    case 'admin': return 'bg-indigo-100 text-indigo-800'
    case 'member':
    default: return 'bg-neutral-100 text-neutral-700'
  }
}

function memberRole(member: User): string {
  return member.id === props.group.owner.id ? 'owner' : 'member'
}
</script>

<template>
  <div class="space-y-2">
    <h3 class="text-sm font-semibold text-neutral-700">Members</h3>
    <ul class="space-y-2">
      <li
        v-for="member in members"
        :key="member.id"
        class="flex items-center justify-between p-2 bg-white rounded border border-neutral-200"
      >
        <span class="flex items-center gap-2">
          <MemberAvatar :username="member.username" size="sm" />
          <span class="text-sm text-neutral-800">{{ member.displayName }}</span>
        </span>
        <span
          class="text-xs font-medium px-2 py-0.5 rounded capitalize"
          :class="roleClasses(memberRole(member))"
        >
          {{ roleLabel(memberRole(member)) }}
        </span>
      </li>
    </ul>
  </div>
</template>
