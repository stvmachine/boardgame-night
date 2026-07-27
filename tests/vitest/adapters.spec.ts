import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toMember,
  toGame,
  toSession,
  toGroup,
  toSuggestion,
  timeAgo,
} from '@/lib/graphql/adapters'
import type {
  GqlUser,
  GqlMergedThing,
  GqlNightSession,
  GqlGroup,
  GqlSuggestion,
} from '@/lib/graphql/types'

const makeUser = (overrides: Partial<GqlUser> = {}): GqlUser => ({
  id: 'user-1',
  username: 'alex',
  email: 'alex@test.com',
  bggUsername: 'alex123',
  avatar: null,
  isProvisional: false,
  displayName: 'Alex Rivera',
  syncStatus: {
    username: 'alex',
    status: 'READY',
    error: null,
    gameCount: 100,
    lastSyncedAt: '2026-07-26T12:00:00Z',
  },
  ...overrides,
})

const makeThing = (overrides: Partial<GqlMergedThing> = {}): GqlMergedThing => ({
  id: 'thing-1',
  objectid: 'feathered-realms',
  name: 'Feathered Realms',
  yearPublished: 2024,
  minPlayers: 1,
  maxPlayers: 5,
  minPlaytime: 45,
  maxPlaytime: 60,
  minAge: 8,
  image: 'https://example.com/image.jpg',
  thumbnail: 'https://example.com/thumb.jpg',
  description: 'A game about birds',
  average: 8.1,
  bayesAverage: 7.9,
  usersRated: 1200,
  averageWeight: 2.4,
  isExpansion: false,
  bestPlayerCount: 4,
  lastPlayedAt: '2026-07-18',
  polls: [],
  owners: [
    { bggUsername: 'alex123', avatar: null },
    { bggUsername: 'samplays', avatar: null },
  ],
  ...overrides,
})

const makeSession = (
  overrides: Partial<GqlNightSession> = {},
): GqlNightSession => ({
  id: 'session-1',
  title: 'Friday Night Battle',
  description: null,
  state: 'INVITED',
  host: makeUser(),
  group: { id: 'group-1', name: 'Strategy Crew' },
  scheduledAt: '2026-07-31T19:00:00Z',
  location: "Alex's Place",
  capacity: 5,
  attendances: [
    {
      id: 'att-1',
      user: makeUser({ id: 'user-1', displayName: 'Alex Rivera' }),
      response: 'going',
      respondedAt: '2026-07-25T10:00:00Z',
    },
    {
      id: 'att-2',
      user: makeUser({
        id: 'user-2',
        username: 'sam',
        displayName: 'Sam Okafor',
      }),
      response: 'going',
      respondedAt: '2026-07-26T08:00:00Z',
    },
  ],
  attendeeCount: 2,
  pickedGame: null,
  previousState: null,
  timeBudgetMinutes: 90,
  complexityPreference: 'medium',
  suggestions: null,
  ...overrides,
})

const makeGroup = (overrides: Partial<GqlGroup> = {}): GqlGroup => ({
  id: 'group-1',
  name: 'Strategy Crew',
  description: 'Weekly game night',
  inviteCode: 'abc123',
  owner: makeUser(),
  members: [
    makeUser({ id: 'user-1', username: 'alex' }),
    makeUser({ id: 'user-2', username: 'sam' }),
  ],
  memberships: [
    { id: 'ms-1', user: makeUser({ id: 'user-1' }), group: { id: 'group-1' }, role: 'OWNER' },
    { id: 'ms-2', user: makeUser({ id: 'user-2' }), group: { id: 'group-1' }, role: 'MEMBER' },
  ],
  myRole: 'OWNER',
  collection: {
    items: [],
    syncStatuses: [],
  },
  collectionTotalCount: 89,
  collectionSpotlight: [],
  sessions: [
    makeSession({ id: 's1', scheduledAt: '2026-08-01T19:00:00Z' }),
    makeSession({ id: 's2', scheduledAt: '2026-07-15T19:00:00Z' }),
  ],
  pastSessions: [makeSession({ id: 's-past', scheduledAt: '2026-07-15T19:00:00Z' })],
  ...overrides,
})

const makeSuggestion = (
  overrides: Partial<GqlSuggestion> = {},
): GqlSuggestion => ({
  thing: makeThing(),
  score: 0.94,
  confidence: 'HIGH',
  reasons: ['Fits 4 confirmed players', 'Runs 60 min'],
  breakdown: {
    playerCountFit: 4,
    timeFit: 30,
    complexityFit: 3,
    communityRating: 8.1,
    ownershipBonus: 3,
  },
  ...overrides,
})

