import type {
  GqlMergedThing,
  GqlNightSession,
  GqlGroup,
  GqlUser,
  GqlSuggestion,
  GqlGroupSpotlightThing,
} from './types'
import type { Game, Session, Group, Member, Suggestion } from '@/lib/data'

// Map GqlUser → Member (for UI components expecting Member)
export function toMember(user: GqlUser): Member {
  return {
    id: user.id,
    name: user.displayName,
    bgg: user.bggUsername || '',
    color: stringToColor(user.username),
    online: true,
  }
}

// Map GqlMergedThing → Game
export function toGame(thing: GqlMergedThing): Game {
  return {
    id: thing.objectid,
    title: thing.name,
    cover: thing.thumbnail || thing.image || '',
    minPlayers: thing.minPlayers ?? 0,
    maxPlayers: thing.maxPlayers ?? 0,
    bestAt: thing.bestPlayerCount ?? 0,
    minutes: thing.maxPlaytime ?? thing.minPlaytime ?? 0,
    weight: thing.averageWeight ?? 0,
    rating: thing.average ?? 0,
    categories: extractCategories(thing),
    owners: thing.owners.map((o) => o.bggUsername),
    addedAt: thing.lastPlayedAt || '',
    description: thing.description,
    lastPlayedAt: thing.lastPlayedAt,
  }
}

// Map GqlNightSession → Session
export function toSession(session: GqlNightSession): Session {
  const dt = session.scheduledAt ? new Date(session.scheduledAt) : null
  return {
    id: session.id,
    title: session.title,
    date: dt
      ? dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : 'TBD',
    time: dt ? dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
    location: session.location || 'TBD',
    state: session.state as Session['state'],
    rsvps: session.attendances.map((a) => ({
      memberId: a.user.id,
      status: a.response as Session['rsvps'][number]['status'],
    })),
    gameId: session.pickedGame?.objectid,
  }
}

// Map GqlGroup → Group
export function toGroup(group: GqlGroup): Group {
  const sortedSessions = [...group.sessions].sort((a, b) => {
    const da = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
    const db = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
    return da - db
  })
  const now = Date.now()
  const nextSession = sortedSessions.find(
    (s) => s.scheduledAt && new Date(s.scheduledAt).getTime() > now,
  )

  return {
    id: group.id,
    token: group.inviteCode || group.id,
    name: group.name,
    emoji: '🎲',
    description: group.description || '',
    memberIds: group.members.map((m) => m.id),
    mergedCount: group.collectionTotalCount,
    lastSession: (() => {
      const last = (group.pastSessions ?? [])[0]
      return last?.scheduledAt ? timeAgo(new Date(last.scheduledAt)) : 'Never'
    })(),
    nextSession: nextSession?.scheduledAt
      ? new Date(nextSession.scheduledAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : undefined,
  }
}

/** Map GqlSuggestion from the GraphQL API to the simpler Suggestion shape used by UI components. */
export function toSuggestion(
  s: GqlSuggestion,
  attendeeCount: number,
): Suggestion {
  return {
    gameId: s.thing.objectid,
    match: Math.round(s.score * 100),
    votes: attendeeCount,
    reasons: [
      ...(s.breakdown.playerCountFit > 0
        ? [{ ok: true, label: 'Fits player count' }]
        : [{ ok: false, label: "Doesn't fit player count" }]),
      ...(s.breakdown.timeFit > 0
        ? [{ ok: true, label: 'Fits time budget' }]
        : [{ ok: false, label: 'Exceeds time budget' }]),
      ...(s.reasons.map((r) => ({ ok: true, label: r }))),
    ],
  }
}

/** Map GqlGroupSpotlightThing to the minimal Game shape for spotlight display. */
export function toSpotlightGame(
  item: GqlGroupSpotlightThing,
): Pick<Game, 'id' | 'title' | 'cover' | 'rating' | 'owners'> {
  return {
    id: item.objectid,
    title: item.name,
    cover: item.thumbnail || '',
    rating: item.average ?? 0,
    owners: item.owners.map((o) => o.bggUsername),
  }
}

// --- Helpers ---

const COLOR_PALETTE = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
] as const

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

function extractCategories(_thing: GqlMergedThing): string[] {
  // Categories are not directly in the GraphQL schema yet.
  // TODO: Add categories / mechanics fields to MergedThing on the server.
  return []
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}
