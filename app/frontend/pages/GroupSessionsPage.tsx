import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, Users } from 'lucide-react'
import { Card, EmptyState, StateBadge } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { useGetGroupQuery, type GetGroupQuery } from '@/generated/operations'

type Group = NonNullable<GetGroupQuery['group']>
type PastSession = Group['pastSessions'][number]

function formatSessionDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.toLocaleDateString('en-US', { day: 'numeric' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function SessionRow({ session }: { session: PastSession }) {
  const date = formatSessionDate(session.scheduledAt)
  const scheduleDetails = date
    ? `${date.weekday}, ${date.time}${session.location ? ` · ${session.location}` : ''}`
    : session.location && session.location.toUpperCase() !== 'TBD'
      ? session.location
      : 'Schedule to be decided'

  return (
    <li
      data-testid="session-row"
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface-raised p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
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
          <StateBadge state={session.state} />
        </div>
        <p className="text-sm text-ink-secondary">{scheduleDetails}</p>

        {session.pickedGame ? (
          <div className="mt-3 flex items-center gap-3">
            {session.pickedGame.thumbnail ? (
              <img
                src={session.pickedGame.thumbnail}
                alt={`${session.pickedGame.name} box cover`}
                className="size-12 rounded-md object-cover"
              />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-md bg-surface text-xs text-ink-muted">
                No image
              </span>
            )}
            <span className="text-sm font-medium text-ink">{session.pickedGame.name}</span>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary">
          <Users className="size-4" aria-hidden="true" />
          Attended
        </span>
      </div>
    </li>
  )
}

export function GroupSessionsPage() {
  const { token } = useParams<{ token: string }>()
  const { data, loading, error } = useGetGroupQuery({
    variables: { token: token ?? '' },
    skip: !token,
  })
  const group = data?.group ?? null
  const pastSessions = useMemo(() => group?.pastSessions ?? [], [group])
  const backToGroup = token ? `/g/${encodeURIComponent(token)}` : '/groups'

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32" aria-busy="true">
        <div className="mb-6">
          <div className="skeleton mb-4 h-4 w-32 rounded-full" />
          <div className="skeleton h-10 w-2/3 rounded-xl" />
        </div>
        <div
          className="flex flex-col gap-3"
          role="progressbar"
          aria-label="Loading past sessions"
          aria-busy="true"
        >
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <h2 className="text-h3 text-ink">
            {error ? 'Couldn’t load this page' : 'Group not found'}
          </h2>
          <p className="text-ink-secondary">
            {error
              ? 'Please check your connection and try again.'
              : 'This group doesn’t exist or you don’t have access to it.'}
          </p>
          <LinkButton to={backToGroup} variant="outline" size="lg">
            Back to group
          </LinkButton>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
      <div className="mb-6">
        <Link
          to={backToGroup}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to group
        </Link>
        <h1 className="text-h1 text-ink">{group.name}</h1>
        <h2 className="text-h3 text-ink-secondary">Past sessions</h2>
      </div>

      {pastSessions.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {pastSessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="No past sessions"
          description="Past game nights will show up here."
          action={
            <LinkButton to={backToGroup} variant="outline">
              Back to group
            </LinkButton>
          }
        />
      )}
    </div>
  )
}
