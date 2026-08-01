/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ConfidenceLevel =
  /** 50 or more votes at the target player count */
  | 'HIGH'
  /** Fewer than 20 votes, or the range-midpoint fallback is in use */
  | 'LOW'
  /** 20–49 votes at the target player count */
  | 'MEDIUM';

export type GroupRole =
  /** Group administrator */
  | 'ADMIN'
  /** Regular group member */
  | 'MEMBER'
  /** Group owner with full control */
  | 'OWNER';

export type ScoreInput = {
  /** Rank (1st, 2nd, 3rd, etc.) */
  rank?: number | null | undefined;
  /** Score value */
  score: number;
  /** ID of the user */
  userId: string | number;
};

export type SessionState =
  /** Session was cancelled and can be reopened */
  | 'CANCELLED'
  /** Game picked and session finalized */
  | 'COMPLETED'
  /** Session is being edited */
  | 'DRAFT'
  /** Invitations sent, RSVPs open */
  | 'INVITED'
  /** Host is picking a game */
  | 'PICKING';

export type SyncStatus =
  /** Import failed */
  | 'ERROR'
  /** Import is queued and waiting to start */
  | 'QUEUED'
  /** Import completed successfully */
  | 'READY'
  /** Import is in progress */
  | 'SYNCING';

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { currentUser: { id: string, username: string | null, email: string | null, bggUsername: string | null, displayName: string, avatar: string | null, isProvisional: boolean, syncStatus: { username: string, status: SyncStatus, error: string | null, gameCount: number | null, lastSyncedAt: unknown } } | null };

export type DashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardStatsQuery = { dashboardStats: { collectionCount: number, groupCount: number, sessionCount: number } | null };

export type MyGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyGroupsQuery = { myGroups: Array<{ id: string, name: string, description: string | null, inviteCode: string | null, collectionTotalCount: number, members: Array<{ id: string, displayName: string, avatar: string | null }>, sessions: Array<{ id: string, title: string, state: SessionState, scheduledAt: unknown }> }> };

export type GetGroupQueryVariables = Exact<{
  token: string;
}>;


export type GetGroupQuery = { group: { id: string, name: string, description: string | null, inviteCode: string | null, anonymousBggUsernames: Array<string>, myRole: GroupRole | null, collectionTotalCount: number, owner: { id: string, displayName: string, avatar: string | null } | null, members: Array<{ id: string, displayName: string, bggUsername: string | null, avatar: string | null, isProvisional: boolean }>, memberships: Array<{ id: string, role: GroupRole, user: { id: string } }>, sessions: Array<{ id: string, title: string, state: SessionState, scheduledAt: unknown, location: string | null, attendeeCount: number }>, pastSessions: Array<{ id: string, title: string, state: SessionState, scheduledAt: unknown, location: string | null, pickedGame: { name: string, thumbnail: string | null } | null }>, collectionSpotlight: Array<{ id: string, objectid: string, name: string, thumbnail: string | null, average: number | null, owners: Array<{ bggUsername: string }> }> } | null };

export type GetNightSessionQueryVariables = Exact<{
  id: string | number;
}>;


export type GetNightSessionQuery = { nightSession: { id: string, title: string, description: string | null, state: SessionState, scheduledAt: unknown, location: string | null, capacity: number | null, timeBudgetMinutes: number, complexityPreference: string, attendeeCount: number, host: { id: string, displayName: string, avatar: string | null }, group: { id: string, name: string }, attendances: Array<{ id: string, response: string, respondedAt: unknown, user: { id: string, displayName: string, avatar: string | null, bggUsername: string | null } }>, pickedGame: { id: string, objectid: string, name: string, thumbnail: string | null, average: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, averageWeight: number | null, bestPlayerCount: number | null } | null, suggestions: Array<{ score: number, confidence: ConfidenceLevel, reasons: Array<string>, breakdown: { playerCountFit: number, timeFit: number, complexityFit: number, communityRating: number, ownershipBonus: number }, thing: { id: string, objectid: string, name: string, thumbnail: string | null, average: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, averageWeight: number | null, bestPlayerCount: number | null } }> | null, scores: Array<{ id: string, score: number, rank: number | null, user: { id: string, displayName: string, avatar: string | null } }> } | null };

export type MergedCollectionQueryVariables = Exact<{
  usernames: Array<string> | string;
}>;


export type MergedCollectionQuery = { mergedCollection: { items: Array<{ id: string, objectid: string, name: string, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, minAge: number | null, image: string | null, thumbnail: string | null, description: string | null, average: number | null, bayesAverage: number | null, usersRated: number | null, averageWeight: number | null, isExpansion: boolean, bestPlayerCount: number | null, lastPlayedAt: unknown, owners: Array<{ bggUsername: string, avatar: string | null }>, polls: Array<{ id: string, name: string, title: string | null, totalVotes: number | null, results: Array<{ id: string, value: string, playerCount: number | null, numVotes: number }> }> }>, syncStatuses: Array<{ username: string, status: SyncStatus, error: string | null, gameCount: number | null, lastSyncedAt: unknown }> } };

export type GroupCollectionQueryVariables = Exact<{
  token: string;
}>;


export type GroupCollectionQuery = { group: { id: string, name: string, collection: { items: Array<{ id: string, objectid: string, name: string, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, minAge: number | null, image: string | null, thumbnail: string | null, description: string | null, average: number | null, bayesAverage: number | null, usersRated: number | null, averageWeight: number | null, isExpansion: boolean, bestPlayerCount: number | null, lastPlayedAt: unknown, owners: Array<{ bggUsername: string, avatar: string | null }>, polls: Array<{ id: string, name: string, title: string | null, totalVotes: number | null, results: Array<{ id: string, value: string, playerCount: number | null, numVotes: number }> }> }>, syncStatuses: Array<{ username: string, status: SyncStatus, error: string | null, gameCount: number | null, lastSyncedAt: unknown }> } } | null };

export type HotItemsQueryVariables = Exact<{ [key: string]: never; }>;


export type HotItemsQuery = { hotItems: Array<{ id: string, rank: number, name: string, yearPublished: number | null, thumbnail: string | null, average: number | null, averageWeight: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null }> };

export type SearchBggQueryVariables = Exact<{
  query: string;
}>;


export type SearchBggQuery = { search: Array<{ id: string, name: string, yearPublished: number | null }> };

export type GetSessionInviteQueryVariables = Exact<{
  token: string;
}>;


export type GetSessionInviteQuery = { sessionInvite: { id: string, email: string, expiresAt: unknown, status: string, token: string | null, role: GroupRole | null, group: { id: string, name: string }, session: { id: string, title: string, state: SessionState, scheduledAt: unknown, location: string | null, host: { id: string, displayName: string } } | null } | null };

export type GetUserQueryVariables = Exact<{
  username: string;
}>;


export type GetUserQuery = { user: { id: string, username: string | null, bggUsername: string | null, displayName: string, avatar: string | null, isProvisional: boolean, syncStatus: { username: string, status: SyncStatus, error: string | null, gameCount: number | null, lastSyncedAt: unknown } } | null };

export type SignInMutationVariables = Exact<{
  email: string;
  password: string;
}>;


export type SignInMutation = { signIn: { token: string, user: { id: string, username: string | null, email: string | null, displayName: string, bggUsername: string | null, avatar: string | null, isProvisional: boolean } } | null };

export type SignUpMutationVariables = Exact<{
  email: string;
  password: string;
  username: string;
}>;


export type SignUpMutation = { signUp: { token: string, user: { id: string, username: string | null, email: string | null, displayName: string, bggUsername: string | null, avatar: string | null, isProvisional: boolean } } | null };

export type SignOutMutationVariables = Exact<{ [key: string]: never; }>;


export type SignOutMutation = { signOut: { success: boolean } | null };

export type BindBggUsernameMutationVariables = Exact<{
  username: string;
}>;


export type BindBggUsernameMutation = { bindBggUsername: { user: { id: string, bggUsername: string | null, syncStatus: { status: SyncStatus, gameCount: number | null } } } | null };

export type CreateGroupMutationVariables = Exact<{
  name: string;
  description?: string | null | undefined;
}>;


export type CreateGroupMutation = { createGroup: { group: { id: string, name: string, description: string | null, inviteCode: string | null } } | null };

export type CreateAnonymousGroupMutationVariables = Exact<{
  name: string;
  bggUsernames: Array<string> | string;
}>;


export type CreateAnonymousGroupMutation = { createAnonymousGroup: { group: { id: string, name: string, inviteCode: string | null, anonymousBggUsernames: Array<string>, collectionTotalCount: number, myRole: GroupRole | null, owner: { id: string, displayName: string } | null, members: Array<{ id: string, displayName: string, bggUsername: string | null, avatar: string | null }>, collectionSpotlight: Array<{ id: string, objectid: string, name: string, thumbnail: string | null, average: number | null, owners: Array<{ bggUsername: string }> }>, sessions: Array<{ id: string, title: string, state: SessionState, scheduledAt: unknown }> } } | null };

export type CreateNightSessionMutationVariables = Exact<{
  groupId: string | number;
  title: string;
  description?: string | null | undefined;
  capacity?: number | null | undefined;
  scheduledAt?: unknown;
  location?: string | null | undefined;
  timeBudgetMinutes?: number | null | undefined;
  complexityPreference?: string | null | undefined;
}>;


