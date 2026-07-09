<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const username = ref('')
const errorMessage = ref('')
const loading = ref(false)

const emit = defineEmits<{
  (e: 'success'): void
}>()

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    // Dynamically import to avoid circular deps with Apollo provider
    const { useAuth } = await import('@/composables/useAuth')
    const { signUp, signUpError } = useAuth()
    const data = await signUp(email.value, password.value, username.value)
    if (signUpError.value) {
      throw new Error('Signup failed')
    }
    emit('success')
    router.push('/')
  } catch (e: any) {
    errorMessage.value = e?.message ?? 'Sign up failed'
  } finally {
    loading.value = false
  }
}

const canSubmit = computed(() =>
  email.value.length > 0 &&
  password.value.length >= 8 &&
  username.value.length > 0
)
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="space-y-1">
      <label for="signup-username" class="text-sm font-medium text-neutral-700">Username</label>
      <input
        id="signup-username"
        v-model="username"
        type="text"
        autocomplete="username"
        class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
    <div class="space-y-1">
      <label for="signup-email" class="text-sm font-medium text-neutral-700">Email</label>
      <input
        id="signup-email"
        v-model="email"
        type="email"
        autocomplete="email"
        class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
    <div class="space-y-1">
      <label for="signup-password" class="text-sm font-medium text-neutral-700">Password</label>
      <input
        id="signup-password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    <button
      type="submit"
      :disabled="!canSubmit || loading"
      class="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
    >
      {{ loading ? 'Creating…' : 'Sign up' }}
    </button>
  </form>
</template>