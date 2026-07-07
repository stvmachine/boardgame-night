---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 07
subsystem: ui
tags: [vue, pinia, graphql, apollo, playwright, rails, e2e]

requires:
  - phase: 03-02
    provides: GameGrid component and /collection route
  - phase: 03-04
    provides: Sidebar, collectors store, and landing route
  - phase: 03-06
    provides: useCollectionFilters composable

provides:
  - CollectionView wired with filters, sort, group-by, owner toggles, and empty state
  - Pinia filter store shared between Sidebar and CollectionView
  - usePermalink composable for owner and filter URL serialization
  - CollectorsSection with per-owner toggles and Select All / Deselect All
  - Playwright e2e coverage for collection load, filter, sort, group, owner toggles, and permalink reload
  - E2e database seed task and updated README

affects:
  - 03-graphql-api-collection-surface-v1-parity
  - collection
  - frontend

tech-stack:
  added: []
  patterns:
    - Pinia setup store for filter state shared across Sidebar and CollectionView
    - Vue reactive function as Apollo query variables for store-driven refetching
    - URLSearchParams + history.replaceState for client-side permalink state
    - Rails rake task for idempotent e2e fixture seeding

key-files:
  created:
    - app/frontend/components/collection/CollectionFilters.vue
    - app/frontend/components/collection/SortControl.vue
    - app/frontend/components/collection/GroupByToggle.vue
    - app/frontend/components/collection/EmptyState.vue
    - app/frontend/components/layout/CollectorsSection.vue
    - app/frontend/stores/filters.ts
    - app/frontend/utils/sorting.ts
    - app/frontend/utils/grouping.ts
    - app/frontend/composables/usePermalink.ts
    - tests/e2e/collection.spec.ts
    - tests/e2e/global-setup.ts
    - lib/tasks/e2e.rake
    - bin/e2e-seed
  modified:
    - app/frontend/views/CollectionView.vue
    - app/frontend/components/collection/GameGrid.vue
    - app/frontend/components/layout/Sidebar.vue
    - app/frontend/components/landing/UsernameForm.vue
    - app/frontend/stores/collectors.ts
    - app/frontend/apollo/client.ts
    - app/models/bgg_thing.rb
    - tests/e2e/playwright.config.ts
    - tests/e2e/health.spec.ts
    - README.md

key-decisions:
  - "Created a dedicated Pinia filter store so filter and selected-owner state can be shared between Sidebar and CollectionView without prop drilling."
  - "Made the collectors store the canonical owner of the usernames list and route query sync; removed the Sidebar's duplicate URL watcher."
  - "Implemented usePermalink with URLSearchParams and history.replaceState to preserve filters, sort, group, and owner selection across reloads."
  - "Used a Rails rake task + bin/e2e-seed for e2e fixtures so tests do not depend on live BGG or credentials."

patterns-established:
  - "Store-driven query variables: pass a reactive function to Apollo useQuery so the collection refetches when the collectors store hydrates."
  - "Client-side permalink state: serialize filter state to URL via history.replaceState and hydrate on mount."
  - "E2e fixtures via a Rails rake task invoked by Playwright globalSetup."

requirements-completed:
  - COLL-06
  - COLL-07
  - COLL-08
  - COLL-10
  - COLL-12
  - COLL-13
  - COLL-14
  - COLL-15
  - COLL-16
  - COLL-17
  - GQL-05

coverage:
  - id: D1
    description: "CollectionView integrates filters, sort, group-by, and merged-collection query"
    requirement: COLL-14
    verification:
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#loads merged collection from seed data"
        status: pass
      - kind: unit
        ref: "spec/frontend/CollectionFilters.spec.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "URL usernames and owners are stable permalinks"
    requirement: COLL-15
    verification:
      - kind: unit
        ref: "spec/frontend/collectorsStore.spec.ts"
        status: pass
      - kind: unit
        ref: "spec/frontend/usePermalink.spec.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#preserves filter state via permalink on reload"
        status: pass
    human_judgment: false
  - id: D3
    description: "Empty state renders when filters match zero games or no collectors are selected"
    requirement: COLL-16
    verification:
      - kind: unit
        ref: "spec/frontend/CollectionFilters.spec.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#deselecting a collector filters the game list"
        status: pass
    human_judgment: false
  - id: D4
    description: "Sidebar contains Select All / Deselect All buttons that toggle owner filters"
    requirement: COLL-17
    verification:
      - kind: unit
        ref: "spec/frontend/CollectorsSection.spec.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#deselecting a collector filters the game list"
        status: pass
    human_judgment: false
  - id: D5
    description: "README documents how to run the full stack and e2e tests"
    requirement: COLL-13
    verification:
      - kind: other
        ref: "README.md#Testing and README.md#Development"
        status: pass
    human_judgment: false

