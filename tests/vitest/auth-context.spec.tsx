import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Mock apollo client module
vi.mock('@/lib/graphql/apollo', () => ({
  apolloClient: { resetStore: vi.fn().mockResolvedValue(undefined) },
}))

// Controlled mutation promises
let resolveSignIn: ((result: any) => void) | null = null
let rejectSignIn: ((error: Error) => void) | null = null
let resolveSignOut: ((result: any) => void) | null = null
let rejectSignOut: ((error: Error) => void) | null = null

// Controlled query state
let querySkip = true
let queryOnCompleted: ((data: any) => void) | null = null
let queryOnError: ((error: any) => void) | null = null
let queryData: any = null
let queryError: any = null

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual('@apollo/client')
  return {
    ...actual,
    gql: actual.gql,
    useQuery: (_query: any, options: any) => {
      const skip = options?.skip ?? false
      querySkip = skip
      queryOnCompleted = options?.onCompleted ?? null
      queryOnError = options?.onError ?? null
      return { loading: false, data: queryData, error: queryError }
    },
    useMutation: (_mutation: any) => {
      const name = _mutation?.definitions?.[0]?.name?.value ?? ''

      if (name === 'SignIn') {
        const mutateFn = vi.fn().mockImplementation(() => {
          return new Promise((resolve, reject) => {
            resolveSignIn = resolve
            rejectSignIn = reject
          })
        })
        return [mutateFn]
      }

      if (name === 'SignOut') {
        const mutateFn = vi.fn().mockImplementation(() => {
          return new Promise((resolve, reject) => {
            resolveSignOut = resolve
            rejectSignOut = reject
          })
        })
        return [mutateFn]
      }

      return [vi.fn().mockResolvedValue({})]
    },
  }
})

const TOKEN_KEY = 'bgg-night-token'
const mockUser = {
  id: 'user-1',
  username: 'alex',
  email: 'alex@test.com',
  bggUsername: 'alex123',
  displayName: 'Alex Rivera',
  avatar: null,
  isProvisional: false,
}

function TestConsumer() {
  const { user, loading, signIn, signOut, error, clearError } = useAuth()

  if (loading) return <div data-testid="loading">Loading…</div>

  return (
    <div>
      {error !== null && <div data-testid="error">{error}</div>}
      {user ? (
        <>
          <div data-testid="user-id">{user.id}</div>
          <div data-testid="user-name">{user.username}</div>
        </>
      ) : (
        <div data-testid="no-user">No user</div>
      )}
      <button data-testid="signin-btn" onClick={() => signIn('a@b.com', 'p')}>
        Sign In
      </button>
      <button data-testid="signout-btn" onClick={() => signOut()}>
        Sign Out
      </button>
      <button data-testid="clear-error-btn" onClick={() => clearError()}>
        Clear Error
      </button>
    </div>
  )
}

function renderProvider() {
  resolveSignIn = null
  rejectSignIn = null
  resolveSignOut = null
  rejectSignOut = null
  querySkip = true
  queryOnCompleted = null
  queryOnError = null

  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  )
}

describe('AuthProvider + useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    resolveSignIn = null
    rejectSignIn = null
    resolveSignOut = null
    rejectSignOut = null
    queryData = null
    queryError = null
    querySkip = true
    queryOnCompleted = null
    queryOnError = null
  })

  it('renders children', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('has null user and no loading when no token in localStorage', async () => {
    renderProvider()
    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })
  })

  it('hydrates user when currentUser query returns data', async () => {
    localStorage.setItem(TOKEN_KEY, 'existing-token')
    queryData = { currentUser: mockUser }
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toBeInTheDocument()
    })
  })

  it('does not clear token on transient query error', async () => {
    localStorage.setItem(TOKEN_KEY, 'existing-token')
    queryError = new Error('Network error')
    renderProvider()

    expect(localStorage.getItem(TOKEN_KEY)).toBe('existing-token')
    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })
  })

  it('signIn sets user and stores token', async () => {
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })

    // Click sign-in + resolve mutation in one act chain
    await act(async () => {
      screen.getByTestId('signin-btn').click()
      // Yield to let click handler start
      await new Promise((r) => setTimeout(r, 0))
      resolveSignIn?.({
        data: {
          signIn: { token: 'fake-token', user: mockUser },
        },
      })
    })

    expect(screen.getByTestId('user-id')).toHaveTextContent('user-1')
    expect(screen.getByTestId('user-name')).toHaveTextContent('alex')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('fake-token')
  })

  it('signOut clears user and removes token', async () => {
    // Seed state as if user is logged in
    localStorage.setItem(TOKEN_KEY, 'fake-token')
    queryData = { currentUser: mockUser }
    renderProvider()

    // Wait for the user to hydrate from the existing token
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toBeInTheDocument()
    })

    // Click sign-out + resolve in one act chain
    await act(async () => {
      screen.getByTestId('signout-btn').click()
      await new Promise((r) => setTimeout(r, 0))
      resolveSignOut?.({ data: { signOut: { success: true } } })
    })

    expect(screen.getByTestId('no-user')).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('signIn sets error on failure', async () => {
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })

    await act(async () => {
      screen.getByTestId('signin-btn').click()
      await new Promise((r) => setTimeout(r, 0))
      rejectSignIn?.(new Error('Invalid credentials'))
    })

    expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
  })

  it('clearError resets the error state', async () => {
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })

    // Trigger error
    await act(async () => {
      screen.getByTestId('signin-btn').click()
      await new Promise((r) => setTimeout(r, 0))
      rejectSignIn?.(new Error('Something went wrong'))
    })

    expect(screen.getByTestId('error')).toBeInTheDocument()

    // Clear error
    await act(async () => {
      screen.getByTestId('clear-error-btn').click()
    })

    await waitFor(() => {
      expect(screen.queryByTestId('error')).not.toBeInTheDocument()
    })
  })

  it('throws when useAuth is used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within AuthProvider',
    )

    consoleSpy.mockRestore()
  })
})
