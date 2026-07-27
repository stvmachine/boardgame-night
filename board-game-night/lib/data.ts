export type Member = {
  id: string
  name: string
  bgg: string
  color: string
  online?: boolean
}

export type Game = {
  id: string
  title: string
  cover: string
  minPlayers: number
  maxPlayers: number
  bestAt: number
  minutes: number
  weight: number // 1-5 complexity
  rating: number
  categories: string[]
  owners: string[] // member ids
  addedAt: string
}

export type RsvpStatus = 'going' | 'maybe' | 'none' | 'no'

export type Rsvp = { memberId: string; status: RsvpStatus }

export type SessionState =
  | 'DRAFT'
  | 'INVITED'
  | 'PICKING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type Session = {
  id: string
  title: string
  date: string
  time: string
  location: string
  state: SessionState
  rsvps: Rsvp[]
  gameId?: string
  winnerId?: string
}

export const members: Member[] = [
  { id: 'alex', name: 'Alex Rivera', bgg: 'alex123', color: '#6366f1', online: true },
  { id: 'sam', name: 'Sam Okafor', bgg: 'samplays', color: '#2dd4bf', online: true },
  { id: 'jordan', name: 'Jordan Lee', bgg: 'jordbg', color: '#fb7185' },
  { id: 'riley', name: 'Riley Chen', bgg: 'rileyb', color: '#f59e0b', online: true },
  { id: 'casey', name: 'Casey Moss', bgg: 'casey_m', color: '#22c55e' },
]

export const memberById = (id: string) => members.find((m) => m.id === id)

export const games: Game[] = [
  {
    id: 'feathered-realms',
    title: 'Feathered Realms',
    cover: '/covers/feathered-realms.png',
    minPlayers: 1,
    maxPlayers: 5,
    bestAt: 4,
    minutes: 60,
    weight: 2.4,
    rating: 8.1,
    categories: ['Strategy', 'Engine Building', 'Nature'],
    owners: ['alex', 'sam', 'jordan'],
    addedAt: '2026-07-18',
  },
  {
    id: 'rail-and-ruin',
    title: 'Rail & Ruin',
    cover: '/covers/rail-and-ruin.png',
    minPlayers: 2,
    maxPlayers: 5,
    bestAt: 4,
    minutes: 45,
    weight: 1.8,
    rating: 7.6,
    categories: ['Family', 'Route Building'],
    owners: ['sam', 'riley', 'casey', 'alex'],
    addedAt: '2026-07-14',
  },
  {
    id: 'azulejo',
    title: 'Azulejo',
    cover: '/covers/azulejo.png',
    minPlayers: 2,
    maxPlayers: 4,
    bestAt: 3,
    minutes: 30,
    weight: 1.7,
    rating: 7.8,
    categories: ['Abstract', 'Family'],
    owners: ['jordan', 'riley', 'casey', 'sam'],
    addedAt: '2026-07-11',
  },
  {
    id: 'harbor-guild',
    title: 'Harbor Guild',
    cover: '/covers/harbor-guild.png',
    minPlayers: 2,
    maxPlayers: 4,
    bestAt: 4,
    minutes: 90,
    weight: 3.6,
    rating: 8.4,
    categories: ['Strategy', 'Economic', 'Worker Placement'],
    owners: ['alex'],
    addedAt: '2026-07-02',
  },
  {
    id: 'moonlit-heist',
    title: 'Moonlit Heist',
    cover: '/covers/moonlit-heist.png',
    minPlayers: 3,
    maxPlayers: 8,
    bestAt: 6,
    minutes: 40,
    weight: 1.5,
    rating: 7.2,
    categories: ['Party', 'Hidden Roles', 'Deduction'],
    owners: ['casey', 'jordan'],
    addedAt: '2026-06-28',
  },
  {
    id: 'terra-bloom',
    title: 'Terra Bloom',
    cover: '/covers/terra-bloom.png',
    minPlayers: 1,
    maxPlayers: 5,
    bestAt: 3,
    minutes: 120,
    weight: 4.2,
    rating: 8.6,
    categories: ['Strategy', 'Sci-Fi', 'Card Drafting'],
    owners: ['sam', 'alex'],
    addedAt: '2026-06-21',
  },
  {
    id: 'cat-cafe',
    title: 'Cat Cafe Co.',
    cover: '/covers/cat-cafe.png',
    minPlayers: 2,
    maxPlayers: 6,
    bestAt: 4,
    minutes: 25,
    weight: 1.2,
    rating: 7.0,
    categories: ['Family', 'Tile Laying'],
    owners: ['riley'],
    addedAt: '2026-06-19',
  },
  {
    id: 'dungeon-delve',
    title: 'Dungeon Delve',
    cover: '/covers/dungeon-delve.png',
    minPlayers: 1,
    maxPlayers: 4,
    bestAt: 4,
    minutes: 150,
    weight: 4.6,
    rating: 8.2,
    categories: ['Adventure', 'Co-op', 'Campaign'],
    owners: ['jordan', 'alex'],
    addedAt: '2026-06-12',
  },
  {
    id: 'word-forge',
    title: 'Word Forge',
    cover: '/covers/word-forge.png',
    minPlayers: 2,
    maxPlayers: 8,
    bestAt: 5,
    minutes: 20,
    weight: 1.1,
    rating: 6.8,
    categories: ['Party', 'Word Game'],
    owners: ['casey', 'sam', 'riley'],
    addedAt: '2026-06-04',
  },
  {
    id: 'spice-route',
    title: 'Spice Route',
    cover: '/covers/spice-route.png',
    minPlayers: 2,
    maxPlayers: 4,
    bestAt: 2,
    minutes: 45,
    weight: 2.6,
    rating: 7.9,
    categories: ['Strategy', 'Trading', 'Hand Management'],
    owners: ['alex', 'riley'],
    addedAt: '2026-05-30',
  },
  {
    id: 'deep-signal',
    title: 'Deep Signal',
    cover: '/covers/deep-signal.png',
    minPlayers: 1,
    maxPlayers: 6,
    bestAt: 4,
    minutes: 75,
    weight: 3.1,
    rating: 8.0,
    categories: ['Co-op', 'Sci-Fi', 'Push Your Luck'],
    owners: ['sam', 'jordan', 'casey'],
    addedAt: '2026-05-22',
  },
  {
    id: 'castle-keep',
    title: 'Castle Keep',
    cover: '/covers/castle-keep.png',
    minPlayers: 2,
    maxPlayers: 5,
    bestAt: 4,
    minutes: 60,
    weight: 2.9,
    rating: 7.7,
    categories: ['Strategy', 'Dice', 'Medieval'],
    owners: ['riley', 'alex', 'casey'],
    addedAt: '2026-05-15',
  },
]

