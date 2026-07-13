---
phase: 06-bgg-poll-data-layer
plan: 03
subsystem: api
tags: [graphql, ruby, rails, bgg, dataloader, polls]

requires:
  - phase: 06-bgg-poll-data-layer
    provides: BggPoll/BggPollResult models and persisted suggested_numplayers poll data (06-01)
  - phase: 06-bgg-poll-data-layer
    provides: Bgg::Client#thing batching/caching and enrichment/backfill jobs (06-02)

provides:
  - GraphQL PollType and PollResultType for raw poll data
  - GraphQL PollsLoader Dataloader source for N+1-free collection lists
  - ThingFields polls and bestPlayerCount fields shared by ThingType and MergedThingType
  - Regenerated schema.graphql and frontend TypeScript types

affects:
  - 07-suggestion-engine-backend
  - 09-home-collection-redesign
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - "GraphQL::Dataloader::Source for batch-loading associated records"
    - "Shared concern (ThingFields) exposing computed fields across ThingType and MergedThingType"
    - "Tie-break resolver: max votes, then lower player_count for bestPlayerCount"

key-files:
  created:
    - app/graphql/types/poll_type.rb
    - app/graphql/types/poll_result_type.rb
    - app/graphql/loaders/polls_loader.rb
    - spec/graphql/loaders/polls_loader_spec.rb
    - spec/graphql/types/poll_type_spec.rb
    - spec/graphql/thing_fields_poll_query_spec.rb
  modified:
    - app/graphql/types/thing_fields.rb
    - app/graphql/boardgame_night_schema.rb
    - schema.graphql
    - schema.json
    - app/frontend/generated/types.ts

key-decisions:
  - "Used a GraphQL::Dataloader::Source (PollsLoader) to batch bgg_polls + bgg_poll_results in one query, avoiding N+1 for merged collection lists."
  - "bestPlayerCount tie-break returns the lower player_count to favor more inclusive game suggestions."

patterns-established:
  - "Poll data is exposed through the shared ThingFields concern so both ThingType and MergedThingType get polls and bestPlayerCount."
  - "Type specs use a minimal test schema to exercise GraphQL type field resolution without requiring the full application schema."

requirements-completed:
  - SUGG-01

coverage:
  - id: D1
    description: "PollType and PollResultType expose raw BGG poll data via GraphQL"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "spec/graphql/types/poll_type_spec.rb#Types::PollType exposes name, title, totalVotes, and results"
        status: pass
    human_judgment: false
  - id: D2
    description: "PollsLoader batches poll + result queries for multiple things with no N+1"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "spec/graphql/loaders/polls_loader_spec.rb#Loaders::PollsLoader#fetch issues a constant number of SQL queries regardless of thing count"
        status: pass
    human_judgment: false
  - id: D3
    description: "ThingFields adds polls and bestPlayerCount to both ThingType and MergedThingType"
    requirement: SUGG-01
    verification:
      - kind: integration
        ref: "spec/graphql/thing_fields_poll_query_spec.rb#returns polls and bestPlayerCount for a thing with suggested_numplayers data"
        status: pass
    human_judgment: false
  - id: D4
    description: "schema.graphql and frontend codegen types are regenerated with Poll/PollResult"
    verification:
      - kind: manual_procedural
        ref: "bin/rails graphql:schema:dump && grep -E 'type Poll|type PollResult|polls:|bestPlayerCount' schema.graphql"
        status: pass
      - kind: manual_procedural
        ref: "npm run codegen && grep 'export type Poll' app/frontend/generated/types.ts"
        status: pass
    human_judgment: false

duration: 4 min
completed: 2026-07-13
status: complete
---

# Phase 6 Plan 3: GraphQL Poll Data Exposure Summary

**GraphQL PollType, PollResultType, PollsLoader Dataloader source, and bestPlayerCount resolver on ThingFields with regenerated schema and frontend types.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-13T21:16:13Z
- **Completed:** 2026-07-13T21:21:04Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created `PollType` and `PollResultType` to expose raw BGG poll rows through GraphQL.
- Created `PollsLoader` to batch-load `bgg_polls` and `bgg_poll_results` for all requested thing IDs in one query.
- Extended `ThingFields` with `polls` and `bestPlayerCount` fields, automatically available on both `ThingType` and `MergedThingType`.
- Implemented `bestPlayerCount` as the player count with the most "Best" votes, tie-breaking to the lower player count.
- Registered `PollType` and `PollResultType` as orphan types in `BoardgameNightSchema` so codegen can discover them.
- Dumped `schema.graphql` and regenerated `app/frontend/generated/types.ts` with the new types.
- Added RSpec coverage for the loader, type, and end-to-end GraphQL query behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED):** PollType, PollsLoader, and ThingFields tests — `28b6809` (test)
2. **Task 1 (GREEN):** Implement PollType, PollResultType, PollsLoader, and ThingFields poll fields — `9f27b47` (feat)
3. **Task 2:** Dump schema, regenerate codegen, and add poll integration spec — `ee32d91` (feat)

**Plan metadata:** committed with this summary (see git log for hash).

## Files Created/Modified

- `app/graphql/types/poll_type.rb` — GraphQL type for a BGG poll.
- `app/graphql/types/poll_result_type.rb` — GraphQL type for a poll vote result.
- `app/graphql/loaders/polls_loader.rb` — Dataloader source batching polls + results.
- `app/graphql/types/thing_fields.rb` — Added `polls` and `bestPlayerCount` fields.
- `app/graphql/boardgame_night_schema.rb` — Registered PollType and PollResultType as orphan types.
- `schema.graphql` — Regenerated schema IDL with Poll/PollResult and new fields.
- `schema.json` — Regenerated schema JSON.
- `app/frontend/generated/types.ts` — Regenerated TypeScript types including Poll and PollResult.
- `spec/graphql/loaders/polls_loader_spec.rb` — PollsLoader behavior and N+1 prevention spec.
- `spec/graphql/types/poll_type_spec.rb` — PollType field resolution spec.
- `spec/graphql/thing_fields_poll_query_spec.rb` — End-to-end GraphQL query spec for polls and bestPlayerCount.

## Decisions Made

- Used `GraphQL::Dataloader::Source` for poll loading to keep collection list queries O(1) in database round-trips.
- Chose the lower player count on a tie for `bestPlayerCount` so the suggestion engine favors more inclusive options.
- Used a minimal test schema in `poll_type_spec.rb` to exercise the type directly without relying on the full application query surface.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 (Suggestion Engine Backend) can now query `polls` and `bestPlayerCount` on `MergedThing` to score games by community poll fit.
- Phase 9/10 can display per-player-count vote breakdowns from the same fields.

## Self-Check: PASSED

- All created files exist on disk.
- Commits `28b6809`, `9f27b47`, and `ee32d91` are present in the repository.
- `bundle exec rspec spec/graphql/ ...` exits 0 (118 examples, 0 failures).
- `bin/rails graphql:schema:dump` exits 0 and `schema.graphql` contains `type Poll`, `type PollResult`, and `polls`/`bestPlayerCount` fields.
- `npm run codegen` exits 0 and emits `Poll`/`PollResult` TypeScript types.
- `bundle exec rubocop` on the new Ruby files exits 0.

---
*Phase: 06-bgg-poll-data-layer*
*Completed: 2026-07-13*
