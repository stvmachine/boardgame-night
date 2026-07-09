import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const userId = ref<string | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  function setSession(newToken: string, id: string) {
    token.value = newToken
    userId.value = id
  }

  function clearSession() {
    token.value = null
    userId.value = null
  }

  return { token, userId, isAuthenticated, setSession, clearSession }
})