export type CreateNightSessionMutation = { createNightSession: { session: { id: string, title: string, state: SessionState } } | null };

export type RsvpMutationVariables = Exact<{
  token: string;
  response: string;
  nickname?: string | null | undefined;
}>;


export type RsvpMutation = { rsvp: { attendance: { id: string, response: string, user: { id: string, displayName: string } }, session: { id: string, state: SessionState } } | null };

export type StartPickingMutationVariables = Exact<{
  sessionId: string | number;
}>;


export type StartPickingMutation = { startPicking: { session: { id: string, state: SessionState } } | null };

export type PickGameMutationVariables = Exact<{
  sessionId: string | number;
  gameId: string | number;
}>;


export type PickGameMutation = { pickGame: { session: { id: string, state: SessionState, pickedGame: { id: string, objectid: string, name: string, thumbnail: string | null } | null } } | null };

export type ImportCollectionMutationVariables = Exact<{
  username: string;
}>;


export type ImportCollectionMutation = { importCollection: { user: { id: string, syncStatus: { status: SyncStatus, gameCount: number | null } } } | null };

export type ValidateBggUsernameMutationVariables = Exact<{
  username: string;
}>;


export type ValidateBggUsernameMutation = { validateBggUsername: { validationResult: { valid: boolean, exists: boolean, username: string, avatar: string | null } } | null };

export type AcceptGroupInviteMutationVariables = Exact<{
  token: string;
}>;


export type AcceptGroupInviteMutation = { acceptGroupInvite: { group: { id: string, name: string } } | null };

export type InviteToGroupMutationVariables = Exact<{
  email: string;
  groupId: string | number;
  role?: string | null | undefined;
}>;


export type InviteToGroupMutation = { inviteToGroup: { inviteToken: { id: string, token: string | null, email: string, status: string } } | null };

export type ScheduleSessionMutationVariables = Exact<{
  sessionId: string | number;
  scheduledAt?: unknown;
  location?: string | null | undefined;
  capacity?: number | null | undefined;
  timeBudgetMinutes?: number | null | undefined;
  complexityPreference?: string | null | undefined;
}>;


export type ScheduleSessionMutation = { scheduleSession: { invitesSent: number, session: { id: string, state: SessionState } } | null };

export type CancelSessionMutationVariables = Exact<{
  sessionId: string | number;
}>;


export type CancelSessionMutation = { cancelSession: { session: { id: string, state: SessionState } } | null };

export type ReopenSessionMutationVariables = Exact<{
  sessionId: string | number;
}>;


export type ReopenSessionMutation = { reopenSession: { session: { id: string, state: SessionState } } | null };

export type UpdateSessionDetailsMutationVariables = Exact<{
  sessionId: string | number;
  title?: string | null | undefined;
  description?: string | null | undefined;
  location?: string | null | undefined;
  scheduledAt?: unknown;
  capacity?: number | null | undefined;
}>;


export type UpdateSessionDetailsMutation = { updateSessionDetails: { session: { id: string, title: string, description: string | null, location: string | null, scheduledAt: unknown, capacity: number | null, state: SessionState } } | null };

export type UpdateSessionPreferencesMutationVariables = Exact<{
  sessionId: string | number;
  timeBudgetMinutes?: number | null | undefined;
  complexityPreference?: string | null | undefined;
}>;


export type UpdateSessionPreferencesMutation = { updateSessionPreferences: { session: { id: string, timeBudgetMinutes: number, complexityPreference: string } } | null };

export type RemoveGroupMemberMutationVariables = Exact<{
  groupId: string | number;
  userId: string | number;
}>;


export type RemoveGroupMemberMutation = { removeGroupMember: { success: boolean, removedMembershipId: string | null } | null };

export type UpdateGroupMemberRoleMutationVariables = Exact<{
  groupId: string | number;
  userId: string | number;
  role: string;
}>;


export type UpdateGroupMemberRoleMutation = { updateGroupMemberRole: { membership: { id: string, role: GroupRole, user: { id: string, displayName: string } } } | null };

export type UpgradeToAccountMutationVariables = Exact<{
  email: string;
  password: string;
  bggUsername?: string | null | undefined;
}>;


export type UpgradeToAccountMutation = { upgradeToAccount: { token: string, user: { id: string, username: string | null, email: string | null, displayName: string, isProvisional: boolean } } | null };

export type SubmitScoresMutationVariables = Exact<{
  sessionId: string | number;
  scores: Array<ScoreInput> | ScoreInput;
}>;


export type SubmitScoresMutation = { submitScores: { session: { id: string, scores: Array<{ id: string, score: number, rank: number | null, user: { id: string, displayName: string, avatar: string | null } }> } } | null };

export type CollectionSyncedSubscriptionVariables = Exact<{
  username: string;
}>;


export type CollectionSyncedSubscription = { collectionSynced: { username: string, status: SyncStatus, error: string | null, gameCount: number | null, lastSyncedAt: unknown } };

export type MyPlaysQueryVariables = Exact<{
  limit?: number | null | undefined;
}>;


export type MyPlaysQuery = { myPlays: Array<{ id: string, date: unknown, quantity: number, bggGameObjectid: number, gameName: string | null, lengthMinutes: number, incomplete: boolean, nowInStats: boolean, location: string | null, comments: string | null, winnersCount: number, user: { id: string, displayName: string, avatar: string | null }, players: Array<{ id: string, bggUsername: string | null, name: string, score: number | null, win: boolean }> }> };

export type GroupPlaysQueryVariables = Exact<{
  groupId: string | number;
  limit?: number | null | undefined;
}>;


export type GroupPlaysQuery = { groupPlays: Array<{ id: string, date: unknown, quantity: number, bggGameObjectid: number, gameName: string | null, lengthMinutes: number, incomplete: boolean, nowInStats: boolean, location: string | null, comments: string | null, winnersCount: number, user: { id: string, displayName: string, avatar: string | null }, players: Array<{ id: string, bggUsername: string | null, name: string, score: number | null, win: boolean }> }> };

export type GamePlaysQueryVariables = Exact<{
  groupId: string | number;
  objectid: number;
  limit?: number | null | undefined;
}>;


export type GamePlaysQuery = { gamePlays: Array<{ id: string, date: unknown, quantity: number, bggGameObjectid: number, gameName: string | null, lengthMinutes: number, incomplete: boolean, nowInStats: boolean, location: string | null, comments: string | null, winnersCount: number, user: { id: string, displayName: string, avatar: string | null }, players: Array<{ id: string, bggUsername: string | null, name: string, score: number | null, win: boolean }> }> };

export type ImportPlaysMutationVariables = Exact<{
  username: string;
}>;


export type ImportPlaysMutation = { importPlays: { success: boolean, message: string } | null };


export const CurrentUserDocument = gql`
    query CurrentUser {
  currentUser {
    id
    username
    email
    bggUsername
    displayName
    avatar
    isProvisional
    syncStatus {
      username
      status
      error
      gameCount
      lastSyncedAt
    }
  }
}
    `;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
      }
export function useCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
// @ts-ignore
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>): Apollo.UseSuspenseQueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>): Apollo.UseSuspenseQueryResult<CurrentUserQuery | undefined, CurrentUserQueryVariables>;
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export type CurrentUserSuspenseQueryHookResult = ReturnType<typeof useCurrentUserSuspenseQuery>;
export type CurrentUserQueryResult = Apollo.QueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export const DashboardStatsDocument = gql`
    query DashboardStats {
  dashboardStats {
    collectionCount
    groupCount
    sessionCount
  }
}
    `;

