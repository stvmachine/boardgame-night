<script setup lang="ts">
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import { useAuth } from '@/composables/useAuth'
import { useBindBggUsernameMutation } from '@/generated/operations'

const { currentUser, isAuthenticated } = useAuth()

const bggUsernameInput = ref('')
const bindError = ref('')
const bindSuccess = ref(false)
const bindLoading = ref(false)

const { mutate: bindBggUsername } = useBindBggUsernameMutation()

const boundUsername = computed(() => currentUser.value?.bggUsername ?? null)

async function handleBind() {
  bindError.value = ''
  bindSuccess.value = false
  bindLoading.value = true
  try {
    const result = await bindBggUsername({ username: bggUsernameInput.value })
    if (result?.data?.bindBggUsername?.user) {
      bindSuccess.value = true
      bggUsernameInput.value = ''
    }
  } catch (e: any) {
    const msg = e?.message ?? 'Failed to bind BGG username'
    bindError.value = msg.includes('not found') ? 'BGG user not found' : msg
  } finally {
    bindLoading.value = false
  }
}

async function handleSignOut() {
  const { signOut } = useAuth()
  await signOut()
}
</script>

<template>
  <AppShell>
    <div class="max-w-2xl mx-auto mt-12 px-6">
      <h1 class="text-2xl font-bold text-neutral-800 mb-6">Account</h1>

      <section class="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-neutral-800 mb-4">Profile</h2>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="text-sm text-neutral-600">Display name</dt>
            <dd class="text-sm font-medium text-neutral-800">{{ currentUser?.displayName ?? '—' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-neutral-600">Email</dt>
            <dd class="text-sm font-medium text-neutral-800">{{ currentUser?.email ?? '—' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-neutral-600">BGG username</dt>
            <dd class="text-sm font-medium text-neutral-800">
              {{ boundUsername ?? 'Not bound' }}
            </dd>
          </div>
        </dl>
      </section>

      <section v-if="isAuthenticated" class="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-neutral-800 mb-4">Bind BGG username</h2>
        <form @submit.prevent="handleBind" class="space-y-3">
          <div class="space-y-1">
            <label for="bgg-username" class="text-sm font-medium text-neutral-700">BGG username</label>
            <input
              id="bgg-username"
              v-model="bggUsernameInput"
              type="text"
              placeholder="your BGG username"
              class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div v-if="bindLoading" class="flex items-center gap-2 text-sm text-neutral-500">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-indigo-600"></span>
            Validating…
          </div>
          <p v-if="bindSuccess" class="text-sm text-green-600">✓ BGG username bound successfully</p>
          <p v-if="bindError" class="text-sm text-red-600">{{ bindError }}</p>
          <button
            type="submit"
            :disabled="!bggUsernameInput || bindLoading"
            class="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Bind
          </button>
        </form>
      </section>

      <button
        v-if="isAuthenticated"
        type="button"
        class="text-sm text-neutral-600 hover:text-red-600"
        @click="handleSignOut"
      >
        Log out
      </button>
    </div>
  </AppShell>
</template>