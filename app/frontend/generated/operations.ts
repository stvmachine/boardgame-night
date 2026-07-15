/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './types';

import gql from 'graphql-tag';
import * as VueApolloComposable from '@vue/apollo-composable';
import * as VueCompositionApi from '@vue/composition-api';
export * from './types';
export type ReactiveFunction<TParam> = () => TParam;
export type AcceptGroupInviteMutationVariables = Exact<{
  token: string;
}>;


export type AcceptGroupInviteMutation = { acceptGroupInvite: { group: { id: string, name: string, inviteCode: string | null, myRole: Types.GroupRole | null, owner: { id: string, username: string, displayName: string }, members: Array<{ id: string, username: string, displayName: string }> } } | null };

export type BindBggUsernameMutationVariables = Exact<{
  username: string;
}>;


export type BindBggUsernameMutation = { bindBggUsername: { user: { id: string, username: string, bggUsername: string | null, displayName: string } } | null };

export type CancelSessionMutationVariables = Exact<{
  sessionId: string | number;
}>;


export type CancelSessionMutation = { cancelSession: { session: { id: string, title: string, state: Types.SessionState, previousState: Types.SessionState | null, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, host: { id: string, displayName: string }, group: { id: string, name: string }, attendances: Array<{ id: string, response: string, user: { id: string, displayName: string } }>, pickedGame: { id: string, name: string, thumbnail: string | null, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, average: number | null, averageWeight: number | null, owners: Array<{ bggUsername: string, avatar: string | null }> } | null } } | null };

export type CreateGroupMutationVariables = Exact<{
  name: string;
  description?: string | null | undefined;
}>;


export type CreateGroupMutation = { createGroup: { group: { id: string, name: string, description: string | null, inviteCode: string | null, myRole: Types.GroupRole | null, owner: { id: string, username: string, displayName: string }, members: Array<{ id: string, username: string, displayName: string }> } } | null };

export type CreateNightSessionMutationVariables = Exact<{
  title: string;
  description?: string | null | undefined;
  groupId: string | number;
  scheduledAt?: unknown;
  location?: string | null | undefined;
  capacity?: number | null | undefined;
}>;


export type CreateNightSessionMutation = { createNightSession: { session: { id: string, title: string, description: string | null, state: Types.SessionState, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, attendances: Array<{ id: string, response: string, user: { id: string, username: string, displayName: string } }>, host: { id: string, username: string, displayName: string }, group: { id: string, name: string } } } | null };

export type ImportCollectionMutationVariables = Exact<{
  username: string;
}>;


export type ImportCollectionMutation = { importCollection: { user: { id: string, username: string, syncStatus: { username: string, status: Types.SyncStatus, lastSyncedAt: unknown, error: string | null, gameCount: number | null } } } | null };

export type InviteToGroupMutationVariables = Exact<{
  groupId: string | number;
  email: string;
  role?: string | null | undefined;
}>;


export type InviteToGroupMutation = { inviteToGroup: { inviteToken: { id: string, token: string | null, status: string, email: string, role: Types.GroupRole | null, expiresAt: unknown, group: { id: string, name: string } } } | null };

export type PickGameMutationVariables = Exact<{
  sessionId: string | number;
  gameId: string | number;
}>;


export type PickGameMutation = { pickGame: { session: { id: string, title: string, state: Types.SessionState, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, host: { id: string, displayName: string }, group: { id: string, name: string }, attendances: Array<{ id: string, response: string, user: { id: string, displayName: string } }>, pickedGame: { id: string, name: string, thumbnail: string | null, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, average: number | null, averageWeight: number | null, owners: Array<{ bggUsername: string, avatar: string | null }> } | null } } | null };

export type RemoveGroupMemberMutationVariables = Exact<{
  groupId: string | number;
  userId: string | number;
}>;


export type RemoveGroupMemberMutation = { removeGroupMember: { success: boolean, removedMembershipId: string | null } | null };

export type ReopenSessionMutationVariables = Exact<{
  sessionId: string | number;
}>;


export type ReopenSessionMutation = { reopenSession: { session: { id: string, title: string, state: Types.SessionState, previousState: Types.SessionState | null, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, host: { id: string, displayName: string }, group: { id: string, name: string }, attendances: Array<{ id: string, response: string, user: { id: string, displayName: string } }>, pickedGame: { id: string, name: string, thumbnail: string | null } | null } } | null };

export type RsvpMutationVariables = Exact<{
  token: string;
  response: string;
  nickname?: string | null | undefined;
}>;


export type RsvpMutation = { rsvp: { attendance: { id: string, response: string, respondedAt: unknown, user: { id: string, username: string, displayName: string, isProvisional: boolean } }, session: { id: string, title: string, state: Types.SessionState, scheduledAt: unknown, location: string | null, attendeeCount: number, host: { id: string, username: string, displayName: string } } } | null };

export type ScheduleSessionMutationVariables = Exact<{
  sessionId: string | number;
  scheduledAt?: unknown;
  location?: string | null | undefined;
  capacity?: number | null | undefined;
}>;


export type ScheduleSessionMutation = { scheduleSession: { invitesSent: number, session: { id: string, title: string, description: string | null, state: Types.SessionState, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, host: { id: string, username: string, displayName: string }, group: { id: string, name: string } } } | null };

export type SignInMutationVariables = Exact<{
  email: string;
  password: string;
}>;


export type SignInMutation = { signIn: { token: string, user: { id: string, username: string, email: string | null, displayName: string } } | null };

export type SignOutMutationVariables = Exact<{ [key: string]: never; }>;


export type SignOutMutation = { signOut: { success: boolean } | null };

export type SignUpMutationVariables = Exact<{
  email: string;
  password: string;
  username: string;
}>;


export type SignUpMutation = { signUp: { token: string, user: { id: string, username: string, email: string | null, displayName: string, isProvisional: boolean } } | null };

