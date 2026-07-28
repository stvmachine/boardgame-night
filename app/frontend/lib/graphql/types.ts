// Core types matching the Rails GraphQL schema (schema.graphql)

export interface GqlUserSyncStatus {
  username: string
  status: 'QUEUED' | 'SYNCING' | 'READY' | 'ERROR'
  error: string | null
  gameCount: number | null
  lastSyncedAt: string | null
}

export interface GqlUser {
  id: string
  username: string
  email: string | null
  bggUsername: string | null
  avatar: string | null
  isProvisional: boolean
  displayName: string
  syncStatus: GqlUserSyncStatus
}

export interface GqlOwner {
  bggUsername: string
  avatar: string | null
}

export interface GqlPollResult {
  id: string
  value: string
  playerCount: number | null
  numVotes: number
}

export interface GqlPoll {
  id: string
  name: string
  title: string | null
  totalVotes: number | null
  results: GqlPollResult[]
}

export interface GqlMergedThing {
  id: string
  objectid: string
  name: string
  yearPublished: number | null
  minPlayers: number | null
  maxPlayers: number | null
  minPlaytime: number | null
  maxPlaytime: number | null
  minAge: number | null
  image: string | null
  thumbnail: string | null
  description: string | null
  average: number | null
  bayesAverage: number | null
  usersRated: number | null
  averageWeight: number | null
  isExpansion: boolean
  bestPlayerCount: number | null
  lastPlayedAt: string | null
  polls: GqlPoll[]
  owners: GqlOwner[]
}

export interface GqlMergedCollection {
  items: GqlMergedThing[]
  syncStatuses: GqlUserSyncStatus[]
}

export interface GqlGroupSpotlightThing {
  id: string
  objectid: string
  name: string
  thumbnail: string | null
  average: number | null
  owners: GqlOwner[]
}

export interface GqlGroupMembership {
  id: string
  user: GqlUser
  group: { id: string }
  role: 'MEMBER' | 'ADMIN' | 'OWNER'
}

export interface GqlGroup {
  id: string
  name: string
  description: string | null
  inviteCode: string | null
  owner: GqlUser
  members: GqlUser[]
  memberships: GqlGroupMembership[]
  myRole: 'MEMBER' | 'ADMIN' | 'OWNER' | null
  collection: GqlMergedCollection
  collectionTotalCount: number
  collectionSpotlight: GqlGroupSpotlightThing[]
  sessions: GqlNightSession[]
  pastSessions: GqlNightSession[]
}

export interface GqlAttendance {
  id: string
  user: GqlUser
  response: string
  respondedAt: string | null
}

export interface GqlScore {
  id: string
  score: number
  rank: number | null
  user: { id: string; displayName: string; avatar: string | null }
}

export interface GqlSuggestionBreakdown {
  playerCountFit: number
  timeFit: number
  complexityFit: number
  communityRating: number
  ownershipBonus: number
}

export interface GqlSuggestion {
  thing: GqlMergedThing
  score: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  reasons: string[]
  breakdown: GqlSuggestionBreakdown
}

export interface GqlNightSession {
  id: string
  title: string
  description: string | null
  state: 'DRAFT' | 'INVITED' | 'PICKING' | 'COMPLETED' | 'CANCELLED'
  host: GqlUser
  group: { id: string; name: string }
  scheduledAt: string | null
  location: string | null
  capacity: number | null
  attendances: GqlAttendance[]
  attendeeCount: number
  pickedGame: GqlMergedThing | null
  previousState: string | null
  timeBudgetMinutes: number
  complexityPreference: string
  suggestions: GqlSuggestion[] | null
  scores: GqlScore[]
}

export interface GqlDashboardStats {
  collectionCount: number
  groupCount: number
  sessionCount: number
}

export interface GqlHotItem {
  id: string
  rank: number
  name: string
  yearPublished: number | null
  thumbnail: string | null
  average: number | null
  averageWeight: number | null
  minPlayers: number | null
  maxPlayers: number | null
  minPlaytime: number | null
  maxPlaytime: number | null
}

export interface GqlSearchResult {
  id: string
  name: string
  yearPublished: number | null
}

export interface GqlValidationResult {
  valid: boolean
  exists: boolean
  username: string
  avatar: string | null
}

export interface GqlSessionInvite {
  id: string
  email: string
  expiresAt: string
  status: string
  token: string | null
  role: 'MEMBER' | 'ADMIN' | 'OWNER' | null
  group: { id: string; name: string }
  session: GqlNightSession | null
}

// Mutation payload types

export interface SignInPayload {
  token: string
  user: GqlUser
}

export interface SignUpPayload {
  token: string
  user: GqlUser
}

export interface SignOutPayload {
  success: boolean
}

export interface BindBggUsernamePayload {
  user: GqlUser
}

export interface CreateGroupPayload {
  group: GqlGroup
}

export interface CreateNightSessionPayload {
  session: GqlNightSession
}

export interface ImportCollectionPayload {
  user: GqlUser
}

export interface RsvpPayload {
  attendance: GqlAttendance
  session: GqlNightSession
}

export interface PickGamePayload {
  session: GqlNightSession
}

export interface StartPickingPayload {
  session: GqlNightSession
}

export interface ScheduleSessionPayload {
  session: GqlNightSession
  invitesSent: number
}

export interface CancelSessionPayload {
  session: GqlNightSession
}

export interface ReopenSessionPayload {
  session: GqlNightSession
}

export interface AcceptGroupInvitePayload {
  group: GqlGroup
}

export interface InviteToGroupPayload {
  inviteToken: GqlSessionInvite
}

export interface UpdateSessionDetailsPayload {
  session: GqlNightSession
}

export interface UpdateSessionPreferencesPayload {
  session: GqlNightSession
}

export interface ValidateBggUsernamePayload {
  validationResult: GqlValidationResult
}

export interface RemoveGroupMemberPayload {
  success: boolean
  removedMembershipId: string | null
}

export interface UpdateGroupMemberRolePayload {
  membership: GqlGroupMembership
}

export interface UpgradeToAccountPayload {
  token: string
  user: GqlUser
}

export interface CollectionSyncedPayload {
  username: string
  status: 'QUEUED' | 'SYNCING' | 'READY' | 'ERROR'
  error: string | null
  gameCount: number | null
  lastSyncedAt: string | null
}

// --- BGG Play History Types ---

export interface GqlPlayPlayer {
  id: string
  username: string
  name: string | null
  score: number | null
  win: boolean
}

export interface GqlPlay {
  id: string
  date: string
  quantity: number
  bggGameObjectid: number
  bggPlayId: number
  gameName: string | null
  lengthMinutes: number
  incomplete: boolean
  nowInStats: boolean
  location: string | null
  comments: string | null
  playerCount: number
  winnersCount: number
  user: { id: string; displayName: string; avatar: string | null }
  players: GqlPlayPlayer[]
}

export interface ImportPlaysPayload {
  success: boolean
  message: string
}
