---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 01
subsystem: api
tags: [graphql, rails, dataloader, bgg, statistics]

requires:
  - phase: 02-bgg-integration-layer-persistence
    provides: Bgg::Normalizer, Bgg::CollectionPersister, BggThing/User models, Solid Queue import job

provides:
  - Migrated statistics columns on bgg_things
  - Merged BGG usernames scope on BggThing
  - GraphQL collection surface types and SyncStatus enum
  - GraphQL::Dataloader owners/users batch loaders

affects:
  - 03-02-graphql-api-collection-queries
  - 03-03-graphql-api-mutations-subscriptions

tech-stack:
  added: []
  patterns:
    - ActiveRecord scopes for server-side collection merge
    - graphql-ruby orphan_types for types not yet wired to Query/Mutation
    - GraphQL::Dataloader::Source for N+1-free owner/user lookups
    - Shared GraphQL field module (ThingFields) for ThingType and MergedThingType

key-files:
  created:
    - db/migrate/20260707000001_add_statistics_to_bgg_things.rb
    - db/migrate/20260707000002_add_bgg_avatar_url_to_users.rb
    - app/graphql/types/thing_fields.rb
    - app/graphql/types/thing_type.rb
    - app/graphql/types/merged_thing_type.rb
    - app/graphql/types/merged_collection_type.rb
    - app/graphql/types/owner_type.rb
    - app/graphql/types/user_type.rb
    - app/graphql/types/user_sync_status_type.rb
    - app/graphql/types/sync_status_enum.rb
    - app/graphql/loaders/owners_loader.rb
    - app/graphql/loaders/users_loader.rb
  modified:
    - app/models/bgg_thing.rb
    - app/services/bgg/normalizer.rb
    - app/services/bgg/collection_persister.rb
    - app/graphql/boardgame_night_schema.rb
    - spec/fixtures/files/stevmachine_collection.xml

key-decisions:
  - Used a shared ThingFields module for ThingType and MergedThingType to keep the v1-essential field list in one place.
  - OwnerType resolves bgg_username and avatar by delegating to its associated user because OwnersLoader batches BggCollection records (matching the planned implementation pattern).
  - SyncStatusEnum is named SyncStatus in the GraphQL schema (graphql_name override) to match the planned contract while keeping the Ruby class name SyncStatusEnum.

patterns-established:
  - "GraphQL type reuse via included field module"
  - "Dataloader source returns records in the exact input order"
  - "Collection XML stats are normalized into a flat :stats hash consumed by the persister"

requirements-completed:
  - COLL-02
  - COLL-09
  - COLL-17
  - GQL-02

coverage:
  - id: D1
    description: "bgg_things statistics columns are migrated and persisted during collection import"
    requirement: COLL-02
    verification:
      - kind: unit
        ref: "spec/services/bgg/normalizer_spec.rb#exposes BGG community statistics under stats"
        status: pass
      - kind: unit
        ref: "spec/services/bgg/collection_persister_spec.rb#persists BGG community statistics on things"
        status: pass
      - kind: unit
        ref: "spec/models/bgg_thing_spec.rb#database columns"
        status: pass
    human_judgment: false
  - id: D2
    description: "users table has bgg_avatar_url and a bgg_username index"
    requirement: COLL-09
    verification:
      - kind: unit
        ref: "spec/models/user_spec.rb#database columns"
        status: pass
    human_judgment: false
  - id: D3
    description: "BggThing.merged_for_bgg_usernames returns distinct things for a list of BGG usernames"
    requirement: COLL-02
    verification:
      - kind: unit
        ref: "spec/models/bgg_thing_spec.rb#merged_for_bgg_usernames"
        status: pass
    human_judgment: false
  - id: D4
    description: "GraphQL collection surface types and Dataloader loaders are defined and loaded by the schema"
    requirement: GQL-02
    verification:
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#collection surface types"
        status: pass
      - kind: unit
        ref: "spec/graphql/loaders/owners_loader_spec.rb#fetch"
        status: pass
      - kind: unit
        ref: "spec/graphql/loaders/users_loader_spec.rb#fetch"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-07-07
status: complete
---

# Phase 03 Plan 01: GraphQL API Collection Surface (v1 Parity) — Backend Foundation Summary

**Migrated BGG statistics columns, added the `merged_for_bgg_usernames` merge scope, and defined the GraphQL collection surface types and Dataloader loaders that later plans wire into queries and mutations.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-07T04:22:57Z
- **Completed:** 2026-07-07T04:39:36Z
- **Tasks:** 2
- **Files modified:** 11 created, 4 modified

