<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAcceptGroupInviteMutation } from '@/generated/operations'
import { useAuthStore } from '@/stores/auth'
import AppShell from '@/components/layout/AppShell.vue'
import EmptyState from '@/components/collection/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => String(route.params.token))
const { mutate: acceptInvite, loading, error, onDone } = useAcceptGroupInviteMutation()

onDone((result) => {
  const inviteCode = result.data?.acceptGroupInvite?.group?.inviteCode
  if (inviteCode) {
    router.push(`/g/${inviteCode}`)
  }
})

async function join() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirectTo: route.fullPath } })
    return
  }

  await acceptInvite({ token: token.value })
}
</script>

<template>
  <AppShell>
    <div class="p-4 md:p-6 max-w-md mx-auto">
      <div class="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        <h1 class="text-xl font-bold text-neutral-800">You're invited to join a group</h1>

        <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ error.message }}
        </div>

        <button
          type="button"
          :disabled="loading"
          class="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:bg-neutral-300 disabled:text-neutral-500"
          @click="join"
        >
          <template v-if="authStore.isAuthenticated">Join group</template>
          <template v-else>Log in to join</template>
        </button>
      </div>
    </div>
  </AppShell>
</template>