export const gameById = (id?: string) => games.find((g) => g.id === id)

export const allCategories = Array.from(
  games.reduce((map, game) => {
    for (const c of game.categories) map.set(c, (map.get(c) ?? 0) + 1)
    return map
  }, new Map<string, number>()),
)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

export type Group = {
  id: string
  token: string
  name: string
  emoji: string
  description: string
  memberIds: string[]
  mergedCount: number
  lastSession: string
  nextSession?: string
}

export const groups: Group[] = [
  {
    id: 'strategy-crew',
    token: 'abc123',
    name: 'Strategy Crew',
    emoji: '♜',
    description: 'Our weekly game night. Heavy euros welcome, snacks mandatory.',
    memberIds: ['alex', 'sam', 'jordan', 'riley', 'casey'],
    mergedCount: 89,
    lastSession: '3 days ago',
    nextSession: 'Friday 7:00 PM',
  },
  {
    id: 'thursday-party',
    token: 'def456',
    name: 'Thursday Party Games',
    emoji: '★',
    description: 'Loud, fast, and a little chaotic. Nothing over 45 minutes.',
    memberIds: ['casey', 'riley', 'sam'],
    mergedCount: 41,
    lastSession: '1 week ago',
  },
  {
    id: 'campaign-club',
    token: 'ghi789',
    name: 'Campaign Club',
    emoji: '⚔',
    description: 'One long campaign at a time. Currently 14 sessions deep.',
    memberIds: ['jordan', 'alex', 'sam', 'casey'],
    mergedCount: 27,
    lastSession: 'Yesterday',
    nextSession: 'Sunday 2:00 PM',
  },
]

export const groupByToken = (token: string) =>
  groups.find((g) => g.token === token) ?? groups[0]

