import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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
  removeOptions: null as any,
  updateRoleHook: vi.fn(),
  updateRoleMutation: vi.fn(),
  inviteHook: vi.fn(),
  inviteMutation: vi.fn(),
  clipboardWrite: vi.fn(),
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

function addAdmin(group: ReturnType<typeof buildGroup>, id = 'admin-user', name = 'Annie Admin') {
  group.members.push({
    id,
    displayName: name,
    bggUsername: 'annie',
    avatar: null,
    isProvisional: false,
  })
  group.memberships.push({ id: `membership-${id}`, role: 'ADMIN', user: { id } })
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
  mocks.removeOptions = null
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: mocks.clipboardWrite },
  })
  mocks.clipboardWrite.mockResolvedValue(undefined)
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
  mocks.removeMutation.mockResolvedValue({
    data: { removeGroupMember: { success: true, removedMembershipId: 'membership-member' } },
  })
  mocks.removeHook.mockImplementation((options) => {
    mocks.removeOptions = options
    return [mocks.removeMutation, { loading: false, error: undefined }]
  })
  mocks.updateRoleMutation.mockResolvedValue({
    data: {
      updateGroupMemberRole: {
        membership: {
          id: 'membership-member',
          role: 'ADMIN',
          user: { id: 'member-user', displayName: 'Bob Member' },
        },
      },
    },
  })
  mocks.updateRoleHook.mockReturnValue([mocks.updateRoleMutation, { loading: false, error: undefined }])
  mocks.inviteMutation.mockResolvedValue({
    data: {
      inviteToGroup: {
        inviteToken: {
          id: 'invite-1',
          token: 'invite-token',
          email: 'friend@example.com',
          status: 'PENDING',
        },
      },
    },
  })
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

