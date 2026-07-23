<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'
import Input from '@/components/ui/input/Input.vue'
import Button from '@/components/ui/button/Button.vue'

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
      <label for="login-email" class="text-sm font-medium text-on-surface-variant">Email</label>
      <Input
        id="login-email"
        v-model="email"
        type="email"
        autocomplete="email"
      />
    </div>
    <div class="space-y-1">
      <label for="login-password" class="text-sm font-medium text-on-surface-variant">Password</label>
      <Input
        id="login-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
      />
    </div>
    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
    <Button
      type="submit"
      variant="primary"
      :disabled="!canSubmit || loading"
      class="w-full"
    >
      {{ loading ? 'Signing in…' : 'Log in' }}
    </Button>
  </form>
</template>