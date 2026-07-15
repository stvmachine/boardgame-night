<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Group } from '@/generated/types'
import { useInviteToGroupMutation } from '@/generated/operations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import Input from '@/components/ui/input/Input.vue'
import Icon from '@/components/ui/icon/Icon.vue'

interface Props {
  group: Pick<Group, 'id' | 'inviteCode' | 'myRole'>
}

const props = defineProps<Props>()

const inviteUrl = computed(() => `${window.location.origin}/g/${props.group.inviteCode}`)
const copied = ref(false)
const copyFailed = ref(false)

const email = ref('')
const role = ref('MEMBER')
const { mutate: invite, loading, error } = useInviteToGroupMutation()

async function copyLink() {
  copied.value = false
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    copied.value = true
    copyFailed.value = false
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copyFailed.value = true
    copied.value = false
  }
}

async function sendInvite() {
  if (!email.value) return
  const result = await invite({ groupId: props.group.id, email: email.value, role: role.value })
  if (result?.data?.inviteToGroup) {
    email.value = ''
    role.value = 'MEMBER'
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Invite people</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Invite link section -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-on-surface">Invite link</label>
        <div class="flex gap-2 items-center">
          <Input
            :model-value="inviteUrl"
            readonly
            class="flex-1"
            aria-label="Invite link"
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Copy"
            class="min-w-11 min-h-11 lg:min-w-10 lg:min-h-10"
            @click="copyLink"
          >
            <Icon name="content_copy" class="size-4" />
          </Button>
        </div>
        <div aria-live="polite" aria-atomic="true" class="text-sm min-h-5">
          <span v-if="copied" class="text-primary">Copied!</span>
          <span v-if="copyFailed" class="text-error">Couldn't copy link</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-outline" />

      <!-- Email invitation form -->
      <form class="space-y-3" @submit.prevent="sendInvite">
        <Input
          v-model="email"
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          :disabled="loading"
        />
        <Select v-model="role" :disabled="loading">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="MEMBER">
                <SelectItemText>Member</SelectItemText>
              </SelectItem>
              <SelectItem v-if="group.myRole === 'OWNER'" value="ADMIN">
                <SelectItemText>Admin</SelectItemText>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          type="submit"
          variant="primary"
          :disabled="loading"
          class="w-full"
        >
          Send invite
        </Button>
        <div v-if="error" class="text-sm text-error" role="alert">
          {{ error.message }}
        </div>
      </form>
    </CardContent>
  </Card>
</template>
