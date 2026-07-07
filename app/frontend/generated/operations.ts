/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import gql from 'graphql-tag';
import * as VueApolloComposable from '@vue/apollo-composable';
import * as VueCompositionApi from '@vue/composition-api';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type ReactiveFunction<TParam> = () => TParam;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** An ISO 8601-encoded datetime */
  ISO8601DateTime: { input: unknown; output: unknown; }
};

export type MergedCollection = {
  __typename?: 'MergedCollection';
  items: Array<MergedThing>;
  syncStatuses: Array<UserSyncStatus>;
};

export type MergedThing = {
  __typename?: 'MergedThing';
  average?: Maybe<Scalars['Float']['output']>;
  averageWeight?: Maybe<Scalars['Float']['output']>;
  bayesAverage?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  isExpansion: Scalars['Boolean']['output'];
  maxPlayers?: Maybe<Scalars['Int']['output']>;
  maxPlaytime?: Maybe<Scalars['Int']['output']>;
  minAge?: Maybe<Scalars['Int']['output']>;
  minPlayers?: Maybe<Scalars['Int']['output']>;
  minPlaytime?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  owners: Array<Owner>;
  thumbnail?: Maybe<Scalars['String']['output']>;
  usersRated?: Maybe<Scalars['Int']['output']>;
  yearPublished?: Maybe<Scalars['Int']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** An example field added by the generator */
  testField: Scalars['String']['output'];
};

export type Owner = {
  __typename?: 'Owner';
  avatar?: Maybe<Scalars['String']['output']>;
  bggUsername: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Health check — proves the GraphQL endpoint is alive. */
  health: Scalars['String']['output'];
  /** Merge and deduplicate the BGG collections for the given usernames. */
  mergedCollection: MergedCollection;
  /** Look up a local user by their BGG username. */
  user?: Maybe<User>;
};


export type QueryMergedCollectionArgs = {
  usernames: Array<Scalars['String']['input']>;
};


export type QueryUserArgs = {
  username: Scalars['String']['input'];
};

export enum SyncStatus {
  /** Import failed */
  Error = 'ERROR',
  /** Import is queued and waiting to start */
  Queued = 'QUEUED',
  /** Import completed successfully */
  Ready = 'READY',
  /** Import is in progress */
  Syncing = 'SYNCING'
}

export type User = {
  __typename?: 'User';
  avatar?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};

export type UserSyncStatus = {
  __typename?: 'UserSyncStatus';
  error?: Maybe<Scalars['String']['output']>;
  gameCount?: Maybe<Scalars['Int']['output']>;
  lastSyncedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  status: SyncStatus;
  username: Scalars['String']['output'];
};

export type SyncStatus =
  /** Import failed */
  | 'ERROR'
  /** Import is queued and waiting to start */
  | 'QUEUED'
  /** Import completed successfully */
  | 'READY'
  /** Import is in progress */
  | 'SYNCING';

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { health: string };

export type MergedCollectionQueryVariables = Exact<{
  usernames: Array<string> | string;
}>;


export type MergedCollectionQuery = { mergedCollection: { items: Array<{ id: string, name: string, yearPublished: number | null, minPlayers: number | null, maxPlayers: number | null, minPlaytime: number | null, maxPlaytime: number | null, minAge: number | null, image: string | null, thumbnail: string | null, description: string | null, average: number | null, bayesAverage: number | null, usersRated: number | null, averageWeight: number | null, isExpansion: boolean, owners: Array<{ bggUsername: string, avatar: string | null }> }>, syncStatuses: Array<{ username: string, status: SyncStatus, lastSyncedAt: unknown, error: string | null, gameCount: number | null }> } };

export type UserQueryVariables = Exact<{
  username: string;
}>;


export type UserQuery = { user: { username: string, avatar: string | null } | null };


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