---
title: "A Field Guide to GraphQL in Boardgame Night"
date: 2026-08-06
description: "How the React SPA consumes the Rails GraphQL API through Apollo Client 3: queries, mutations, subscriptions, cache normalization, and the GraphiQL explorer."
tags: [graphql, apollo, react, rails, api]
---

## The problem

Boardgame Night is a monorepo: a React 19 SPA on one side and a Rails 8 API-only application on the other. The only contract between them is a single GraphQL endpoint at `/graphql`. The frontend needs to read authenticated user data, merge BGG collections, manage groups and sessions, and subscribe to import progress — all without making the API surface explode into a tangle of REST endpoints.

The challenge is not just using GraphQL; it is using it consistently across the whole product. Every view has to agree on how entities are identified, how lists are updated after a mutation, and how real-time events reach the browser. We also want a single source of truth for the schema, typed hooks, and a way for engineers to explore the API without reading the frontend code.

## The decision: Apollo Client 3, one endpoint, generated hooks

We standardized on **Apollo Client 3** for the React layer and `graphql-ruby` on the Rails layer. Hand-written GraphQL documents live in `app/frontend/lib/graphql/documents.ts`, and the generated typed hooks live in `app/frontend/generated/operations.ts`. Rails exposes one `/graphql` endpoint, with an optional WebSocket upgrade at `/cable` for subscriptions, and `graphiql-rails` mounts the GraphiQL explorer at `/graphiql` in development.

This keeps the frontend and backend in lockstep: change the Rails schema, run `npm run codegen`, and the TypeScript contract updates itself.

## The Apollo link chain

The client is built in `app/frontend/lib/graphql/apollo.ts`:

```ts
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
```

The `authLink` reads the same `bgg-night-token` that `AuthContext` writes after sign-in. Because the app is served from the same origin as the API, `credentials: 'same-origin'` is enough; we do not need CORS in production.

Subscriptions use a separate `graphql-ws` link over Action Cable:

```ts
const wsClient = createClient({
  url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/cable`,
  connectionParams: () => {
    const token = localStorage.getItem('bgg-night-token')
    return { token }
  },
  retryAttempts: Infinity,
  shouldRetry: () => true,
})
```

A `split` link routes every operation by kind: subscriptions go to the WebSocket, everything else goes to the authenticated HTTP link.

## Queries: ask for exactly what you need

The frontend declares every field it needs. For example, the group detail page asks for a single group by its invite token:

```graphql
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
```

Because the response includes `id` on every entity that supports it, Apollo can normalize `User`, `Group`, `NightSession`, and the rest into a single cache map. If the same group appears in `MyGroups` and `GetGroup`, it is stored once and updated everywhere.

## Mutations: change state, then update the cache

A mutation is just a GraphQL operation with side effects. Creating a group looks like this:

```graphql
mutation CreateGroup($name: String!, $description: String) {
  createGroup(input: { name: $name, description: $description }) {
    group { id name inviteCode }
  }
}
```

After a successful mutation, the frontend has two ways to keep the cache honest. The simplest is to refetch the list:

```tsx
const [createGroup] = useCreateGroupMutation({
  refetchQueries: [{ query: MY_GROUPS }],
  awaitRefetchQueries: true,
})
```

For targeted updates, we modify the cache directly. Removing a member from a group updates only the `memberships` array on the cached `Group` object:

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

The pattern is: identify the cached entity by `__typename` + `id`, read the field references, and return a new array without the removed item. This avoids the cost of refetching the entire group.

## Subscriptions: real-time collection sync

When a BGG collection import runs in the background, the frontend wants to know when it finishes. The `CollectionSynced` subscription streams updates per username:

```graphql
subscription CollectionSynced($username: String!) {
  collectionSynced(username: $username) {
    username
    status
    error
    gameCount
    lastSyncedAt
  }
}
```

Because the operation is a `subscription`, the `split` link routes it to the WebSocket link automatically. The rest of the app continues to use ordinary HTTP queries and mutations.

## Cache and IDs: why `id` is non-negotiable

Apollo's default cache identity is `__typename:id`. Every object that should be normalized must return both fields. If a query omits `id` on a nested entity, Apollo cannot merge it; it becomes an embedded value inside its parent and updates to that entity elsewhere will not propagate.

The frontend therefore asks for `id` on every entity type: `User`, `Group`, `NightSession`, `MergedThing`, `BggPlay`, and so on. Only `Owner` intentionally lacks an `id` because it is a computed, nested value inside `MergedThing` and does not need independent normalization.

Fetch policies are chosen per view:

- `cache-and-network` for data that changes often, such as the current user and the merged collection. The cached value renders immediately while a fresh request validates it in the background.
- `cache-first` for stable reference data, such as the BGG hot list after the initial load.
- `resetStore` on sign-in and sign-out to ensure no stale user data leaks across sessions.

## Exploring the API with GraphiQL

In development, Rails mounts the GraphiQL explorer at `/graphiql`. You can run a health query to confirm the endpoint is alive:

```graphql
query HealthCheck {
  health
}
```

The response is a simple JSON object:

```json
{
  "data": {
    "health": "ok"
  }
}
```

The docs panel lists every type, query, mutation, and subscription in the schema, which makes it the fastest way to discover what fields are available without reading the generated code.

![GraphiQL query example](docs/images/graphql/graphiql-query.png)

![GraphiQL docs panel](docs/images/graphql/graphiql-docs.png)

Mutations work the same way. A `CreateAnonymousGroup` mutation can be run directly in the explorer with variables:

```graphql
mutation CreateAnonymousGroup($name: String!, $bggUsernames: [String!]!) {
  createAnonymousGroup(name: $name, bggUsernames: $bggUsernames) {
    group { id name inviteCode }
  }
}
```

```json
{
  "name": "Weekend Board Gamers",
  "bggUsernames": ["teosta", "elkido"]
}
```

![GraphiQL mutation example](docs/images/graphql/graphiql-mutation.png)

> **Note:** Apollo Studio is not connected to this app. We use the self-hosted GraphiQL endpoint in development. If you later add an Apollo Studio graph, the same queries and mutations can be pasted there for shared team documentation and tracing.

## Best practices we follow

1. **Always request `id` on entity types.** This is the single biggest lever for cache consistency.
2. **Use `refetchQueries` for list creation.** When you add a new top-level item (group, session), refetch the list query rather than hand-rolling a cache append.
3. **Use `cache.modify` for targeted removal or updates.** Avoid paying the network cost of refetching a whole list when only one item changed.
4. **Reset the cache on auth changes.** `apolloClient.resetStore()` prevents cross-user leakage.
5. **Regenerate hooks after schema changes.** `npm run codegen` keeps TypeScript aligned with Rails.
6. **Keep GraphQL documents in one place.** `app/frontend/lib/graphql/documents.ts` is the single source of truth for frontend operations.
7. **Prefer the generated hooks.** They are typed, tested, and follow the same pattern everywhere.

## Related documents

- [Wiring React Apollo Client 3 to the Rails GraphQL API](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/development/2026-08-02-graphql-wiring-react-to-rails.md) — the transport-layer story.
- [Merged Collection Query Deep Dive](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/development/2026-08-02-merged-collection-query-deep-dive.md) — how the persisted, deduplicated collection query works.
- [ADR-003: GraphQL N+1 and Dataloader](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/003-graphql-n-plus-one-dataloader.md) — backend batching strategy.
- [Standalone GraphQL API Guide](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/graphql-api-guide.md) — the full reference version with tables and file links.