/**
 * __useDashboardStatsQuery__
 *
 * To run a query within a React component, call `useDashboardStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useDashboardStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDashboardStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useDashboardStatsQuery(baseOptions?: Apollo.QueryHookOptions<DashboardStatsQuery, DashboardStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DashboardStatsQuery, DashboardStatsQueryVariables>(DashboardStatsDocument, options);
      }
export function useDashboardStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DashboardStatsQuery, DashboardStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DashboardStatsQuery, DashboardStatsQueryVariables>(DashboardStatsDocument, options);
        }
// @ts-ignore
export function useDashboardStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DashboardStatsQuery, DashboardStatsQueryVariables>): Apollo.UseSuspenseQueryResult<DashboardStatsQuery, DashboardStatsQueryVariables>;
export function useDashboardStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DashboardStatsQuery, DashboardStatsQueryVariables>): Apollo.UseSuspenseQueryResult<DashboardStatsQuery | undefined, DashboardStatsQueryVariables>;
export function useDashboardStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DashboardStatsQuery, DashboardStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DashboardStatsQuery, DashboardStatsQueryVariables>(DashboardStatsDocument, options);
        }
export type DashboardStatsQueryHookResult = ReturnType<typeof useDashboardStatsQuery>;
export type DashboardStatsLazyQueryHookResult = ReturnType<typeof useDashboardStatsLazyQuery>;
export type DashboardStatsSuspenseQueryHookResult = ReturnType<typeof useDashboardStatsSuspenseQuery>;
export type DashboardStatsQueryResult = Apollo.QueryResult<DashboardStatsQuery, DashboardStatsQueryVariables>;
export const MyGroupsDocument = gql`
    query MyGroups {
  myGroups {
    id
    name
    description
    inviteCode
    collectionTotalCount
    members {
      id
      displayName
      avatar
    }
    sessions {
      id
      title
      state
      scheduledAt
    }
  }
}
    `;

/**
 * __useMyGroupsQuery__
 *
 * To run a query within a React component, call `useMyGroupsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyGroupsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyGroupsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyGroupsQuery(baseOptions?: Apollo.QueryHookOptions<MyGroupsQuery, MyGroupsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyGroupsQuery, MyGroupsQueryVariables>(MyGroupsDocument, options);
      }
export function useMyGroupsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyGroupsQuery, MyGroupsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyGroupsQuery, MyGroupsQueryVariables>(MyGroupsDocument, options);
        }
// @ts-ignore
export function useMyGroupsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyGroupsQuery, MyGroupsQueryVariables>): Apollo.UseSuspenseQueryResult<MyGroupsQuery, MyGroupsQueryVariables>;
export function useMyGroupsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyGroupsQuery, MyGroupsQueryVariables>): Apollo.UseSuspenseQueryResult<MyGroupsQuery | undefined, MyGroupsQueryVariables>;
export function useMyGroupsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyGroupsQuery, MyGroupsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyGroupsQuery, MyGroupsQueryVariables>(MyGroupsDocument, options);
        }
export type MyGroupsQueryHookResult = ReturnType<typeof useMyGroupsQuery>;
export type MyGroupsLazyQueryHookResult = ReturnType<typeof useMyGroupsLazyQuery>;
export type MyGroupsSuspenseQueryHookResult = ReturnType<typeof useMyGroupsSuspenseQuery>;
export type MyGroupsQueryResult = Apollo.QueryResult<MyGroupsQuery, MyGroupsQueryVariables>;
export const GetGroupDocument = gql`
    query GetGroup($token: String!) {
  group(token: $token) {
    id
    name
    description
    inviteCode
    anonymousBggUsernames
    myRole
    collectionTotalCount
    owner {
      id
      displayName
      avatar
    }
    members {
      id
      displayName
      bggUsername
      avatar
      isProvisional
    }
    memberships {
      id
      role
      user {
        id
      }
    }
    sessions {
      id
      title
      state
      scheduledAt
      location
      attendeeCount
    }
    pastSessions {
      id
      title
      state
      scheduledAt
      location
      pickedGame {
        name
        thumbnail
      }
    }
    collectionSpotlight {
      id
      objectid
      name
      thumbnail
      average
      owners {
        bggUsername
      }
    }
  }
}
    `;

/**
 * __useGetGroupQuery__
 *
 * To run a query within a React component, call `useGetGroupQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGroupQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGroupQuery({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useGetGroupQuery(baseOptions: Apollo.QueryHookOptions<GetGroupQuery, GetGroupQueryVariables> & ({ variables: GetGroupQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGroupQuery, GetGroupQueryVariables>(GetGroupDocument, options);
      }
export function useGetGroupLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGroupQuery, GetGroupQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGroupQuery, GetGroupQueryVariables>(GetGroupDocument, options);
        }
// @ts-ignore
export function useGetGroupSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetGroupQuery, GetGroupQueryVariables>): Apollo.UseSuspenseQueryResult<GetGroupQuery, GetGroupQueryVariables>;
export function useGetGroupSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGroupQuery, GetGroupQueryVariables>): Apollo.UseSuspenseQueryResult<GetGroupQuery | undefined, GetGroupQueryVariables>;
export function useGetGroupSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGroupQuery, GetGroupQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetGroupQuery, GetGroupQueryVariables>(GetGroupDocument, options);
        }
export type GetGroupQueryHookResult = ReturnType<typeof useGetGroupQuery>;
export type GetGroupLazyQueryHookResult = ReturnType<typeof useGetGroupLazyQuery>;
export type GetGroupSuspenseQueryHookResult = ReturnType<typeof useGetGroupSuspenseQuery>;
export type GetGroupQueryResult = Apollo.QueryResult<GetGroupQuery, GetGroupQueryVariables>;
export const GetNightSessionDocument = gql`
    query GetNightSession($id: ID!) {
  nightSession(id: $id) {
    id
    title
    description
    state
    scheduledAt
    location
    capacity
    timeBudgetMinutes
    complexityPreference
    attendeeCount
    host {
      id
      displayName
      avatar
    }
    group {
      id
      name
    }
    attendances {
      id
      response
      respondedAt
      user {
        id
        displayName
        avatar
        bggUsername
      }
    }
    pickedGame {
      id
      objectid
      name
      thumbnail
      average
      minPlayers
      maxPlayers
      minPlaytime
      maxPlaytime
      averageWeight
      bestPlayerCount
    }
    suggestions {
      score
      confidence
      reasons
      breakdown {
        playerCountFit
        timeFit
        complexityFit
        communityRating
        ownershipBonus
      }
      thing {
        id
        objectid
        name
        thumbnail
        average
        minPlayers
        maxPlayers
        minPlaytime
        maxPlaytime
        averageWeight
        bestPlayerCount
      }
    }
    scores {
      id
      score
      rank
      user {
        id
        displayName
        avatar
      }
    }
  }
}
    `;

/**
 * __useGetNightSessionQuery__
 *
 * To run a query within a React component, call `useGetNightSessionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNightSessionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNightSessionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetNightSessionQuery(baseOptions: Apollo.QueryHookOptions<GetNightSessionQuery, GetNightSessionQueryVariables> & ({ variables: GetNightSessionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetNightSessionQuery, GetNightSessionQueryVariables>(GetNightSessionDocument, options);
      }
export function useGetNightSessionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNightSessionQuery, GetNightSessionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetNightSessionQuery, GetNightSessionQueryVariables>(GetNightSessionDocument, options);
        }
// @ts-ignore
export function useGetNightSessionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetNightSessionQuery, GetNightSessionQueryVariables>): Apollo.UseSuspenseQueryResult<GetNightSessionQuery, GetNightSessionQueryVariables>;
export function useGetNightSessionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNightSessionQuery, GetNightSessionQueryVariables>): Apollo.UseSuspenseQueryResult<GetNightSessionQuery | undefined, GetNightSessionQueryVariables>;
export function useGetNightSessionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNightSessionQuery, GetNightSessionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetNightSessionQuery, GetNightSessionQueryVariables>(GetNightSessionDocument, options);
        }
export type GetNightSessionQueryHookResult = ReturnType<typeof useGetNightSessionQuery>;
export type GetNightSessionLazyQueryHookResult = ReturnType<typeof useGetNightSessionLazyQuery>;
export type GetNightSessionSuspenseQueryHookResult = ReturnType<typeof useGetNightSessionSuspenseQuery>;
export type GetNightSessionQueryResult = Apollo.QueryResult<GetNightSessionQuery, GetNightSessionQueryVariables>;
export const MergedCollectionDocument = gql`
    query MergedCollection($usernames: [String!]!) {
  mergedCollection(usernames: $usernames) {
    items {
      id
      objectid
      name
      yearPublished
      minPlayers
      maxPlayers
      minPlaytime
      maxPlaytime
      minAge
      image
      thumbnail
      description
      average
      bayesAverage
      usersRated
      averageWeight
      isExpansion
      bestPlayerCount
      lastPlayedAt
      owners {
        bggUsername
        avatar
      }
      polls {
        id
        name
        title
        totalVotes
        results {
          id
          value
          playerCount
          numVotes
        }
      }
    }
    syncStatuses {
      username
      status
      error
      gameCount
      lastSyncedAt
    }
  }
}
    `;

/**
 * __useMergedCollectionQuery__
 *
 * To run a query within a React component, call `useMergedCollectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useMergedCollectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMergedCollectionQuery({
 *   variables: {
 *      usernames: // value for 'usernames'
 *   },
 * });
 */
export function useMergedCollectionQuery(baseOptions: Apollo.QueryHookOptions<MergedCollectionQuery, MergedCollectionQueryVariables> & ({ variables: MergedCollectionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MergedCollectionQuery, MergedCollectionQueryVariables>(MergedCollectionDocument, options);
      }
export function useMergedCollectionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MergedCollectionQuery, MergedCollectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MergedCollectionQuery, MergedCollectionQueryVariables>(MergedCollectionDocument, options);
        }
// @ts-ignore
export function useMergedCollectionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MergedCollectionQuery, MergedCollectionQueryVariables>): Apollo.UseSuspenseQueryResult<MergedCollectionQuery, MergedCollectionQueryVariables>;
export function useMergedCollectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MergedCollectionQuery, MergedCollectionQueryVariables>): Apollo.UseSuspenseQueryResult<MergedCollectionQuery | undefined, MergedCollectionQueryVariables>;
export function useMergedCollectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MergedCollectionQuery, MergedCollectionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MergedCollectionQuery, MergedCollectionQueryVariables>(MergedCollectionDocument, options);
        }
