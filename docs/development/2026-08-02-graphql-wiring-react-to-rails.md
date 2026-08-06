---
title: "Wiring React Apollo Client 3 to the Rails GraphQL API"
date: 2026-08-02
description: "How the React SPA splits HTTP queries and WebSocket subscriptions, attaches Bearer auth, and lands on a Rails GraphQL schema guarded by depth, complexity, and introspection limits."
tags: [react, apollo, graphql, rails, websockets]
---

## The problem

The frontend is a React 19 SPA built with Vite. The backend is a Rails 8 API-only application exposing a single `/graphql` endpoint. The transport layer has to do three things at once: run ordinary queries and mutations over HTTP, stream real-time subscription events over a WebSocket, and attach the Bearer token from the React auth layer to every request — without leaking credentials in URLs, HTML, or logs.

We also want to keep the door open for future batching while not pretending the current client does something it does not. The controller can accept Apollo multiplex requests, but the React app shipped today uses standard per-operation HTTP execution.

## The decision: one Apollo client, two links, same origin

The frontend uses Apollo Client 3 with a `split` link that routes subscriptions to a `GraphQLWsLink` over Action Cable and everything else to a plain HTTP link. Auth is injected with `setContext`, which reads the same `localStorage` key the React `AuthProvider` uses. The same-origin setup means we do not need CORS configuration in production, and the WebSocket URL is derived from `window.location` so the same client works in development and production.

## The Apollo link chain

The HTTP link is deliberately simple:

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

`createHttpLink` points to `/graphql` with `same-origin` credentials. The `setContext` link reads the Bearer token and adds it to the outgoing headers. This is the only place in the browser where the token leaves `localStorage`; it is never echoed in URLs, local state, or component props.

Subscriptions use a separate WebSocket link backed by `graphql-ws` and Rails Action Cable:

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

const wsLink = new GraphQLWsLink(wsClient)
```

The `split` link chooses the transport based on the operation definition:

```ts
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  authLink.concat(httpLink),
)
```

Everything else — queries, mutations, and any future persisted queries — flows over the authenticated HTTP link. The current React client does not use `BatchHttpLink`. The Apollo `split` logic is a single transport decision, not a batching layer.

## The Rails side: `GraphqlController`

`GraphqlController` includes the `Authentication` concern, so `Current.user` and `Current.session` are set before the GraphQL execution path runs. The `execute` action accepts either a single query or a multiplexed array:

```ruby
def execute
  if params[:_json]
    queries = params[:_json].map do |param|
      {
        query: param[:query],
        operation_name: param[:operationName],
        variables: ensure_hash(param[:variables]),
        context: {
          current_user: Current.user,
          current_session: Current.session
        }
      }
    end
    result = BoardgameNightSchema.multiplex(queries)
    render json: result
  else
    variables = ensure_hash(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]
    result = BoardgameNightSchema.execute(query, variables: variables,
      context: { current_user: Current.user, current_session: Current.session },
      operation_name: operation_name)
    render json: result
  end
end
```

The multiplex branch is there for compatibility with Apollo's batching transport, but the React app currently sends each operation individually. Both branches pass the same `current_user` and `current_session` context, so resolvers see the same identity regardless of the request shape.

## Schema limits and introspection

`BoardgameNightSchema` wires in `GraphQL::Dataloader` for batching, `ActionCableSubscriptions` for real-time events, and a set of hard guardrails:

```ruby
class BoardgameNightSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)
  subscription(Types::SubscriptionType)

  use GraphQL::Subscriptions::ActionCableSubscriptions
  use GraphQL::Dataloader

  max_depth 15
  max_complexity 400
  disable_introspection_entry_points unless Rails.env.development? || Rails.env.test?
  max_query_string_tokens(5000)
  validate_max_errors(100)
end
```

`max_depth 15` and `max_complexity 400` prevent an attacker from constructing a trivially expensive query. Introspection is disabled in production, so the schema surface is not exposed to unauthenticated reconnaissance. `max_query_string_tokens(5000)` caps the size of incoming query strings, and `validate_max_errors(100)` stops validation from burning CPU on a pathological document.

These limits are not configurable per environment; they are constants in the schema file. If we ever need to relax them, the change is a single line in the code and a corresponding test.

## Historical note on Apollo Client architecture

[ADR-006](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/006-vue-apollo-normalized-cache.md) originally documented the Apollo Client 3 choice in the context of the historical frontend stack. The frontend framework has changed, but the core principle in that ADR — a normalized Apollo cache as the single source of truth for server data — is still how the React app works. The link layer described here is the current implementation, not the historical binding.

## Trade-offs

Using the same `/graphql` endpoint for both HTTP and subscription operations keeps the API surface minimal. The WebSocket connection is only opened when the app subscribes to something (currently collection-sync progress), so idle users pay no WebSocket cost. Keeping auth in `localStorage` means a page refresh preserves the session, but it also means a malicious injected script could exfiltrate the token; we mitigate that with strict CSP headers and by making session revocation instant on the server.

`same-origin` credentials plus a same-origin deployment eliminate CORS, but development requires the Vite proxy to forward `/graphql` to Rails. That is configured once in `vite.config.ts` and never bleeds into production.

The decision to not ship `BatchHttpLink` is intentional. It keeps the link layer small and makes the controller's single-query branch the hot path. If we later add batching, the controller is already compatible and only the Apollo client needs to change.
