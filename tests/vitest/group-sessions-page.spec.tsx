import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupSessionsPage } from '@/pages/GroupSessionsPage'

const mocks = vi.hoisted(() => ({
  getGroup: vi.fn(),
}))

vi.mock('@/generated/operations', () => ({
  useGetGroupQuery: (...args: unknown[]) => mocks.getGroup(...args),
}))

function renderPage(
  token = 'NIGHTOWLS',
  result: { data?: { group: ReturnType<typeof buildGroup> } | undefined; loading: boolean; error?: Error | undefined } = {
    data: { group: buildGroup() },
    loading: false,
    error: undefined,
  },
) {
  mocks.getGroup.mockReturnValue(result)

  return render(
    <MemoryRouter initialEntries={[`/g/${token}/sessions`]}>
      <Routes>
        <Route path="/g/:token/sessions" element={<GroupSessionsPage />} />
        <Route path="/g/:token" element={<div data-testid="group-page">Group page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function buildGroup() {
  return {
    id: 'group-1',
    name: 'Night Owls',
    description: 'Games after dark',
    inviteCode: 'NIGHTOWLS',
    anonymousBggUsernames: [] as string[],
    myRole: 'OWNER' as const,
    collectionTotalCount: 0,
    owner: { id: 'owner-user', displayName: 'Alice Owner', avatar: null },
    members: [
      { id: 'owner-user', displayName: 'Alice Owner', bggUsername: 'alice', avatar: null, isProvisional: false },
    ],
    memberships: [{ id: 'membership-owner', role: 'OWNER' as const, user: { id: 'owner-user' } }],
    sessions: [],
    pastSessions: [
      {
        id: 'completed-session',
        title: 'Completed Night',
        state: 'COMPLETED' as const,
        scheduledAt: '2026-07-15T18:30:00Z',
        location: 'Clubhouse',
        pickedGame: { name: 'Brass: Birmingham', thumbnail: 'https://example.com/brass.jpg' },
      },
      {
        id: 'cancelled-session',
        title: 'Cancelled Night',
        state: 'CANCELLED' as const,
        scheduledAt: '2026-07-08T18:00:00Z',
        location: null,
        pickedGame: null,
      },
    ],
    collectionSpotlight: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GroupSessionsPage loading and error states', () => {
  it('renders a skeleton while loading', () => {
    renderPage('NIGHTOWLS', { data: undefined, loading: true, error: undefined })

    expect(screen.getByRole('progressbar', { name: 'Loading past sessions' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Past sessions' })).not.toBeInTheDocument()
  })

  it('renders a not-found state when the group query fails', () => {
    renderPage('NIGHTOWLS', {
      data: undefined,
      loading: false,
      error: new Error('Network error'),
    })

    expect(screen.getByRole('heading', { name: 'Couldn’t load this page' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to group' })).toHaveAttribute('href', '/g/NIGHTOWLS')
  })

  it('renders an empty state when there are no past sessions', () => {
    const group = buildGroup()
    group.pastSessions = []
    renderPage('NIGHTOWLS', { data: { group }, loading: false, error: undefined })

    expect(screen.getByRole('heading', { name: 'No past sessions' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Back to group' })).toHaveLength(2)
  })
})

describe('GroupSessionsPage past sessions list', () => {
  it('renders the group name and server-ordered past sessions', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Night Owls' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Past sessions' })).toBeInTheDocument()

    const rows = screen.getAllByTestId('session-row')
    expect(rows).toHaveLength(2)

    expect(within(rows[0]).getByText('Completed Night')).toBeInTheDocument()
    expect(within(rows[0]).getByText('COMPLETED')).toBeInTheDocument()
    expect(within(rows[0]).getByText(/Clubhouse/)).toBeInTheDocument()
    expect(within(rows[0]).getByText('Brass: Birmingham')).toBeInTheDocument()
    expect(within(rows[0]).getByRole('img', { name: 'Brass: Birmingham box cover' })).toBeInTheDocument()

    expect(within(rows[1]).getByText('Cancelled Night')).toBeInTheDocument()
    expect(within(rows[1]).getByText('CANCELLED')).toBeInTheDocument()
  })

  it('queries the group by the route token and skips when no token is present', () => {
    renderPage('NIGHTOWLS')
    expect(mocks.getGroup).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { token: 'NIGHTOWLS' } }),
    )

    cleanup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<GroupSessionsPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(mocks.getGroup).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }))
  })

  it('navigates back to the group page', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('link', { name: 'Back to group' }))
    expect(screen.getByTestId('group-page')).toBeInTheDocument()
  })
})