export type MergedCollectionQueryHookResult = ReturnType<typeof useMergedCollectionQuery>;
export type MergedCollectionLazyQueryHookResult = ReturnType<typeof useMergedCollectionLazyQuery>;
export type MergedCollectionSuspenseQueryHookResult = ReturnType<typeof useMergedCollectionSuspenseQuery>;
export type MergedCollectionQueryResult = Apollo.QueryResult<MergedCollectionQuery, MergedCollectionQueryVariables>;
export const GroupCollectionDocument = gql`
    query GroupCollection($token: String!) {
  group(token: $token) {
    id
    name
    collection {
      items {
        id
        objectid
        name
        yearPublished
        minPlayers
        maxPlayers
        minPlaytime
        maxPlaytime
        minAge
        image
        thumbnail
        description
        average
        bayesAverage
        usersRated
        averageWeight
        isExpansion
        bestPlayerCount
        lastPlayedAt
        owners {
          bggUsername
          avatar
        }
        polls {
          id
          name
          title
          totalVotes
          results {
            id
            value
            playerCount
            numVotes
          }
        }
      }
      syncStatuses {
        username
        status
        error
        gameCount
        lastSyncedAt
      }
    }
  }
}
    `;

/**
 * __useGroupCollectionQuery__
 *
 * To run a query within a React component, call `useGroupCollectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGroupCollectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGroupCollectionQuery({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useGroupCollectionQuery(baseOptions: Apollo.QueryHookOptions<GroupCollectionQuery, GroupCollectionQueryVariables> & ({ variables: GroupCollectionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GroupCollectionQuery, GroupCollectionQueryVariables>(GroupCollectionDocument, options);
      }
export function useGroupCollectionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GroupCollectionQuery, GroupCollectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GroupCollectionQuery, GroupCollectionQueryVariables>(GroupCollectionDocument, options);
        }
// @ts-ignore
export function useGroupCollectionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GroupCollectionQuery, GroupCollectionQueryVariables>): Apollo.UseSuspenseQueryResult<GroupCollectionQuery, GroupCollectionQueryVariables>;
export function useGroupCollectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GroupCollectionQuery, GroupCollectionQueryVariables>): Apollo.UseSuspenseQueryResult<GroupCollectionQuery | undefined, GroupCollectionQueryVariables>;
export function useGroupCollectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GroupCollectionQuery, GroupCollectionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GroupCollectionQuery, GroupCollectionQueryVariables>(GroupCollectionDocument, options);
        }
export type GroupCollectionQueryHookResult = ReturnType<typeof useGroupCollectionQuery>;
export type GroupCollectionLazyQueryHookResult = ReturnType<typeof useGroupCollectionLazyQuery>;
export type GroupCollectionSuspenseQueryHookResult = ReturnType<typeof useGroupCollectionSuspenseQuery>;
export type GroupCollectionQueryResult = Apollo.QueryResult<GroupCollectionQuery, GroupCollectionQueryVariables>;
export const HotItemsDocument = gql`
    query HotItems {
  hotItems {
    id
    rank
    name
    yearPublished
    thumbnail
    average
    averageWeight
    minPlayers
    maxPlayers
    minPlaytime
    maxPlaytime
  }
}
    `;

/**
 * __useHotItemsQuery__
 *
 * To run a query within a React component, call `useHotItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHotItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHotItemsQuery({
 *   variables: {
 *   },
 * });
 */
export function useHotItemsQuery(baseOptions?: Apollo.QueryHookOptions<HotItemsQuery, HotItemsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HotItemsQuery, HotItemsQueryVariables>(HotItemsDocument, options);
      }
export function useHotItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HotItemsQuery, HotItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HotItemsQuery, HotItemsQueryVariables>(HotItemsDocument, options);
        }
// @ts-ignore
export function useHotItemsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<HotItemsQuery, HotItemsQueryVariables>): Apollo.UseSuspenseQueryResult<HotItemsQuery, HotItemsQueryVariables>;
export function useHotItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HotItemsQuery, HotItemsQueryVariables>): Apollo.UseSuspenseQueryResult<HotItemsQuery | undefined, HotItemsQueryVariables>;
export function useHotItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HotItemsQuery, HotItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HotItemsQuery, HotItemsQueryVariables>(HotItemsDocument, options);
        }
export type HotItemsQueryHookResult = ReturnType<typeof useHotItemsQuery>;
export type HotItemsLazyQueryHookResult = ReturnType<typeof useHotItemsLazyQuery>;
export type HotItemsSuspenseQueryHookResult = ReturnType<typeof useHotItemsSuspenseQuery>;
export type HotItemsQueryResult = Apollo.QueryResult<HotItemsQuery, HotItemsQueryVariables>;
export const SearchBggDocument = gql`
    query SearchBgg($query: String!) {
  search(query: $query) {
    id
    name
    yearPublished
  }
}
    `;

/**
 * __useSearchBggQuery__
 *
 * To run a query within a React component, call `useSearchBggQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchBggQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchBggQuery({
 *   variables: {
 *      query: // value for 'query'
 *   },
 * });
 */
export function useSearchBggQuery(baseOptions: Apollo.QueryHookOptions<SearchBggQuery, SearchBggQueryVariables> & ({ variables: SearchBggQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchBggQuery, SearchBggQueryVariables>(SearchBggDocument, options);
      }
export function useSearchBggLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchBggQuery, SearchBggQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchBggQuery, SearchBggQueryVariables>(SearchBggDocument, options);
        }
// @ts-ignore
export function useSearchBggSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SearchBggQuery, SearchBggQueryVariables>): Apollo.UseSuspenseQueryResult<SearchBggQuery, SearchBggQueryVariables>;
export function useSearchBggSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchBggQuery, SearchBggQueryVariables>): Apollo.UseSuspenseQueryResult<SearchBggQuery | undefined, SearchBggQueryVariables>;
export function useSearchBggSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchBggQuery, SearchBggQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchBggQuery, SearchBggQueryVariables>(SearchBggDocument, options);
        }
export type SearchBggQueryHookResult = ReturnType<typeof useSearchBggQuery>;
export type SearchBggLazyQueryHookResult = ReturnType<typeof useSearchBggLazyQuery>;
export type SearchBggSuspenseQueryHookResult = ReturnType<typeof useSearchBggSuspenseQuery>;
export type SearchBggQueryResult = Apollo.QueryResult<SearchBggQuery, SearchBggQueryVariables>;
export const GetSessionInviteDocument = gql`
    query GetSessionInvite($token: String!) {
  sessionInvite(token: $token) {
    id
    email
    expiresAt
    status
    token
    role
    group {
      id
      name
    }
    session {
      id
      title
      state
      scheduledAt
      location
      host {
        id
        displayName
      }
    }
  }
}
    `;

/**
 * __useGetSessionInviteQuery__
 *
 * To run a query within a React component, call `useGetSessionInviteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionInviteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionInviteQuery({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useGetSessionInviteQuery(baseOptions: Apollo.QueryHookOptions<GetSessionInviteQuery, GetSessionInviteQueryVariables> & ({ variables: GetSessionInviteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSessionInviteQuery, GetSessionInviteQueryVariables>(GetSessionInviteDocument, options);
      }
export function useGetSessionInviteLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSessionInviteQuery, GetSessionInviteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSessionInviteQuery, GetSessionInviteQueryVariables>(GetSessionInviteDocument, options);
        }
// @ts-ignore
export function useGetSessionInviteSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSessionInviteQuery, GetSessionInviteQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionInviteQuery, GetSessionInviteQueryVariables>;
export function useGetSessionInviteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionInviteQuery, GetSessionInviteQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionInviteQuery | undefined, GetSessionInviteQueryVariables>;
export function useGetSessionInviteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionInviteQuery, GetSessionInviteQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSessionInviteQuery, GetSessionInviteQueryVariables>(GetSessionInviteDocument, options);
        }
export type GetSessionInviteQueryHookResult = ReturnType<typeof useGetSessionInviteQuery>;
export type GetSessionInviteLazyQueryHookResult = ReturnType<typeof useGetSessionInviteLazyQuery>;
export type GetSessionInviteSuspenseQueryHookResult = ReturnType<typeof useGetSessionInviteSuspenseQuery>;
export type GetSessionInviteQueryResult = Apollo.QueryResult<GetSessionInviteQuery, GetSessionInviteQueryVariables>;
export const GetUserDocument = gql`
    query GetUser($username: String!) {
  user(username: $username) {
    id
    username
    bggUsername
    displayName
    avatar
    isProvisional
    syncStatus {
      username
      status
      error
      gameCount
      lastSyncedAt
    }
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables> & ({ variables: GetUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
// @ts-ignore
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery | undefined, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserSuspenseQueryHookResult = ReturnType<typeof useGetUserSuspenseQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const SignInDocument = gql`
    mutation SignIn($email: String!, $password: String!) {
  signIn(email: $email, password: $password) {
    token
    user {
      id
      username
      email
      displayName
      bggUsername
      avatar
      isProvisional
    }
  }
}
    `;
export type SignInMutationFn = Apollo.MutationFunction<SignInMutation, SignInMutationVariables>;

/**
 * __useSignInMutation__
 *
 * To run a mutation, you first call `useSignInMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignInMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signInMutation, { data, loading, error }] = useSignInMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useSignInMutation(baseOptions?: Apollo.MutationHookOptions<SignInMutation, SignInMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SignInMutation, SignInMutationVariables>(SignInDocument, options);
      }
export type SignInMutationHookResult = ReturnType<typeof useSignInMutation>;
export type SignInMutationResult = Apollo.MutationResult<SignInMutation>;
export type SignInMutationOptions = Apollo.BaseMutationOptions<SignInMutation, SignInMutationVariables>;
export const SignUpDocument = gql`
    mutation SignUp($email: String!, $password: String!, $username: String!) {
  signUp(email: $email, password: $password, username: $username) {
    token
    user {
      id
      username
      email
      displayName
      bggUsername
      avatar
      isProvisional
    }
  }
}
    `;
export type SignUpMutationFn = Apollo.MutationFunction<SignUpMutation, SignUpMutationVariables>;

/**
 * __useSignUpMutation__
 *
 * To run a mutation, you first call `useSignUpMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignUpMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signUpMutation, { data, loading, error }] = useSignUpMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *      username: // value for 'username'
 *   },
 * });
 */
