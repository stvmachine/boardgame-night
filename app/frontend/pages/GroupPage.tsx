import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, Copy, EllipsisVertical, LibraryBig, Plus, Star, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, EmptyState, StateBadge } from '@/components/primitives'
import { PlaysHistory, ImportPlaysButton } from '@/components/plays-history'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { useActiveGroup } from '@/contexts/ActiveGroupContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  useCreateNightSessionMutation,
  useGetGroupQuery,
  useInviteToGroupMutation,
  useRemoveGroupMemberMutation,
  useUpdateGroupMemberRoleMutation,
  type GetGroupQuery,
  type SessionState,
} from '@/generated/operations'

type Group = NonNullable<GetGroupQuery['group']>
type GroupSession = Group['sessions'][number]
type GroupMember = Group['members'][number]
type GroupMembership = Group['memberships'][number]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatSessionDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.toLocaleDateString('en-US', { day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function SessionRow({ session }: { session: GroupSession }) {
  const navigate = useNavigate()
  const date = formatSessionDate(session.scheduledAt)
  const cta = session.state === 'PICKING' ? 'Choose a game' : 'View details'
  const scheduleDetails = date
    ? `${date.time}${session.location ? ` · ${session.location}` : ''}`
    : session.location && session.location.toUpperCase() !== 'TBD'
      ? session.location
      : 'Schedule to be decided'
  const goToSession = useCallback(() => navigate(`/s/${session.id}`), [navigate, session.id])

  return (
    <li
      data-testid="session-row"
      className="flex min-w-0 cursor-pointer flex-col gap-4 rounded-xl border border-line bg-surface-raised p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
      role="link"
      tabIndex={0}
      onClick={goToSession}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          goToSession()
        }
      }}
    >
      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-surface">
        {date ? (
          <>
            <span className="text-xs font-semibold tracking-wide text-ink-muted">{date.month}</span>
            <span className="text-xl font-semibold text-ink">{date.day}</span>
          </>
        ) : (
          <>
            <span className="text-xs font-semibold text-ink-muted">Date</span>
            <span className="text-sm font-semibold text-ink">TBD</span>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-ink">{session.title}</p>
          <StateBadge state={session.state as SessionState} />
        </div>
        <p className="text-sm text-ink-secondary">{scheduleDetails}</p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary">
          <Users className="size-4" aria-hidden="true" />
          {session.attendeeCount} going
        </span>
        <Button
          type="button"
          variant={session.state === 'PICKING' ? 'default' : 'outline'}
          size="sm"
          onClick={goToSession}
        >
          {cta}
        </Button>
      </div>
    </li>
  )
}

function UpcomingSessions({
  group,
  canManage,
  onCreate,
  creating,
}: {
  group: Group
  canManage: boolean
  onCreate: () => void
  creating: boolean
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-h2 text-ink">Upcoming sessions</h2>
        <LinkButton to={`/g/${group.inviteCode ?? group.id}/sessions`} variant="ghost" size="sm">
          View all
        </LinkButton>
      </div>

      {group.sessions.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {group.sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title={canManage ? 'Plan your first game night' : 'No nights planned yet'}
          description={
            canManage
              ? 'Create a night to get everyone on the schedule.'
              : 'Check back later for upcoming game nights.'
          }
          action={
            canManage ? (
              <Button type="button" onClick={onCreate} disabled={creating}>
                Create a night
              </Button>
            ) : undefined
          }
        />
      )}
    </Card>
  )
}

function CollectionSpotlight({ group }: { group: Group }) {
  const games = group.collectionSpotlight.slice(0, 4)

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-h2 text-ink">Shared collection spotlight</h2>
        <LinkButton
          to={`/collection?group=${encodeURIComponent(group.inviteCode ?? group.id)}`}
          variant="link"
          size="sm"
        >
          Browse Library
        </LinkButton>
      </div>

      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {games.map((game) => (
            <a
              key={game.id}
              data-testid="spotlight-game"
              href={`https://boardgamegeek.com/boardgame/${encodeURIComponent(game.objectid)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${game.name} on BoardGameGeek (opens in a new tab)`}
              className="group min-w-0 overflow-hidden rounded-xl border border-line bg-surface-raised transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-surface">
                {game.thumbnail ? (
                  <img
                    src={game.thumbnail}
                    alt={`${game.name} box cover`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
                    No image
                  </span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold text-ink">{game.name}</h3>
                  {game.average != null ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-info/15 px-2 py-0.5 text-xs font-semibold text-info">
                      <Star className="size-3" aria-hidden="true" />
                      {game.average.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1" aria-label="Owners">
                  {game.owners.slice(0, 3).map((owner) => (
                    <span
                      key={owner.bggUsername}
                      className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-secondary"
                    >
                      {owner.bggUsername}
                    </span>
                  ))}
                  {game.owners.length > 3 ? (
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-secondary">
                      +{game.owners.length - 3}
                    </span>
                  ) : null}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<LibraryBig className="size-5" />}
          title="The shared library is empty"
          description="Members’ collections will appear once they bind their BGG usernames."
        />
      )}
    </Card>
  )
}

function MemberIdentity({ member }: { member: GroupMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-semibold text-ink ring-2 ring-line">
        {initials(member.displayName)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{member.displayName}</p>
        {member.bggUsername ? (
          <p className="truncate text-xs text-ink-muted">@{member.bggUsername}</p>
        ) : null}
      </div>
    </div>
  )
}

function MembersPanel({ group }: { group: Group }) {
  const { user } = useAuth()
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null)
  const [confirmingMembershipId, setConfirmingMembershipId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const groupCacheKey = group.id

  const [removeGroupMember, { loading: removing }] = useRemoveGroupMemberMutation({
    update(cache, result) {
      const removedMembershipId = result.data?.removeGroupMember?.removedMembershipId
      if (!removedMembershipId) return
      const groupCacheId = cache.identify({ __typename: 'Group', id: groupCacheKey })
      if (!groupCacheId) return
      cache.modify({
        id: groupCacheId,
        fields: {
          memberships(existing = [], { readField }) {
            const references = existing as ReadonlyArray<{ __ref: string }>
            return references.filter((reference) => readField('id', reference) !== removedMembershipId)
          },
        },
      })
    },
  })
  const [updateGroupMemberRole, { loading: updatingRole }] = useUpdateGroupMemberRoleMutation()

  useEffect(() => {
    if (confirmingMembershipId) cancelButtonRef.current?.focus()
  }, [confirmingMembershipId])

  const membershipByUserId = new Map(
    group.memberships.map((membership) => [membership.user.id, membership]),
  )

  const canActOn = (membership: GroupMembership) => {
    if (membership.role === 'OWNER' || membership.user.id === user?.id) return false
    return group.myRole === 'OWNER' || group.myRole === 'ADMIN'
  }

  const handleRoleChange = async (member: GroupMember, membership: GroupMembership) => {
    const role = membership.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
    setMutationError(null)
    try {
      await updateGroupMemberRole({
        variables: { groupId: group.id, userId: member.id, role },
      })
      setOpenActionsFor(null)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not change this role.')
    }
  }

  const handleRemove = async (member: GroupMember, membership: GroupMembership) => {
    setMutationError(null)
    try {
      await removeGroupMember({ variables: { groupId: group.id, userId: member.id } })
      setConfirmingMembershipId(null)
      setOpenActionsFor(null)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not remove this member.')
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-h2 text-ink">Members</h2>
      <ul className="space-y-2">
        {group.members.map((member) => {
          const membership = membershipByUserId.get(member.id)
          if (!membership) return null
          const actionsAvailable = canActOn(membership)
          const actionsOpen = openActionsFor === membership.id
          const confirming = confirmingMembershipId === membership.id

          return (
            <li key={member.id} className="rounded-lg border border-line bg-surface-raised p-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <MemberIdentity member={member} />
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                    {membership.role.toLowerCase()}
                  </span>
                  {actionsAvailable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Actions for ${member.displayName}`}
                      aria-expanded={actionsOpen}
                      onClick={() => {
                        setMutationError(null)
                        setOpenActionsFor(actionsOpen ? null : membership.id)
                        setConfirmingMembershipId(null)
                      }}
                    >
                      <EllipsisVertical className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {actionsOpen && !confirming ? (
                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
                  {group.myRole === 'OWNER' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={updatingRole}
                      onClick={() => handleRoleChange(member, membership)}
                    >
                      {membership.role === 'ADMIN' ? 'Change role to member' : 'Make admin'}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setMutationError(null)
                      setConfirmingMembershipId(membership.id)
                    }}
                  >
                    Remove from group
                  </Button>
                </div>
              ) : null}

              {confirming ? (
                <div
                  className="mt-3 rounded-lg border border-danger/40 bg-danger/10 p-4"
                  role="alert"
                >
                  <p className="text-sm text-ink">
                    <strong>Remove {member.displayName}?</strong> They will be removed from the group
                    and their games will no longer appear in the shared collection.
                  </p>
                  {mutationError ? (
                    <p className="mt-2 text-sm text-danger">{mutationError}</p>
                  ) : null}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      ref={cancelButtonRef}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfirmingMembershipId(null)
                        setMutationError(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={removing}
                      onClick={() => handleRemove(member, membership)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      {mutationError && !confirmingMembershipId ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {mutationError}
        </p>
      ) : null}
    </Card>
  )
}

function InvitePeopleCard({ group }: { group: Group }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const copyFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [inviteToGroup, { loading: inviting }] = useInviteToGroupMutation()
  const groupToken = group.inviteCode ?? group.id
  const inviteLink = `${window.location.origin}/g/${encodeURIComponent(groupToken)}`

  useEffect(
    () => () => {
      if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current)
    },
    [],
  )

  const handleCopy = async () => {
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current)
      copyFeedbackTimer.current = setTimeout(() => setCopied(false), 2_000)
    } catch {
      setCopied(false)
      setCopyError('Could not copy the invite link.')
    }
  }

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    setInviteError(null)
    if (!normalizedEmail) {
      setInviteError('Enter an email address.')
      return
    }

    try {
      await inviteToGroup({
        variables: { email: normalizedEmail, groupId: group.id, role },
      })
      setEmail('')
      setRole('MEMBER')
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Could not send this invitation.')
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-h2 text-ink">Invite people</h2>

      <div>
        <label htmlFor="group-invite-link" className="mb-1.5 block text-sm font-medium text-ink">
          Invite link
        </label>
        <div className="flex min-w-0 gap-2">
          <input
            id="group-invite-link"
            aria-label="Invite link"
            readOnly
            value={inviteLink}
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
          <Button type="button" variant="outline" size="icon-lg" aria-label="Copy" onClick={handleCopy}>
            <Copy className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-2 min-h-5 text-sm" aria-live="polite">
          {copied ? <span className="font-medium text-primary">Copied!</span> : null}
          {copyError ? <span className="text-danger">{copyError}</span> : null}
        </div>
      </div>

      <form className="mt-4 space-y-3 border-t border-line pt-4" onSubmit={handleInvite} noValidate>
        <label htmlFor="group-invite-email" className="sr-only">
          Email address
        </label>
        <input
          id="group-invite-email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-9 w-full min-w-0 rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <label className="min-w-0 text-sm font-medium text-ink">
            <span className="sr-only">Role</span>
            <select
              aria-label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value as 'MEMBER' | 'ADMIN')}
              className="h-9 w-full min-w-0 rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="MEMBER">Member</option>
              {group.myRole === 'OWNER' ? <option value="ADMIN">Admin</option> : null}
            </select>
          </label>
          <Button type="submit" disabled={inviting}>
            {inviting ? 'Sending…' : 'Send invite'}
          </Button>
        </div>

        {inviteError ? (
          <p className="text-sm text-danger" role="alert">
            {inviteError}
          </p>
        ) : null}
      </form>
    </Card>
  )
}

export function GroupPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setActiveGroup } = useActiveGroup()
  const [createError, setCreateError] = useState<string | null>(null)
  const { data, loading, error } = useGetGroupQuery({
    variables: { token: token ?? '' },
    skip: !token,
  })
  const group = data?.group ?? null
  const groupId = group?.id

  const [createNightSession, { loading: creating }] = useCreateNightSessionMutation({
    update(cache, result) {
      const session = result.data?.createNightSession?.session
      if (!session || !groupId) return
      const groupCacheId = cache.identify({ __typename: 'Group', id: groupId })
      const sessionCacheId = cache.identify({ __typename: 'NightSession', id: session.id })
      if (!groupCacheId || !sessionCacheId) return

      cache.modify({
        id: groupCacheId,
        fields: {
          sessions(existing = [], { readField }) {
            const references = existing as ReadonlyArray<{ __ref: string }>
            if (references.some((ref) => readField('id', ref) === session.id)) return references
            return [...references, { __ref: sessionCacheId }]
          },
        },
      })
    },
  })

  useEffect(() => {
    if (!group) return
    const memberUsernames = group.members
      .map((member) => member.bggUsername)
      .filter((username): username is string => Boolean(username))
    setActiveGroup(
      group.inviteCode ?? group.id,
      group.name,
      memberUsernames.length > 0 ? memberUsernames : group.anonymousBggUsernames,
    )
  }, [group, setActiveGroup])

  const canManage = group?.myRole === 'OWNER' || group?.myRole === 'ADMIN'

  const handleCreateNight = useCallback(async () => {
    if (!group) return
    setCreateError(null)
    try {
      const result = await createNightSession({
        variables: { groupId: group.id, title: `${group.name} game night` },
      })
      const sessionId = result.data?.createNightSession?.session.id
      if (sessionId) navigate(`/s/${sessionId}`)
    } catch (mutationError) {
      setCreateError(
        mutationError instanceof Error ? mutationError.message : 'Could not create the game night.',
      )
    }
  }, [createNightSession, group, navigate])

  if (loading) {
    return (
      <div className="w-full px-4 pt-24 pb-20 sm:px-6" aria-busy="true">
        <div className="skeleton mb-6 h-32 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="w-full px-4 pt-24 pb-20 sm:px-6">
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title={error ? 'Couldn’t load this page' : 'Group not found'}
          description={
            error
              ? 'Please check your connection and try again.'
              : 'This group doesn’t exist or you don’t have access to it.'
          }
          action={
            <LinkButton to="/groups" variant="outline" size="lg">
              Back to groups
            </LinkButton>
          }
        />
      </div>
    )
  }

  return (
    <div
      data-testid="group-page"
      className="w-full min-w-0 overflow-x-clip px-4 pt-24 pb-20 sm:px-6"
    >
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 text-ink">{group.name}</h1>
            <span className="rounded-full bg-surface-raised px-3 py-1 text-sm font-semibold text-ink-secondary">
              {group.members.length} members
            </span>
          </div>
          {group.description ? (
            <p className="mt-2 max-w-3xl text-ink-secondary">{group.description}</p>
          ) : null}
        </div>
        {canManage ? (
          <Button
            type="button"
            size="lg"
            className="w-full lg:w-auto"
            onClick={handleCreateNight}
            disabled={creating}
          >
            <Plus className="size-4" aria-hidden="true" />
            {creating ? 'Creating…' : 'Create a night'}
          </Button>
        ) : null}
      </header>

      {createError ? (
        <p className="mb-4 text-sm text-danger" role="alert">
          {createError}
        </p>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <main className="min-w-0 space-y-6 lg:col-span-8">
          <UpcomingSessions
            group={group}
            canManage={canManage}
            onCreate={handleCreateNight}
            creating={creating}
          />
          <CollectionSpotlight group={group} />
        </main>
        <aside className="min-w-0 space-y-6 lg:col-span-4 lg:self-start lg:sticky lg:top-6">
          <MembersPanel group={group} />
          {canManage ? <InvitePeopleCard group={group} /> : null}
        </aside>
      </div>

      <section className="mt-6" aria-labelledby="play-history-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="play-history-heading" className="text-h2 text-ink">
            Play History
          </h2>
          {group.members[0]?.bggUsername ? (
            <ImportPlaysButton
              username={group.members[0].bggUsername}
              groupId={group.id}
              onComplete={() => undefined}
            />
          ) : null}
        </div>
        <PlaysHistory groupId={group.id} />
      </section>
    </div>
  )
}