## Accomplishments

- Added five statistics columns to `bgg_things` and a `bgg_avatar_url` column + `bgg_username` index to `users`.
- Implemented `BggThing.merged_for_bgg_usernames` for server-side collection merging by BGG username.
- Extended `Bgg::Normalizer` and `Bgg::CollectionPersister` to extract and persist BGG community statistics.
- Defined the full collection surface GraphQL type layer (`ThingType`, `MergedThingType`, `MergedCollectionType`, `OwnerType`, `UserType`, `UserSyncStatusType`, `SyncStatusEnum`).
- Implemented `Loaders::OwnersLoader` and `Loaders::UsersLoader` as `GraphQL::Dataloader::Source` subclasses for batch loading.
- All 79 backend specs pass.

## Task Commits

Each task followed the TDD RED/GREEN cycle:

1. **Task 1 (RED):** Add failing tests for statistics persistence and merge scope — `789aa3b`
2. **Task 1 (GREEN):** Add statistics columns, merge scope, and persister updates — `8fdec2a`
3. **Task 2 (RED):** Add failing tests for collection GraphQL types and loaders — `0263f20`
4. **Task 2 (GREEN):** Add GraphQL collection surface types and Dataloader loaders — `225089a`

**Plan metadata:** `14d1ddb` (docs: complete plan), `bc6ae4a` (docs: append self-check)

## Files Created/Modified

- `db/migrate/20260707000001_add_statistics_to_bgg_things.rb` — Adds average, bayes_average, users_rated, average_weight, num_comments.
- `db/migrate/20260707000002_add_bgg_avatar_url_to_users.rb` — Adds bgg_avatar_url and bgg_username index.
- `app/models/bgg_thing.rb` — Adds `merged_for_bgg_usernames` scope.
- `app/services/bgg/normalizer.rb` — Extracts community statistics from collection XML.
- `app/services/bgg/collection_persister.rb` — Persists statistics columns.
- `app/graphql/types/thing_fields.rb` — Shared field module for thing-shaped types.
- `app/graphql/types/thing_type.rb`, `merged_thing_type.rb`, `merged_collection_type.rb`, `owner_type.rb`, `user_type.rb`, `user_sync_status_type.rb`, `sync_status_enum.rb` — Collection surface GraphQL types.
- `app/graphql/loaders/owners_loader.rb`, `users_loader.rb` — Dataloader batch sources.
- `app/graphql/boardgame_night_schema.rb` — Registers new types as orphan types.
- `spec/fixtures/files/stevmachine_collection.xml` — Added realistic `averageweight` elements to collection items.

## Decisions Made

- Used a shared `ThingFields` module so `ThingType` and `MergedThingType` stay in sync with the v1-essential field list.
- Kept `OwnerType` backed by `BggCollection` records (matching the planned `OwnersLoader` pattern) and delegated `bgg_username`/`avatar` to the associated user.
- Named the GraphQL enum `SyncStatus` while keeping the Ruby class `SyncStatusEnum`, matching the planned schema contract.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Ruby/Bundler environment drift:**
   - The working tree had a pre-existing `Gemfile.lock` modification that moved `BUNDLED WITH` to `4.0.11` and added the `arm64-darwin-24` platform. After `bundle exec rspec` failed with missing `securerandom` and other default-gem load errors, I reverted `Gemfile.lock` to the committed version and reinstalled Ruby 3.4.9 via rbenv. The fresh Ruby install left empty placeholder directories for default gems, which caused Bundler to compute incorrect load paths; removing those empty directories restored the test suite.
   - **Resolution:** Reverted `Gemfile.lock`, reinstalled Ruby 3.4.9, removed empty default-gem directories, and re-ran `bundle install`. All tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend foundation is ready for Plan 03-02 (`mergedCollection` query, `user` query, `hotItems` query) and Plan 03-03 (`importCollection` / `validateBggUsername` mutations and `collectionSynced` subscription).
- No blockers.

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-07*

## Self-Check: PASSED

- [x] SUMMARY.md exists at `.planning/phases/03-graphql-api-collection-surface-v1-parity/03-01-SUMMARY.md`
- [x] Task commits found: `789aa3b`, `8fdec2a`, `0263f20`, `225089a`
- [x] Summary commit found: `ed5a883`
- [x] Final metadata commit found: `14d1ddb` (plus amended self-check)
- [x] All 79 backend specs pass
