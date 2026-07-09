import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useCurrentUserQuery,
} from '@/generated/operations'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  const { mutate: signUpMutate, loading: signUpLoading, error: signUpError } = useSignUpMutation()
  const { mutate: signInMutate, loading: signInLoading, error: signInError } = useSignInMutation()
  const { mutate: signOutMutate, loading: signOutLoading, error: signOutError } = useSignOutMutation()
  const { result: currentUserResult, loading: currentUserLoading } = useCurrentUserQuery(
    () => ({}),
    () => ({ fetchPolicy: 'cache-and-network' })
  )

  const currentUser = computed(() => currentUserResult.value?.currentUser ?? null)

  async function signUp(email: string, password: string, username: string) {
    const result = await signUpMutate({ email, password, username })
    const data = result?.data?.signUp
    if (data?.token && data?.user) {
      authStore.setSession(data.token, data.user.id)
    }
    return data
  }

  async function signIn(email: string, password: string) {
    const result = await signInMutate({ email, password })
    const data = result?.data?.signIn
    if (data?.token && data?.user) {
      authStore.setSession(data.token, data.user.id)
    }
    return data
  }

  async function signOut() {
    await signOutMutate({})
    authStore.clearSession()
  }

  return {
    signUp,
    signIn,
    signOut,
    currentUser,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    // raw loading/error for callers that need them
    signUpLoading,
    signUpError,
    signInLoading,
    signInError,
    signOutLoading,
    signOutError,
    currentUserLoading,
  }
}