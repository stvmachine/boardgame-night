---
phase: 09-home-collection-redesign
plan: 03
subsystem: api
tags:
  - graphql-ruby
  - dataloader
  - authorization
  - boardgamegeek
  - recently-played

requires:
  - phase: 09-02
    provides: Persisted batched Hot enrichment and schema/codegen workflow
  - phase: 08-03
    provides: Group collection resolver with viewer_role authorization
  - phase: 08-04
    provides: Group spotlight wrapper pattern and scoped owner loading

provides:
  - Immutable ScopedMergedThing wrapper carrying a frozen Scope(kind, id)
  - LastPlayedAtLoader: one batched NightSession aggregate per scope
  - MergedThing.objectid field exposing persisted BGG numeric identity
  - MergedThing.lastPlayedAt field scoped to user or group history
  - Same-operation and schema-multiplex isolation specs
  - Regenerated schema.graphql, schema.json, and Apollo types/operations

affects:
  - collection sorting
  - recently played
  - group collection
  - merged collection

tech-stack:
  added: []
  patterns:
    - Immutable per-item scope wrapper instead of mutable query context
    - Scope-aware GraphQL::Dataloader::Source keyed by (kind, id)
    - Objectid as persisted BGG identity separate from database id

key-files:
  created:
    - app/graphql/loaders/last_played_at_loader.rb
    - app/graphql/types/scoped_merged_thing.rb
    - spec/graphql/last_played_at_query_spec.rb
  modified:
    - app/graphql/types/merged_collection_type.rb
    - app/graphql/types/thing_fields.rb
    - app/graphql/types/query_type.rb
    - app/graphql/types/group_type.rb
    - app/frontend/apollo/queries/merged_collection.graphql
    - app/frontend/apollo/queries/group_collection.graphql
    - schema.graphql
    - schema.json
    - app/frontend/generated/types.ts
    - app/frontend/generated/operations.ts

key-decisions:
  - "Attach immutable scope to each collection item rather than storing it in mutable query context; this survives lazy field resolution and GraphQL multiplexing."
  - "Expose objectid as a first-class MergedThing field so cards and external links use the true BGG identity, not the internal database id."
  - "Return null lastPlayedAt for raw BggThing consumers (suggestions, hot enrichment) and for anonymous requests; only signed-in users or authorized group members see scoped history."

patterns-established:
  - "Scope(kind, id) is a frozen value object; the wrapper delegates scalar fields to the underlying BggThing while carrying the scope through GraphQL execution."
  - "LastPlayedAtLoader is keyed by scope so merged and group collections in the same operation do not share a cache key."
  - "Authorization boundary is enforced at the parent resolver: QueryType sets user scope only when authenticated; GroupType sets group scope only after viewer_role passes."

requirements-completed:
  - COLL-21

coverage:
  - id: D1
    description: Immutable per-item scope wrapper that survives lazy resolution
    requirement: COLL-21
    verification:
      - kind: integration
        ref: spec/graphql/last_played_at_query_spec.rb#keeps merged and group scopes isolated in one operation
        status: pass
      - kind: integration
        ref: spec/graphql/last_played_at_query_spec.rb#keeps scoped dates isolated across schema multiplex
        status: pass
    human_judgment: false
  - id: D2
    description: Batched LastPlayedAtLoader with one aggregate per scope
    requirement: COLL-21
    verification:
      - kind: integration
        ref: spec/graphql/last_played_at_query_spec.rb#does not increase last-played SQL count with item count
        status: pass
      - kind: integration
        ref: spec/graphql/last_played_at_query_spec.rb#does not call any BGG client method when resolving lastPlayedAt
        status: pass
    human_judgment: false
  - id: D3
    description: Authorization boundaries (anonymous null, outsider empty, cancelled excluded)
    requirement: COLL-21
    verification:
      - kind: integration
        ref: spec/graphql/last_played_at_query_spec.rb#returns null lastPlayedAt for anonymous merged history
        status: pass
      - kind: integration
        ref: spec/graphql/last_played_at_query_spec.rb#returns an empty collection for outsiders with no history leakage
        status: pass
      - kind: integration
        ref: spec/graphql/last_played_at_query_spec.rb#excludes cancelled sessions from lastPlayedAt
        status: pass
    human_judgment: false
  - id: D4
    description: MergedThing.objectid and lastPlayedAt published in schema and generated client artifacts
    requirement: COLL-21
    verification:
      - kind: integration
        ref: schema.graphql#MergedThing.objectid and MergedThing.lastPlayedAt
        status: pass
      - kind: integration
        ref: bin/rails graphql:schema:dump + npm run codegen byte-stability check
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-16T04:27:08Z
status: complete
---

# Phase 09 Plan 03: Collision-Proof Scoped lastPlayedAt and objectid Summary

**Immutable per-item scope wrapper, batched LastPlayedAtLoader, and persisted objectid for MergedThing, with direct same-operation and multiplex isolation specs.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-16T04:16:33Z
- **Completed:** 2026-07-16T04:27:08Z
- **Tasks:** 3 / 3
- **Files modified:** 10 source/test files plus generated schema/codegen artifacts

## Accomplishments