export function useSignUpMutation(baseOptions?: Apollo.MutationHookOptions<SignUpMutation, SignUpMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SignUpMutation, SignUpMutationVariables>(SignUpDocument, options);
      }
export type SignUpMutationHookResult = ReturnType<typeof useSignUpMutation>;
export type SignUpMutationResult = Apollo.MutationResult<SignUpMutation>;
export type SignUpMutationOptions = Apollo.BaseMutationOptions<SignUpMutation, SignUpMutationVariables>;
export const SignOutDocument = gql`
    mutation SignOut {
  signOut {
    success
  }
}
    `;
export type SignOutMutationFn = Apollo.MutationFunction<SignOutMutation, SignOutMutationVariables>;

/**
 * __useSignOutMutation__
 *
 * To run a mutation, you first call `useSignOutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignOutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signOutMutation, { data, loading, error }] = useSignOutMutation({
 *   variables: {
 *   },
 * });
 */
export function useSignOutMutation(baseOptions?: Apollo.MutationHookOptions<SignOutMutation, SignOutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SignOutMutation, SignOutMutationVariables>(SignOutDocument, options);
      }
export type SignOutMutationHookResult = ReturnType<typeof useSignOutMutation>;
export type SignOutMutationResult = Apollo.MutationResult<SignOutMutation>;
export type SignOutMutationOptions = Apollo.BaseMutationOptions<SignOutMutation, SignOutMutationVariables>;
export const BindBggUsernameDocument = gql`
    mutation BindBggUsername($username: String!) {
  bindBggUsername(username: $username) {
    user {
      id
      bggUsername
      syncStatus {
        status
        gameCount
      }
    }
  }
}
    `;
export type BindBggUsernameMutationFn = Apollo.MutationFunction<BindBggUsernameMutation, BindBggUsernameMutationVariables>;

/**
 * __useBindBggUsernameMutation__
 *
 * To run a mutation, you first call `useBindBggUsernameMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBindBggUsernameMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bindBggUsernameMutation, { data, loading, error }] = useBindBggUsernameMutation({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useBindBggUsernameMutation(baseOptions?: Apollo.MutationHookOptions<BindBggUsernameMutation, BindBggUsernameMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BindBggUsernameMutation, BindBggUsernameMutationVariables>(BindBggUsernameDocument, options);
      }
export type BindBggUsernameMutationHookResult = ReturnType<typeof useBindBggUsernameMutation>;
export type BindBggUsernameMutationResult = Apollo.MutationResult<BindBggUsernameMutation>;
export type BindBggUsernameMutationOptions = Apollo.BaseMutationOptions<BindBggUsernameMutation, BindBggUsernameMutationVariables>;
export const CreateGroupDocument = gql`
    mutation CreateGroup($name: String!, $description: String) {
  createGroup(name: $name, description: $description) {
    group {
      id
      name
      description
      inviteCode
    }
  }
}
    `;
export type CreateGroupMutationFn = Apollo.MutationFunction<CreateGroupMutation, CreateGroupMutationVariables>;

/**
 * __useCreateGroupMutation__
 *
 * To run a mutation, you first call `useCreateGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createGroupMutation, { data, loading, error }] = useCreateGroupMutation({
 *   variables: {
 *      name: // value for 'name'
 *      description: // value for 'description'
 *   },
 * });
 */
export function useCreateGroupMutation(baseOptions?: Apollo.MutationHookOptions<CreateGroupMutation, CreateGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateGroupMutation, CreateGroupMutationVariables>(CreateGroupDocument, options);
      }
export type CreateGroupMutationHookResult = ReturnType<typeof useCreateGroupMutation>;
export type CreateGroupMutationResult = Apollo.MutationResult<CreateGroupMutation>;
export type CreateGroupMutationOptions = Apollo.BaseMutationOptions<CreateGroupMutation, CreateGroupMutationVariables>;
export const CreateAnonymousGroupDocument = gql`
    mutation CreateAnonymousGroup($name: String!, $bggUsernames: [String!]!) {
  createAnonymousGroup(name: $name, bggUsernames: $bggUsernames) {
    group {
      id
      name
      inviteCode
      anonymousBggUsernames
      collectionTotalCount
      myRole
      owner {
        id
        displayName
      }
      members {
        id
        displayName
        bggUsername
        avatar
      }
      collectionSpotlight {
        id
        objectid
        name
        thumbnail
        average
        owners {
          bggUsername
        }
      }
      sessions {
        id
        title
        state
        scheduledAt
      }
    }
  }
}
    `;
export type CreateAnonymousGroupMutationFn = Apollo.MutationFunction<CreateAnonymousGroupMutation, CreateAnonymousGroupMutationVariables>;

/**
 * __useCreateAnonymousGroupMutation__
 *
 * To run a mutation, you first call `useCreateAnonymousGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAnonymousGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAnonymousGroupMutation, { data, loading, error }] = useCreateAnonymousGroupMutation({
 *   variables: {
 *      name: // value for 'name'
 *      bggUsernames: // value for 'bggUsernames'
 *   },
 * });
 */
export function useCreateAnonymousGroupMutation(baseOptions?: Apollo.MutationHookOptions<CreateAnonymousGroupMutation, CreateAnonymousGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateAnonymousGroupMutation, CreateAnonymousGroupMutationVariables>(CreateAnonymousGroupDocument, options);
      }
export type CreateAnonymousGroupMutationHookResult = ReturnType<typeof useCreateAnonymousGroupMutation>;
export type CreateAnonymousGroupMutationResult = Apollo.MutationResult<CreateAnonymousGroupMutation>;
export type CreateAnonymousGroupMutationOptions = Apollo.BaseMutationOptions<CreateAnonymousGroupMutation, CreateAnonymousGroupMutationVariables>;
export const CreateNightSessionDocument = gql`
    mutation CreateNightSession($groupId: ID!, $title: String!, $description: String, $capacity: Int, $scheduledAt: ISO8601DateTime, $location: String, $timeBudgetMinutes: Int, $complexityPreference: String) {
  createNightSession(
    groupId: $groupId
    title: $title
    description: $description
    capacity: $capacity
    scheduledAt: $scheduledAt
    location: $location
    timeBudgetMinutes: $timeBudgetMinutes
    complexityPreference: $complexityPreference
  ) {
    session {
      id
      title
      state
    }
  }
}
    `;
export type CreateNightSessionMutationFn = Apollo.MutationFunction<CreateNightSessionMutation, CreateNightSessionMutationVariables>;

/**
 * __useCreateNightSessionMutation__
 *
 * To run a mutation, you first call `useCreateNightSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNightSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNightSessionMutation, { data, loading, error }] = useCreateNightSessionMutation({
 *   variables: {
 *      groupId: // value for 'groupId'
 *      title: // value for 'title'
 *      description: // value for 'description'
 *      capacity: // value for 'capacity'
 *      scheduledAt: // value for 'scheduledAt'
 *      location: // value for 'location'
 *      timeBudgetMinutes: // value for 'timeBudgetMinutes'
 *      complexityPreference: // value for 'complexityPreference'
 *   },
 * });
 */
export function useCreateNightSessionMutation(baseOptions?: Apollo.MutationHookOptions<CreateNightSessionMutation, CreateNightSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNightSessionMutation, CreateNightSessionMutationVariables>(CreateNightSessionDocument, options);
      }
export type CreateNightSessionMutationHookResult = ReturnType<typeof useCreateNightSessionMutation>;
export type CreateNightSessionMutationResult = Apollo.MutationResult<CreateNightSessionMutation>;
export type CreateNightSessionMutationOptions = Apollo.BaseMutationOptions<CreateNightSessionMutation, CreateNightSessionMutationVariables>;
export const RsvpDocument = gql`
    mutation Rsvp($token: String!, $response: String!, $nickname: String) {
  rsvp(token: $token, response: $response, nickname: $nickname) {
    attendance {
      id
      response
      user {
        id
        displayName
      }
    }
    session {
      id
      state
    }
  }
}
    `;
export type RsvpMutationFn = Apollo.MutationFunction<RsvpMutation, RsvpMutationVariables>;

/**
 * __useRsvpMutation__
 *
 * To run a mutation, you first call `useRsvpMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRsvpMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rsvpMutation, { data, loading, error }] = useRsvpMutation({
 *   variables: {
 *      token: // value for 'token'
 *      response: // value for 'response'
 *      nickname: // value for 'nickname'
 *   },
 * });
 */
export function useRsvpMutation(baseOptions?: Apollo.MutationHookOptions<RsvpMutation, RsvpMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RsvpMutation, RsvpMutationVariables>(RsvpDocument, options);
      }
