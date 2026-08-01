import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvitePage } from '@/pages/InvitePage'

const mocks = vi.hoisted(() => ({
  getSessionInvite: vi.fn(),
  rsvpMutation: vi.fn(),
  authUser: null as Record<string, unknown> | null,
  authLoading: false,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mocks.authUser,
    loading: mocks.authLoading,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    error: null,
    clearError: vi.fn(),
  }),
}))

vi.mock('@/generated/operations', () => ({
  useGetSessionInviteQuery: (...args: unknown[]) => mocks.getSessionInvite(...args),
  useRsvpMutation: () => mocks.rsvpMutation(),
}))

type InviteShape = {
  id: string
  email: string
  expiresAt: string
  status: string
  token: string
  role: string
  group: { id: string; name: string }
  session: {
    id: string
    title: string
    state: string
    scheduledAt: string
    location: string | null
    host: { id: string; displayName: string }
  } | null
}

function buildInvite(overrides: Partial<InviteShape> = {}): InviteShape {
  return {
    id: 'invite-1',
    email: 'guest@example.com',
    expiresAt: '2099-12-31T23:59:59Z',
    status: 'PENDING',
    token: 'ABC123',
    role: 'MEMBER',
    group: { id: 'group-1', name: 'Night Owls' },
    session: {
      id: 'session-1',
      title: 'Friday Games',
      state: 'INVITED',
      scheduledAt: '2026-08-07T18:00:00Z',
      location: 'Clubhouse',
      host: { id: 'host-1', displayName: 'Alice Host' },
    },
    ...overrides,
  }
}

function buildUser() {
  return { id: 'user-1', username: 'alex', displayName: 'Alex Guest', email: 'alex@example.com', bggUsername: null, avatar: null, isProvisional: false }
}

function renderPage(
  token = 'ABC123',
  inviteResult: {
    data?: { sessionInvite: InviteShape } | undefined
    loading: boolean
    error?: Error | undefined
  } = {
    data: { sessionInvite: buildInvite() },
    loading: false,
    error: undefined,
  },
  user: Record<string, unknown> | null = buildUser(),
) {
  mocks.authUser = user
  mocks.authLoading = false
  mocks.getSessionInvite.mockReturnValue(inviteResult)

  return render(
    <MemoryRouter initialEntries={[`/invite/${token}`]}>
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/login" element={<div data-testid="login-page">Sign in</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.authUser = null
  mocks.authLoading = false
})

describe('InvitePage loading and invalid states', () => {
  it('renders a skeleton while loading', () => {
    renderPage('ABC123', { data: undefined, loading: true, error: undefined })

    expect(screen.getByRole('progressbar', { name: 'Loading invite' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Going' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Not Going' })).not.toBeInTheDocument()
  })

  it('renders a not-found state when the invite query fails', () => {
    renderPage('ABC123', { data: undefined, loading: false, error: new Error('Invite not found') })

    expect(screen.getByRole('heading', { name: 'Invite not found' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Going' })).not.toBeInTheDocument()
  })

  it('renders a safe state for an expired invite', () => {
    renderPage('ABC123', {
      data: { sessionInvite: buildInvite({ status: 'EXPIRED' }) },
      loading: false,
      error: undefined,
    })

    expect(screen.getByRole('heading', { name: 'This invite has expired' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Going' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Not Going' })).not.toBeInTheDocument()
  })

  it('renders a safe state for an already used invite', () => {
    renderPage('ABC123', {
      data: { sessionInvite: buildInvite({ status: 'ACCEPTED' }) },
      loading: false,
      error: undefined,
    })

    expect(screen.getByRole('heading', { name: 'This invite has already been used' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Going' })).not.toBeInTheDocument()
  })
})

describe('InvitePage signed-out viewer', () => {
  it('shows session context and a sign-in action carrying the invite return path', () => {
    renderPage('ABC123', { data: { sessionInvite: buildInvite() }, loading: false, error: undefined }, null)

    expect(screen.getByRole('heading', { name: 'Friday Games' })).toBeInTheDocument()
    expect(screen.getByText('Night Owls')).toBeInTheDocument()
    expect(screen.getByText('Alice Host')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Sign in to RSVP/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: 'Going' })).not.toBeInTheDocument()
  })
})

describe('InvitePage authenticated RSVP', () => {
  it('shows Going and Not Going controls for an authenticated user', () => {
    renderPage('ABC123', { data: { sessionInvite: buildInvite() }, loading: false, error: undefined })

    expect(screen.getByRole('button', { name: 'Going' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Not Going' })).toBeInTheDocument()
  })

  it('submits Going and displays the returned response', async () => {
    const mutate = vi.fn().mockResolvedValue({
      data: {
        rsvp: {
          attendance: { id: 'att-1', response: 'going', user: { id: 'user-1', displayName: 'Alex Guest' } },
          session: { id: 'session-1', state: 'INVITED' },
        },
      },
    })
    mocks.rsvpMutation.mockReturnValue([mutate, { loading: false, error: undefined, data: undefined }])

    const user = userEvent.setup()
    renderPage('ABC123', { data: { sessionInvite: buildInvite() }, loading: false, error: undefined })

    await user.click(screen.getByRole('button', { name: 'Going' }))

    await waitFor(() => expect(screen.getByText('Thanks! Your response is Going')).toBeInTheDocument())
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ variables: { token: 'ABC123', response: 'going' } }))
  })

  it('submits Not Going and displays the returned response', async () => {
    const mutate = vi.fn().mockResolvedValue({
      data: {
        rsvp: {
          attendance: { id: 'att-2', response: 'not_going', user: { id: 'user-1', displayName: 'Alex Guest' } },
          session: { id: 'session-1', state: 'INVITED' },
        },
      },
    })
    mocks.rsvpMutation.mockReturnValue([mutate, { loading: false, error: undefined, data: undefined }])

    const user = userEvent.setup()
    renderPage('ABC123', { data: { sessionInvite: buildInvite() }, loading: false, error: undefined })

    await user.click(screen.getByRole('button', { name: 'Not Going' }))

    await waitFor(() => expect(screen.getByText('Thanks! Your response is Not Going')).toBeInTheDocument())
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ variables: { token: 'ABC123', response: 'not_going' } }))
  })

  it('disables controls while the RSVP mutation is pending', async () => {
    const mutate = vi.fn().mockImplementation(() => new Promise(() => {}))
    mocks.rsvpMutation.mockReturnValue([mutate, { loading: true, error: undefined, data: undefined }])

    renderPage('ABC123', { data: { sessionInvite: buildInvite() }, loading: false, error: undefined })

    expect(screen.getByRole('button', { name: 'Going' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Not Going' })).toBeDisabled()
  })

  it('exposes an alert and keeps controls when the RSVP mutation fails', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('Server error'))
    mocks.rsvpMutation.mockReturnValue([mutate, { loading: false, error: undefined, data: undefined }])

    const user = userEvent.setup()
    renderPage('ABC123', { data: { sessionInvite: buildInvite() }, loading: false, error: undefined })

    await user.click(screen.getByRole('button', { name: 'Going' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Going' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Not Going' })).toBeInTheDocument()
  })
})
