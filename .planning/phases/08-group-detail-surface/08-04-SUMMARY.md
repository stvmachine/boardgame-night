---
phase: 08-group-detail-surface
plan: 04
subsystem: ui
tags: [vue, vue-router, apollo, pinia, graphql]

requires:
  - phase: 08-group-detail-surface
    provides: GroupCollection query and viewer_role guard from 08-03

provides:
  - group-scoped CollectionView query mode
  - permalink reservation of `group` token with `groupBy` migration
  - Browse Library link to `/collection?group=<inviteCode>`
  - focused CollectionView, GroupDetail, and usePermalink tests

affects:
  - 08-group-detail-surface
  - 09-home-collection-redesign

tech-stack:
  added: []
  patterns:
    - "Apollo enabled option to make merged and group queries mutually exclusive"
    - "Normalize group collection items into MergedThing for shared filter/grid pipeline"
    - "Legacy URL value allowlist for backward-compatible grouping migration"

key-files:
  created:
    - spec/frontend/CollectionView.spec.ts
  modified:
    - app/frontend/composables/usePermalink.ts
    - app/frontend/views/CollectionView.vue
    - app/frontend/components/group/GroupCollectionSpotlight.vue
    - spec/frontend/usePermalink.spec.ts
    - spec/frontend/GroupDetail.spec.ts

key-decisions:
  - "Used an exact allowlist (players, rating, bestPlayers, owner) to identify legacy grouping values, so any other `group` value is preserved as an invite token."
  - "Normalized group collection items into MergedThing by adding missing optional fields rather than duplicating the collection pipeline."
  - "Used Apollo's reactive `enabled` option so merged and group queries are mutually exclusive."
  - "Added a minimal error EmptyState to expose server query errors through the existing collection surface."

patterns-established:
  - "Group-scoped collection mode reuses the same filter/sort/grid pipeline as the merged-user collection."
  - "Permalink layer migrates legacy grouping URLs while preserving non-grouping `group` tokens."

requirements-completed: [GROUP-09]

coverage:
  - id: D1
    description: "Reserve `group` token in permalink and serialize grouping as `groupBy`"
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/frontend/usePermalink.spec.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Group-scoped query mode inside CollectionView feeding the shared filter/grid pipeline"
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionView.spec.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Browse Library link targets `/collection?group=<inviteCode>` in the same tab"
    requirement: GROUP-09
    verification:
      - kind: unit
        ref: "spec/frontend/GroupDetail.spec.ts#renders section title and Browse Library link with group-scoped href"
        status: pass
    human_judgment: false
  - id: D4
    description: "Production build succeeds with the new CollectionView and GroupCollectionSpotlight changes"
    requirement: GROUP-09
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-07-15
status: complete
---

# Phase 08 Plan 04: Group Collection Browse Link Summary

**Connected the shared-collection spotlight to the canonical Collection surface via the locked `/collection?group=<inviteCode>` contract, with group-scoped Apollo query selection and collision-free permalink serialization.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-15T14:08:26Z
- **Completed:** 2026-07-15T14:20:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Reserved `group` for invite tokens in `usePermalink` and moved grouping state to `groupBy`, migrating the four known legacy grouping values.
- Added group-scoped query mode to `CollectionView` using the existing `GroupCollection` query and shared filter/sort/grid pipeline.
- Hydrated collector controls from non-empty group member BGG usernames in group mode.
- Updated `GroupCollectionSpotlight` to use the object-form RouterLink to `/collection?group=<inviteCode>`.
- Added focused tests for permalink token preservation, CollectionView query selection/data normalization, and the Browse Library href.
- Verified the production build still succeeds.

## Task Commits

Each task was committed atomically:

1. **Task 1: Reserve group scope in the collection permalink contract** (TDD)
   - Test: `0577837` - "test(08-04): add permalink tests for group token reservation and groupBy migration"
   - Feat: `31cedd2` - "feat(08-04): reserve group token in permalink and serialize grouping as groupBy"

2. **Task 2: Load group data through the existing CollectionView** (TDD)
   - Test: `4fadf93` - "test(08-04): add CollectionView group-mode and Browse Library href tests"
   - Feat: `391b88e` - "feat(08-04): add group-scoped query mode to CollectionView and object-form Browse Library link"

## Files Created/Modified
- `app/frontend/composables/usePermalink.ts` - Reserves `group` for invite tokens; hydrates `groupBy`; migrates legacy grouping values.
- `app/frontend/views/CollectionView.vue` - Adds group-scoped query mode, normalizes group items into MergedThing, hydrates collectors, exposes query errors.
- `app/frontend/components/group/GroupCollectionSpotlight.vue` - Uses object-form RouterLink to `/collection?group=<inviteCode>`.
- `spec/frontend/usePermalink.spec.ts` - Token preservation, `groupBy` hydration/serialization, legacy migration, collector-sync regression.
- `spec/frontend/CollectionView.spec.ts` - Query selection, data normalization, collector hydration, loading/error/empty states, sync-status imports.
- `spec/frontend/GroupDetail.spec.ts` - Asserts exact Browse Library href.

## Decisions Made
- **Exact allowlist for legacy grouping:** Only `players`, `rating`, `bestPlayers`, and `owner` are treated as legacy grouping values; all other `group` values are reserved invite tokens. This keeps the migration narrow and predictable.
- **Normalize group items into MergedThing:** Added the missing optional fields (`description`, `image`, `isExpansion`, `minAge`, `bayesAverage`, `usersRated`, `bestPlayerCount`, `polls`) rather than forking the filter/grid pipeline.
- **Mutually exclusive Apollo queries:** Used reactive `enabled` options so only one of `useMergedCollectionQuery` or `useGroupCollectionQuery` is active at a time.
- **Group members drive collectors:** In group mode, `collectorsStore.usernames` is set from non-empty member `bggUsername` values, filtering out unbound members.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected invalid grouping value in existing permalink test**
- **Found during:** Task 1
- **Issue:** The existing `usePermalink.spec.ts` test used `group=player_count`, which is not a valid `GroupOption` and would be misinterpreted under the new `group`/`groupBy` split.
- **Fix:** Updated the test to use `groupBy=players` (a valid grouping value) and added separate coverage for legacy `group` values.
- **Files modified:** `spec/frontend/usePermalink.spec.ts`
- **Verification:** All 17 usePermalink tests pass.
- **Committed in:** `0577837` (test commit for Task 1)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test correction; no scope creep or behavior change.

## Issues Encountered
- None - the implementation matched the existing Apollo/Vue patterns and the backend `GroupCollection` contract from 08-03.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Group Detail surface now has a complete Browse Library path to the canonical collection view.
- Phase 09 (Home & Collection Redesign) can rely on the locked `/collection?group=<inviteCode>` URL and the group-scoped query mode.

## Self-Check: PASSED
- Created files exist: `spec/frontend/CollectionView.spec.ts` ✓
- All task commits exist: `0577837`, `31cedd2`, `4fadf93`, `391b88e` ✓
- Verification tests pass: usePermalink (17), CollectionView (9), GroupDetail (23) ✓
- Production build succeeds ✓

---
*Phase: 08-group-detail-surface*
*Completed: 2026-07-15*
