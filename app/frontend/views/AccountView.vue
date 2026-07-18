<script setup lang="ts">
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import { useAuth } from '@/composables/useAuth'
import { useBindBggUsernameMutation } from '@/generated/operations'
import { useUiStore, type Theme } from '@/stores/ui'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import Icon from '@/components/ui/icon/Icon.vue'

const { currentUser, isAuthenticated } = useAuth()

const bggUsernameInput = ref('')
const bindError = ref('')
const bindSuccess = ref(false)
const bindLoading = ref(false)

const { mutate: bindBggUsername } = useBindBggUsernameMutation()

const boundUsername = computed(() => currentUser.value?.bggUsername ?? null)

const uiStore = useUiStore()
const appearanceValue = computed({
  get: () => uiStore.theme,
  set: (val: string) => {
    // Guard against single-select deselection emitting a falsy value.
    if (val === 'light' || val === 'dark' || val === 'system') {
      uiStore.setTheme(val)
    }
  }
})

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
    <div class="max-w-2xl mx-auto mt-12 px-6 space-y-6">
      <h1 class="text-2xl font-bold text-on-surface mb-6">Account</h1>

      <!-- Profile -->
      <section class="rounded-xl border border-outline bg-surface-container p-6">
        <h2 class="text-lg font-semibold text-on-surface mb-4">Profile</h2>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="text-sm text-on-surface-variant">Display name</dt>
            <dd class="text-sm font-medium text-on-surface">{{ currentUser?.displayName ?? '—' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-on-surface-variant">Email</dt>
            <dd class="text-sm font-medium text-on-surface">{{ currentUser?.email ?? '—' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-on-surface-variant">BGG username</dt>
            <dd class="text-sm font-medium text-on-surface">
              {{ boundUsername ?? 'Not bound' }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- Appearance -->
      <fieldset class="rounded-xl border border-outline bg-surface-container p-6">
        <legend class="text-lg font-semibold text-on-surface mb-4">Appearance</legend>
        <p class="text-sm text-on-surface-variant mb-4">
          Choose how the app looks. System follows your device setting.
        </p>
        <ToggleGroup
          type="single"
          v-model="appearanceValue"
          variant="outline"
        >
          <ToggleGroupItem value="light" aria-label="Light" class="min-h-[44px] min-w-[44px] px-4 gap-2">
            <Icon name="light-mode" class="h-5 w-5" />
            <span>Light</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark" class="min-h-[44px] min-w-[44px] px-4 gap-2">
            <Icon name="dark-mode" class="h-5 w-5" />
            <span>Dark</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="system" aria-label="System" class="min-h-[44px] min-w-[44px] px-4 gap-2">
            <Icon name="brightness-auto" class="h-5 w-5" />
            <span>System</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </fieldset>

      <!-- Bind BGG username -->
      <section v-if="isAuthenticated" class="rounded-xl border border-outline bg-surface-container p-6">
        <h2 class="text-lg font-semibold text-on-surface mb-4">Bind BGG username</h2>
        <form @submit.prevent="handleBind" class="space-y-3">
          <div class="space-y-1">
            <label for="bgg-username" class="text-sm font-medium text-on-surface">BGG username</label>
            <input
              id="bgg-username"
              v-model="bggUsernameInput"
              type="text"
              placeholder="your BGG username"
              class="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div v-if="bindLoading" class="flex items-center gap-2 text-sm text-on-surface-variant">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-outline border-t-primary"></span>
            Validating…
          </div>
          <p v-if="bindSuccess" class="text-sm text-success">✓ BGG username bound successfully</p>
          <p v-if="bindError" class="text-sm text-error">{{ bindError }}</p>
          <button
            type="submit"
            :disabled="!bggUsernameInput || bindLoading"
            class="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bind
          </button>
        </form>
      </section>

      <!-- Logout -->
      <button
        v-if="isAuthenticated"
        type="button"
        class="text-sm text-on-surface-variant hover:text-error"
        @click="handleSignOut"
      >
        Log out
      </button>
    </div>
  </AppShell>
</template>