export type StartPickingMutationVariables = Exact<{
  sessionId: string | number;
}>;


export type StartPickingMutation = { startPicking: { session: { id: string, title: string, state: Types.SessionState, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, host: { id: string, displayName: string }, group: { id: string, name: string }, attendances: Array<{ id: string, response: string, user: { id: string, displayName: string } }>, pickedGame: { id: string, name: string, thumbnail: string | null } | null } } | null };

export type UpdateGroupMemberRoleMutationVariables = Exact<{
  groupId: string | number;
  userId: string | number;
  role: string;
}>;


export type UpdateGroupMemberRoleMutation = { updateGroupMemberRole: { membership: { id: string, role: Types.GroupRole, user: { id: string, username: string, displayName: string } } } | null };

export type UpgradeToAccountMutationVariables = Exact<{
  email: string;
  password: string;
  bggUsername?: string | null | undefined;
}>;


export type UpgradeToAccountMutation = { upgradeToAccount: { token: string, user: { id: string, username: string, email: string | null, isProvisional: boolean } } | null };

export type ValidateBggUsernameMutationVariables = Exact<{
  username: string;
}>;


export type ValidateBggUsernameMutation = { validateBggUsername: { validationResult: { valid: boolean, username: string, exists: boolean, avatar: string | null } } | null };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { currentUser: { id: string, username: string, displayName: string, email: string | null, isProvisional: boolean, bggUsername: string | null } | null };

export type GroupQueryVariables = Exact<{
  token: string;
}>;


export type GroupQuery = { group: { id: string, name: string, description: string | null, inviteCode: string | null, myRole: Types.GroupRole | null, owner: { id: string, username: string, displayName: string }, members: Array<{ id: string, username: string, displayName: string }>, memberships: Array<{ id: string, role: Types.GroupRole, user: { id: string, username: string, displayName: string } }>, sessions: Array<{ id: string, title: string, state: Types.SessionState, scheduledAt: unknown, attendeeCount: number, attendances: Array<{ id: string, response: string, user: { id: string, username: string, displayName: string } }> }>, collectionSpotlight: Array<{ id: string, objectid: string, name: string, thumbnail: string | null, average: number | null, owners: Array<{ bggUsername: string, avatar: string | null }> }> } | null };

export type GroupCollectionQueryVariables = Exact<{
  token: string;
}>;


export type GroupCollectionQuery = { group: { id: string, name: string, description: string | null, inviteCode: string | null, myRole: Types.GroupRole | null, owner: { id: string, username: string, displayName: string }, members: Array<{ id: string, username: string, displayName: string, bggUsername: string | null }>, memberships: Array<{ id: string, role: Types.GroupRole, user: { id: string, username: string, displayName: string, bggUsername: string | null } }>, collection: { items: Array<{ id: string, name: string, thumbnail: string | null, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, average: number | null, averageWeight: number | null, owners: Array<{ bggUsername: string, avatar: string | null }> }>, syncStatuses: Array<{ username: string, status: Types.SyncStatus, lastSyncedAt: unknown, gameCount: number | null }> } } | null };

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { health: string };

export type HotItemsQueryVariables = Exact<{ [key: string]: never; }>;


export type HotItemsQuery = { hotItems: Array<{ id: string, rank: number, name: string, yearPublished: number | null, thumbnail: string | null }> };

export type MergedCollectionQueryVariables = Exact<{
  usernames: Array<string> | string;
}>;


export type MergedCollectionQuery = { mergedCollection: { items: Array<{ id: string, name: string, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, minAge: number | null, image: string | null, thumbnail: string | null, description: string | null, average: number | null, bayesAverage: number | null, usersRated: number | null, averageWeight: number | null, isExpansion: boolean, owners: Array<{ bggUsername: string, avatar: string | null }> }>, syncStatuses: Array<{ username: string, status: Types.SyncStatus, lastSyncedAt: unknown, error: string | null, gameCount: number | null }> } };

export type MyGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyGroupsQuery = { myGroups: Array<{ id: string, name: string, description: string | null, inviteCode: string | null, myRole: Types.GroupRole | null, owner: { id: string, username: string, displayName: string }, members: Array<{ id: string, username: string, displayName: string }> }> };

export type NightSessionQueryVariables = Exact<{
  id: string | number;
}>;


export type NightSessionQuery = { nightSession: { id: string, title: string, description: string | null, state: Types.SessionState, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, previousState: Types.SessionState | null, host: { id: string, username: string, displayName: string }, group: { id: string, name: string, inviteCode: string | null, myRole: Types.GroupRole | null, members: Array<{ id: string, username: string, displayName: string }> }, attendances: Array<{ id: string, response: string, respondedAt: unknown, user: { id: string, username: string, displayName: string } }>, pickedGame: { id: string, name: string, thumbnail: string | null, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, average: number | null, averageWeight: number | null, owners: Array<{ bggUsername: string, avatar: string | null }> } | null } | null };

export type SearchQueryVariables = Exact<{
  query: string;
}>;


export type SearchQuery = { search: Array<{ id: string, name: string, yearPublished: number | null }> };

export type SessionInviteQueryVariables = Exact<{
  token: string;
}>;


export type SessionInviteQuery = { sessionInvite: { id: string, status: string, email: string, expiresAt: unknown, session: { id: string, title: string, description: string | null, state: Types.SessionState, scheduledAt: unknown, location: string | null, capacity: number | null, attendeeCount: number, host: { id: string, username: string, displayName: string }, group: { id: string, name: string } } | null, group: { id: string, name: string } } | null };

export type UserQueryVariables = Exact<{
  username: string;
}>;


export type UserQuery = { user: { username: string, avatar: string | null } | null };

export type CollectionSyncedSubscriptionVariables = Exact<{
  username: string;
}>;


export type CollectionSyncedSubscription = { collectionSynced: { username: string, status: Types.SyncStatus, lastSyncedAt: unknown, error: string | null, gameCount: number | null } };


