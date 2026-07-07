---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 02
subsystem: api, ui
tags: [graphql, ruby, vue, apollo, codegen, rspec, tdd]

requires:
  - phase: 03-01
    provides: GraphQL types (MergedThing, MergedCollection, Owner, User, UserSyncStatus, SyncStatus), OwnersLoader, BggThing merge scope, UserType

provides:
  - QueryType.merged_collection(usernames:) and QueryType.user(username:) fields
  - app/frontend/apollo/queries/merged_collection.graphql and user.graphql
  - Minimal /collection route with CollectionView.vue, GameCard.vue, GameGrid.vue, ResultsSkeleton.vue
  - Regenerated schema.graphql and app/frontend/generated/operations.ts

affects:
  - 03-06 (shell/avatar components: GameCard owner avatars currently inline; MemberAvatar stub expected)
  - 03-04 (hotItems and search queries extend the same QueryType)
  - 03-07 (collection polish uses these components as base)

tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN for GraphQL query wiring: failing spec first, then implementation"
    - "GraphQL::Dataloader via Loaders::OwnersLoader for batched owner resolution on MergedThingType"
    - "Schema-first codegen: rails-generated schema.graphql drives npm run codegen"

key-files:
  created:
    - app/frontend/apollo/queries/merged_collection.graphql
    - app/frontend/apollo/queries/user.graphql
    - app/frontend/components/collection/GameCard.vue
    - app/frontend/components/collection/GameGrid.vue
    - app/frontend/components/collection/ResultsSkeleton.vue
    - app/frontend/views/CollectionView.vue
    - spec/graphql/merged_collection_query_spec.rb
  modified:
    - app/graphql/types/query_type.rb
    - app/graphql/types/user_type.rb
    - app/frontend/router/index.ts
    - schema.graphql
    - app/frontend/generated/operations.ts

key-decisions:
  - "Return UserSyncStatus structs with status READY for all requested usernames on the read path (sync state is computed at query time; subscriptions will be added in 03-03)."
  - "Use a direct Ruby Struct (SyncStatus) for the resolver payload instead of a dedicated model because sync status is currently transient."
  - "GameCard renders owner avatars inline as deterministic colored initials rather than importing a not-yet-existing MemberAvatar component."

requirements-completed:
  - COLL-02
  - COLL-12
  - COLL-13
  - GQL-02
  - GQL-05

coverage:
  - id: D1
    description: "GraphQL mergedCollection and user queries resolve from DB with batched owner loading and return expected shapes."
    requirement: GQL-02
    verification:
      - kind: unit
        ref: "spec/graphql/merged_collection_query_spec.rb#returns a single deduplicated thing with both owners"
        status: pass
      - kind: unit
        ref: "spec/graphql/merged_collection_query_spec.rb#looks up a user by bgg_username"
        status: pass
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#collection surface types loads the required types"
        status: pass
    human_judgment: false
  - id: D2
    description: "/collection route renders a minimal game-card grid with thumbnails, meta, rating/complexity badges, and owner avatars."
    requirement: COLL-12
    verification:
      - kind: unit
        ref: "npm run test"
        status: pass
      - kind: unit
        ref: "npx vue-tsc --noEmit (no new errors from created components)"
        status: pass
    human_judgment: false
  - id: D3
    description: "schema.graphql and app/frontend/generated/operations.ts are regenerated, in sync, and committed."
    requirement: GQL-05
    verification:
      - kind: other
        ref: "bundle exec ruby -e 'require_relative config/environment; puts BoardgameNightSchema.to_definition' > schema.graphql"
        status: pass
      - kind: other
        ref: "npm run codegen"
        status: pass
    human_judgment: false

# Metrics
duration: 10min
completed: 2026-07-07
status: complete
---

# Phase 03 Plan 02: GraphQL Query Wiring + Minimal Collection Grid Summary

**GraphQL `mergedCollection` and `user` queries wired end-to-end with a minimal `/collection` game-card grid and regenerated schema/codegen artifacts.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-07T04:59:53Z
- **Completed:** 2026-07-07T05:10:44Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added `mergedCollection(usernames:)` and `user(username:)` fields to `QueryType`, backed by `BggThing.merged_for_bgg_usernames` and `User.find_by(bgg_username:)`.
- Wrote a TDD RSpec proving two users sharing one thing return a single deduplicated item with both owners.
- Created `CollectionView.vue`, `GameCard.vue`, `GameGrid.vue`, and `ResultsSkeleton.vue` for a responsive auto-fill game grid.
- Added `/collection` route to `app/frontend/router/index.ts` without a legacy `/u/:usernames` route.
- Regenerated `schema.graphql` and `app/frontend/generated/operations.ts` so the frontend consumes typed `useMergedCollectionQuery` and `MergedThing`.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED):** GraphQL query failing test — `a00875f` (test)
2. **Task 1 (GREEN):** Implement `mergedCollection` and `user` queries — `3e5f35c` (feat)
3. **Task 2:** Minimal CollectionView, GameCard, GameGrid, and codegen — `04509fd` (feat)

**Plan metadata:** `09c5aca` (docs: complete plan)

## Files Created/Modified