- Added an immutable `ScopedMergedThing` wrapper carrying a frozen `Scope(kind, id)` so history scope travels with each collection item rather than living in mutable query context.
- Created `Loaders::LastPlayedAtLoader` to issue one batched `NightSession` aggregate per scope, excluding cancelled sessions and returning input-ordered dates.
- Exposed `objectid` and `lastPlayedAt` on `MergedThing` via the shared `ThingFields` mixin so raw `BggThing` consumers (e.g., suggestions) continue to work with null history.
- Updated `MergedCollectionType` to wrap each item before field resolution, and set the user scope in `QueryType#merged_collection` only when authenticated.
- Updated `GroupType#collection` to attach the group scope only after `viewer_role` passes, keeping outsider collections empty and history-free.
- Added a focused isolation spec covering same-operation merged-vs-group scope collision, schema multiplex isolation, anonymous null, outsider empty collection, cancelled exclusion, bounded SQL, and zero BGG calls.
- Extended both `mergedCollection` and `groupCollection` Apollo operations with `objectid`, `description`, and `lastPlayedAt`, then regenerated and stabilized `schema.graphql`, `schema.json`, `types.ts`, and `operations.ts`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define direct collision and authorization RED specs** - `907f075` (test)
2. **Task 2: Implement immutable scoped values and batched history resolution** - `5fb744a` (feat)
3. **Task 3: Publish objectid/lastPlayedAt schema and generated operations** - `98e966f` (feat)

## Files Created/Modified

- `app/graphql/loaders/last_played_at_loader.rb` - New scope-aware batched loader for latest non-cancelled night session per game.
- `app/graphql/types/scoped_merged_thing.rb` - New immutable wrapper with frozen `Scope` and delegated scalar fields.
- `app/graphql/types/merged_collection_type.rb` - Wraps each item with the payload's scope before field resolution.
- `app/graphql/types/thing_fields.rb` - Added `objectid` and `lastPlayedAt` fields; resolver uses the wrapper's scope.
- `app/graphql/types/query_type.rb` - `merged_collection` now attaches a user scope for authenticated requests.
- `app/graphql/types/group_type.rb` - `collection` attaches a group scope only after `viewer_role` authorization.
- `spec/graphql/last_played_at_query_spec.rb` - New isolation, authorization, multiplex, and performance specs.
- `app/frontend/apollo/queries/merged_collection.graphql` - Added `objectid` and `lastPlayedAt` selections.
- `app/frontend/apollo/queries/group_collection.graphql` - Added `objectid`, `description`, and `lastPlayedAt` selections.
- `schema.graphql`, `schema.json`, `app/frontend/generated/types.ts`, `app/frontend/generated/operations.ts` - Regenerated and byte-stable.

## Decisions Made

- **Immutable per-item scope:** Rather than storing `last_played_scope_type/id` in the mutable GraphQL context, the scope is attached as frozen data on each collection item. This makes scope isolation deterministic under lazy Dataloader scheduling and across schema multiplexing.
- **objectid as persisted BGG identity:** Added `objectid` to `ThingFields` so both merged and group collection cards can link directly to boardgamegeek.com without exposing internal database ids.
- **Null history for raw consumers and anonymous users:** `ThingFields#last_played_at` returns nil when the resolved object is not a scoped wrapper, preserving suggestion and hot-enrichment consumers and preventing anonymous users from seeing any session history.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RuboCop layout offenses in new loader and MergedCollectionType**
- **Found during:** Post-Task 2 verification
- **Issue:** `bundle exec rubocop` reported `Layout/EndAlignment` in `LastPlayedAtLoader` and `Layout/SpaceInsideArrayLiteralBrackets` in `MergedCollectionType`.
- **Fix:** Aligned the `case`/`end` block with the `session_dates` assignment variable per omakase `Layout/EndAlignment`, and added spaces inside array literal brackets.
- **Files modified:** `app/graphql/loaders/last_played_at_loader.rb`, `app/graphql/types/merged_collection_type.rb`
- **Verification:** `bundle exec rubocop` on all plan-owned files now reports no offenses; all `spec/graphql` specs still pass.
- **Committed in:** `5fb744a` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Style-only cleanup; no behavior changes.

## Issues Encountered

- The initial `LastPlayedAtLoader` returned raw SQLite `MAX` datetime strings, which `GraphQL::Types::ISO8601DateTime` parsed as local time. Converted strings to UTC via `Time.parse("#{datetime} UTC")` so serialization matches the existing `ISO8601DateTime` Z-format convention used elsewhere in the schema.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- COLL-21 is complete.
- The backend GraphQL contract now supports the four sort choices (Name, Rating, Weight, Recently Played) and the `objectid` required for external BGG links in the redesigned Collection cards.
- No blockers.

---
*Phase: 09-home-collection-redesign*
*Completed: 2026-07-16*

## Self-Check: PASSED

- `app/graphql/loaders/last_played_at_loader.rb` exists
- `app/graphql/types/scoped_merged_thing.rb` exists
- `spec/graphql/last_played_at_query_spec.rb` exists
- Commit `907f075` (Task 1) exists
- Commit `5fb744a` (Task 2) exists
- Commit `98e966f` (Task 3) exists
- All `spec/graphql` specs pass (204 examples, 0 failures)
- `bundle exec rubocop` on plan-owned files reports no offenses
- Schema dump and codegen are byte-stable across re-runs