duration: 2h 10m
completed: 2026-07-08
status: complete
---

# Phase 3 Plan 7: Collection Surface v1 Parity Summary

**Fully wired CollectionView with filters, sort, group-by, owner toggles, empty state, permalink preservation, and Playwright e2e coverage seeded from Rails fixtures.**

## Performance

- **Duration:** 2h 10m
- **Started:** 2026-07-08T09:42:00Z
- **Completed:** 2026-07-08T11:52:00Z
- **Tasks:** 3
- **Files modified:** 23

## Accomplishments

- Added filter, sort, group, and owner-toggle components and wired them into CollectionView.
- Created a shared Pinia filter store so Sidebar and CollectionView stay in sync.
- Implemented permalink preservation for collectors (via collectors store + router.replace) and owner/filters (via usePermalink + history.replaceState).
- Added unit tests for the collectors store URL sync and usePermalink hydration/serialization.
- Built an idempotent e2e seed task (`lib/tasks/e2e.rake`) and Playwright global setup (`tests/e2e/global-setup.ts`) so e2e tests run without live BGG or credentials.
- Wrote `tests/e2e/collection.spec.ts` covering collection load, owner toggles, player-count filter, sort, group-by, and permalink reload.
- Updated README with setup, dev server, unit test, and e2e test instructions.

## Task Commits

Each task was committed atomically:

1. **Task 1: CollectionView integration with filters, sort, and group-by** - `a6c0910` (feat)
2. **Task 2: Permalink preservation and route integration** - `087dbc2` (feat)
3. **Task 3: Playwright e2e tests for collection and permalink** - `4447d99` (test)

## Files Created/Modified

- `app/frontend/views/CollectionView.vue` - Wires filters, sort, group, empty state, merged query, and usePermalink.
- `app/frontend/components/collection/CollectionFilters.vue` - Filter inputs for search, players, time, complexity, rating.
- `app/frontend/components/collection/SortControl.vue` - Sort select.
- `app/frontend/components/collection/GroupByToggle.vue` - Group-by select.
- `app/frontend/components/collection/EmptyState.vue` - Empty-state UI with clear action.
- `app/frontend/components/collection/GameGrid.vue` - Renders grouped or ungrouped game cards.
- `app/frontend/components/layout/CollectorsSection.vue` - Owner toggles with Select All / Deselect All.
- `app/frontend/components/layout/Sidebar.vue` - Includes CollectorsSection; removed duplicate URL watcher.
- `app/frontend/components/landing/UsernameForm.vue` - Seeds collectors store before navigation.
- `app/frontend/stores/filters.ts` - Shared Pinia filter store.
- `app/frontend/stores/collectors.ts` - Watches route usernames and updates URL via router.replace.
- `app/frontend/composables/usePermalink.ts` - Hydrates/serializes owner and filter state from URL.
- `app/frontend/utils/sorting.ts` - Sort options and sortGames helper.
- `app/frontend/utils/grouping.ts` - Group options and groupGames helper.
- `app/frontend/utils/filters.ts` - Added complexity and rating filters.
- `app/frontend/composables/useCollectionFilters.ts` - Extended to accept shared refs from filter store.
- `app/models/bgg_thing.rb` - Added `is_expansion` fallback to resolve GraphQL field.
- `lib/tasks/e2e.rake` - Idempotent e2e fixture seed task.
- `bin/e2e-seed` - Wrapper that initializes rbenv/nvm before running the seed task.
- `tests/e2e/global-setup.ts` - Playwright global setup invoking bin/e2e-seed.
- `tests/e2e/collection.spec.ts` - E2e coverage for collection and permalink.
- `tests/e2e/playwright.config.ts` - Added globalSetup.
- `tests/e2e/health.spec.ts` - Fixed route to `/health`.
- `README.md` - Added setup, dev, and test instructions.

## Decisions Made

- Created a dedicated Pinia filter store to share filter/owner state between Sidebar and CollectionView without prop drilling.
- Extended `useCollectionFilters` to accept optional refs from the store so the same composable works in tests and in the wired view.
- Made the collectors store the canonical owner of the usernames list; removed the Sidebar's duplicate URL watcher to avoid double updates.
- Used `history.replaceState` (via URLSearchParams) in usePermalink for lightweight, client-side serialization that does not trigger router navigation loops.
- Used a Rails rake task + Playwright `globalSetup` for e2e fixtures instead of relying on live BGG, avoiding credential requirements in CI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GameGrid did not render ungrouped games**
- **Found during:** Task 3 (e2e test "loads merged collection from seed data")
- **Issue:** `CollectionView` passes `:groups="groupedGames"`; when `groupBy` is `'none'`, `groupGames` returns `[{ name: 'All Games', games: [...] }]`. The `GameGrid` v-else branch iterated over the empty `games` prop, so no cards rendered.
- **Fix:** Added a computed `ungroupedGames` that returns `games` prop if provided, otherwise `groups[0].games` when the first group is `'All Games'`.
- **Files modified:** `app/frontend/components/collection/GameGrid.vue`
- **Verification:** `tests/e2e/collection.spec.ts` passed.
- **Committed in:** `4447d99` (Task 3 commit)