export const AcceptGroupInviteDocument = gql`
    mutation AcceptGroupInvite($token: String!) {
  acceptGroupInvite(token: $token) {
    group {
      id
      name
      inviteCode
      myRole
      owner {
        id
        username
        displayName
      }
      members {
        id
        username
        displayName
      }
    }
  }
}
    `;

/**
 * __useAcceptGroupInviteMutation__
 *
 * To run a mutation, you first call `useAcceptGroupInviteMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useAcceptGroupInviteMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useAcceptGroupInviteMutation({
 *   variables: {
 *     token: // value for 'token'
 *   },
 * });
 */
export function useAcceptGroupInviteMutation(options: VueApolloComposable.UseMutationOptions<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables>(AcceptGroupInviteDocument, options);
}
export type AcceptGroupInviteMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<AcceptGroupInviteMutation, AcceptGroupInviteMutationVariables>;
export const BindBggUsernameDocument = gql`
    mutation BindBggUsername($username: String!) {
  bindBggUsername(username: $username) {
    user {
      id
      username
      bggUsername
      displayName
    }
  }
}
    `;

/**
 * __useBindBggUsernameMutation__
 *
 * To run a mutation, you first call `useBindBggUsernameMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useBindBggUsernameMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useBindBggUsernameMutation({
 *   variables: {
 *     username: // value for 'username'
 *   },
 * });
 */
export function useBindBggUsernameMutation(options: VueApolloComposable.UseMutationOptions<BindBggUsernameMutation, BindBggUsernameMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<BindBggUsernameMutation, BindBggUsernameMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<BindBggUsernameMutation, BindBggUsernameMutationVariables>(BindBggUsernameDocument, options);
}
export type BindBggUsernameMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<BindBggUsernameMutation, BindBggUsernameMutationVariables>;
export const CancelSessionDocument = gql`
    mutation CancelSession($sessionId: ID!) {
  cancelSession(sessionId: $sessionId) {
    session {
      id
      title
      state
      previousState
      scheduledAt
      location
      capacity
      attendeeCount
      host {
        id
        displayName
      }
      group {
        id
        name
      }
      attendances {
        id
        response
        user {
          id
          displayName
        }
      }
      pickedGame {
        id
        name
        thumbnail
        yearPublished
        minPlayers
        maxPlayers
        minPlaytime
        maxPlaytime
        average
        averageWeight
        owners {
          bggUsername
          avatar
        }
      }
    }
  }
}
    `;

/**
 * __useCancelSessionMutation__
 *
 * To run a mutation, you first call `useCancelSessionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCancelSessionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCancelSessionMutation({
 *   variables: {
 *     sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useCancelSessionMutation(options: VueApolloComposable.UseMutationOptions<CancelSessionMutation, CancelSessionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CancelSessionMutation, CancelSessionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CancelSessionMutation, CancelSessionMutationVariables>(CancelSessionDocument, options);
}
export type CancelSessionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CancelSessionMutation, CancelSessionMutationVariables>;
export const CreateGroupDocument = gql`
    mutation CreateGroup($name: String!, $description: String) {
  createGroup(name: $name, description: $description) {
    group {
      id
      name
      description
      inviteCode
      myRole
      owner {
        id
        username
        displayName
      }
      members {
        id
        username
        displayName
      }
    }
  }
}
    `;

/**
 * __useCreateGroupMutation__
 *
 * To run a mutation, you first call `useCreateGroupMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreateGroupMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreateGroupMutation({
 *   variables: {
 *     name: // value for 'name'
 *     description: // value for 'description'
 *   },
 * });
 */
export function useCreateGroupMutation(options: VueApolloComposable.UseMutationOptions<CreateGroupMutation, CreateGroupMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreateGroupMutation, CreateGroupMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreateGroupMutation, CreateGroupMutationVariables>(CreateGroupDocument, options);
}
export type CreateGroupMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreateGroupMutation, CreateGroupMutationVariables>;
export const CreateNightSessionDocument = gql`
    mutation CreateNightSession($title: String!, $description: String, $groupId: ID!, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int) {
  createNightSession(
    title: $title
    description: $description
    groupId: $groupId
    scheduledAt: $scheduledAt
    location: $location
    capacity: $capacity
  ) {
    session {
      id
      title
      description
      state
      scheduledAt
      location
      capacity
      attendeeCount
      attendances {
        id
        response
        user {
          id
          username
          displayName
        }
      }
      host {
        id
        username
        displayName
      }
      group {
        id
        name
      }
    }
  }
}
    `;

/**
 * __useCreateNightSessionMutation__
 *
 * To run a mutation, you first call `useCreateNightSessionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useCreateNightSessionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useCreateNightSessionMutation({
 *   variables: {
 *     title: // value for 'title'
 *     description: // value for 'description'
 *     groupId: // value for 'groupId'
 *     scheduledAt: // value for 'scheduledAt'
 *     location: // value for 'location'
 *     capacity: // value for 'capacity'
 *   },
 * });
 */
export function useCreateNightSessionMutation(options: VueApolloComposable.UseMutationOptions<CreateNightSessionMutation, CreateNightSessionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<CreateNightSessionMutation, CreateNightSessionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<CreateNightSessionMutation, CreateNightSessionMutationVariables>(CreateNightSessionDocument, options);
}
export type CreateNightSessionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<CreateNightSessionMutation, CreateNightSessionMutationVariables>;
export const ImportCollectionDocument = gql`
    mutation ImportCollection($username: String!) {
  importCollection(username: $username) {
    user {
      id
      username
      syncStatus {
        username
        status
        lastSyncedAt
        error
        gameCount
      }
    }
  }
}
    `;

/**
 * __useImportCollectionMutation__
 *
 * To run a mutation, you first call `useImportCollectionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useImportCollectionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useImportCollectionMutation({
 *   variables: {
 *     username: // value for 'username'
 *   },
 * });
 */
