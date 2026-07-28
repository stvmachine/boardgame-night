import { useMemo, useState, useCallback } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  Download,
  Star,
  Users,
  Clock,
  MapPin,
  Loader2,
  Check,
  AlertCircle,
  History,
  RotateCw,
} from 'lucide-react'
import { Card, Badge, Eyebrow, EmptyState } from '@/components/primitives'
import { Button } from '@/components/ui/button'
import { GROUP_PLAYS, IMPORT_PLAYS } from '@/lib/graphql/documents'
import type { GqlPlay, GqlPlayPlayer, ImportPlaysPayload } from '@/lib/graphql/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toDateKey(iso: string): string {
  // Extract YYYY-MM-DD from the date string (handles both ISO datetime and date-only)
  return iso.slice(0, 10)
}

function isToday(iso: string): boolean {
  return toDateKey(iso) === toDateKey(new Date().toISOString())
}

function isYesterday(iso: string): boolean {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateKey(iso) === toDateKey(d.toISOString())
}

function isThisWeek(iso: string): boolean {
  const playDate = new Date(iso)
  const now = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(now.getDate() - 7)
  return playDate >= sevenDaysAgo && !isToday(iso) && !isYesterday(iso)
}

type DateGroup = 'today' | 'yesterday' | 'this-week' | 'earlier'

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This week',
  earlier: 'Earlier',
}

const DATE_GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'this-week', 'earlier']

