import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'bgn_session_token'
const USER_ID_KEY = 'bgn_session_user_id'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(sessionStorage.getItem(TOKEN_KEY))
  const userId = ref<string | null>(sessionStorage.getItem(USER_ID_KEY))

  const isAuthenticated = computed(() => token.value !== null)

  function setSession(newToken: string, id: string) {
    token.value = newToken
    userId.value = id
    sessionStorage.setItem(TOKEN_KEY, newToken)
    sessionStorage.setItem(USER_ID_KEY, id)
  }

  function clearSession() {
    token.value = null
    userId.value = null
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_ID_KEY)
  }

  return { token, userId, isAuthenticated, setSession, clearSession }
})