export function useImportCollectionMutation(options: VueApolloComposable.UseMutationOptions<ImportCollectionMutation, ImportCollectionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ImportCollectionMutation, ImportCollectionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ImportCollectionMutation, ImportCollectionMutationVariables>(ImportCollectionDocument, options);
}
export type ImportCollectionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ImportCollectionMutation, ImportCollectionMutationVariables>;
export const InviteToGroupDocument = gql`
    mutation InviteToGroup($groupId: ID!, $email: String!, $role: String) {
  inviteToGroup(groupId: $groupId, email: $email, role: $role) {
    inviteToken {
      id
      token
      status
      email
      role
      expiresAt
      group {
        id
        name
      }
    }
  }
}
    `;

/**
 * __useInviteToGroupMutation__
 *
 * To run a mutation, you first call `useInviteToGroupMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useInviteToGroupMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useInviteToGroupMutation({
 *   variables: {
 *     groupId: // value for 'groupId'
 *     email: // value for 'email'
 *     role: // value for 'role'
 *   },
 * });
 */
export function useInviteToGroupMutation(options: VueApolloComposable.UseMutationOptions<InviteToGroupMutation, InviteToGroupMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<InviteToGroupMutation, InviteToGroupMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<InviteToGroupMutation, InviteToGroupMutationVariables>(InviteToGroupDocument, options);
}
export type InviteToGroupMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<InviteToGroupMutation, InviteToGroupMutationVariables>;
export const PickGameDocument = gql`
    mutation PickGame($sessionId: ID!, $gameId: ID!) {
  pickGame(sessionId: $sessionId, gameId: $gameId) {
    session {
      id
      title
      state
      scheduledAt
      location
      capacity
      attendeeCount
      host {
        id
        displayName
      }
      group {
        id
        name
      }
      attendances {
        id
        response
        user {
          id
          displayName
        }
      }
      pickedGame {
        id
        name
        thumbnail
        yearPublished
        minPlayers
        maxPlayers
        minPlaytime
        maxPlaytime
        average
        averageWeight
        owners {
          bggUsername
          avatar
        }
      }
    }
  }
}
    `;

/**
 * __usePickGameMutation__
 *
 * To run a mutation, you first call `usePickGameMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `usePickGameMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = usePickGameMutation({
 *   variables: {
 *     sessionId: // value for 'sessionId'
 *     gameId: // value for 'gameId'
 *   },
 * });
 */
export function usePickGameMutation(options: VueApolloComposable.UseMutationOptions<PickGameMutation, PickGameMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<PickGameMutation, PickGameMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<PickGameMutation, PickGameMutationVariables>(PickGameDocument, options);
}
export type PickGameMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<PickGameMutation, PickGameMutationVariables>;
export const RemoveGroupMemberDocument = gql`
    mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
  removeGroupMember(groupId: $groupId, userId: $userId) {
    success
    removedMembershipId
  }
}
    `;

/**
 * __useRemoveGroupMemberMutation__
 *
 * To run a mutation, you first call `useRemoveGroupMemberMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useRemoveGroupMemberMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useRemoveGroupMemberMutation({
 *   variables: {
 *     groupId: // value for 'groupId'
 *     userId: // value for 'userId'
 *   },
 * });
 */
export function useRemoveGroupMemberMutation(options: VueApolloComposable.UseMutationOptions<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>(RemoveGroupMemberDocument, options);
}
export type RemoveGroupMemberMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>;
export const ReopenSessionDocument = gql`
    mutation ReopenSession($sessionId: ID!) {
  reopenSession(sessionId: $sessionId) {
    session {
      id
      title
      state
      previousState
      scheduledAt
      location
      capacity
      attendeeCount
      host {
        id
        displayName
      }
      group {
        id
        name
      }
      attendances {
        id
        response
        user {
          id
          displayName
        }
      }
      pickedGame {
        id
        name
        thumbnail
      }
    }
  }
}
    `;

/**
 * __useReopenSessionMutation__
 *
 * To run a mutation, you first call `useReopenSessionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useReopenSessionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useReopenSessionMutation({
 *   variables: {
 *     sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useReopenSessionMutation(options: VueApolloComposable.UseMutationOptions<ReopenSessionMutation, ReopenSessionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ReopenSessionMutation, ReopenSessionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ReopenSessionMutation, ReopenSessionMutationVariables>(ReopenSessionDocument, options);
}
export type ReopenSessionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ReopenSessionMutation, ReopenSessionMutationVariables>;
export const RsvpDocument = gql`
    mutation Rsvp($token: String!, $response: String!, $nickname: String) {
  rsvp(token: $token, response: $response, nickname: $nickname) {
    attendance {
      id
      response
      respondedAt
      user {
        id
        username
        displayName
        isProvisional
      }
    }
    session {
      id
      title
      state
      scheduledAt
      location
      attendeeCount
      host {
        id
        username
        displayName
      }
    }
  }
}
    `;

/**
 * __useRsvpMutation__
 *
 * To run a mutation, you first call `useRsvpMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useRsvpMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useRsvpMutation({
 *   variables: {
 *     token: // value for 'token'
 *     response: // value for 'response'
 *     nickname: // value for 'nickname'
 *   },
 * });
 */
export function useRsvpMutation(options: VueApolloComposable.UseMutationOptions<RsvpMutation, RsvpMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<RsvpMutation, RsvpMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<RsvpMutation, RsvpMutationVariables>(RsvpDocument, options);
}
export type RsvpMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<RsvpMutation, RsvpMutationVariables>;
export const ScheduleSessionDocument = gql`
    mutation ScheduleSession($sessionId: ID!, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int) {
  scheduleSession(
    sessionId: $sessionId
    scheduledAt: $scheduledAt
    location: $location
    capacity: $capacity
  ) {
    session {
      id
      title
      description
      state
      scheduledAt
      location
      capacity
      attendeeCount
      host {
        id
        username
        displayName
      }
      group {
        id
        name
      }
    }
    invitesSent
  }
}
    `;

