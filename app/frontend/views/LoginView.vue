<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function handleSuccess() {
  const redirect = router.currentRoute.value.query.redirectTo as string
  router.push(redirect || '/')
}
</script>

<template>
  <AppShell>
    <div class="max-w-md mx-auto mt-12 px-6">
      <h1 class="text-2xl font-bold text-neutral-800 mb-6">Log in</h1>
      <LoginForm @success="handleSuccess" />
      <p class="mt-4 text-sm text-neutral-600">
        Don't have an account yet?
        <a href="/signup" class="text-indigo-600 hover:underline">Sign up</a>
      </p>
    </div>
  </AppShell>
</template>