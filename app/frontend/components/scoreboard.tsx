import { Trophy } from 'lucide-react'
import { Card, MemberAvatar } from '@/components/primitives'
import type { Member } from '@/lib/data'

export interface ScoreEntry {
  userId: string
  displayName: string
  avatar: string | null
  score: number | null
  rank: number | null
}

interface ScoreboardProps {
  scores: ScoreEntry[]
  pickedGameName: string
}

const rankBadge = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🥇'
    case 2:
      return '🥈'
    case 3:
      return '🥉'
    default:
      return `${rank}`
  }
}

function scoreToMember(entry: ScoreEntry): Member {
  return {
    id: entry.userId,
    name: entry.displayName,
    bgg: '',
    color: '#6366f1',
    online: false,
  }
}

export function Scoreboard({ scores, pickedGameName }: ScoreboardProps) {
  const sorted = [...scores].sort((a, b) => {
    if (a.score === null && b.score === null) return 0
    if (a.score === null) return 1
    if (b.score === null) return -1
    return b.score - a.score
  })

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold text-ink">
        <Trophy className="mr-1.5 inline size-4 text-star" />
        Scoreboard — {pickedGameName}
      </h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No scores recorded yet. Scores will appear after the game is played.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {sorted.map((entry, i) => {
            const rank = entry.rank ?? i + 1
            return (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${rank === 1 ? 'bg-success/5' : ''}`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center text-sm font-bold text-ink-secondary">
                  {rankBadge(rank)}
                </span>
                <MemberAvatar member={scoreToMember(entry)} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {entry.displayName}
                </span>
                <span className="font-mono text-sm tabular-nums text-ink-secondary">
                  {entry.score !== null ? entry.score.toLocaleString() : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
