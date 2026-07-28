import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { Clock, Users, Check, Star } from 'lucide-react'
import { Eyebrow, Card, StateBadge, MemberAvatar, Progress } from '@/components/primitives'
import { Scoreboard } from '@/components/scoreboard'
import { LinkButton } from '@/components/ui/link-button'
import { GET_NIGHT_SESSION } from '@/lib/graphql/documents'
import { toGame, toMember, toSuggestion } from '@/lib/graphql/adapters'
import type { GqlNightSession, GqlSuggestion, GqlAttendance } from '@/lib/graphql/types'
import type { Member, Game, Suggestion } from '@/lib/data'

export function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error } = useQuery(GET_NIGHT_SESSION, {
    variables: { id: id ?? '' },
    skip: !id,
  })

  const nightSession: GqlNightSession | null = data?.nightSession ?? null

  const members: Member[] = useMemo(
    () => (nightSession?.attendances ?? []).map((a) => toMember(a.user)),
    [nightSession],
  )

  const memberById = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m]))
    return (id: string) => map.get(id)
  }, [members])

  const attendances: GqlAttendance[] = nightSession?.attendances ?? []
  const going = attendances.filter((a) => a.response === 'going')

  // Derive session metadata from the GQL session
  const sessionMeta = useMemo(() => {
    if (!nightSession) return null
    const dt = nightSession.scheduledAt ? new Date(nightSession.scheduledAt) : null
    return {
      title: nightSession.title,
      state: nightSession.state as import('@/lib/data').SessionState,
      date: dt
        ? dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : 'TBD',
      time: dt ? dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
      location: nightSession.location || 'TBD',
      gameId: nightSession.pickedGame?.objectid,
    }
  }, [nightSession])

  const pickedGame: Game | null = useMemo(
    () => (nightSession?.pickedGame ? toGame(nightSession.pickedGame) : null),
    [nightSession],
  )

  const suggestions: Suggestion[] = useMemo(
    () => (nightSession?.suggestions ?? []).map((s) => toSuggestion(s, attendances.length)),
    [nightSession, attendances.length],
  )

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-20 sm:px-6">
        <div className="skeleton mb-8 h-32 rounded-xl" />
        <div className="flex flex-col gap-6">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !nightSession || !sessionMeta) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-20 sm:px-6">
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-ink-secondary">Session not found.</p>
          <LinkButton to="/" variant="outline" size="lg">Back home</LinkButton>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-20 sm:px-6">
      <div className="mb-8 flex flex-col gap-3">
        <Eyebrow>Session</Eyebrow>
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-ink">{sessionMeta.title}</h1>
          <StateBadge state={sessionMeta.state} />
        </div>
        <p className="flex items-center gap-2 text-sm text-ink-secondary">
          <Clock className="size-4" />
          {sessionMeta.date} &middot; {sessionMeta.time} &middot; {sessionMeta.location}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-ink">
            <Users className="mr-1.5 inline size-4" />
            RSVPs ({going.length}/{attendances.length})
          </h2>
          <Progress
            value={attendances.length > 0 ? (going.length / attendances.length) * 100 : 0}
            barClassName="bg-success"
            label="RSVP progress"
          />
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {attendances.map((a) => {
              const m = memberById(a.user.id)
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

        {suggestions.length > 0 && (
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-sm font-semibold text-ink">
              <Star className="mr-1.5 inline size-4 text-star" />
              Suggested games
            </h2>
            <ul className="flex flex-col gap-3">
              {suggestions.map((s, i) => {
                const g = pickedGame?.id === s.gameId ? pickedGame : null
                // Find the thing from the GQL suggestion data for richer display
                const thing = nightSession.suggestions?.[i]
                const gameTitle = thing?.thing?.name
                return (
                  <li key={s.gameId} className="flex items-center gap-3 rounded-lg bg-surface-raised p-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{gameTitle ?? s.gameId}</p>
                      <p className="font-mono text-xs text-accent-teal">
                        {s.match}% match &middot; {s.votes} votes
                      </p>
                    </div>
                    {i === 0 && (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
                        <Check className="size-4" />
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        {sessionMeta.state === 'COMPLETED' && pickedGame && (
          // TODO: Wire to GET_NIGHT_SESSION scores field when backend adds it
          <Scoreboard scores={[]} pickedGameName={pickedGame.title} />
        )}
      </div>
    </div>
  )
}
