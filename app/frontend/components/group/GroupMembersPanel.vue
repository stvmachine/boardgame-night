<script setup lang="ts">
import { computed, ref, nextTick, watch, type WatchStopHandle } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRemoveGroupMemberMutation, useUpdateGroupMemberRoleMutation, GroupDocument } from '@/generated/operations'
import type { Group, GroupMembership, GroupRole } from '@/generated/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import MemberAvatar from '@/components/common/MemberAvatar.vue'
import Icon from '@/components/ui/icon/Icon.vue'

interface Props {
  memberships: GroupMembership[]
  group: Pick<Group, 'id' | 'inviteCode' | 'myRole' | 'owner'>
}

const props = defineProps<Props>()
const authStore = useAuthStore()

const confirmingRemoveId = ref<string | null>(null)
const lastRoleTargetId = ref<string | null>(null)

const viewerId = computed(() => authStore.userId)

function roleLabel(role: GroupRole): string {
  switch (role) {
    case 'OWNER': return 'Owner'
    case 'ADMIN': return 'Admin'
    case 'MEMBER': return 'Member'
    default: return 'Member'
  }
}

function isOwnerViewer(): boolean {
  return props.group.myRole === 'OWNER'
}

function isAdminViewer(): boolean {
  return props.group.myRole === 'ADMIN'
}

function canChangeRole(membership: GroupMembership): boolean {
  return isOwnerViewer() && membership.role !== 'OWNER' && membership.user.id !== props.group.owner.id
}

function canRemove(membership: GroupMembership): boolean {
  if (membership.role === 'OWNER') return false
  if (membership.user.id === viewerId.value) return false
  if (isOwnerViewer()) return true
  if (isAdminViewer()) return true
  return false
}

function hasMenu(membership: GroupMembership): boolean {
  return canChangeRole(membership) || canRemove(membership)
}

function roleToggleLabel(membership: GroupMembership): string {
  if (membership.role === 'MEMBER') return 'Make admin'
  if (membership.role === 'ADMIN') return 'Change role to member'
  return ''
}

function roleToggleValue(membership: GroupMembership): GroupRole {
  return membership.role === 'MEMBER' ? 'ADMIN' : 'MEMBER'
}

const { mutate: updateRole, error: roleError } = useUpdateGroupMemberRoleMutation()
const { mutate: removeMember, error: removeError } = useRemoveGroupMemberMutation({
  update(cache, { data }) {
    const removedId = data?.removeGroupMember?.removedMembershipId
    if (!removedId) return

    const groupId = cache.identify({ __typename: 'Group', id: props.group.id })
    if (!groupId) return

    cache.modify({
      id: groupId,
      fields: {
        memberships(existing = []) {
          return existing.filter((ref: any) => ref.__ref !== `GroupMembership:${removedId}`)
        }
      }
    })
  },
  refetchQueries: [{ query: GroupDocument, variables: { token: props.group.inviteCode } }]
})

function askRemove(membership: GroupMembership) {
  confirmingRemoveId.value = membership.id
  // Wait for Vue DOM update, then yield to let reka-ui's DismissableLayer
  // closeAutoFocus settle, then explicitly focus the Cancel button.
  nextTick(() => {
    setTimeout(() => {
      const cancelButton = document.querySelector('[data-testid="cancel-remove"]') as HTMLElement
      cancelButton?.focus()
    }, 0)
  })
}

function cancelRemove() {
  confirmingRemoveId.value = null
}

async function confirmRemove(membership: GroupMembership) {
  await removeMember({ groupId: props.group.id, userId: membership.user.id })
  if (!removeError.value) {
    confirmingRemoveId.value = null
  }
}

async function changeRole(membership: GroupMembership) {
  lastRoleTargetId.value = membership.id
  await updateRole({
    groupId: props.group.id,
    userId: membership.user.id,
    role: roleToggleValue(membership)
  })
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Members</CardTitle>
    </CardHeader>
    <CardContent>
      <ul class="space-y-2">
        <li
          v-for="membership in memberships"
          :key="membership.id"
          :data-testid="`member-row-${membership.id}`"
          class="p-2 rounded-lg border border-outline bg-surface"
        >
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2">
              <MemberAvatar :username="membership.user.username" size="md" />
              <span class="text-sm font-medium text-on-surface">{{ membership.user.displayName }}</span>
            </span>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {{ roleLabel(membership.role) }}
              </span>

              <DropdownMenu v-if="hasMenu(membership)">
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    :aria-label="`Actions for ${membership.user.displayName}`"
                    data-testid="member-actions"
                  >
                    <Icon name="more_vert" class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="canChangeRole(membership)"
                    data-testid="role-menu-item"
                    @select="changeRole(membership)"
                  >
                    {{ roleToggleLabel(membership) }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="canRemove(membership)"
                    variant="destructive"
                    data-testid="remove-menu-item"
                    @select="askRemove(membership)"
                  >
                    Remove from group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div
            v-if="confirmingRemoveId === membership.id"
            role="alert"
            data-testid="remove-confirmation"
            class="mt-3 p-4 rounded-lg border border-outline bg-error-container"
          >
            <p class="text-sm text-on-error-container mb-3">
              Remove {{ membership.user.displayName }}? They will be removed from the group and their games will no longer appear in the shared collection.
            </p>
            <div class="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                data-testid="confirm-remove"
                @click="confirmRemove(membership)"
              >
                Remove
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="cancel-remove"
                @click="cancelRemove"
              >
                Cancel
              </Button>
            </div>
            <p v-if="removeError" class="mt-2 text-sm text-error">
              {{ removeError.message }}
            </p>
          </div>

          <p
            v-if="roleError && lastRoleTargetId === membership.id"
            class="mt-2 text-sm text-error"
          >
            {{ roleError.message }}
          </p>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