describe('GroupPage collection spotlight and members', () => {
  it('renders up to four server-returned spotlight games with owner attribution and safe links', () => {
    const group = buildGroup() as any
    group.collectionSpotlight = Array.from({ length: 5 }, (_, index) => ({
      id: `thing-${index + 1}`,
      objectid: String(100 + index),
      name: index === 0 ? 'Brass: Birmingham' : `Game ${index + 1}`,
      thumbnail: index === 0 ? 'https://example.com/brass.jpg' : null,
      average: index === 0 ? 8.6 : 7.2,
      owners: [{ bggUsername: 'alice' }, { bggUsername: 'bob' }],
    }))

    renderGroup(group)

    expect(screen.getByRole('heading', { name: 'Shared collection spotlight' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse Library' })).toHaveAttribute(
      'href',
      '/collection?group=NIGHTOWLS',
    )
    expect(screen.getAllByTestId('spotlight-game')).toHaveLength(4)
    expect(screen.getAllByText('alice')).not.toHaveLength(0)
    const brassLink = screen.getByRole('link', {
      name: 'Brass: Birmingham on BoardGameGeek (opens in a new tab)',
    })
    expect(brassLink).toHaveAttribute('href', 'https://boardgamegeek.com/boardgame/100')
    expect(brassLink).toHaveAttribute('target', '_blank')
    expect(brassLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the approved spotlight empty state', () => {
    renderGroup()

    expect(screen.getByRole('heading', { name: 'The shared library is empty' })).toBeInTheDocument()
    expect(
      screen.getByText('Members’ collections will appear once they bind their BGG usernames.'),
    ).toBeInTheDocument()
  })

  it('shows owner role changes and removals while keeping owner rows protected', async () => {
    const user = userEvent.setup()
    const group = buildGroup()
    addAdmin(group)
    renderGroup(group)

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Actions for Alice Owner' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Bob Member' }))
    await user.click(screen.getByRole('button', { name: 'Make admin' }))
    expect(mocks.updateRoleMutation).toHaveBeenCalledWith({
      variables: { groupId: 'group-1', userId: 'member-user', role: 'ADMIN' },
    })

    await user.click(screen.getByRole('button', { name: 'Actions for Annie Admin' }))
    expect(screen.getByRole('button', { name: 'Change role to member' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove from group' })).toBeInTheDocument()
  })

  it('allows admins to remove non-owners but never change roles, and hides member controls', async () => {
    const user = userEvent.setup()
    const adminGroup = buildGroup('ADMIN')
    addAdmin(adminGroup)
    addAdmin(adminGroup, 'other-admin', 'Alex Admin')
    mocks.currentUserId = 'admin-user'
    renderGroup(adminGroup)

    expect(screen.queryByRole('button', { name: 'Actions for Alice Owner' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Actions for Annie Admin' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Bob Member' }))
    expect(screen.getByRole('button', { name: 'Remove from group' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Make admin' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Alex Admin' }))
    expect(screen.getByRole('button', { name: 'Remove from group' })).toBeInTheDocument()

    cleanup()
    const memberGroup = buildGroup('MEMBER')
    mocks.currentUserId = 'member-user'
    renderGroup(memberGroup)
    expect(screen.queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument()
  })

  it('focuses Cancel for inline removal and reconciles the returned membership id', async () => {
    const user = userEvent.setup()
    renderGroup()

    await user.click(screen.getByRole('button', { name: 'Actions for Bob Member' }))
    await user.click(screen.getByRole('button', { name: 'Remove from group' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(
      'Remove Bob Member? They will be removed from the group and their games will no longer appear in the shared collection.',
    )
    expect(within(alert).getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.click(within(alert).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Remove Bob Member?')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove from group' }))
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Remove' }))
    expect(mocks.removeMutation).toHaveBeenCalledWith({
      variables: { groupId: 'group-1', userId: 'member-user' },
    })

    const cache = {
      identify: vi.fn().mockReturnValue('Group:group-1'),
      modify: vi.fn(),
    }
    mocks.removeOptions.update(cache, {
      data: {
        removeGroupMember: { success: true, removedMembershipId: 'membership-member' },
      },
    })
    expect(cache.modify).toHaveBeenCalledWith(expect.objectContaining({ id: 'Group:group-1' }))
  })

  it('keeps the confirmation open and reports a removal mutation error', async () => {
    const user = userEvent.setup()
    mocks.removeMutation.mockRejectedValueOnce(new Error('Removal failed'))
    renderGroup()

    await user.click(screen.getByRole('button', { name: 'Actions for Bob Member' }))
    await user.click(screen.getByRole('button', { name: 'Remove from group' }))
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Remove' }))

    expect(await screen.findByText('Removal failed')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Remove Bob Member?')
  })
})

describe('GroupPage invitations and integrated order', () => {
  it('shows manager invitation controls with the canonical link and hides them from members', () => {
    renderGroup()

    expect(screen.getByRole('heading', { name: 'Invite people' })).toBeInTheDocument()
    expect(screen.getByLabelText('Invite link')).toHaveValue(
      `${window.location.origin}/g/NIGHTOWLS`,
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument()

    cleanup()
    mocks.currentUserId = 'member-user'
    renderGroup(buildGroup('MEMBER'))
    expect(screen.queryByRole('heading', { name: 'Invite people' })).not.toBeInTheDocument()
  })

  it('copies the canonical group URL and announces success politely', async () => {
    const user = userEvent.setup()
    const clipboardWrite = vi.spyOn(navigator.clipboard, 'writeText')
    renderGroup()

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(clipboardWrite).toHaveBeenCalledWith(`${window.location.origin}/g/NIGHTOWLS`)
    const copied = await screen.findByText('Copied!')
    expect(copied).toBeInTheDocument()
    expect(copied.closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('validates email, sends the owner-selected role, and resets only after success', async () => {
    const user = userEvent.setup()
    renderGroup()

    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an email address.')
    expect(mocks.inviteMutation).not.toHaveBeenCalled()

    const email = screen.getByPlaceholderText('Email address')
    const role = screen.getByLabelText('Role')
    await user.type(email, 'friend@example.com')
    await user.selectOptions(role, 'ADMIN')
    await user.click(screen.getByRole('button', { name: 'Send invite' }))

    expect(mocks.inviteMutation).toHaveBeenCalledWith({
      variables: { email: 'friend@example.com', groupId: 'group-1', role: 'ADMIN' },
    })
    await waitFor(() => {
      expect(email).toHaveValue('')
      expect(role).toHaveValue('MEMBER')
    })
  })

  it('limits admins to member invitations and preserves form values after an error', async () => {
    const user = userEvent.setup()
    mocks.currentUserId = 'admin-user'
    const group = buildGroup('ADMIN')
    addAdmin(group)
    mocks.inviteMutation.mockRejectedValueOnce(new Error('Invite failed'))
    renderGroup(group)

    expect(screen.queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument()
    const email = screen.getByPlaceholderText('Email address')
    const role = screen.getByLabelText('Role')
    await user.type(email, 'friend@example.com')
    await user.click(screen.getByRole('button', { name: 'Send invite' }))

    expect(mocks.inviteMutation).toHaveBeenCalledWith({
      variables: { email: 'friend@example.com', groupId: 'group-1', role: 'MEMBER' },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Invite failed')
    expect(email).toHaveValue('friend@example.com')
    expect(role).toHaveValue('MEMBER')
  })

  it('keeps the five coordination sections in mobile source order before Play History', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
    window.dispatchEvent(new Event('resize'))
    renderGroup()

    const page = screen.getByTestId('group-page')
    expect(page).toHaveClass('min-w-0', 'overflow-x-clip')

    const sectionHeadings = [
      screen.getByRole('heading', { name: 'Upcoming sessions' }),
      screen.getByRole('heading', { name: 'Shared collection spotlight' }),
      screen.getByRole('heading', { name: 'Members' }),
      screen.getByRole('heading', { name: 'Invite people' }),
      screen.getByRole('heading', { name: 'Play History' }),
    ]
    sectionHeadings.slice(0, -1).forEach((heading, index) => {
      expect(
        heading.compareDocumentPosition(sectionHeadings[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })
  })
})
