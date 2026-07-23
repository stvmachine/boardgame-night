<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'
import Input from '@/components/ui/input/Input.vue'
import Button from '@/components/ui/button/Button.vue'

const router = useRouter()
const { signUp, signUpError } = useAuth()

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
      <label for="signup-username" class="text-sm font-medium text-on-surface-variant">Username</label>
      <Input
        id="signup-username"
        v-model="username"
        type="text"
        autocomplete="username"
      />
    </div>
    <div class="space-y-1">
      <label for="signup-email" class="text-sm font-medium text-on-surface-variant">Email</label>
      <Input
        id="signup-email"
        v-model="email"
        type="email"
        autocomplete="email"
      />
    </div>
    <div class="space-y-1">
      <label for="signup-password" class="text-sm font-medium text-on-surface-variant">Password</label>
      <Input
        id="signup-password"
        v-model="password"
        type="password"
        autocomplete="new-password"
      />
    </div>
    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
    <Button
      type="submit"
      variant="primary"
      :disabled="!canSubmit || loading"
      class="w-full"
    >
      {{ loading ? 'Creating…' : 'Sign up' }}
    </Button>
  </form>
</template>