/**
 * __useScheduleSessionMutation__
 *
 * To run a mutation, you first call `useScheduleSessionMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useScheduleSessionMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useScheduleSessionMutation({
 *   variables: {
 *     sessionId: // value for 'sessionId'
 *     scheduledAt: // value for 'scheduledAt'
 *     location: // value for 'location'
 *     capacity: // value for 'capacity'
 *   },
 * });
 */
export function useScheduleSessionMutation(options: VueApolloComposable.UseMutationOptions<ScheduleSessionMutation, ScheduleSessionMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ScheduleSessionMutation, ScheduleSessionMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ScheduleSessionMutation, ScheduleSessionMutationVariables>(ScheduleSessionDocument, options);
}
export type ScheduleSessionMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ScheduleSessionMutation, ScheduleSessionMutationVariables>;
export const SignInDocument = gql`
    mutation SignIn($email: String!, $password: String!) {
  signIn(email: $email, password: $password) {
    token
    user {
      id
      username
      email
      displayName
    }
  }
}
    `;

/**
 * __useSignInMutation__
 *
 * To run a mutation, you first call `useSignInMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSignInMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSignInMutation({
 *   variables: {
 *     email: // value for 'email'
 *     password: // value for 'password'
 *   },
 * });
 */
export function useSignInMutation(options: VueApolloComposable.UseMutationOptions<SignInMutation, SignInMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SignInMutation, SignInMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SignInMutation, SignInMutationVariables>(SignInDocument, options);
}
export type SignInMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SignInMutation, SignInMutationVariables>;
export const SignOutDocument = gql`
    mutation SignOut {
  signOut {
    success
  }
}
    `;

/**
 * __useSignOutMutation__
 *
 * To run a mutation, you first call `useSignOutMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSignOutMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSignOutMutation();
 */
export function useSignOutMutation(options: VueApolloComposable.UseMutationOptions<SignOutMutation, SignOutMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SignOutMutation, SignOutMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SignOutMutation, SignOutMutationVariables>(SignOutDocument, options);
}
export type SignOutMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SignOutMutation, SignOutMutationVariables>;
export const SignUpDocument = gql`
    mutation SignUp($email: String!, $password: String!, $username: String!) {
  signUp(email: $email, password: $password, username: $username) {
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

/**
 * __useSignUpMutation__
 *
 * To run a mutation, you first call `useSignUpMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useSignUpMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useSignUpMutation({
 *   variables: {
 *     email: // value for 'email'
 *     password: // value for 'password'
 *     username: // value for 'username'
 *   },
 * });
 */
export function useSignUpMutation(options: VueApolloComposable.UseMutationOptions<SignUpMutation, SignUpMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<SignUpMutation, SignUpMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<SignUpMutation, SignUpMutationVariables>(SignUpDocument, options);
}
export type SignUpMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<SignUpMutation, SignUpMutationVariables>;
export const StartPickingDocument = gql`
    mutation StartPicking($sessionId: ID!) {
  startPicking(sessionId: $sessionId) {
    session {
      id
      title
      state
      scheduledAt
      location
      capacity
      attendeeCount
      host {
        id
        displayName
      }
      group {
        id
        name
      }
      attendances {
        id
        response
        user {
          id
          displayName
        }
      }
      pickedGame {
        id
        name
        thumbnail
      }
    }
  }
}
    `;

/**
 * __useStartPickingMutation__
 *
 * To run a mutation, you first call `useStartPickingMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useStartPickingMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useStartPickingMutation({
 *   variables: {
 *     sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useStartPickingMutation(options: VueApolloComposable.UseMutationOptions<StartPickingMutation, StartPickingMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<StartPickingMutation, StartPickingMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<StartPickingMutation, StartPickingMutationVariables>(StartPickingDocument, options);
}
export type StartPickingMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<StartPickingMutation, StartPickingMutationVariables>;
export const UpdateGroupMemberRoleDocument = gql`
    mutation UpdateGroupMemberRole($groupId: ID!, $userId: ID!, $role: String!) {
  updateGroupMemberRole(groupId: $groupId, userId: $userId, role: $role) {
    membership {
      id
      role
      user {
        id
        username
        displayName
      }
    }
  }
}
    `;

/**
 * __useUpdateGroupMemberRoleMutation__
 *
 * To run a mutation, you first call `useUpdateGroupMemberRoleMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useUpdateGroupMemberRoleMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useUpdateGroupMemberRoleMutation({
 *   variables: {
 *     groupId: // value for 'groupId'
 *     userId: // value for 'userId'
 *     role: // value for 'role'
 *   },
 * });
 */
export function useUpdateGroupMemberRoleMutation(options: VueApolloComposable.UseMutationOptions<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>(UpdateGroupMemberRoleDocument, options);
}
export type UpdateGroupMemberRoleMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>;
export const UpgradeToAccountDocument = gql`
    mutation UpgradeToAccount($email: String!, $password: String!, $bggUsername: String) {
  upgradeToAccount(email: $email, password: $password, bggUsername: $bggUsername) {
    token
    user {
      id
      username
      email
      isProvisional
    }
  }
}
    `;

/**
 * __useUpgradeToAccountMutation__
 *
 * To run a mutation, you first call `useUpgradeToAccountMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useUpgradeToAccountMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useUpgradeToAccountMutation({
 *   variables: {
 *     email: // value for 'email'
 *     password: // value for 'password'
 *     bggUsername: // value for 'bggUsername'
 *   },
 * });
 */
