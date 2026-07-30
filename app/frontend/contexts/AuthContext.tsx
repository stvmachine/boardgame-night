import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { apolloClient } from '@/lib/graphql/apollo'
import { CURRENT_USER, SIGN_IN, SIGN_UP, SIGN_OUT } from '@/lib/graphql/documents'

export interface AuthUser {
  id: string
  username: string
  email: string | null
  bggUsername: string | null
  displayName: string
  avatar: string | null
  isProvisional: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'bgg-night-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Query current user on mount if token exists
  const { loading: queryLoading } = useQuery(CURRENT_USER, {
    fetchPolicy: 'cache-and-network',
    skip: !localStorage.getItem(TOKEN_KEY),
    onCompleted: (data) => {
      if (data?.currentUser) {
        setUser(data.currentUser)
      }
      setLoading(false)
    },
    onError: () => {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY)
      setLoading(false)
    },
  })

  // If no token, skip loading
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false)
    }
  }, [])

  const [signInMutation] = useMutation(SIGN_IN)
  const [signUpMutation] = useMutation(SIGN_UP)
  const [signOutMutation] = useMutation(SIGN_OUT)

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      const { data } = await signInMutation({ variables: { email, password } })
      const { token, user: userData } = data.signIn
      localStorage.setItem(TOKEN_KEY, token)
      setUser(userData)
      // Reset Apollo cache to refetch all data with new auth
      await apolloClient.resetStore()
    } catch (err: any) {
      const message = err?.graphQLErrors?.[0]?.message || err?.message || 'Sign in failed'
      setError(message)
    }
  }, [signInMutation])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      setError(null)
      const { data } = await signUpMutation({ variables: { email, password, username } })
      const { token, user: userData } = data.signUp
      localStorage.setItem(TOKEN_KEY, token)
      setUser(userData)
      await apolloClient.resetStore()
    } catch (err: any) {
      const message = err?.graphQLErrors?.[0]?.message || err?.message || 'Sign up failed'
      setError(message)
    }
  }, [signUpMutation])

  const signOut = useCallback(async () => {
    try {
      await signOutMutation()
    } catch {
      // Sign out even if the mutation fails (clear local state)
    }
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    await apolloClient.resetStore()
  }, [signOutMutation])

  const clearError = useCallback(() => setError(null), [])

  // Sync loading state with query loading
  useEffect(() => {
    if (queryLoading && localStorage.getItem(TOKEN_KEY)) {
      setLoading(true)
    }
  }, [queryLoading])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, error, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