function classifyDate(iso: string): DateGroup {
  if (isToday(iso)) return 'today'
  if (isYesterday(iso)) return 'yesterday'
  if (isThisWeek(iso)) return 'this-week'
  return 'earlier'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ---------------------------------------------------------------------------
// Player chip
// ---------------------------------------------------------------------------

function PlayerChip({ player }: { player: GqlPlayPlayer }) {
  const displayName = player.name || player.username
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        player.win
          ? 'bg-success/15 text-success'
          : 'bg-surface-raised text-ink-secondary',
      )}
    >
      {player.win && <Star className="size-3 shrink-0 fill-current" />}
      <span className="truncate max-w-[100px]">{displayName}</span>
      {player.score !== null && (
        <span className="font-mono text-[10px] text-ink-muted ml-0.5">
          {player.score}
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Single play row
// ---------------------------------------------------------------------------

function PlayRow({ play }: { play: GqlPlay }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-lg bg-surface-raised/50 px-4 py-3',
        'transition-colors duration-150 hover:bg-surface-raised',
      )}
    >
      {/* Top line: game name + meta badges */}
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-ink min-w-0 truncate">
          {play.gameName}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className="gap-1">
            <Users className="size-3 text-accent-teal" />
            {play.players.length}
          </Badge>
          {play.lengthMinutes != null && play.lengthMinutes > 0 && (
            <Badge className="gap-1">
              <Clock className="size-3 text-ink-muted" />
              {formatDuration(play.lengthMinutes)}
            </Badge>
          )}
          {play.location && (
            <Badge className="gap-1">
              <MapPin className="size-3 text-ink-muted" />
              <span className="truncate max-w-[100px]">{play.location}</span>
            </Badge>
          )}
          {play.incomplete && (
            <Badge className="bg-warning/15 text-warning">Incomplete</Badge>
          )}
        </div>
      </div>

      {/* Second line: logged by + date */}
      <p className="text-xs text-ink-muted">
        Logged by{' '}
        <span className="font-medium text-ink-secondary">
          {play.user.displayName}
        </span>{' '}
        · {formatDate(play.date)}
        {play.quantity > 1 && (
          <span className="ml-1 text-ink-muted">
            ({play.quantity} plays)
          </span>
        )}
      </p>

      {/* Player results */}
      {play.players.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {play.players.map((p) => (
            <PlayerChip key={`${p.id}-${p.username}`} player={p} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PlayRowSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-surface-raised/50 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="skeleton h-4 w-36 rounded-full" />
        <div className="skeleton h-5 w-10 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
      <div className="skeleton h-3 w-48 rounded-full" />
      <div className="flex gap-1">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

function PlaysHistorySkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="skeleton h-3 w-24 rounded-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <PlayRowSkeleton key={i} />
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Grouped plays list
// ---------------------------------------------------------------------------

function GroupedPlaysList({ plays }: { plays: GqlPlay[] }) {
  const grouped = useMemo(() => {
    const map = new Map<DateGroup, GqlPlay[]>()
    for (const play of plays) {
      const group = classifyDate(play.date)
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(play)
    }
    return DATE_GROUP_ORDER
      .filter((g) => map.has(g) && map.get(g)!.length > 0)
      .map((g) => ({ group: g, plays: map.get(g)! }))
  }, [plays])

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(({ group, plays: groupPlays }) => (
        <section key={group}>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-muted">
            {DATE_GROUP_LABELS[group]}
          </p>
          <div className="flex flex-col gap-2">
            {groupPlays.map((play) => (
              <PlayRow key={play.id} play={play} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PlaysHistory — main exported component
// ---------------------------------------------------------------------------

interface PlaysHistoryProps {
  groupId: string | undefined
}

export function PlaysHistory({ groupId }: PlaysHistoryProps) {
  const { data, loading, error, refetch } = useQuery(GROUP_PLAYS, {
    variables: { groupId: groupId!, limit: 20 },
    skip: !groupId,
  })

  const plays: GqlPlay[] = data?.groupPlays ?? []

  // --- Loading ---
  if (loading && !data) {
    return <PlaysHistorySkeleton />
  }

  // --- Error ---
  if (error) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-danger/15">
          <AlertCircle className="size-5 text-danger" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-ink">
            Failed to load play history
          </p>
          <p className="text-xs text-ink-muted">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCw className="size-3.5" />
          Retry
        </Button>
      </Card>
    )
  }

  // --- Empty ---
  if (plays.length === 0) {
    return (
      <Card className="p-0">
        <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
          <Eyebrow>Recent Plays</Eyebrow>
        </div>
        <EmptyState
          icon={<History className="size-5" />}
          title="No plays recorded yet"
          description="Import play history from BoardGameGeek to see what your group has been playing."
        />
      </Card>
    )
  }

  // --- Content ---
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <Eyebrow>Recent Plays</Eyebrow>
        <span className="text-xs text-ink-muted">
          {plays.length} {plays.length === 1 ? 'play' : 'plays'}
        </span>
      </div>
      <GroupedPlaysList plays={plays} />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ImportPlaysButton — import BGG play history
// ---------------------------------------------------------------------------

interface ImportPlaysButtonProps {
  username: string
  groupId: string | undefined
  onComplete?: () => void
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error'

export function ImportPlaysButton({
  username,
  onComplete,
}: ImportPlaysButtonProps) {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const [importPlays] = useMutation<{ importPlays: ImportPlaysPayload }>(
    IMPORT_PLAYS,
  )

  const handleClick = useCallback(async () => {
    if (status === 'loading') return

    setStatus('loading')
    setMessage(null)

    try {
      const { data } = await importPlays({ variables: { username } })
      const payload = data?.importPlays

      if (payload?.success) {
        setStatus('success')
        setMessage(payload.message || 'Play history imported successfully')
        onComplete?.()
        // Reset success state after a few seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage(null)
        }, 4000)
      } else {
        setStatus('error')
        setMessage(payload?.message || 'Import failed — please try again')
      }
    } catch (err) {
      setStatus('error')
      setMessage(
        err instanceof Error ? err.message : 'Something went wrong',
      )
    }
  }, [importPlays, username, status, onComplete])

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        Import plays
      </Button>

      {/* Inline feedback message */}
      {message && (
        <p
          className={cn(
            'flex items-center gap-1.5 text-xs',
            status === 'success' && 'text-success',
            status === 'error' && 'text-danger',
          )}
          role="status"
          aria-live="polite"
        >
          {status === 'success' && <Check className="size-3 shrink-0" />}
          {status === 'error' && <AlertCircle className="size-3 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  )
}