describe('toMember', () => {
  it('maps GqlUser to Member', () => {
    const user = makeUser()
    const result = toMember(user)

    expect(result).toEqual({
      id: 'user-1',
      name: 'Alex Rivera',
      bgg: 'alex123',
      color: expect.any(String),
      online: true,
    })
  })

  it('uses empty string for bgg when bggUsername is missing', () => {
    const user = makeUser({ bggUsername: null })
    const result = toMember(user)
    expect(result.bgg).toBe('')
  })

  it('generates a stable color from username', () => {
    const user1 = makeUser({ username: 'alex' })
    const user2 = makeUser({ username: 'alex' })
    const user3 = makeUser({ username: 'different' })

    expect(toMember(user1).color).toBe(toMember(user2).color)
    // Different usernames likely produce different colors
    // (palette has 10 entries so collisions possible; just verify it's a non-empty string)
    expect(toMember(user3).color).toBeTruthy()
  })
})

describe('toGame', () => {
  it('maps GqlMergedThing to Game', () => {
    const thing = makeThing()
    const result = toGame(thing)

    expect(result).toEqual({
      id: 'feathered-realms',
      title: 'Feathered Realms',
      cover: 'https://example.com/thumb.jpg',
      minPlayers: 1,
      maxPlayers: 5,
      bestAt: 4,
      minutes: 60,
      weight: 2.4,
      rating: 8.1,
      categories: [],
      owners: ['alex123', 'samplays'],
      addedAt: '2026-07-18',
    })
  })

  it('falls back to image when thumbnail is null', () => {
    const thing = makeThing({ thumbnail: null, image: 'https://example.com/image.jpg' })
    const result = toGame(thing)
    expect(result.cover).toBe('https://example.com/image.jpg')
  })

  it('uses empty string when both image and thumbnail are null', () => {
    const thing = makeThing({ thumbnail: null, image: null })
    const result = toGame(thing)
    expect(result.cover).toBe('')
  })

  it('handles null numeric fields with defaults', () => {
    const thing = makeThing({
      minPlayers: null,
      maxPlayers: null,
      minPlaytime: null,
      maxPlaytime: null,
      averageWeight: null,
      average: null,
    })
    const result = toGame(thing)

    expect(result.minPlayers).toBe(0)
    expect(result.maxPlayers).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.weight).toBe(0)
    expect(result.rating).toBe(0)
  })

  it('uses maxPlaytime for minutes when available', () => {
    const thing = makeThing({ minPlaytime: 30, maxPlaytime: 90 })
    const result = toGame(thing)
    expect(result.minutes).toBe(90)
  })

  it('falls back to minPlaytime when maxPlaytime is null', () => {
    const thing = makeThing({ minPlaytime: 45, maxPlaytime: null })
    const result = toGame(thing)
    expect(result.minutes).toBe(45)
  })
})

describe('toSession', () => {
  beforeEach(() => {
    // Use a fixed "now" for locale-sensitive tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps GqlNightSession to Session', () => {
    const session = makeSession()
    const result = toSession(session)

    expect(result).toMatchObject({
      id: 'session-1',
      title: 'Friday Night Battle',
      location: "Alex's Place",
      state: 'INVITED',
      gameId: undefined,
    })
    expect(typeof result.date).toBe('string')
    expect(result.date).not.toBe('')
    expect(typeof result.time).toBe('string')
    expect(result.rsvps).toHaveLength(2)
    expect(result.rsvps[0]).toEqual({ memberId: 'user-1', status: 'going' })
    expect(result.rsvps[1]).toEqual({ memberId: 'user-2', status: 'going' })
  })

  it('returns TBD for date when scheduledAt is null', () => {
    const session = makeSession({ scheduledAt: null })
    const result = toSession(session)
    expect(result.date).toBe('TBD')
    expect(result.time).toBe('')
  })

  it('returns TBD for location when location is null', () => {
    const session = makeSession({ location: null })
    const result = toSession(session)
    expect(result.location).toBe('TBD')
  })

  it('extracts gameId from pickedGame', () => {
    const session = makeSession({
      pickedGame: makeThing({ objectid: 'azulejo' }),
    })
    const result = toSession(session)
    expect(result.gameId).toBe('azulejo')
  })

  it('handles empty attendances', () => {
    const session = makeSession({ attendances: [] })
    const result = toSession(session)
    expect(result.rsvps).toEqual([])
  })
})

