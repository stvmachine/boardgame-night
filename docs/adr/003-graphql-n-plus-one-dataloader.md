# ADR-003: GraphQL N+1 Prevention with GraphQL::Dataloader

## Status

accepted

## Context

The merged collection query returns many games, and each game exposes its owners (`owners: [Owner!]!`). Without batching, resolving `owners` for each game would query the database once per game (N+1). The same risk applies to loading a `User` record for a given BGG username.

The graphql-ruby ecosystem historically used `graphql-batch` (Shopify) for promise-based batching. graphql-ruby now ships a built-in, fiber-based batching mechanism called `GraphQL::Dataloader`.

## Decision

We will use **GraphQL::Dataloader** and custom `GraphQL::Dataloader::Source` subclasses for all association batching in the GraphQL schema.

Concrete examples in use:

- `Loaders::OwnersLoader` batches `BggCollection` lookups per `bgg_thing_id` and eager-loads `user`.
- `Loaders::UsersLoader` batches `User` lookups per `bgg_username`.

`BoardgameNightSchema` enables Dataloader with `use GraphQL::Dataloader`.

## Consequences

- N+1 queries are eliminated for batched associations without manual memoization.
- The implementation follows the official, modern graphql-ruby path.
- `GraphQL::Dataloader` is fiber-based, so it works well with Rails 8 and modern Ruby.
- We do not introduce `graphql-batch` as a dependency.

## Alternatives Considered

- **`graphql-batch`** — rejected: it is promise-based, legacy, and superseded by `GraphQL::Dataloader`.
- **Manual memoization in resolvers** — rejected: error-prone, leaks resolver state, and harder to test.

## References

- `app/graphql/boardgame_night_schema.rb`
- `app/graphql/loaders/owners_loader.rb`
- `app/graphql/loaders/users_loader.rb`
- <https://graphql-ruby.org/dataloader/overview.html>
