# ADR-006: Apollo Client 3.x with Normalized Cache in Vue

## Status

accepted

> **Correction ([ADR-016](./016-frontend-spa-react-not-vue.md)):** the frontend is
> **React**, not Vue. The client is `@apollo/client`'s **React hooks** (not
> `@vue/apollo-composable`), and UI-only state uses **React state / Context** (not
> Pinia). The substantive decision here — Apollo Client 3.x with a normalized cache as
> the single source of truth, never duplicating server data into client state — stands.

## Context

The Vue frontend needs a GraphQL client that supports batched queries, subscriptions, and a normalized cache so that the same entity (e.g., a `MergedThing` or `UserSyncStatus`) is shared across all active components. Apollo Client 4.x and the matching `@vue/apollo-composable` v5 were in beta as of mid-2026 and reported incompatible with each other.

## Decision

We will use **Apollo Client 3.14.x** with **`@vue/apollo-composable` 4.2.2** in the Vue frontend.

Cache and network policies:

- Use Apollo's `InMemoryCache` as the single source of truth for all server data.
- Use `cache-first` or `cache-and-network` for merged collection queries so stale data renders immediately while fresh data loads in the background.
- Route subscription operations to an `ActionCableLink` and all other operations to a `BatchHttpLink` via Apollo's `split` link.

`Pinia` is used only for **UI-only state** (filters, sidebar open/closed, draft usernames). Server data is never duplicated into Pinia.

## Consequences

- Entity identity is normalized across queries and subscriptions.
- Stale-while-revalidate behavior is built-in.
- We avoid the Apollo 4 / composable v5 compatibility risk.
- The `graphql-ruby-client` `ActionCableLink` handles subscription reconnections and `X-Subscription-ID` automatically.

## Alternatives Considered

- **Apollo Client 4 + @vue/apollo-composable v5** — rejected: the Vue binding was still in beta and incompatible with Apollo 4 at the time of the decision.
- **urql** — rejected: Apollo's ecosystem and normalized cache are better aligned with the existing GraphQL-shaped frontend and codegen pipeline.
- **Pinia for server data** — rejected: duplicating server data creates cache invalidation bugs.

## References

- `app/frontend/apollo/client.ts`
- `package.json`
- <https://www.apollographql.com/docs/react>
- <https://graphql-ruby.org/javascript_client/apollo_subscriptions.html>
