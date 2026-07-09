<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Group } from '@/generated/types'
import { useInviteToGroupMutation } from '@/generated/operations'

interface Props {
  group: Pick<Group, 'id' | 'inviteCode' | 'myRole'>
}

const props = defineProps<Props>()

const inviteUrl = computed(() => `${window.location.origin}/g/${props.group.inviteCode}`)
const copied = ref(false)

const email = ref('')
const role = ref('MEMBER')
const { mutate: invite, loading, error } = useInviteToGroupMutation()

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // ignore
  }
}

async function sendInvite() {
  if (!email.value) return
  await invite({ groupId: props.group.id, email: email.value, role: role.value })
  email.value = ''
}
</script>

<template>
  <div class="bg-white rounded border border-neutral-200 p-4 space-y-4">
    <div class="space-y-2">
      <label class="block text-sm font-medium text-neutral-700">Invite link</label>
      <div class="flex gap-2">
        <input
          :value="inviteUrl"
          readonly
          class="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm bg-neutral-50"
          aria-label="Invite link"
        />
        <button
          type="button"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700"
          @click="copyLink"
        >
          Copy link
        </button>
      </div>
      <p v-if="copied" class="text-sm text-indigo-700">Copied!</p>
    </div>

    <form class="space-y-3" @submit.prevent="sendInvite">
      <div class="flex gap-2">
        <input
          v-model="email"
          type="email"
          required
          placeholder="Email address"
          class="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        />
        <select
          v-model="role"
          class="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="MEMBER">Member</option>
          <option v-if="group.myRole === 'OWNER'" value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          Send invite
        </button>
      </div>
      <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ error.message }}
      </div>
    </form>
  </div>
</template>
