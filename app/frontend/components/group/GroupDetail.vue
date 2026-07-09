<script setup lang="ts">
import { computed } from 'vue'
import type { Group, MergedThing } from '@/generated/types'
import { useRemoveGroupMemberMutation, useUpdateGroupMemberRoleMutation } from '@/generated/operations'
import GameGrid from '@/components/collection/GameGrid.vue'
import MemberList from './MemberList.vue'
import InviteLink from './InviteLink.vue'

interface Props {
  group: Group
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { mutate: removeMember } = useRemoveGroupMemberMutation()
const { mutate: updateRole } = useUpdateGroupMemberRoleMutation()

const allGames = computed(() => (props.group.collection?.items ?? []) as MergedThing[])
const memberships = computed(() => props.group.memberships ?? [])

async function handleRemove(membership: { id: string; user: { id: string } }) {
  await removeMember({ groupId: props.group.id, userId: membership.user.id })
}

async function handleUpdateRole(membership: { id: string; user: { id: string } }, role: string) {
  await updateRole({ groupId: props.group.id, userId: membership.user.id, role })
}
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold text-neutral-800">{{ group.name }}</h1>
      <p v-if="group.description" class="text-neutral-600">{{ group.description }}</p>
    </header>

    <InviteLink v-if="group.myRole === 'OWNER' || group.myRole === 'ADMIN'" :group="group" />

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside class="lg:col-span-1">
        <MemberList
          :memberships="memberships"
          :group="group"
          @remove="handleRemove"
          @updateRole="handleUpdateRole"
        />
      </aside>

      <section class="lg:col-span-3">
        <GameGrid :games="allGames" :loading="loading" />
      </section>
    </div>
  </div>
</template>
