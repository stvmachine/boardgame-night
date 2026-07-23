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
      <h1 class="text-2xl font-bold text-on-surface mb-6">Log in</h1>
      <LoginForm @success="handleSuccess" />
      <p class="mt-4 text-sm text-on-surface-variant">
        Don't have an account yet?
        <RouterLink to="/signup" class="text-primary hover:underline">Sign up</RouterLink>
      </p>
    </div>
  </AppShell>
</template>