- `app/graphql/types/query_type.rb` — Added `mergedCollection` and `user` root fields with resolvers and sync-status payload.
- `app/graphql/types/user_type.rb` — Added `avatar` resolver delegating to `bgg_avatar_url`.
- `app/frontend/apollo/queries/merged_collection.graphql` — Frontend query selecting all `MergedThing` fields plus owners.
- `app/frontend/apollo/queries/user.graphql` — Frontend query selecting `username` and `avatar`.
- `app/frontend/components/collection/GameCard.vue` — Game card with thumbnail, meta, badges, and owner avatars.
- `app/frontend/components/collection/GameGrid.vue` — Grid wrapper that renders cards or skeletons.
- `app/frontend/components/collection/ResultsSkeleton.vue` — Pulse skeleton matching card dimensions.
- `app/frontend/views/CollectionView.vue` — Reads `route.query.usernames`, calls `useMergedCollectionQuery`, renders `GameGrid`.
- `app/frontend/router/index.ts` — Added `/collection` route; kept `/` as `HealthView`.
- `schema.graphql` — Regenerated with `mergedCollection`, `user`, `MergedThing`, `Owner`, `User`, `UserSyncStatus`, `SyncStatus`.
- `app/frontend/generated/operations.ts` — Regenerated typed composables and types.
- `spec/graphql/merged_collection_query_spec.rb` — TDD spec for deduplication and owner arrays.

## Decisions Made

- Followed TDD RED/GREEN for the GraphQL query wiring (failing spec first, then implementation).
- Returned transient `UserSyncStatus` objects with `READY` status on the read path; real-time sync subscriptions will be added in Plan 03-03.
- Inlined deterministic owner avatars as colored initials in `GameCard.vue` rather than blocking on the `MemberAvatar` component planned for 03-06.
- Used `bundle exec ruby ... BoardgameNightSchema.to_definition` because the assumed `bin/rails graphql:schema:dump` rake task is not present in this project.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test used lazy `let` for user query fixture, so the user was never created**
- **Found during:** Task 1 (RED/GREEN cycle)
- **Issue:** The `user query` test defined `let(:alice)` but never referenced it, so `User.find_by(bgg_username:)` returned `nil` and the test failed for the wrong reason.
- **Fix:** Changed `let(:alice)` to `let!(:alice)` to ensure the user record is created before the query runs.
- **Files modified:** `spec/graphql/merged_collection_query_spec.rb`
- **Verification:** `user query` examples pass.
- **Committed in:** `3e5f35c` (Task 1 GREEN commit)

**2. [Rule 1 - Bug] `UserType.avatar` field had no resolver and called non-existent `User#avatar`**
- **Found during:** Task 1 (GREEN cycle)
- **Issue:** `UserType` exposed `avatar` but did not define a resolver; graphql-ruby tried `User#avatar`, which does not exist. The model stores the avatar in `bgg_avatar_url`.
- **Fix:** Added `def avatar` to `UserType` that delegates to `object.bgg_avatar_url`.
- **Files modified:** `app/graphql/types/user_type.rb`
- **Verification:** `user query` examples pass.
- **Committed in:** `3e5f35c` (Task 1 GREEN commit)

**3. [Rule 3 - Blocking] `bin/rails graphql:schema:dump` rake task does not exist**
- **Found during:** Task 1 verification
- **Issue:** The plan's verify command uses `rails graphql:schema:dump`, but Rails reports `Unrecognized command "graphql:schema:dump"`.
- **Fix:** Replaced the rake task with `bundle exec ruby -e 'require_relative "config/environment"; puts BoardgameNightSchema.to_definition' > schema.graphql` to produce the same committed artifact.
- **Files modified:** `schema.graphql` (regenerated)
- **Verification:** Schema dump and `npm run codegen` both succeed; `schema.graphql` contains all expected types.
- **Committed in:** `3e5f35c` (Task 1) and `04509fd` (Task 2)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes were necessary for correctness or to execute the planned verification. No scope creep.

## Issues Encountered

- RSpec's `-x` flag used in the plan's verify command is not supported by this version of RSpec; replaced with `--fail-fast` for local verification.
- `vue-tsc --noEmit` reports pre-existing errors in `app/frontend/generated/operations.ts` (missing `@vue/composition-api` peer) and `app/frontend/views/HealthView.spec.ts` (missing `DeepMockProxy` type). No new errors were introduced by this plan's components.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The DB → GraphQL → Vue read path is proven and ready for Plan 03-03 (import/sync API with Solid Cable subscriptions) and Plan 03-06 (shell/avatar components).
- `MemberAvatar` is expected to replace the inline owner circles in `GameCard.vue` when 03-06 runs.

## Self-Check: PASSED

- [x] `spec/graphql/merged_collection_query_spec.rb` exists and passes.
- [x] `schema.graphql` exists and contains `mergedCollection`, `user`, `MergedThing`, `Owner`, `User`, `UserSyncStatus`, and `SyncStatus`.
- [x] `app/frontend/generated/operations.ts` exports `useMergedCollectionQuery` and `MergedThing`.
- [x] `app/frontend/router/index.ts` contains `/collection` and no `/u/:usernames` route.
- [x] `npm run test` passes.
- [x] `npx vue-tsc --noEmit` introduces no new errors.
- [x] All commits recorded and pushed to local history.

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-07*
