import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupPage } from '@/pages/GroupPage'

const mocks = vi.hoisted(() => ({
  getGroup: vi.fn(),
  createHook: vi.fn(),
  createMutation: vi.fn(),
  createOptions: null as any,
  removeHook: vi.fn(),
  removeMutation: vi.fn(),
  updateRoleHook: vi.fn(),
  updateRoleMutation: vi.fn(),
  inviteHook: vi.fn(),
  inviteMutation: vi.fn(),
  setActiveGroup: vi.fn(),
  currentUserId: 'owner-user',
}))

vi.mock('@/generated/operations', () => ({
  useGetGroupQuery: (...args: unknown[]) => mocks.getGroup(...args),
  useCreateNightSessionMutation: (...args: unknown[]) => mocks.createHook(...args),
  useRemoveGroupMemberMutation: (...args: unknown[]) => mocks.removeHook(...args),
  useUpdateGroupMemberRoleMutation: (...args: unknown[]) => mocks.updateRoleHook(...args),
  useInviteToGroupMutation: (...args: unknown[]) => mocks.inviteHook(...args),
}))

vi.mock('@/contexts/ActiveGroupContext', () => ({
  useActiveGroup: () => ({
    token: null,
    name: null,
    bggUsernames: [],
    setActiveGroup: mocks.setActiveGroup,
    clearActiveGroup: vi.fn(),
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: mocks.currentUserId,
      username: 'viewer',
      email: 'viewer@example.com',
      bggUsername: 'viewer_bgg',
      displayName: 'Viewer',
      avatar: null,
      isProvisional: false,
    },
    loading: false,
  }),
}))

vi.mock('@/components/plays-history', () => ({
  PlaysHistory: ({ groupId }: { groupId?: string }) => (
    <div data-testid="plays-history">History for {groupId}</div>
  ),
  ImportPlaysButton: () => <button type="button">Import plays</button>,
}))

const sessions = [
  {
    id: 'picking-session',
    title: 'Picking Night',
    state: 'PICKING',
    scheduledAt: '2026-08-09T18:30:00Z',
    location: 'Clubhouse',
    attendeeCount: 4,
  },
  {
    id: 'invited-session',
    title: 'Friday Games',
    state: 'INVITED',
    scheduledAt: '2026-08-15T19:00:00Z',
    location: null,
    attendeeCount: 2,
  },
  {
    id: 'draft-session',
    title: 'Draft Night',
    state: 'DRAFT',
    scheduledAt: null,
    location: null,
    attendeeCount: 0,
  },
]

function buildGroup(role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'OWNER') {
  return {
    id: 'group-1',
    name: 'Night Owls',
    description: 'Games after dark',
    inviteCode: 'NIGHTOWLS',
    anonymousBggUsernames: [],
    myRole: role,
    collectionTotalCount: 2,
    owner: { id: 'owner-user', displayName: 'Alice Owner', avatar: null },
    members: [
      {
        id: 'owner-user',
        displayName: 'Alice Owner',
        bggUsername: 'alice',
        avatar: null,
        isProvisional: false,
      },
      {
        id: 'member-user',
        displayName: 'Bob Member',
        bggUsername: 'bob',
        avatar: null,
        isProvisional: false,
      },
    ],
    memberships: [
      { id: 'membership-owner', role: 'OWNER', user: { id: 'owner-user' } },
      { id: 'membership-member', role: 'MEMBER', user: { id: 'member-user' } },
    ],
    sessions,
    pastSessions: [],
    collectionSpotlight: [],
  }
}

function LocationProbe() {
  const location = useLocation()
  return <output>{`${location.pathname}${location.search}`}</output>
}

function renderGroup(group = buildGroup()) {
  mocks.getGroup.mockReturnValue({
    data: { group },
    loading: false,
    error: undefined,
  })

  return render(
    <MemoryRouter initialEntries={['/g/NIGHTOWLS']}>
      <Routes>
        <Route path="/g/:token" element={<GroupPage />} />
        <Route path="/s/:id" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.currentUserId = 'owner-user'
  mocks.createOptions = null
  mocks.createMutation.mockResolvedValue({
    data: {
      createNightSession: {
        session: { id: 'new-session', title: 'Night Owls game night', state: 'DRAFT' },
      },
    },
  })
  mocks.createHook.mockImplementation((options) => {
    mocks.createOptions = options
    return [mocks.createMutation, { loading: false, error: undefined }]
  })
  mocks.removeHook.mockReturnValue([mocks.removeMutation, { loading: false, error: undefined }])
  mocks.updateRoleHook.mockReturnValue([mocks.updateRoleMutation, { loading: false, error: undefined }])
  mocks.inviteHook.mockReturnValue([mocks.inviteMutation, { loading: false, error: undefined }])
})

describe('GroupPage header and upcoming sessions', () => {
  it('shows the role-aware header and preserves the server session order and copy', () => {
    renderGroup()

    expect(screen.getByRole('heading', { name: 'Night Owls' })).toBeInTheDocument()
    expect(screen.getByText('Games after dark')).toBeInTheDocument()
    expect(screen.getByText('2 members')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create a night' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Upcoming sessions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute(
      'href',
      '/g/NIGHTOWLS/sessions',
    )

    const rows = screen.getAllByTestId('session-row')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Picking Night')).toBeInTheDocument()
    expect(within(rows[0]).getByRole('button', { name: 'Choose a game' })).toBeInTheDocument()
    expect(within(rows[1]).getByText('Friday Games')).toBeInTheDocument()
    expect(within(rows[1]).getByRole('button', { name: 'View details' })).toBeInTheDocument()
    expect(within(rows[2]).getByText('Draft Night')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Date')).toBeInTheDocument()
    expect(within(rows[2]).getByText('TBD')).toBeInTheDocument()
    expect(within(rows[2]).getByText('0 going')).toBeInTheDocument()
  })

  it('does not offer creation to ordinary members and renders only server-returned rows', () => {
    mocks.currentUserId = 'member-user'
    const memberGroup = buildGroup('MEMBER')
    memberGroup.sessions = sessions.slice(0, 2)

    renderGroup(memberGroup)

    expect(screen.queryByRole('button', { name: 'Create a night' })).not.toBeInTheDocument()
    expect(screen.getAllByTestId('session-row')).toHaveLength(2)
    expect(screen.queryByText('Draft Night')).not.toBeInTheDocument()
  })

  it('creates with the real group id, reconciles Apollo, and navigates to the draft', async () => {
    const user = userEvent.setup()
    renderGroup()

    await user.click(screen.getByRole('button', { name: 'Create a night' }))

    expect(mocks.createMutation).toHaveBeenCalledWith({
      variables: { groupId: 'group-1', title: 'Night Owls game night' },
    })
    expect(await screen.findByText('/s/new-session')).toBeInTheDocument()

    const cache = {
      identify: vi.fn().mockReturnValue('Group:group-1'),
      writeFragment: vi.fn().mockReturnValue({ __ref: 'NightSession:new-session' }),
      modify: vi.fn(),
    }
    mocks.createOptions.update(cache, {
      data: {
        createNightSession: {
          session: { id: 'new-session', title: 'Night Owls game night', state: 'DRAFT' },
        },
      },
    })

    expect(cache.modify).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'Group:group-1' }),
    )
    expect(mocks.getGroup).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { token: 'NIGHTOWLS' } }),
    )
    await waitFor(() => {
      expect(mocks.setActiveGroup).toHaveBeenCalledWith(
        'NIGHTOWLS',
        'Night Owls',
        ['alice', 'bob'],
      )
    })
  })
})
