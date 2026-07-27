import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'

type AuthState = {
  user: Record<string, unknown> | null
  loading: boolean
  signIn: ReturnType<typeof vi.fn>
  signOut: ReturnType<typeof vi.fn>
}

const mockAuthState: AuthState = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal() as { AuthProvider: React.FC<{ children: React.ReactNode }>; useAuth: () => AuthState }
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => mockAuthState,
  }
})

function ProtectedPage() {
  return <div data-testid="protected-content">Secret Page</div>
}

function LoginPage() {
  return <div data-testid="login-page">Login Page</div>
}

function renderRoute(initialRoute = '/protected') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthState.user = null
    mockAuthState.loading = false
  })

  it('redirects to /login when no user', () => {
    renderRoute()
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    mockAuthState.user = { id: '1', username: 'alex' }
    renderRoute()
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('shows loading spinner when auth is loading', () => {
    mockAuthState.loading = true
    renderRoute()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })
})
