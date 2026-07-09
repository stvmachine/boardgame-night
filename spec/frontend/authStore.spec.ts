import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.userId).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('setSession sets token and userId', () => {
    const store = useAuthStore()
    store.setSession('abc-token-123', 'user-1')
    expect(store.token).toBe('abc-token-123')
    expect(store.userId).toBe('user-1')
    expect(store.isAuthenticated).toBe(true)
  })

  it('clearSession resets token and userId', () => {
    const store = useAuthStore()
    store.setSession('abc-token-123', 'user-1')
    store.clearSession()
    expect(store.token).toBeNull()
    expect(store.userId).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})