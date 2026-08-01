import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Plus, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, EmptyState, StateBadge } from '@/components/primitives'
import { PlaysHistory, ImportPlaysButton } from '@/components/plays-history'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { useActiveGroup } from '@/contexts/ActiveGroupContext'
import {
  useCreateNightSessionMutation,
  useGetGroupQuery,
  type GetGroupQuery,
  type SessionState,
} from '@/generated/operations'

type Group = NonNullable<GetGroupQuery['group']>
type GroupSession = Group['sessions'][number]

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
        <p className="text-sm text-ink-secondary">
          {date ? date.time : 'Time TBD'}
          {session.location ? ` · ${session.location}` : ''}
        </p>
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
    <div className="w-full min-w-0 px-4 pt-24 pb-20 sm:px-6">
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
        </main>
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
