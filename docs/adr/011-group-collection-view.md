# ADR-011: Group Collection View

## Status

accepted

## Context

Each group member binds a BoardGameGeek username to their account. The system already imports and persists collections into `bgg_things` and `bgg_collections`. A v1 requirement (GROUP-06) states that a group must have a persistent merged collection view: the union of all members' bound BGG collections, deduplicated by BGG objectId.

The existing codebase already provides `BggThing.merged_for_users(user_ids)` and the `OwnersLoader` Dataloader source for the public collection merge. We must decide whether the group view reuses this dynamic computation or introduces a persisted snapshot.

## Decision

We will compute the **group merged collection dynamically** from members' persisted `bgg_collections`.

Specifically:
- `Group` has many members via `group_memberships`.
- The group GraphQL resolver calls `BggThing.merged_for_users(group.member_ids)` and wraps the result with the existing `MergedCollection` type.
- `OwnersLoader` continues to batch owner lookups per thing.
- No new `group_collections` snapshot table, materialized view, or cache layer is introduced for v1.
- If a member's BGG collection is refreshed, the group view reflects the change immediately on the next read.

## Consequences

- Reuses the existing, tested collection-merge scope and Dataloader source.
- Query performance is well within the v1 budget (~5–15ms for the merge + owners queries at the expected scale of 5–20 members and ~200 games each).
- Perfect freshness; no cache invalidation or snapshot rebuild logic.
- No write amplification on BGG collection imports.
- The database remains the single source of truth for the merged view.
- Future pivots (snapshot table, materialized view, Redis cache) are possible if scale or feature requirements change.

## Alternatives Considered

- **Persisted `GroupCollection` snapshot table** — rejected: adds write amplification on every member sync/join/leave and requires diff-and-delete logic to handle game removals. Not justified at v1 scale.
- **Materialized database view** — rejected: SQLite does not support materialized views; the project uses SQLite for v1 per STACK.md. Even on PostgreSQL, per-group filtering would undermine the benefit.
- **Rails.cache of the merged result** — rejected: serializing hundreds of `BggThing` records into Solid Cache can be slower than re-running the query and introduces invalidation complexity. The database with proper indexes is already an effective cache.

## References

- `app/models/bgg_thing.rb`
- `app/models/bgg_collection.rb`
- `app/graphql/loaders/owners_loader.rb`
- `docs/adr/005-bgg-collection-import-pipeline.md`
- `docs/adr/003-graphql-n-plus-one-dataloader.md`
