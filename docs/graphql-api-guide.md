# GraphQL API Guide

This guide documents how the Boardgame Night monorepo uses **GraphQL** between the React frontend and the Rails 8 API-only backend, and how **Apollo Client 3** is configured for queries, mutations, subscriptions, and cache management.

> For the architecture story behind these choices, see `docs/development/2026-08-02-graphql-wiring-react-to-rails.md` and ADR-003 (`docs/adr/003-graphql-n-plus-one-dataloader.md`).

---

## Table of Contents

1. [Overview](#overview)
2. [Apollo Client Setup](#apollo-client-setup)
3. [Queries](#queries)
4. [Mutations](#mutations)
5. [Subscriptions](#subscriptions)
6. [Cache Concepts](#cache-concepts)
7. [IDs and Normalization](#ids-and-normalization)
8. [GraphiQL / Apollo Studio](#graphiql--apollo-studio)
9. [Best Practices](#best-practices)

---

## Overview

GraphQL is the single API boundary between the React SPA and the Rails backend.

- **Single endpoint:** `POST /graphql` (and `GET /graphql` for GraphiQL).
- **HTTP transport:** Apollo `createHttpLink` with same-origin credentials.
- **WebSocket transport:** `graphql-ws` over ActionCable for live subscriptions.
- **Code generation:** Hand-written `.graphql` documents in `app/frontend/lib/graphql/documents.ts` are consumed by `graphql-code-generator` to produce typed React hooks in `app/frontend/generated/operations.ts`.
- **Schema source of truth:** Rails `app/graphql/boardgame_night_schema.rb` plus dumped `schema.graphql`.

---

## Apollo Client Setup

`app/frontend/lib/graphql/apollo.ts` wires the HTTP link, the auth link, and the WebSocket link.

```ts
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, split } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const httpLink = createHttpLink({
  uri: '/graphql',
  credentials: 'same-origin',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('bgg-night-token')
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
})

const wsClient = createClient({
  url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/cable`,
  connectionParams: () => {
    const token = localStorage.getItem('bgg-night-token')
    return { token }
  },
  retryAttempts: Infinity,
  shouldRetry: () => true,
})

const wsLink = new GraphQLWsLink(wsClient)

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  authLink.concat(httpLink),
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
```

Key points:

- **Auth via `localStorage` token:** The `bgg-night-token` set by `AuthContext` is attached to every HTTP request as `Authorization: Bearer <token>` and to WebSocket `connectionParams`.
- **Split link:** Operations whose main definition is a `subscription` go to the WebSocket; everything else goes to the authenticated HTTP link.
- **Default cache:** `InMemoryCache()` with standard `__typename:id` normalization.

---

## Queries

A query asks the server for read-only data. The frontend declares exactly the fields it needs.

### Example: current user

```ts
export const CURRENT_USER = gql`
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
`
```

Usage in `AuthContext.tsx`:

```tsx
const { data, loading } = useQuery(CURRENT_USER, {
  fetchPolicy: 'cache-and-network',
  skip: !token,
})
```

### Example: group by token

```ts
export const GET_GROUP = gql`
  query GetGroup($token: String!) {
    group(token: $token) {
      id
      name
      description
      inviteCode
      myRole
      collectionTotalCount
      owner { id displayName avatar }
      members { id displayName bggUsername avatar isProvisional }
      sessions { id title state scheduledAt location attendeeCount }
      pastSessions { id title state scheduledAt location pickedGame { name thumbnail } }
      collectionSpotlight { id objectid name thumbnail average owners { bggUsername } }
    }
  }
`
```

Generated hook:

```tsx
const { data, loading, error } = useGetGroupQuery({ variables: { token } })
```

### Query inventory

| Query | Purpose | Key arguments |
|-------|---------|---------------|
| `CurrentUser` | Authenticated profile | — |
| `DashboardStats` | Home page counts | — |
| `MyGroups` | Group list | — |
| `GetGroup` | Group detail hub | `token: String!` |
| `GetNightSession` | Session details | `id: ID!` |
| `MergedCollection` | Multi-username collection merge | `usernames: [String!]!` |
| `GroupCollection` | Group merged collection | `token: String!` |
| `HotItems` | BGG trending list | — |
| `SearchBgg` | BGG search | `query: String!` |
| `GetSessionInvite` | Public invite preview | `token: String!` |
| `GetUser` | Public user profile | `username: String!` |
| `MyPlays` / `GroupPlays` / `GamePlays` | Play history | `groupId`, `objectid`, `limit` |
| `HealthCheck` | Server health | — |

---

## Mutations

A mutation changes server-side state. The frontend sends input variables and receives the updated result.

### Example: sign in

```ts
export const SIGN_IN = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(input: { email: $email, password: $password }) {
      token
      user { id username email bggUsername displayName avatar isProvisional }
    }
  }
`
```

Usage:

```tsx
const [signInMutation] = useMutation(SIGN_IN)

const signIn = async (email: string, password: string) => {
  const { data } = await signInMutation({ variables: { email, password } })
  const { token, user } = data.signIn
  localStorage.setItem('bgg-night-token', token)
  await apolloClient.resetStore()
}
```

### Example: create a group and refetch the list

```tsx
const [createGroup] = useCreateGroupMutation({
  refetchQueries: [{ query: MY_GROUPS }],
  awaitRefetchQueries: true,
})
```

### Mutation inventory

| Mutation | Purpose |
|----------|---------|
| `SignIn` / `SignUp` / `SignOut` | Authentication |
| `BindBggUsername` | Attach BGG account |
| `CreateGroup` / `CreateAnonymousGroup` | Group creation |
| `CreateNightSession` | Start a new session |
| `ScheduleSession` | Send invites and schedule |
| `StartPicking` / `PickGame` | Session state transitions |
| `Rsvp` | RSVP via invite token |
| `AcceptGroupInvite` / `InviteToGroup` | Membership management |
| `RemoveGroupMember` / `UpdateGroupMemberRole` | Admin actions |
| `ImportCollection` / `ValidateBggUsername` | BGG data sync |
| `SubmitScores` / `ImportPlays` | Play/score tracking |
| `UpgradeToAccount` | Convert provisional user |
| `CancelSession` / `ReopenSession` / `UpdateSessionDetails` | Session lifecycle edits |

---

## Subscriptions

Subscriptions keep a live connection open so the server can push updates to the client.

### `CollectionSynced`

Fired when a BGG collection import finishes for a given username.

```ts
export const COLLECTION_SYNCED = gql`
  subscription CollectionSynced($username: String!) {
    collectionSynced(username: $username) {
      username
      status
      error
      gameCount
      lastSyncedAt
    }
  }
`
```

Usage:

```tsx
const { data } = useCollectionSyncedSubscription({ variables: { username } })
```

The subscription is routed over the WebSocket link because its operation kind is `subscription`.

---

## Cache Concepts

Apollo Client caches every normalized object by `__typename` + `id`. This means shared entities (e.g., the same `Group` appearing in `MyGroups` and `GetGroup`) are stored once and updated everywhere.

### `fetchPolicy`

| Policy | Behavior | Where used |
|--------|----------|------------|
| `cache-first` | Read cache; only fetch if missing. | Default for most queries. |
| `cache-and-network` | Show cached data immediately, then refresh from server. | `CurrentUser`, collection queries. |
| `network-only` | Skip cache, always fetch. | Rare; used for explicit refresh. |
| `no-cache` | Do not write to cache. | Debug or large one-off reads. |

Example from `AuthContext`:

```tsx
useQuery(CURRENT_USER, {
  fetchPolicy: 'cache-and-network',
  skip: !token,
})
```

### `refetchQueries`

After a mutation, explicitly refetch a list to keep indexes up to date.

```tsx
const [createGroup] = useCreateGroupMutation({
  refetchQueries: [{ query: MY_GROUPS }],
  awaitRefetchQueries: true,
})
```

### `resetStore`

On sign-in or sign-out, the cache is fully reset so stale data from a previous user cannot leak.

```tsx
await apolloClient.resetStore()
```

### Manual cache updates with `cache.modify`

When a mutation returns a partial change, it is often faster and more robust to update the cache directly rather than refetching the entire list.

#### Remove a group member

```tsx
const [removeGroupMember] = useRemoveGroupMemberMutation({
  update(cache, result) {
    const removedMembershipId = result.data?.removeGroupMember?.removedMembershipId
    if (!removedMembershipId) return

    const groupCacheId = cache.identify({ __typename: 'Group', id: groupId })
    if (!groupCacheId) return

    cache.modify({
      id: groupCacheId,
      fields: {
        memberships(existing = [], { readField }) {
          const references = existing as ReadonlyArray<{ __ref: string }>
          return references.filter(
            (reference) => readField('id', reference) !== removedMembershipId,
          )
        },
      },
    })
  },
})
```

#### Add a new session to a group

```tsx
cache.modify({
  id: cache.identify({ __typename: 'Group', id: groupId }),
  fields: {
    sessions(existing = [], { readField }) {
      const newSessionRef = cache.writeFragment({
        data: session,
        fragment: gql`
          fragment NewSession on NightSession {
            id
            title
            state
            scheduledAt
            location
            attendeeCount
          }
        `,
      })
      if (existing.some((ref) => readField('id', ref) === session.id)) return existing
      return [...existing, newSessionRef]
    },
  },
})
```

Patterns:

- Use `cache.identify({ __typename, id })` to get a stable cache key.
- Use `readField('id', reference)` to inspect normalized references without reading the whole object.
- Return `existing` unchanged when the item is already present to avoid duplicates.

---

## IDs and Normalization

Apollo's default data identity is `__typename + id`. Every object that should be normalized must have both `id` and `__typename` in the response. GraphQL servers automatically include `__typename` when the client sends the field, but Apollo injects it into outgoing operations automatically.

### Cache identity examples

| Type | Cache key | Notes |
|------|-----------|-------|
| `User` | `User:<db-id>` | Standard model id. |
| `Group` | `Group:<db-id>` | Used in `cache.identify`. |
| `NightSession` | `NightSession:<db-id>` | Used in `cache.identify`. |
| `MergedThing` | `MergedThing:<db-id>` | Persisted BGG thing record. |
| `BggPlay` | `BggPlay:<db-id>` | Play history records. |
| `Owner` | *(none)* | No `id` field; stored as nested object inside `MergedThing`. |
| `Suggestion` | `Suggestion:<db-id>` | Ephemeral result from suggestion engine. |

### Why `id` matters

If a query omits `id` on a nested object, Apollo cannot normalize that object. It will be stored as an embedded value inside its parent, so updates to the same entity elsewhere will not propagate.

Example of a cache-friendly query:

```graphql
query GetGroup($token: String!) {
  group(token: $token) {
    id
    name
    owner { id displayName }
    members { id displayName }
  }
}
```

Both `Group` and every `User` (owner, members) have `id`, so they can be updated independently across the app.

---

## GraphiQL / Apollo Studio

During development, the mounted `graphiql-rails` explorer at `/graphiql` lets you browse the schema, write queries, and inspect the docs panel.

### Opening GraphiQL

1. Start the Rails server:

   ```bash
   bin/rails server
   ```

2. Open `http://localhost:3000/graphiql` in your browser.
3. Write a query on the left, run it with the play button, and inspect the response on the right.

### Example query to run

```graphql
query Dashboard {
  dashboardStats {
    collectionCount
    groupCount
    sessionCount
  }
}
```

### Screenshot: GraphiQL explorer with a query

![GraphiQL query example](docs/images/graphql/graphiql-query.png)

### Screenshot: GraphiQL docs panel showing a type

![GraphiQL docs panel](docs/images/graphql/graphiql-docs.png)

### Screenshot: GraphiQL mutation with variables

![GraphiQL mutation example](docs/images/graphql/graphiql-mutation.png)

> **Note:** Apollo Studio (cloud) is not connected to this app. We use the self-hosted GraphiQL endpoint in development. If you later add an Apollo Studio graph, the same queries and mutations can be pasted there for shared team documentation and tracing.

---

## Best Practices

1. **Always request `id` on entity types.** This enables Apollo normalization and keeps data consistent across views.
2. **Prefer `cache-and-network` for data that changes often** (current user, collections). Use `cache-first` for stable reference data (e.g., hot list after initial load).
3. **Use `refetchQueries` for list indexes.** When creating a new top-level entity (group, session), refetch the list query rather than manually updating it.
4. **Use `cache.modify` for targeted updates.** When removing or updating a single item in a large list, avoid the cost of refetching the whole query.
5. **Reset the cache on auth changes.** `apolloClient.resetStore()` prevents cross-user cache leakage after sign-in or sign-out.
6. **Generate typed hooks from `documents.ts`.** Run `npm run codegen` to keep `operations.ts` in sync with the Rails schema.
7. **Keep GraphQL documents in one place.** All frontend operations live in `app/frontend/lib/graphql/documents.ts` so they are easy to audit and reuse.
8. **Do not rely on fragments.** The project currently inlines fields; if fragments are introduced, keep them close to their consumers and run codegen to regenerate types.

---

## Related Files

- Frontend Apollo setup: `app/frontend/lib/graphql/apollo.ts`
- GraphQL documents: `app/frontend/lib/graphql/documents.ts`
- Generated hooks: `app/frontend/generated/operations.ts`
- Auth usage: `app/frontend/contexts/AuthContext.tsx`
- Cache updates: `app/frontend/pages/GroupPage.tsx`
- Rails schema: `app/graphql/boardgame_night_schema.rb`
- Query entry: `app/graphql/types/query_type.rb`
- Mutation entry: `app/graphql/types/mutation_type.rb`
- Subscription entry: `app/graphql/types/subscription_type.rb`
- Dumped schema: `schema.graphql`

---

*Last updated: 2026-08-06*
