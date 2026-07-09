<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionInviteQuery, useAcceptGroupInviteMutation, useRsvpMutation, useUpgradeToAccountMutation } from '@/generated/operations'
import { useAuthStore } from '@/stores/auth'
import AppShell from '@/components/layout/AppShell.vue'
import EmptyState from '@/components/collection/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => String(route.params.token))
const nickname = ref('')
const rsvpedResponse = ref<string | null>(null)

const { result: inviteResult, loading: loadingInvite, error: inviteError } = useSessionInviteQuery(() => ({ token: token.value }))

const isSessionInvite = computed(() => !!inviteResult.value?.sessionInvite?.session)
const sessionInvite = computed(() => inviteResult.value?.sessionInvite)

const { mutate: acceptGroupInvite, loading: joining, error: groupError, onDone: onGroupDone } = useAcceptGroupInviteMutation()
const { mutate: rsvp, loading: rsvping, error: rsvpError, onDone: onRsvpDone } = useRsvpMutation()
const { mutate: upgrade, loading: upgrading, error: upgradeError, onDone: onUpgradeDone } = useUpgradeToAccountMutation()

const error = computed(() => groupError.value?.message || rsvpError.value?.message || upgradeError.value?.message || inviteError.value?.message)

onGroupDone((result) => {
  const inviteCode = result.data?.acceptGroupInvite?.group?.inviteCode
  if (inviteCode) {
    router.push(`/g/${inviteCode}`)
  }
})

onRsvpDone((result) => {
  rsvpedResponse.value = result.data?.rsvp?.attendance?.response ?? null
})

onUpgradeDone((result) => {
  const token = result.data?.upgradeToAccount?.token
  if (token) {
    authStore.setSession(token, result.data?.upgradeToAccount?.user?.id ?? '')
  }
})

async function joinGroup() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirectTo: route.fullPath } })
    return
  }
  await acceptGroupInvite({ token: token.value })
}

async function submitRsvp(response: 'going' | 'not_going') {
  await rsvp({ token: token.value, response, nickname: nickname.value || null })
}

async function submitUpgrade() {
  const email = (document.getElementById('upgrade-email') as HTMLInputElement)?.value
  const password = (document.getElementById('upgrade-password') as HTMLInputElement)?.value
  if (!email || !password) return
  await upgrade({ email, password })
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null
  const date = new Date(iso)
  return date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
}
</script>

<template>
  <AppShell>
    <div class="mx-auto max-w-md p-4 md:p-6">
      <div v-if="loadingInvite" class="text-sm text-neutral-500">Loading invitation...</div>

      <EmptyState
        v-else-if="inviteError"
        heading="Couldn’t load this invitation"
        body="Please check your connection and try again."
      />

      <div v-else-if="isSessionInvite" class="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
        <div>
          <h1 class="text-xl font-bold text-neutral-800">{{ sessionInvite?.session?.title }}</h1>
          <p class="text-sm text-neutral-500">
            Hosted by {{ sessionInvite?.session?.host?.displayName }}
          </p>
          <p v-if="sessionInvite?.session?.scheduledAt" class="text-sm text-neutral-700">
            {{ formatDateTime(sessionInvite?.session?.scheduledAt) }}
          </p>
          <p v-if="sessionInvite?.session?.location" class="text-sm text-neutral-700">
            {{ sessionInvite?.session?.location }}
          </p>
        </div>

        <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ error }}
        </div>

        <template v-if="rsvpedResponse">
          <div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Thanks! Your response is
            <span class="font-semibold">{{ rsvpedResponse === 'going' ? 'Going' : 'Not going' }}</span>.
          </div>
          <p class="text-sm text-neutral-600">
            Attendee count: {{ sessionInvite?.session?.attendeeCount }}
          </p>
        </template>

        <template v-else>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :disabled="rsvping"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-neutral-300 disabled:text-neutral-500"
              @click="submitRsvp('going')"
            >
              Going
            </button>
            <button
              type="button"
              :disabled="rsvping"
              class="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-500"
              @click="submitRsvp('not_going')"
            >
              Not going
            </button>
          </div>

          <div class="pt-2">
            <label for="rsvp-nickname" class="block text-sm font-medium text-neutral-700">Name your nickname (optional)</label>
            <input
              id="rsvp-nickname"
              v-model="nickname"
              type="text"
              class="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Alex"
            />
          </div>
        </template>

        <div v-if="sessionInvite?.session?.attendances?.some(a => a.user.isProvisional)" class="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <h3 class="text-sm font-medium text-neutral-800">Upgrade to a full account</h3>
          <div v-if="upgradeError" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ upgradeError.message }}
          </div>
          <input
            id="upgrade-email"
            type="email"
            class="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Email address"
          />
          <input
            id="upgrade-password"
            type="password"
            class="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Password (min 8 characters)"
          />
          <button
            type="button"
            :disabled="upgrading"
            class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-neutral-300 disabled:text-neutral-500"
            @click="submitUpgrade"
          >
            Create account
          </button>
        </div>
      </div>

      <div v-else class="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
        <h1 class="text-xl font-bold text-neutral-800">You're invited to join a group</h1>

        <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ error }}
        </div>

        <button
          type="button"
          :disabled="joining"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-neutral-300 disabled:text-neutral-500"
          @click="joinGroup"
        >
          <template v-if="authStore.isAuthenticated">Join group</template>
          <template v-else>Log in to join</template>
        </button>
      </div>
    </div>
  </AppShell>
</template>