**2. [Rule 1 - Bug] GraphQL `mergedCollection` query returned 500 due to missing `is_expansion` resolver**
- **Found during:** Task 3 (e2e test runtime)
- **Issue:** `Types::ThingFields` declares `is_expansion` non-null, but `BggThing` had no `is_expansion` attribute or method, causing graphql-ruby to raise when the full query ran.
- **Fix:** Added `BggThing#is_expansion` returning `false` with a comment explaining BGG does not expose a dedicated expansion flag and expansions are separate objects.
- **Files modified:** `app/models/bgg_thing.rb`
- **Verification:** Full `mergedCollection` GraphQL query returned 200; e2e tests passed.
- **Committed in:** `4447d99` (Task 3 commit)

**3. [Rule 1 - Bug] Pre-existing health e2e test visited wrong route**
- **Found during:** Task 3 (`npm run e2e` run)
- **Issue:** `tests/e2e/health.spec.ts` navigated to `/` but `HealthView` is mounted at `/health`, so "Server Health" never appeared.
- **Fix:** Changed `page.goto('/')` to `page.goto('/health')`.
- **Files modified:** `tests/e2e/health.spec.ts`
- **Verification:** `npm run e2e` passed.
- **Committed in:** `4447d99` (Task 3 commit)

**4. [Rule 2 - Missing Critical] Collector checkboxes lacked accessible labels**
- **Found during:** Task 3 (e2e test selector strict-mode violations)
- **Issue:** `getByLabel('e2e_alice')` matched multiple elements because the `MemberAvatar` span had an `aria-label` and the checkbox had no explicit label, making owner toggles unreliable to target.
- **Fix:** Added `:aria-label="username"` to the checkbox input in `CollectorsSection.vue`.
- **Files modified:** `app/frontend/components/layout/CollectorsSection.vue`
- **Verification:** `tests/e2e/collection.spec.ts` passed.
- **Committed in:** `4447d99` (Task 3 commit)

### Path Adjustments

- The plan specified `spec/e2e/` for e2e tests, but the project's existing Playwright config and scripts use `tests/e2e/`. All new e2e files were placed under `tests/e2e/` to match the existing convention and `package.json`.
- The plan's verify step uses `npm run test:e2e`, but the actual script is `npm run e2e`; `npm run e2e` was used.
- The permalink scenario was covered inside `tests/e2e/collection.spec.ts` as a dedicated test case rather than a separate `permalink.spec.ts`, since the acceptance criteria overlap and a single spec keeps the suite faster.

---

**Total deviations:** 4 auto-fixed (3 Rule 1 bugs, 1 Rule 2 missing critical)
**Impact on plan:** All auto-fixes were required for correctness and testability. No scope creep.

## Issues Encountered

- Initial `CollectionView` query variables used a `computed()` reading from the collectors store, but the store's `usernames` ref was empty at component setup time and the query did not refetch after the store hydrated from the route. Switched to a reactive function `() => ({ usernames: collectorsStore.usernames })` so Apollo re-runs when the store updates.
- E2e seed initially failed because the global setup ran `bin/rails` without initializing rbenv/nvm, causing the system Ruby (4.0) to load the wrong Bundler environment. Added `bin/e2e-seed` that mirrors `bin/dev-e2e`'s environment setup before invoking the rake task.

## User Setup Required

None - no external service configuration required beyond the existing `.env.bggeek` (not needed for seeded e2e fixtures).

## Next Phase Readiness

- Collection surface is complete and covered by e2e tests; ready for session-organizing features or night-session workflows.
- The filter store and permalink composable can be extended to persist additional state (e.g., selected session attendees) in future phases.

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-08*

## Self-Check: PASSED

- Created files found: usePermalink.ts, collection.spec.ts, global-setup.ts, e2e.rake, e2e-seed, SUMMARY.md.
- Task commits found: a6c0910, 087dbc2, 4447d99.
- Final verification: `npm run test` 49 passed, `npm run e2e` 8 passed, `npx vue-tsc --noEmit` only pre-existing errors.