export type RsvpMutationHookResult = ReturnType<typeof useRsvpMutation>;
export type RsvpMutationResult = Apollo.MutationResult<RsvpMutation>;
export type RsvpMutationOptions = Apollo.BaseMutationOptions<RsvpMutation, RsvpMutationVariables>;
export const StartPickingDocument = gql`
    mutation StartPicking($sessionId: ID!) {
  startPicking(sessionId: $sessionId) {
    session {
      id
      state
    }
  }
}
    `;
export type StartPickingMutationFn = Apollo.MutationFunction<StartPickingMutation, StartPickingMutationVariables>;

/**
 * __useStartPickingMutation__
 *
 * To run a mutation, you first call `useStartPickingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartPickingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startPickingMutation, { data, loading, error }] = useStartPickingMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useStartPickingMutation(baseOptions?: Apollo.MutationHookOptions<StartPickingMutation, StartPickingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<StartPickingMutation, StartPickingMutationVariables>(StartPickingDocument, options);
      }
export type StartPickingMutationHookResult = ReturnType<typeof useStartPickingMutation>;
export type StartPickingMutationResult = Apollo.MutationResult<StartPickingMutation>;
export type StartPickingMutationOptions = Apollo.BaseMutationOptions<StartPickingMutation, StartPickingMutationVariables>;
export const PickGameDocument = gql`
    mutation PickGame($sessionId: ID!, $gameId: ID!) {
  pickGame(sessionId: $sessionId, gameId: $gameId) {
    session {
      id
      state
      pickedGame {
        id
        objectid
        name
        thumbnail
      }
    }
  }
}
    `;
export type PickGameMutationFn = Apollo.MutationFunction<PickGameMutation, PickGameMutationVariables>;

/**
 * __usePickGameMutation__
 *
 * To run a mutation, you first call `usePickGameMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePickGameMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pickGameMutation, { data, loading, error }] = usePickGameMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      gameId: // value for 'gameId'
 *   },
 * });
 */
export function usePickGameMutation(baseOptions?: Apollo.MutationHookOptions<PickGameMutation, PickGameMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PickGameMutation, PickGameMutationVariables>(PickGameDocument, options);
      }
export type PickGameMutationHookResult = ReturnType<typeof usePickGameMutation>;
export type PickGameMutationResult = Apollo.MutationResult<PickGameMutation>;
export type PickGameMutationOptions = Apollo.BaseMutationOptions<PickGameMutation, PickGameMutationVariables>;
export const ImportCollectionDocument = gql`
    mutation ImportCollection($username: String!) {
  importCollection(username: $username) {
    user {
      id
      syncStatus {
        status
        gameCount
      }
    }
  }
}
    `;
export type ImportCollectionMutationFn = Apollo.MutationFunction<ImportCollectionMutation, ImportCollectionMutationVariables>;

/**
 * __useImportCollectionMutation__
 *
 * To run a mutation, you first call `useImportCollectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useImportCollectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [importCollectionMutation, { data, loading, error }] = useImportCollectionMutation({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useImportCollectionMutation(baseOptions?: Apollo.MutationHookOptions<ImportCollectionMutation, ImportCollectionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ImportCollectionMutation, ImportCollectionMutationVariables>(ImportCollectionDocument, options);
      }
export type ImportCollectionMutationHookResult = ReturnType<typeof useImportCollectionMutation>;
export type ImportCollectionMutationResult = Apollo.MutationResult<ImportCollectionMutation>;
export type ImportCollectionMutationOptions = Apollo.BaseMutationOptions<ImportCollectionMutation, ImportCollectionMutationVariables>;
export const ValidateBggUsernameDocument = gql`
    mutation ValidateBggUsername($username: String!) {
  validateBggUsername(username: $username) {
    validationResult {
      valid
      exists
      username
      avatar
    }
  }
}
    `;
export type ValidateBggUsernameMutationFn = Apollo.MutationFunction<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables>;

/**
 * __useValidateBggUsernameMutation__
 *
 * To run a mutation, you first call `useValidateBggUsernameMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useValidateBggUsernameMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [validateBggUsernameMutation, { data, loading, error }] = useValidateBggUsernameMutation({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useValidateBggUsernameMutation(baseOptions?: Apollo.MutationHookOptions<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables>(ValidateBggUsernameDocument, options);
      }
export type ValidateBggUsernameMutationHookResult = ReturnType<typeof useValidateBggUsernameMutation>;
export type ValidateBggUsernameMutationResult = Apollo.MutationResult<ValidateBggUsernameMutation>;
export type ValidateBggUsernameMutationOptions = Apollo.BaseMutationOptions<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables>;
export const AcceptGroupInviteDocument = gql`
    mutation AcceptGroupInvite($token: String!) {
  acceptGroupInvite(token: $token) {
    group {
      id
      name
    }
  }
}
    `;
export type AcceptGroupInviteMutationFn = Apollo.MutationFunction<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables>;

/**
 * __useAcceptGroupInviteMutation__
 *
 * To run a mutation, you first call `useAcceptGroupInviteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAcceptGroupInviteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [acceptGroupInviteMutation, { data, loading, error }] = useAcceptGroupInviteMutation({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useAcceptGroupInviteMutation(baseOptions?: Apollo.MutationHookOptions<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables>(AcceptGroupInviteDocument, options);
      }
export type AcceptGroupInviteMutationHookResult = ReturnType<typeof useAcceptGroupInviteMutation>;
export type AcceptGroupInviteMutationResult = Apollo.MutationResult<AcceptGroupInviteMutation>;
export type AcceptGroupInviteMutationOptions = Apollo.BaseMutationOptions<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables>;
export const InviteToGroupDocument = gql`
    mutation InviteToGroup($email: String!, $groupId: ID!, $role: String) {
  inviteToGroup(email: $email, groupId: $groupId, role: $role) {
    inviteToken {
      id
      token
      email
      status
    }
  }
}
    `;
export type InviteToGroupMutationFn = Apollo.MutationFunction<InviteToGroupMutation, InviteToGroupMutationVariables>;

/**
 * __useInviteToGroupMutation__
 *
 * To run a mutation, you first call `useInviteToGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInviteToGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [inviteToGroupMutation, { data, loading, error }] = useInviteToGroupMutation({
 *   variables: {
 *      email: // value for 'email'
 *      groupId: // value for 'groupId'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useInviteToGroupMutation(baseOptions?: Apollo.MutationHookOptions<InviteToGroupMutation, InviteToGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<InviteToGroupMutation, InviteToGroupMutationVariables>(InviteToGroupDocument, options);
      }
export type InviteToGroupMutationHookResult = ReturnType<typeof useInviteToGroupMutation>;
export type InviteToGroupMutationResult = Apollo.MutationResult<InviteToGroupMutation>;
export type InviteToGroupMutationOptions = Apollo.BaseMutationOptions<InviteToGroupMutation, InviteToGroupMutationVariables>;
export const ScheduleSessionDocument = gql`
    mutation ScheduleSession($sessionId: ID!, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int, $timeBudgetMinutes: Int, $complexityPreference: String) {
  scheduleSession(
    sessionId: $sessionId
    scheduledAt: $scheduledAt
    location: $location
    capacity: $capacity
    timeBudgetMinutes: $timeBudgetMinutes
    complexityPreference: $complexityPreference
  ) {
    session {
      id
      state
    }
    invitesSent
  }
}
    `;
export type ScheduleSessionMutationFn = Apollo.MutationFunction<ScheduleSessionMutation, ScheduleSessionMutationVariables>;

/**
 * __useScheduleSessionMutation__
 *
 * To run a mutation, you first call `useScheduleSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useScheduleSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [scheduleSessionMutation, { data, loading, error }] = useScheduleSessionMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      scheduledAt: // value for 'scheduledAt'
 *      location: // value for 'location'
 *      capacity: // value for 'capacity'
 *      timeBudgetMinutes: // value for 'timeBudgetMinutes'
 *      complexityPreference: // value for 'complexityPreference'
 *   },
 * });
 */
export function useScheduleSessionMutation(baseOptions?: Apollo.MutationHookOptions<ScheduleSessionMutation, ScheduleSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ScheduleSessionMutation, ScheduleSessionMutationVariables>(ScheduleSessionDocument, options);
      }
export type ScheduleSessionMutationHookResult = ReturnType<typeof useScheduleSessionMutation>;
export type ScheduleSessionMutationResult = Apollo.MutationResult<ScheduleSessionMutation>;
export type ScheduleSessionMutationOptions = Apollo.BaseMutationOptions<ScheduleSessionMutation, ScheduleSessionMutationVariables>;
export const CancelSessionDocument = gql`
    mutation CancelSession($sessionId: ID!) {
  cancelSession(sessionId: $sessionId) {
    session {
      id
      state
    }
  }
}
    `;
export type CancelSessionMutationFn = Apollo.MutationFunction<CancelSessionMutation, CancelSessionMutationVariables>;

