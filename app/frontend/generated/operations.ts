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
export type ImportCollectionMutationVariables = Exact<{
  username: string;
}>;


export type ImportCollectionMutation = { importCollection: { user: { id: string, username: string, syncStatus: { username: string, status: Types.SyncStatus, lastSyncedAt: unknown, error: string | null, gameCount: number | null } } } | null };

export type ValidateBggUsernameMutationVariables = Exact<{
  username: string;
}>;


export type ValidateBggUsernameMutation = { validateBggUsername: { validationResult: { valid: boolean, username: string, exists: boolean, avatar: string | null } } | null };

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { health: string };

export type HotItemsQueryVariables = Exact<{ [key: string]: never; }>;


export type HotItemsQuery = { hotItems: Array<{ id: string, rank: number, name: string, yearPublished: number | null, thumbnail: string | null }> };

export type MergedCollectionQueryVariables = Exact<{
  usernames: Array<string> | string;
}>;


export type MergedCollectionQuery = { mergedCollection: { items: Array<{ id: string, name: string, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, minAge: number | null, image: string | null, thumbnail: string | null, description: string | null, average: number | null, bayesAverage: number | null, usersRated: number | null, averageWeight: number | null, isExpansion: boolean, owners: Array<{ bggUsername: string, avatar: string | null }> }>, syncStatuses: Array<{ username: string, status: Types.SyncStatus, lastSyncedAt: unknown, error: string | null, gameCount: number | null }> } };

export type SearchQueryVariables = Exact<{
  query: string;
}>;


export type SearchQuery = { search: Array<{ id: string, name: string, yearPublished: number | null }> };

export type UserQueryVariables = Exact<{
  username: string;
}>;


export type UserQuery = { user: { username: string, avatar: string | null } | null };

export type CollectionSyncedSubscriptionVariables = Exact<{
  username: string;
}>;


export type CollectionSyncedSubscription = { collectionSynced: { username: string, status: Types.SyncStatus, lastSyncedAt: unknown, error: string | null, gameCount: number | null } };


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