export function useUpgradeToAccountMutation(options: VueApolloComposable.UseMutationOptions<UpgradeToAccountMutation, UpgradeToAccountMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<UpgradeToAccountMutation, UpgradeToAccountMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<UpgradeToAccountMutation, UpgradeToAccountMutationVariables>(UpgradeToAccountDocument, options);
}
export type UpgradeToAccountMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<UpgradeToAccountMutation, UpgradeToAccountMutationVariables>;
export const ValidateBggUsernameDocument = gql`
    mutation ValidateBggUsername($username: String!) {
  validateBggUsername(username: $username) {
    validationResult {
      valid
      username
      exists
      avatar
    }
  }
}
    `;

/**
 * __useValidateBggUsernameMutation__
 *
 * To run a mutation, you first call `useValidateBggUsernameMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useValidateBggUsernameMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useValidateBggUsernameMutation({
 *   variables: {
 *     username: // value for 'username'
 *   },
 * });
 */
export function useValidateBggUsernameMutation(options: VueApolloComposable.UseMutationOptions<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables>(ValidateBggUsernameDocument, options);
}
export type ValidateBggUsernameMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<ValidateBggUsernameMutation, ValidateBggUsernameMutationVariables>;
export const CurrentUserDocument = gql`
    query CurrentUser {
  currentUser {
    id
    username
    displayName
    email
    isProvisional
    bggUsername
  }
}
    `;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a Vue component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useCurrentUserQuery();
 */
export function useCurrentUserQuery(options: VueApolloComposable.UseQueryOptions<CurrentUserQuery, CurrentUserQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<CurrentUserQuery, CurrentUserQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<CurrentUserQuery, CurrentUserQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, {}, options);
}
export function useCurrentUserLazyQuery(options: VueApolloComposable.UseQueryOptions<CurrentUserQuery, CurrentUserQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<CurrentUserQuery, CurrentUserQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<CurrentUserQuery, CurrentUserQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, {}, options);
}
export type CurrentUserQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<CurrentUserQuery, CurrentUserQueryVariables>;
export const GroupDocument = gql`
    query Group($token: String!) {
  group(token: $token) {
    id
    name
    description
    inviteCode
    myRole
    owner {
      id
      username
      displayName
    }
    members {
      id
      username
      displayName
    }
    memberships {
      id
      role
      user {
        id
        username
        displayName
      }
    }
    sessions {
      id
      title
      state
      scheduledAt
      attendeeCount
      attendances {
        id
        response
        user {
          id
          username
          displayName
        }
      }
    }
    collectionSpotlight(limit: 4) {
      id
      objectid
      name
      thumbnail
      average
      owners {
        bggUsername
        avatar
      }
    }
  }
}
    `;

/**
 * __useGroupQuery__
 *
 * To run a query within a Vue component, call `useGroupQuery` and pass it any options that fit your needs.
 * When your component renders, `useGroupQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGroupQuery({
 *   token: // value for 'token'
 * });
 */
export function useGroupQuery(variables: GroupQueryVariables | VueCompositionApi.Ref<GroupQueryVariables> | ReactiveFunction<GroupQueryVariables>, options: VueApolloComposable.UseQueryOptions<GroupQuery, GroupQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GroupQuery, GroupQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GroupQuery, GroupQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GroupQuery, GroupQueryVariables>(GroupDocument, variables, options);
}
export function useGroupLazyQuery(variables?: GroupQueryVariables | VueCompositionApi.Ref<GroupQueryVariables> | ReactiveFunction<GroupQueryVariables>, options: VueApolloComposable.UseQueryOptions<GroupQuery, GroupQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GroupQuery, GroupQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GroupQuery, GroupQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GroupQuery, GroupQueryVariables>(GroupDocument, variables, options);
}
export type GroupQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GroupQuery, GroupQueryVariables>;
export const GroupCollectionDocument = gql`
    query GroupCollection($token: String!) {
  group(token: $token) {
    id
    name
    description
    inviteCode
    myRole
    owner {
      id
      username
      displayName
    }
    members {
      id
      username
      displayName
      bggUsername
    }
    memberships {
      id
      role
      user {
        id
        username
        displayName
        bggUsername
      }
    }
    collection {
      items {
        id
        name
        thumbnail
        yearPublished
        minPlayers
        maxPlayers
        minPlaytime
        maxPlaytime
        average
        averageWeight
        owners {
          bggUsername
          avatar
        }
      }
      syncStatuses {
        username
        status
        lastSyncedAt
        gameCount
      }
    }
  }
}
    `;

/**
 * __useGroupCollectionQuery__
 *
 * To run a query within a Vue component, call `useGroupCollectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGroupCollectionQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGroupCollectionQuery({
 *   token: // value for 'token'
 * });
 */
export function useGroupCollectionQuery(variables: GroupCollectionQueryVariables | VueCompositionApi.Ref<GroupCollectionQueryVariables> | ReactiveFunction<GroupCollectionQueryVariables>, options: VueApolloComposable.UseQueryOptions<GroupCollectionQuery, GroupCollectionQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GroupCollectionQuery, GroupCollectionQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GroupCollectionQuery, GroupCollectionQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GroupCollectionQuery, GroupCollectionQueryVariables>(GroupCollectionDocument, variables, options);
}
export function useGroupCollectionLazyQuery(variables?: GroupCollectionQueryVariables | VueCompositionApi.Ref<GroupCollectionQueryVariables> | ReactiveFunction<GroupCollectionQueryVariables>, options: VueApolloComposable.UseQueryOptions<GroupCollectionQuery, GroupCollectionQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GroupCollectionQuery, GroupCollectionQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GroupCollectionQuery, GroupCollectionQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GroupCollectionQuery, GroupCollectionQueryVariables>(GroupCollectionDocument, variables, options);
}
export type GroupCollectionQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GroupCollectionQuery, GroupCollectionQueryVariables>;
export const HealthDocument = gql`
    query Health {
  health
}
    `;

/**
 * __useHealthQuery__
 *
 * To run a query within a Vue component, call `useHealthQuery` and pass it any options that fit your needs.
 * When your component renders, `useHealthQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useHealthQuery();
 */
