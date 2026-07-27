import { useParams } from 'react-router-dom'
import { Clock, Users, Check, Star, Trophy } from 'lucide-react'
import { Eyebrow, Card, StateBadge, MemberAvatar, Progress } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'
import { sessionById, gameById, members, suggestions, scoreboard } from '@/lib/data'

export function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const session = sessionById(id ?? '')
  const game = gameById(session.gameId)

  const going = session.rsvps.filter((r) => r.status === 'going')

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-20 sm:px-6">
      <div className="mb-8 flex flex-col gap-3">
        <Eyebrow>Session</Eyebrow>
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-ink">{session.title}</h1>
          <StateBadge state={session.state} />
        </div>
        <p className="flex items-center gap-2 text-sm text-ink-secondary">
          <Clock className="size-4" />
          {session.date} &middot; {session.time} &middot; {session.location}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-ink">
            <Users className="mr-1.5 inline size-4" />
            RSVPs ({going.length}/{session.rsvps.length})
          </h2>
          <Progress
            value={(going.length / session.rsvps.length) * 100}
            barClassName="bg-success"
            label="RSVP progress"
          />
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {session.rsvps.map((r) => {
              const m = members.find((x) => x.id === r.memberId)
              if (!m) return null
              return (
                <li key={m.id} className="flex flex-col items-center gap-1.5 rounded-lg bg-surface-raised px-2 py-3">
                  <MemberAvatar member={m} size="sm" />
                  <span className="text-xs font-medium text-ink">{m.name.split(' ')[0]}</span>
                  <span
                    className={
                      r.status === 'going'
                        ? 'text-[10px] font-semibold text-success'
                        : r.status === 'maybe'
                          ? 'text-[10px] font-semibold text-warning'
                          : 'text-[10px] text-ink-muted'
                    }
                  >
                    {r.status === 'going' ? 'Going' : r.status === 'maybe' ? 'Maybe' : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>

        {session.state === 'INVITED' && (
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-sm font-semibold text-ink">
              <Star className="mr-1.5 inline size-4 text-star" />
              Suggested games
            </h2>
            <ul className="flex flex-col gap-3">
              {suggestions.map((s, i) => {
                const g = gameById(s.gameId)
                if (!g) return null
                return (
                  <li key={s.gameId} className="flex items-center gap-3 rounded-lg bg-surface-raised p-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{g.title}</p>
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

        {session.state === 'COMPLETED' && session.gameId && (
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-sm font-semibold text-ink">
              <Trophy className="mr-1.5 inline size-4 text-star" />
              Scoreboard — {game?.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {scoreboard
                .sort((a, b) => a.total - b.total)
                .reverse()
                .map((row, i) => {
                  const m = members.find((x) => x.id === row.memberId)
                  if (!m) return null
                  return (
                    <li key={m.id} className="flex items-center gap-3 rounded-lg bg-surface-raised px-3 py-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <MemberAvatar member={m} size="sm" showRing={false} />
                      <span className="flex-1 text-sm font-medium text-ink">{m.name}</span>
                      <span className="font-mono text-sm text-ink">{row.total}</span>
                    </li>
                  )
                })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