export const sessions: Session[] = [
  {
    id: 'fri-battle',
    title: 'Friday Night Battle',
    date: 'Jul 31, 2026',
    time: '7:00 PM',
    location: "Alex's Place",
    state: 'INVITED',
    rsvps: [
      { memberId: 'alex', status: 'going' },
      { memberId: 'sam', status: 'going' },
      { memberId: 'jordan', status: 'maybe' },
      { memberId: 'riley', status: 'none' },
      { memberId: 'casey', status: 'going' },
    ],
  },
  {
    id: 'heavy-sunday',
    title: 'Heavy Euro Sunday',
    date: 'Aug 9, 2026',
    time: '2:00 PM',
    location: "Sam's Loft",
    state: 'DRAFT',
    rsvps: members.map((m) => ({ memberId: m.id, status: 'none' as RsvpStatus })),
  },
  {
    id: 'midweek-quickies',
    title: 'Midweek Quickies',
    date: 'Jul 22, 2026',
    time: '8:00 PM',
    location: "Casey's Kitchen",
    state: 'COMPLETED',
    gameId: 'azulejo',
    winnerId: 'riley',
    rsvps: [
      { memberId: 'riley', status: 'going' },
      { memberId: 'casey', status: 'going' },
      { memberId: 'sam', status: 'going' },
      { memberId: 'alex', status: 'no' },
      { memberId: 'jordan', status: 'going' },
    ],
  },
  {
    id: 'delve-night',
    title: 'Dungeon Delve — Chapter 4',
    date: 'Jul 15, 2026',
    time: '7:30 PM',
    location: "Jordan's Basement",
    state: 'COMPLETED',
    gameId: 'dungeon-delve',
    winnerId: 'jordan',
    rsvps: [
      { memberId: 'jordan', status: 'going' },
      { memberId: 'alex', status: 'going' },
      { memberId: 'sam', status: 'going' },
      { memberId: 'casey', status: 'going' },
      { memberId: 'riley', status: 'no' },
    ],
  },
]

export const sessionById = (id: string) => sessions.find((s) => s.id === id) ?? sessions[0]

export type Suggestion = {
  gameId: string
  match: number
  votes: number
  reasons: { ok: boolean; label: string }[]
}

export const suggestions: Suggestion[] = [
  {
    gameId: 'feathered-realms',
    match: 94,
    votes: 3,
    reasons: [
      { ok: true, label: 'Fits 4 confirmed players' },
      { ok: true, label: 'Runs 60 min — under the 90 min limit' },
      { ok: true, label: 'Owned by 3 of 4 attendees' },
      { ok: true, label: 'Best at 4 players — exactly tonight' },
    ],
  },
  {
    gameId: 'castle-keep',
    match: 86,
    votes: 2,
    reasons: [
      { ok: true, label: 'Fits 4 confirmed players' },
      { ok: true, label: 'Runs 60 min' },
      { ok: true, label: 'Owned by 3 of 4 attendees' },
      { ok: false, label: 'Riley rated it 6.2 — lowest in the group' },
    ],
  },
  {
    gameId: 'azulejo',
    match: 78,
    votes: 1,
    reasons: [
      { ok: true, label: 'Fits 4 confirmed players' },
      { ok: true, label: 'Runs 30 min — room for a second game' },
      { ok: false, label: 'Played 6 days ago' },
    ],
  },
  {
    gameId: 'deep-signal',
    match: 71,
    votes: 0,
    reasons: [
      { ok: true, label: 'Fits 4 confirmed players' },
      { ok: true, label: 'Owned by 3 of 4 attendees' },
      { ok: false, label: '75 min plus 15 min teach for Casey' },
    ],
  },
]

export const scoreboard = [
  { memberId: 'alex', rounds: [12, 18, 6], total: 36 },
  { memberId: 'sam', rounds: [15, 14, 7], total: 36 },
  { memberId: 'jordan', rounds: [8, 22, 14], total: 44 },
  { memberId: 'casey', rounds: [11, 16, 5], total: 32 },
]

export const stats = {
  gamesMerged: '12,400',
  sessionsHosted: '3,200',
  activeGroups: '847',
}

export const testimonials = [
  {
    quote:
      'We used to burn 40 minutes arguing about what to play. Now the app tells us what four of us can actually start in the next ten minutes.',
    name: 'Priya Raman',
    group: 'The Meeple Mafia',
    stat: 'Group of 5 · 47 games merged',
  },
  {
    quote:
      'The merged shelf is the killer feature. I finally know who owns the copy we should bring — and we stopped buying duplicates.',
    name: 'Tom Vasquez',
    group: 'Basement Dwellers',
    stat: 'Group of 7 · 132 games merged',
  },
  {
    quote:
      'RSVP nudges alone saved our Thursday night. Everyone answers now because the reminder does the nagging instead of me.',
    name: 'Mei Lin',
    group: 'Thursday Table',
    stat: 'Group of 4 · 61 games merged',
  },
]