describe('toGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps GqlGroup to Group', () => {
    const group = makeGroup()
    const result = toGroup(group)

    expect(result).toMatchObject({
      id: 'group-1',
      token: 'abc123',
      name: 'Strategy Crew',
      emoji: '🎲',
      description: 'Weekly game night',
      memberIds: ['user-1', 'user-2'],
      mergedCount: 89,
    })
    expect(typeof result.lastSession).toBe('string')
  })

  it('falls back to group.id for token when inviteCode is null', () => {
    const group = makeGroup({ inviteCode: null })
    const result = toGroup(group)
    expect(result.token).toBe('group-1')
  })

  it('uses empty string for description when null', () => {
    const group = makeGroup({ description: null })
    const result = toGroup(group)
    expect(result.description).toBe('')
  })

  it('sets lastSession using timeAgo from first pastSession', () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const group = makeGroup({
      pastSessions: [makeSession({ id: 's-past', scheduledAt: past })],
    })
    const result = toGroup(group)
    expect(result.lastSession).toContain('d ago')
  })

  it('sets lastSession to "Never" when no past sessions', () => {
    const group = makeGroup({ pastSessions: [] })
    const result = toGroup(group)
    expect(result.lastSession).toBe('Never')
  })

  it('sets nextSession when a future session exists', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    const group = makeGroup({
      sessions: [makeSession({ id: 's-future', scheduledAt: future.toISOString() })],
    })
    const result = toGroup(group)
    expect(result.nextSession).toBeDefined()
  })

  it('does not set nextSession when no future session exists', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const group = makeGroup({
      sessions: [makeSession({ id: 's-past', scheduledAt: past.toISOString() })],
      pastSessions: [makeSession({ id: 's-past', scheduledAt: past.toISOString() })],
    })
    const result = toGroup(group)
    expect(result.nextSession).toBeUndefined()
  })

  it('handles empty sessions list', () => {
    const group = makeGroup({ sessions: [], pastSessions: [] })
    const result = toGroup(group)
    expect(result.lastSession).toBe('Never')
    expect(result.nextSession).toBeUndefined()
  })
})

describe('toSuggestion', () => {
  it('maps GqlSuggestion to Suggestion', () => {
    const suggestion = makeSuggestion()
    const result = toSuggestion(suggestion, 4)

    expect(result).toEqual({
      gameId: 'feathered-realms',
      match: 94,
      votes: 4,
      reasons: expect.arrayContaining([
        { ok: true, label: 'Fits player count' },
        { ok: true, label: 'Fits time budget' },
        { ok: true, label: 'Fits 4 confirmed players' },
        { ok: true, label: 'Runs 60 min' },
      ]),
    })
    expect(result.reasons).toHaveLength(4)
  })

  it('includes negative reasons when breakdown values are 0', () => {
    const suggestion = makeSuggestion({
      breakdown: { playerCountFit: 0, timeFit: 0, complexityFit: 0, communityRating: 0, ownershipBonus: 0 },
      reasons: [],
    })
    const result = toSuggestion(suggestion, 3)

    expect(result.reasons).toContainEqual({ ok: false, label: "Doesn't fit player count" })
    expect(result.reasons).toContainEqual({ ok: false, label: 'Exceeds time budget' })
  })

  it('rounds score to integer match percentage', () => {
    const suggestion = makeSuggestion({ score: 0.856 })
    const result = toSuggestion(suggestion, 2)
    expect(result.match).toBe(86)
  })

  it('handles zero attendee count for votes', () => {
    const suggestion = makeSuggestion()
    const result = toSuggestion(suggestion, 0)
    expect(result.votes).toBe(0)
  })
})

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for dates less than 60 seconds ago', () => {
    const date = new Date(Date.now() - 30 * 1000)
    expect(timeAgo(date)).toBe('just now')
  })

  it('returns "Xm ago" for minutes', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(timeAgo(date)).toBe('5m ago')
  })

  it('returns "Xh ago" for hours', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(timeAgo(date)).toBe('3h ago')
  })

  it('returns "Xd ago" for days', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(timeAgo(date)).toBe('2d ago')
  })

  it('returns "Xw ago" for weeks', () => {
    const date = new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000)
    expect(timeAgo(date)).toBe('3w ago')
  })

  it('handles near-future dates as "just now"', () => {
    // A date 60 seconds in the future: difference is -60 seconds
    // Math.floor(-0.06) = -1 which is < 60, so it returns "just now"
    const date = new Date(Date.now() + 60 * 1000)
    expect(timeAgo(date)).toBe('just now')
  })
})