/**
 * __useCancelSessionMutation__
 *
 * To run a mutation, you first call `useCancelSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelSessionMutation, { data, loading, error }] = useCancelSessionMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useCancelSessionMutation(baseOptions?: Apollo.MutationHookOptions<CancelSessionMutation, CancelSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelSessionMutation, CancelSessionMutationVariables>(CancelSessionDocument, options);
      }
export type CancelSessionMutationHookResult = ReturnType<typeof useCancelSessionMutation>;
export type CancelSessionMutationResult = Apollo.MutationResult<CancelSessionMutation>;
export type CancelSessionMutationOptions = Apollo.BaseMutationOptions<CancelSessionMutation, CancelSessionMutationVariables>;
export const ReopenSessionDocument = gql`
    mutation ReopenSession($sessionId: ID!) {
  reopenSession(sessionId: $sessionId) {
    session {
      id
      state
    }
  }
}
    `;
export type ReopenSessionMutationFn = Apollo.MutationFunction<ReopenSessionMutation, ReopenSessionMutationVariables>;

/**
 * __useReopenSessionMutation__
 *
 * To run a mutation, you first call `useReopenSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReopenSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reopenSessionMutation, { data, loading, error }] = useReopenSessionMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useReopenSessionMutation(baseOptions?: Apollo.MutationHookOptions<ReopenSessionMutation, ReopenSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ReopenSessionMutation, ReopenSessionMutationVariables>(ReopenSessionDocument, options);
      }
export type ReopenSessionMutationHookResult = ReturnType<typeof useReopenSessionMutation>;
export type ReopenSessionMutationResult = Apollo.MutationResult<ReopenSessionMutation>;
export type ReopenSessionMutationOptions = Apollo.BaseMutationOptions<ReopenSessionMutation, ReopenSessionMutationVariables>;
export const UpdateSessionDetailsDocument = gql`
    mutation UpdateSessionDetails($sessionId: ID!, $title: String, $description: String, $location: String, $scheduledAt: ISO8601DateTime, $capacity: Int) {
  updateSessionDetails(
    sessionId: $sessionId
    title: $title
    description: $description
    location: $location
    scheduledAt: $scheduledAt
    capacity: $capacity
  ) {
    session {
      id
      title
      description
      location
      scheduledAt
      capacity
      state
    }
  }
}
    `;
export type UpdateSessionDetailsMutationFn = Apollo.MutationFunction<UpdateSessionDetailsMutation, UpdateSessionDetailsMutationVariables>;

/**
 * __useUpdateSessionDetailsMutation__
 *
 * To run a mutation, you first call `useUpdateSessionDetailsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSessionDetailsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSessionDetailsMutation, { data, loading, error }] = useUpdateSessionDetailsMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      title: // value for 'title'
 *      description: // value for 'description'
 *      location: // value for 'location'
 *      scheduledAt: // value for 'scheduledAt'
 *      capacity: // value for 'capacity'
 *   },
 * });
 */
export function useUpdateSessionDetailsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSessionDetailsMutation, UpdateSessionDetailsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSessionDetailsMutation, UpdateSessionDetailsMutationVariables>(UpdateSessionDetailsDocument, options);
      }
export type UpdateSessionDetailsMutationHookResult = ReturnType<typeof useUpdateSessionDetailsMutation>;
export type UpdateSessionDetailsMutationResult = Apollo.MutationResult<UpdateSessionDetailsMutation>;
export type UpdateSessionDetailsMutationOptions = Apollo.BaseMutationOptions<UpdateSessionDetailsMutation, UpdateSessionDetailsMutationVariables>;
export const UpdateSessionPreferencesDocument = gql`
    mutation UpdateSessionPreferences($sessionId: ID!, $timeBudgetMinutes: Int, $complexityPreference: String) {
  updateSessionPreferences(
    sessionId: $sessionId
    timeBudgetMinutes: $timeBudgetMinutes
    complexityPreference: $complexityPreference
  ) {
    session {
      id
      timeBudgetMinutes
      complexityPreference
    }
  }
}
    `;
export type UpdateSessionPreferencesMutationFn = Apollo.MutationFunction<UpdateSessionPreferencesMutation, UpdateSessionPreferencesMutationVariables>;

/**
 * __useUpdateSessionPreferencesMutation__
 *
 * To run a mutation, you first call `useUpdateSessionPreferencesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSessionPreferencesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSessionPreferencesMutation, { data, loading, error }] = useUpdateSessionPreferencesMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      timeBudgetMinutes: // value for 'timeBudgetMinutes'
 *      complexityPreference: // value for 'complexityPreference'
 *   },
 * });
 */
export function useUpdateSessionPreferencesMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSessionPreferencesMutation, UpdateSessionPreferencesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSessionPreferencesMutation, UpdateSessionPreferencesMutationVariables>(UpdateSessionPreferencesDocument, options);
      }
export type UpdateSessionPreferencesMutationHookResult = ReturnType<typeof useUpdateSessionPreferencesMutation>;
export type UpdateSessionPreferencesMutationResult = Apollo.MutationResult<UpdateSessionPreferencesMutation>;
export type UpdateSessionPreferencesMutationOptions = Apollo.BaseMutationOptions<UpdateSessionPreferencesMutation, UpdateSessionPreferencesMutationVariables>;
export const RemoveGroupMemberDocument = gql`
    mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
  removeGroupMember(groupId: $groupId, userId: $userId) {
    success
    removedMembershipId
  }
}
    `;
export type RemoveGroupMemberMutationFn = Apollo.MutationFunction<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>;

/**
 * __useRemoveGroupMemberMutation__
 *
 * To run a mutation, you first call `useRemoveGroupMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveGroupMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeGroupMemberMutation, { data, loading, error }] = useRemoveGroupMemberMutation({
 *   variables: {
 *      groupId: // value for 'groupId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useRemoveGroupMemberMutation(baseOptions?: Apollo.MutationHookOptions<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>(RemoveGroupMemberDocument, options);
      }
export type RemoveGroupMemberMutationHookResult = ReturnType<typeof useRemoveGroupMemberMutation>;
export type RemoveGroupMemberMutationResult = Apollo.MutationResult<RemoveGroupMemberMutation>;
export type RemoveGroupMemberMutationOptions = Apollo.BaseMutationOptions<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>;
export const UpdateGroupMemberRoleDocument = gql`
    mutation UpdateGroupMemberRole($groupId: ID!, $userId: ID!, $role: String!) {
  updateGroupMemberRole(groupId: $groupId, userId: $userId, role: $role) {
    membership {
      id
      role
      user {
        id
        displayName
      }
    }
  }
}
    `;
export type UpdateGroupMemberRoleMutationFn = Apollo.MutationFunction<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>;

/**
 * __useUpdateGroupMemberRoleMutation__
 *
 * To run a mutation, you first call `useUpdateGroupMemberRoleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateGroupMemberRoleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateGroupMemberRoleMutation, { data, loading, error }] = useUpdateGroupMemberRoleMutation({
 *   variables: {
 *      groupId: // value for 'groupId'
 *      userId: // value for 'userId'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useUpdateGroupMemberRoleMutation(baseOptions?: Apollo.MutationHookOptions<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>(UpdateGroupMemberRoleDocument, options);
      }
export type UpdateGroupMemberRoleMutationHookResult = ReturnType<typeof useUpdateGroupMemberRoleMutation>;
export type UpdateGroupMemberRoleMutationResult = Apollo.MutationResult<UpdateGroupMemberRoleMutation>;
export type UpdateGroupMemberRoleMutationOptions = Apollo.BaseMutationOptions<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>;
export const UpgradeToAccountDocument = gql`
    mutation UpgradeToAccount($email: String!, $password: String!, $bggUsername: String) {
  upgradeToAccount(email: $email, password: $password, bggUsername: $bggUsername) {
    token
    user {
      id
      username
      email
      displayName
      isProvisional
    }
  }
}
    `;
export type UpgradeToAccountMutationFn = Apollo.MutationFunction<UpgradeToAccountMutation, UpgradeToAccountMutationVariables>;

/**
 * __useUpgradeToAccountMutation__
 *
 * To run a mutation, you first call `useUpgradeToAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpgradeToAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upgradeToAccountMutation, { data, loading, error }] = useUpgradeToAccountMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *      bggUsername: // value for 'bggUsername'
 *   },
 * });
 */
export function useUpgradeToAccountMutation(baseOptions?: Apollo.MutationHookOptions<UpgradeToAccountMutation, UpgradeToAccountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpgradeToAccountMutation, UpgradeToAccountMutationVariables>(UpgradeToAccountDocument, options);
      }
export type UpgradeToAccountMutationHookResult = ReturnType<typeof useUpgradeToAccountMutation>;
export type UpgradeToAccountMutationResult = Apollo.MutationResult<UpgradeToAccountMutation>;
export type UpgradeToAccountMutationOptions = Apollo.BaseMutationOptions<UpgradeToAccountMutation, UpgradeToAccountMutationVariables>;
export const SubmitScoresDocument = gql`
    mutation SubmitScores($sessionId: ID!, $scores: [ScoreInput!]!) {
  submitScores(sessionId: $sessionId, scores: $scores) {
    session {
      id
      scores {
        id
        score
        rank
        user {
          id
          displayName
          avatar
        }
      }
    }
  }
}
    `;
export type SubmitScoresMutationFn = Apollo.MutationFunction<SubmitScoresMutation, SubmitScoresMutationVariables>;

/**
 * __useSubmitScoresMutation__
 *
 * To run a mutation, you first call `useSubmitScoresMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitScoresMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitScoresMutation, { data, loading, error }] = useSubmitScoresMutation({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *      scores: // value for 'scores'
 *   },
 * });
 */
