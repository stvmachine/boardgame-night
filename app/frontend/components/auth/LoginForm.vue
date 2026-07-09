<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signIn, signInError } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const emit = defineEmits<{
  (e: 'success'): void
}>()

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    const data = await signIn(email.value, password.value)
    if (signInError.value) {
      throw new Error('Login failed')
    }
    emit('success')
    const redirect = router.currentRoute.value.query.redirectTo as string
    router.push(redirect || '/')
  } catch (e: any) {
    errorMessage.value = e?.message ?? 'Login failed'
  } finally {
    loading.value = false
  }
}

const canSubmit = computed(() =>
  email.value.length > 0 && password.value.length > 0
)
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="space-y-1">
      <label for="login-email" class="text-sm font-medium text-neutral-700">Email</label>
      <input
        id="login-email"
        v-model="email"
        type="email"
        autocomplete="email"
        class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
    <div class="space-y-1">
      <label for="login-password" class="text-sm font-medium text-neutral-700">Password</label>
      <input
        id="login-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    <button
      type="submit"
      :disabled="!canSubmit || loading"
      class="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
    >
      {{ loading ? 'Signing in…' : 'Log in' }}
    </button>
  </form>
</template>