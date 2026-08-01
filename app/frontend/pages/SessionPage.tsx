import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Clock, MapPin, Users, Calendar, AlertCircle, Pencil, X } from 'lucide-react'
import {
  useGetNightSessionQuery,
  useScheduleSessionMutation,
  useStartPickingMutation,
  useUpdateSessionDetailsMutation,
  usePickGameMutation,
  type GetNightSessionQuery,
} from '@/generated/operations'
import { useAuth } from '@/contexts/AuthContext'
import { Card, EmptyState, Eyebrow, MemberAvatar, Progress, StateBadge } from '@/components/primitives'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { GameCard } from '@/components/game-card'
import { toMember, toGame, toSuggestion } from '@/lib/graphql/adapters'
import type { SessionState } from '@/lib/data'

type NightSession = NonNullable<GetNightSessionQuery['nightSession']>
type Attendance = NightSession['attendances'][number]

function formatSessionDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.toLocaleDateString('en-US', { day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function SessionHeader({
  session,
  children,
}: {
  session: NightSession
  children?: React.ReactNode
}) {
  const date = formatSessionDate(session.scheduledAt)

  return (
    <div className="mb-8 rounded-xl border border-line bg-surface-container p-4 shadow-card md:p-6">
      <Eyebrow>Session</Eyebrow>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 text-ink">{session.title}</h1>
            <StateBadge state={session.state as SessionState} />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
            {date ? (
              <>
                <Calendar className="size-4" aria-hidden="true" />
                <span>
                  {date.weekday}, {date.month} {date.day} · {date.time}
                </span>
              </>
            ) : (
              <>
                <Clock className="size-4" aria-hidden="true" />
                <span>Date TBD</span>
              </>
            )}
            <span className="text-ink-muted">·</span>
            <MapPin className="size-4" aria-hidden="true" />
            <span>{session.location || 'Location TBD'}</span>
          </p>
          <p className="mt-1 text-sm text-ink-secondary">Hosted by {session.host.displayName}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function AttendeeList({ attendances }: { attendances: Attendance[] }) {
  const goingCount = attendances.filter((a) => a.response === 'going').length
  const members = useMemo(() => attendances.map((a) => toMember(a.user as Parameters<typeof toMember>[0])), [attendances])
  const names = members.map((m) => m.name).join(', ')

  if (members.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-secondary">
        <Users className="size-4" aria-hidden="true" />
        <span>No confirmed players yet</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center" aria-label={`${goingCount} confirmed players${names ? `: ${names}` : ''}`}>
        {members.slice(0, 5).map((member, index) => (
          <span key={member.id} className={index > 0 ? '-ml-2' : ''}>
            <MemberAvatar member={member} size="sm" showRing={false} />
          </span>
        ))}
        {members.length > 5 && (
          <span className="-ml-2 inline-flex size-8 items-center justify-center rounded-full bg-surface-raised text-[11px] font-semibold text-ink-secondary ring-2 ring-page">
            +{members.length - 5}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-ink-secondary">
        <span className="font-semibold text-ink">{goingCount}</span> going
      </span>
    </div>
  )
}

function DraftScheduleForm({
  session,
  isHost,
  onScheduled,
}: {
  session: NightSession
  isHost: boolean
  onScheduled(session: NightSession): void
}) {
  const [scheduleSession, { loading: scheduling }] = useScheduleSessionMutation()
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState(session.location || '')
  const [capacity, setCapacity] = useState(session.capacity?.toString() || '')

  if (!isHost) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      const result = await scheduleSession({
        variables: {
          sessionId: session.id,
          location: location || undefined,
          capacity: capacity ? parseInt(capacity, 10) : undefined,
        },
      })
      const updated = result.data?.scheduleSession?.session
      if (updated) {
        onScheduled(updated as NightSession)
      }
    } catch (err) {
      setError(err instanceof Error ? `Could not schedule: ${err.message}` : 'Could not schedule the session.')
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-h2 text-ink">Schedule this night</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="session-location" className="text-sm font-medium text-ink">
            Location
          </label>
          <input
            id="session-location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Where are you playing?"
            className="h-10 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="session-capacity" className="text-sm font-medium text-ink">
            Capacity
          </label>
          <input
            id="session-capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="How many players?"
            className="h-10 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={scheduling} className="w-full sm:w-auto">
            {scheduling ? 'Scheduling…' : 'Schedule & send invites'}
          </Button>
        </div>
        {error ? (
          <p className="sm:col-span-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Card>
  )
}

function StartPickingButton({
  session,
  onStarted,
}: {
  session: NightSession
  onStarted(session: NightSession): void
}) {
  const [startPicking, { loading: starting }] = useStartPickingMutation()
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setError(null)
    try {
      const result = await startPicking({ variables: { sessionId: session.id } })
      const updated = result.data?.startPicking?.session
      if (updated) {
        onStarted(updated as NightSession)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start picking.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={handleClick} disabled={starting}>
        {starting ? 'Starting…' : 'Start picking'}
      </Button>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function SessionRsvpCard({ attendances }: { attendances: Attendance[] }) {
  const going = attendances.filter((a) => a.response === 'going')
  const members = useMemo(
    () => attendances.map((a) => toMember(a.user as Parameters<typeof toMember>[0])),
    [attendances],
  )
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold text-ink">
        <Users className="mr-1.5 inline size-4" aria-hidden="true" />
        RSVPs ({going.length}/{attendances.length})
      </h2>
      <Progress
        value={attendances.length > 0 ? (going.length / attendances.length) * 100 : 0}
        barClassName="bg-success"
        label="RSVP progress"
      />
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {attendances.map((a) => {
          const m = memberById.get(a.user.id)
          if (!m) return null
          return (
            <li key={m.id} className="flex flex-col items-center gap-1.5 rounded-lg bg-surface-raised px-2 py-3">
              <MemberAvatar member={m} size="sm" />
              <span className="text-xs font-medium text-ink">{m.name.split(' ')[0]}</span>
              <span
                className={
                  a.response === 'going'
                    ? 'text-[10px] font-semibold text-success'
                    : a.response === 'maybe'
                      ? 'text-[10px] font-semibold text-warning'
                      : 'text-[10px] text-ink-muted'
                }
              >
                {a.response === 'going' ? 'Going' : a.response === 'maybe' ? 'Maybe' : '—'}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const { data, loading, error } = useGetNightSessionQuery({
    variables: { id: id ?? '' },
    skip: !id,
  })

  const session = data?.nightSession ?? null
  const [displaySession, setDisplaySession] = useState<NightSession | null>(session)

  useEffect(() => {
    if (session) {
      setDisplaySession(session)
    }
  }, [session])

  const isHost = Boolean(user && displaySession && user.id === displaySession.host.id)

  if (loading || authLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6" aria-busy="true">
        <div role="progressbar" aria-label="Loading session" className="skeleton mb-8 h-32 rounded-xl" />
        <div className="flex flex-col gap-6">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !displaySession) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-20 sm:px-6">
        <EmptyState
          icon={<AlertCircle className="size-5" />}
          title="Session not found"
          description={
            error
              ? 'Please check your connection and try again.'
              : 'This session doesn’t exist or you don’t have access to it.'
          }
          action={
            <LinkButton to="/" variant="outline" size="lg">
              Back home
            </LinkButton>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6">
      <SessionHeader session={displaySession}>
        {displaySession.state === 'INVITED' && isHost ? (
          <StartPickingButton session={displaySession} onStarted={setDisplaySession} />
        ) : null}
      </SessionHeader>

      <div className="flex flex-col gap-6">
        {displaySession.state === 'DRAFT' ? (
          <>
            <Card className="p-5">
              <h2 className="mb-3 text-h2 text-ink">Who&apos;s coming</h2>
              <AttendeeList attendances={displaySession.attendances} />
            </Card>
            <DraftScheduleForm session={displaySession} isHost={isHost} onScheduled={setDisplaySession} />
          </>
        ) : null}

        {displaySession.state === 'INVITED' ? <SessionRsvpCard attendances={displaySession.attendances} /> : null}

        {displaySession.state === 'PICKING' ? (
          <PickingView
            session={displaySession}
            isHost={isHost}
            onUpdated={setDisplaySession}
            onPicked={setDisplaySession}
          />
        ) : null}

        {displaySession.state === 'COMPLETED' ? <CompletedView session={displaySession} /> : null}
      </div>
    </div>
  )
}

function SessionDetailsEditor({
  session,
  isHost,
  onUpdated,
}: {
  session: NightSession
  isHost: boolean
  onUpdated(session: NightSession): void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [updateSession, { loading: updating }] = useUpdateSessionDetailsMutation()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(session.title)
  const [description, setDescription] = useState(session.description || '')
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (!session.scheduledAt) return ''
    try {
      const date = new Date(session.scheduledAt as string)
      return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  })
  const [location, setLocation] = useState(session.location || '')
  const [capacity, setCapacity] = useState(session.capacity?.toString() || '')

  if (!isHost) return null

  const handleOpen = () => {
    setIsOpen(true)
    setError(null)
    setTitle(session.title)
    setDescription(session.description || '')
    setScheduledAt(
      session.scheduledAt
        ? new Date(session.scheduledAt as string).toISOString().slice(0, 16)
        : '',
    )
    setLocation(session.location || '')
    setCapacity(session.capacity?.toString() || '')
  }

  const handleClose = () => {
    setIsOpen(false)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      const result = await updateSession({
        variables: {
          sessionId: session.id,
          title: title || undefined,
          description: description || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          location: location || undefined,
          capacity: capacity ? parseInt(capacity, 10) : undefined,
        },
      })
      const updated = result.data?.updateSessionDetails?.session
      if (updated) {
        onUpdated(updated as NightSession)
        setIsOpen(false)
      }
    } catch (err) {
      setError(err instanceof Error ? `Could not save: ${err.message}` : 'Could not save details.')
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={handleOpen}>
        <Pencil className="size-4" aria-hidden="true" />
        Edit Details
      </Button>
      {isOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 p-4 pt-24"
          onClick={(event) => {
            if (event.target === event.currentTarget) handleClose()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-session-title"
            className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="edit-session-title" className="text-h2 text-ink">
                Edit session details
              </h2>
              <Button type="button" variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-title" className="text-sm font-medium text-ink">
                  Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-description" className="text-sm font-medium text-ink">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-line bg-surface-raised p-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="edit-scheduledAt" className="text-sm font-medium text-ink">
                    Date/time
                  </label>
                  <input
                    id="edit-scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    className="h-10 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-location" className="text-sm font-medium text-ink">
                    Location
                  </label>
                  <input
                    id="edit-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-10 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-capacity" className="text-sm font-medium text-ink">
                  Capacity
                </label>
                <input
                  id="edit-capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
              <p className="text-sm text-ink-secondary">
                Game preferences stay locked while picking.
              </p>
              {error ? (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Saving…' : 'Save details'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

function GoingAttendees({ attendances, attendeeCount }: { attendances: Attendance[]; attendeeCount: number }) {
  const going = attendances.filter((a) => a.response === 'going')
  const members = useMemo(() => going.map((a) => toMember(a.user as Parameters<typeof toMember>[0])), [going])
  const names = members.map((m) => m.name).join(', ')
  const count = Math.max(members.length, attendeeCount)

  if (count === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center" aria-label={`${count} going${names ? `: ${names}` : ''}`}>
        {members.slice(0, 5).map((member, index) => (
          <span key={member.id} className={index > 0 ? '-ml-2' : ''}>
            <MemberAvatar member={member} size="sm" showRing={false} />
          </span>
        ))}
        {members.length > 5 && (
          <span className="-ml-2 inline-flex size-8 items-center justify-center rounded-full bg-surface-raised text-[11px] font-semibold text-ink-secondary ring-2 ring-page">
            +{members.length - 5}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-ink-secondary">
        <span className="font-semibold text-ink">{count}</span> going
      </span>
    </div>
  )
}

function PickingView({
  session,
  isHost,
  onUpdated,
  onPicked,
}: {
  session: NightSession
  isHost: boolean
  onUpdated(session: NightSession): void
  onPicked(session: NightSession): void
}) {
  const [pickGame, { loading: picking }] = usePickGameMutation()
  const [pickError, setPickError] = useState<string | null>(null)
  const suggestions = session.suggestions ?? []
  const topSuggestions = suggestions.slice(0, 8)

  const handlePick = async (gameId: string) => {
    setPickError(null)
    try {
      const result = await pickGame({ variables: { sessionId: session.id, gameId } })
      const updated = result.data?.pickGame?.session
      if (updated) {
        onPicked(updated as NightSession)
      }
    } catch (err) {
      setPickError(err instanceof Error ? err.message : 'Could not pick game.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3">
            <GoingAttendees attendances={session.attendances} attendeeCount={session.attendeeCount} />
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
              <Clock className="size-4" aria-hidden="true" />
              <span>Up to {session.timeBudgetMinutes} min</span>
              <span className="text-ink-muted">·</span>
              <span>{session.complexityPreference} complexity</span>
            </div>
          </div>
          <SessionDetailsEditor session={session} isHost={isHost} onUpdated={onUpdated} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-h2 text-ink">
          Game Suggestions (Filtered for {session.attendeeCount} Players)
        </h2>

        {session.attendeeCount === 0 ? (
          <p className="mt-4 text-sm text-ink-secondary">No confirmed players yet</p>
        ) : suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-ink-secondary">No games fit this night</p>
        ) : (
          <div
            data-testid="suggestion-grid"
            className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {topSuggestions.map((suggestion, index) => {
              const game = toGame(suggestion.thing as Parameters<typeof toGame>[0])
              const uiSuggestion = toSuggestion(suggestion as Parameters<typeof toSuggestion>[0], session.attendeeCount)
              return (
                <GameCard
                  key={`${game.id}-${index}`}
                  game={game}
                  suggestion={uiSuggestion}
                  isHost={isHost}
                  onPick={() => handlePick(game.id)}
                  picking={picking}
                  pickError={index === 0 ? pickError : null}
                />
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function CompletedView({ session }: { session: NightSession }) {
  const game = session.pickedGame
    ? toGame(session.pickedGame as Parameters<typeof toGame>[0])
    : null

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        <h2 className="mb-4 text-h2 text-ink">Picked game</h2>
        {game ? (
          <GameCard game={game} />
        ) : (
          <p className="text-sm text-ink-secondary">No game was picked for this session.</p>
        )}
      </Card>
    </div>
  )
}