export function useHealthQuery(options: VueApolloComposable.UseQueryOptions<HealthQuery, HealthQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<HealthQuery, HealthQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<HealthQuery, HealthQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<HealthQuery, HealthQueryVariables>(HealthDocument, {}, options);
}
export function useHealthLazyQuery(options: VueApolloComposable.UseQueryOptions<HealthQuery, HealthQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<HealthQuery, HealthQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<HealthQuery, HealthQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<HealthQuery, HealthQueryVariables>(HealthDocument, {}, options);
}
export type HealthQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<HealthQuery, HealthQueryVariables>;
export const HotItemsDocument = gql`
    query HotItems {
  hotItems {
    id
    rank
    name
    yearPublished
    thumbnail
  }
}
    `;

/**
 * __useHotItemsQuery__
 *
 * To run a query within a Vue component, call `useHotItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHotItemsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useHotItemsQuery();
 */
export function useHotItemsQuery(options: VueApolloComposable.UseQueryOptions<HotItemsQuery, HotItemsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<HotItemsQuery, HotItemsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<HotItemsQuery, HotItemsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<HotItemsQuery, HotItemsQueryVariables>(HotItemsDocument, {}, options);
}
export function useHotItemsLazyQuery(options: VueApolloComposable.UseQueryOptions<HotItemsQuery, HotItemsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<HotItemsQuery, HotItemsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<HotItemsQuery, HotItemsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<HotItemsQuery, HotItemsQueryVariables>(HotItemsDocument, {}, options);
}
export type HotItemsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<HotItemsQuery, HotItemsQueryVariables>;
export const MergedCollectionDocument = gql`
    query MergedCollection($usernames: [String!]!) {
  mergedCollection(usernames: $usernames) {
    items {
      id
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
      owners {
        bggUsername
        avatar
      }
    }
    syncStatuses {
      username
      status
      lastSyncedAt
      error
      gameCount
    }
  }
}
    `;

/**
 * __useMergedCollectionQuery__
 *
 * To run a query within a Vue component, call `useMergedCollectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useMergedCollectionQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useMergedCollectionQuery({
 *   usernames: // value for 'usernames'
 * });
 */
export function useMergedCollectionQuery(variables: MergedCollectionQueryVariables | VueCompositionApi.Ref<MergedCollectionQueryVariables> | ReactiveFunction<MergedCollectionQueryVariables>, options: VueApolloComposable.UseQueryOptions<MergedCollectionQuery, MergedCollectionQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<MergedCollectionQuery, MergedCollectionQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<MergedCollectionQuery, MergedCollectionQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<MergedCollectionQuery, MergedCollectionQueryVariables>(MergedCollectionDocument, variables, options);
}
export function useMergedCollectionLazyQuery(variables?: MergedCollectionQueryVariables | VueCompositionApi.Ref<MergedCollectionQueryVariables> | ReactiveFunction<MergedCollectionQueryVariables>, options: VueApolloComposable.UseQueryOptions<MergedCollectionQuery, MergedCollectionQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<MergedCollectionQuery, MergedCollectionQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<MergedCollectionQuery, MergedCollectionQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<MergedCollectionQuery, MergedCollectionQueryVariables>(MergedCollectionDocument, variables, options);
}
export type MergedCollectionQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<MergedCollectionQuery, MergedCollectionQueryVariables>;
export const MyGroupsDocument = gql`
    query MyGroups {
  myGroups {
    id
    name
    description
    inviteCode
    myRole
    owner {
      id
      username
      displayName
    }
    members {
      id
      username
      displayName
    }
  }
}
    `;

/**
 * __useMyGroupsQuery__
 *
 * To run a query within a Vue component, call `useMyGroupsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyGroupsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useMyGroupsQuery();
 */
export function useMyGroupsQuery(options: VueApolloComposable.UseQueryOptions<MyGroupsQuery, MyGroupsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<MyGroupsQuery, MyGroupsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<MyGroupsQuery, MyGroupsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<MyGroupsQuery, MyGroupsQueryVariables>(MyGroupsDocument, {}, options);
}
export function useMyGroupsLazyQuery(options: VueApolloComposable.UseQueryOptions<MyGroupsQuery, MyGroupsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<MyGroupsQuery, MyGroupsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<MyGroupsQuery, MyGroupsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<MyGroupsQuery, MyGroupsQueryVariables>(MyGroupsDocument, {}, options);
}
export type MyGroupsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<MyGroupsQuery, MyGroupsQueryVariables>;
export const NightSessionDocument = gql`
    query NightSession($id: ID!) {
  nightSession(id: $id) {
    id
    title
    description
    state
    scheduledAt
    location
    capacity
    attendeeCount
    host {
      id
      username
      displayName
    }
    group {
      id
      name
      inviteCode
      myRole
      members {
        id
        username
        displayName
      }
    }
    attendances {
      id
      response
      respondedAt
      user {
        id
        username
        displayName
      }
    }
    pickedGame {
      id
      name
      thumbnail
      yearPublished
      minPlayers
      maxPlayers
      minPlaytime
      maxPlaytime
      average
      averageWeight
      owners {
        bggUsername
        avatar
      }
    }
    previousState
  }
}
    `;

/**
 * __useNightSessionQuery__
 *
 * To run a query within a Vue component, call `useNightSessionQuery` and pass it any options that fit your needs.
 * When your component renders, `useNightSessionQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useNightSessionQuery({
 *   id: // value for 'id'
 * });
 */