export function useSubmitScoresMutation(baseOptions?: Apollo.MutationHookOptions<SubmitScoresMutation, SubmitScoresMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SubmitScoresMutation, SubmitScoresMutationVariables>(SubmitScoresDocument, options);
      }
export type SubmitScoresMutationHookResult = ReturnType<typeof useSubmitScoresMutation>;
export type SubmitScoresMutationResult = Apollo.MutationResult<SubmitScoresMutation>;
export type SubmitScoresMutationOptions = Apollo.BaseMutationOptions<SubmitScoresMutation, SubmitScoresMutationVariables>;
export const CollectionSyncedDocument = gql`
    subscription CollectionSynced($username: String!) {
  collectionSynced(username: $username) {
    username
    status
    error
    gameCount
    lastSyncedAt
  }
}
    `;

/**
 * __useCollectionSyncedSubscription__
 *
 * To run a query within a React component, call `useCollectionSyncedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useCollectionSyncedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCollectionSyncedSubscription({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useCollectionSyncedSubscription(baseOptions: Apollo.SubscriptionHookOptions<CollectionSyncedSubscription, CollectionSyncedSubscriptionVariables> & ({ variables: CollectionSyncedSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<CollectionSyncedSubscription, CollectionSyncedSubscriptionVariables>(CollectionSyncedDocument, options);
      }
export type CollectionSyncedSubscriptionHookResult = ReturnType<typeof useCollectionSyncedSubscription>;
export type CollectionSyncedSubscriptionResult = Apollo.SubscriptionResult<CollectionSyncedSubscription>;
export const MyPlaysDocument = gql`
    query MyPlays($limit: Int) {
  myPlays(limit: $limit) {
    id
    date
    quantity
    bggGameObjectid
    gameName
    lengthMinutes
    incomplete
    nowInStats
    location
    comments
    winnersCount
    user {
      id
      displayName
      avatar
    }
    players {
      id
      bggUsername
      name
      score
      win
    }
  }
}
    `;

/**
 * __useMyPlaysQuery__
 *
 * To run a query within a React component, call `useMyPlaysQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyPlaysQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyPlaysQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useMyPlaysQuery(baseOptions?: Apollo.QueryHookOptions<MyPlaysQuery, MyPlaysQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyPlaysQuery, MyPlaysQueryVariables>(MyPlaysDocument, options);
      }
export function useMyPlaysLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyPlaysQuery, MyPlaysQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyPlaysQuery, MyPlaysQueryVariables>(MyPlaysDocument, options);
        }
// @ts-ignore
export function useMyPlaysSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyPlaysQuery, MyPlaysQueryVariables>): Apollo.UseSuspenseQueryResult<MyPlaysQuery, MyPlaysQueryVariables>;
export function useMyPlaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyPlaysQuery, MyPlaysQueryVariables>): Apollo.UseSuspenseQueryResult<MyPlaysQuery | undefined, MyPlaysQueryVariables>;
export function useMyPlaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyPlaysQuery, MyPlaysQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyPlaysQuery, MyPlaysQueryVariables>(MyPlaysDocument, options);
        }
export type MyPlaysQueryHookResult = ReturnType<typeof useMyPlaysQuery>;
export type MyPlaysLazyQueryHookResult = ReturnType<typeof useMyPlaysLazyQuery>;
export type MyPlaysSuspenseQueryHookResult = ReturnType<typeof useMyPlaysSuspenseQuery>;
export type MyPlaysQueryResult = Apollo.QueryResult<MyPlaysQuery, MyPlaysQueryVariables>;
export const GroupPlaysDocument = gql`
    query GroupPlays($groupId: ID!, $limit: Int) {
  groupPlays(groupId: $groupId, limit: $limit) {
    id
    date
    quantity
    bggGameObjectid
    gameName
    lengthMinutes
    incomplete
    nowInStats
    location
    comments
    winnersCount
    user {
      id
      displayName
      avatar
    }
    players {
      id
      bggUsername
      name
      score
      win
    }
  }
}
    `;

/**
 * __useGroupPlaysQuery__
 *
 * To run a query within a React component, call `useGroupPlaysQuery` and pass it any options that fit your needs.
 * When your component renders, `useGroupPlaysQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGroupPlaysQuery({
 *   variables: {
 *      groupId: // value for 'groupId'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGroupPlaysQuery(baseOptions: Apollo.QueryHookOptions<GroupPlaysQuery, GroupPlaysQueryVariables> & ({ variables: GroupPlaysQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GroupPlaysQuery, GroupPlaysQueryVariables>(GroupPlaysDocument, options);
      }
export function useGroupPlaysLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GroupPlaysQuery, GroupPlaysQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GroupPlaysQuery, GroupPlaysQueryVariables>(GroupPlaysDocument, options);
        }
// @ts-ignore
export function useGroupPlaysSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GroupPlaysQuery, GroupPlaysQueryVariables>): Apollo.UseSuspenseQueryResult<GroupPlaysQuery, GroupPlaysQueryVariables>;
export function useGroupPlaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GroupPlaysQuery, GroupPlaysQueryVariables>): Apollo.UseSuspenseQueryResult<GroupPlaysQuery | undefined, GroupPlaysQueryVariables>;
export function useGroupPlaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GroupPlaysQuery, GroupPlaysQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GroupPlaysQuery, GroupPlaysQueryVariables>(GroupPlaysDocument, options);
        }
export type GroupPlaysQueryHookResult = ReturnType<typeof useGroupPlaysQuery>;
export type GroupPlaysLazyQueryHookResult = ReturnType<typeof useGroupPlaysLazyQuery>;
export type GroupPlaysSuspenseQueryHookResult = ReturnType<typeof useGroupPlaysSuspenseQuery>;
export type GroupPlaysQueryResult = Apollo.QueryResult<GroupPlaysQuery, GroupPlaysQueryVariables>;
export const GamePlaysDocument = gql`
    query GamePlays($groupId: ID!, $objectid: Int!, $limit: Int) {
  gamePlays(groupId: $groupId, objectid: $objectid, limit: $limit) {
    id
    date
    quantity
    bggGameObjectid
    gameName
    lengthMinutes
    incomplete
    nowInStats
    location
    comments
    winnersCount
    user {
      id
      displayName
      avatar
    }
    players {
      id
      bggUsername
      name
      score
      win
    }
  }
}
    `;

/**
 * __useGamePlaysQuery__
 *
 * To run a query within a React component, call `useGamePlaysQuery` and pass it any options that fit your needs.
 * When your component renders, `useGamePlaysQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGamePlaysQuery({
 *   variables: {
 *      groupId: // value for 'groupId'
 *      objectid: // value for 'objectid'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGamePlaysQuery(baseOptions: Apollo.QueryHookOptions<GamePlaysQuery, GamePlaysQueryVariables> & ({ variables: GamePlaysQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GamePlaysQuery, GamePlaysQueryVariables>(GamePlaysDocument, options);
      }
export function useGamePlaysLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GamePlaysQuery, GamePlaysQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GamePlaysQuery, GamePlaysQueryVariables>(GamePlaysDocument, options);
        }
// @ts-ignore
export function useGamePlaysSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GamePlaysQuery, GamePlaysQueryVariables>): Apollo.UseSuspenseQueryResult<GamePlaysQuery, GamePlaysQueryVariables>;
export function useGamePlaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GamePlaysQuery, GamePlaysQueryVariables>): Apollo.UseSuspenseQueryResult<GamePlaysQuery | undefined, GamePlaysQueryVariables>;
export function useGamePlaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GamePlaysQuery, GamePlaysQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GamePlaysQuery, GamePlaysQueryVariables>(GamePlaysDocument, options);
        }
export type GamePlaysQueryHookResult = ReturnType<typeof useGamePlaysQuery>;
export type GamePlaysLazyQueryHookResult = ReturnType<typeof useGamePlaysLazyQuery>;
export type GamePlaysSuspenseQueryHookResult = ReturnType<typeof useGamePlaysSuspenseQuery>;
export type GamePlaysQueryResult = Apollo.QueryResult<GamePlaysQuery, GamePlaysQueryVariables>;
export const ImportPlaysDocument = gql`
    mutation ImportPlays($username: String!) {
  importPlays(username: $username) {
    success
    message
  }
}
    `;
export type ImportPlaysMutationFn = Apollo.MutationFunction<ImportPlaysMutation, ImportPlaysMutationVariables>;

/**
 * __useImportPlaysMutation__
 *
 * To run a mutation, you first call `useImportPlaysMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useImportPlaysMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [importPlaysMutation, { data, loading, error }] = useImportPlaysMutation({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useImportPlaysMutation(baseOptions?: Apollo.MutationHookOptions<ImportPlaysMutation, ImportPlaysMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ImportPlaysMutation, ImportPlaysMutationVariables>(ImportPlaysDocument, options);
      }
export type ImportPlaysMutationHookResult = ReturnType<typeof useImportPlaysMutation>;
export type ImportPlaysMutationResult = Apollo.MutationResult<ImportPlaysMutation>;
export type ImportPlaysMutationOptions = Apollo.BaseMutationOptions<ImportPlaysMutation, ImportPlaysMutationVariables>;