<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import SignupForm from '@/components/auth/SignupForm.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function handleSuccess() {
  router.push('/')
}
</script>

<template>
  <AppShell>
    <div class="max-w-md mx-auto mt-12 px-6">
      <h1 class="text-2xl font-bold text-neutral-800 mb-6">Create your account</h1>
      <SignupForm @success="handleSuccess" />
      <p class="mt-4 text-sm text-neutral-600">
        Already have an account?
        <a href="/login" class="text-indigo-600 hover:underline">Log in</a>
      </p>
    </div>
  </AppShell>
</template>