export function useNightSessionQuery(variables: NightSessionQueryVariables | VueCompositionApi.Ref<NightSessionQueryVariables> | ReactiveFunction<NightSessionQueryVariables>, options: VueApolloComposable.UseQueryOptions<NightSessionQuery, NightSessionQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<NightSessionQuery, NightSessionQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<NightSessionQuery, NightSessionQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<NightSessionQuery, NightSessionQueryVariables>(NightSessionDocument, variables, options);
}
export function useNightSessionLazyQuery(variables?: NightSessionQueryVariables | VueCompositionApi.Ref<NightSessionQueryVariables> | ReactiveFunction<NightSessionQueryVariables>, options: VueApolloComposable.UseQueryOptions<NightSessionQuery, NightSessionQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<NightSessionQuery, NightSessionQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<NightSessionQuery, NightSessionQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<NightSessionQuery, NightSessionQueryVariables>(NightSessionDocument, variables, options);
}
export type NightSessionQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<NightSessionQuery, NightSessionQueryVariables>;
export const SearchDocument = gql`
    query Search($query: String!) {
  search(query: $query) {
    id
    name
    yearPublished
  }
}
    `;

/**
 * __useSearchQuery__
 *
 * To run a query within a Vue component, call `useSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useSearchQuery({
 *   query: // value for 'query'
 * });
 */
export function useSearchQuery(variables: SearchQueryVariables | VueCompositionApi.Ref<SearchQueryVariables> | ReactiveFunction<SearchQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchQuery, SearchQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchQuery, SearchQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchQuery, SearchQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<SearchQuery, SearchQueryVariables>(SearchDocument, variables, options);
}
export function useSearchLazyQuery(variables?: SearchQueryVariables | VueCompositionApi.Ref<SearchQueryVariables> | ReactiveFunction<SearchQueryVariables>, options: VueApolloComposable.UseQueryOptions<SearchQuery, SearchQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SearchQuery, SearchQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SearchQuery, SearchQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<SearchQuery, SearchQueryVariables>(SearchDocument, variables, options);
}
export type SearchQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<SearchQuery, SearchQueryVariables>;
export const SessionInviteDocument = gql`
    query SessionInvite($token: String!) {
  sessionInvite(token: $token) {
    id
    status
    email
    expiresAt
    session {
      id
      title
      description
      state
      scheduledAt
      location
      capacity
      attendeeCount
      host {
        id
        username
        displayName
      }
      group {
        id
        name
      }
    }
    group {
      id
      name
    }
  }
}
    `;

/**
 * __useSessionInviteQuery__
 *
 * To run a query within a Vue component, call `useSessionInviteQuery` and pass it any options that fit your needs.
 * When your component renders, `useSessionInviteQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useSessionInviteQuery({
 *   token: // value for 'token'
 * });
 */
export function useSessionInviteQuery(variables: SessionInviteQueryVariables | VueCompositionApi.Ref<SessionInviteQueryVariables> | ReactiveFunction<SessionInviteQueryVariables>, options: VueApolloComposable.UseQueryOptions<SessionInviteQuery, SessionInviteQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SessionInviteQuery, SessionInviteQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SessionInviteQuery, SessionInviteQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<SessionInviteQuery, SessionInviteQueryVariables>(SessionInviteDocument, variables, options);
}
export function useSessionInviteLazyQuery(variables?: SessionInviteQueryVariables | VueCompositionApi.Ref<SessionInviteQueryVariables> | ReactiveFunction<SessionInviteQueryVariables>, options: VueApolloComposable.UseQueryOptions<SessionInviteQuery, SessionInviteQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<SessionInviteQuery, SessionInviteQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<SessionInviteQuery, SessionInviteQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<SessionInviteQuery, SessionInviteQueryVariables>(SessionInviteDocument, variables, options);
}
export type SessionInviteQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<SessionInviteQuery, SessionInviteQueryVariables>;
export const UserDocument = gql`
    query User($username: String!) {
  user(username: $username) {
    username
    avatar
  }
}
    `;

/**
 * __useUserQuery__
 *
 * To run a query within a Vue component, call `useUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useUserQuery({
 *   username: // value for 'username'
 * });
 */
export function useUserQuery(variables: UserQueryVariables | VueCompositionApi.Ref<UserQueryVariables> | ReactiveFunction<UserQueryVariables>, options: VueApolloComposable.UseQueryOptions<UserQuery, UserQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<UserQuery, UserQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<UserQuery, UserQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<UserQuery, UserQueryVariables>(UserDocument, variables, options);
}
export function useUserLazyQuery(variables?: UserQueryVariables | VueCompositionApi.Ref<UserQueryVariables> | ReactiveFunction<UserQueryVariables>, options: VueApolloComposable.UseQueryOptions<UserQuery, UserQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<UserQuery, UserQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<UserQuery, UserQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<UserQuery, UserQueryVariables>(UserDocument, variables, options);
}
export type UserQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<UserQuery, UserQueryVariables>;
export const CollectionSyncedDocument = gql`
    subscription CollectionSynced($username: String!) {
  collectionSynced(username: $username) {
    username
    status
    lastSyncedAt
    error
    gameCount
  }
}
    `;

/**
 * __useCollectionSyncedSubscription__
 *
 * To run a query within a Vue component, call `useCollectionSyncedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useCollectionSyncedSubscription` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the subscription
 * @param options that will be passed into the subscription, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/subscription.html#options;
 *
 * @example
 * const { result, loading, error } = useCollectionSyncedSubscription({
 *   username: // value for 'username'
 * });
 */
export function useCollectionSyncedSubscription(variables: CollectionSyncedSubscriptionVariables | VueCompositionApi.Ref<CollectionSyncedSubscriptionVariables> | ReactiveFunction<CollectionSyncedSubscriptionVariables>, options: VueApolloComposable.UseSubscriptionOptions<CollectionSyncedSubscription, CollectionSyncedSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<CollectionSyncedSubscription, CollectionSyncedSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<CollectionSyncedSubscription, CollectionSyncedSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<CollectionSyncedSubscription, CollectionSyncedSubscriptionVariables>(CollectionSyncedDocument, variables, options);
}
export type CollectionSyncedSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<CollectionSyncedSubscription, CollectionSyncedSubscriptionVariables>;