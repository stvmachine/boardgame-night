---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 06
subsystem: ui
tags: [vue, vue-router, tailwind, fuse.js, pinia, vitest, graphql, apollo]

requires:
  - phase: 03-01
    provides: GraphQL schema and Apollo client wiring used by the collection view.

provides:
  - Responsive app shell with header, mobile drawer, and sidebar slot.
  - Client-side filter utilities (player count, playtime) and Fuse.js search wrapper.
  - useCollectionFilters composable composing text search, player count, playtime, rating, weight, and owner filters.
  - collectors Pinia store that syncs usernames with the URL query string.
  - Sidebar and MemberAvatar components for managing collectors.
  - CollectionView integration with search input and player-count select.

affects:
  - 03-graphql-api-collection-surface-v1-parity

tech-stack:
  added:
    - fuse.js
  patterns:
    - Pinia setup stores for UI-only state.
    - Composables for reusable client-side filtering logic.
    - Deterministic placeholder avatars via username hash.

key-files:
  created:
    - app/frontend/components/layout/AppShell.vue
    - app/frontend/components/layout/AppHeader.vue
    - app/frontend/components/layout/MobileDrawer.vue
    - app/frontend/components/layout/Sidebar.vue
    - app/frontend/components/common/MemberAvatar.vue
    - app/frontend/composables/useCollectionFilters.ts
    - app/frontend/composables/useMemberColor.ts
    - app/frontend/stores/collectors.ts
    - app/frontend/utils/fuseSearch.ts
    - app/frontend/utils/filters.ts
  modified:
    - app/frontend/App.vue
    - app/frontend/stores/ui.ts
    - app/frontend/views/CollectionView.vue
    - spec/frontend/filters.spec.ts

key-decisions:
  - "Created the minimal ui store in Task 1 because AppHeader depends on sidebarOpen; Task 3 only extended it with theme."
  - "Used Fuse keys ['name', 'originalname'] with threshold 0.3 because the generated MergedThing type does not include a nested name.text field."
  - "Did not commit package-lock.json because it had pre-existing uncommitted changes unrelated to this plan."

patterns-established:
  - "UI state lives in Pinia; server data stays in Apollo cache."
  - "Filter composables accept Ref<MergedThing[]> and return reactive filter state plus computed filteredGames."
  - "Collector usernames are a UI concern stored in Pinia and mirrored to the URL query string."

requirements-completed:
  - COLL-15
  - COLL-16
  - GQL-05

coverage:
  - id: D1
    description: "AppShell renders a responsive layout with header, sidebar slot, and main content area."
    requirement: COLL-15
    verification:
      - kind: unit
        ref: "spec/frontend/AppShell.spec.ts#renders header, main and aside slots"
        status: pass
      - kind: unit
        ref: "spec/frontend/AppShell.spec.ts#toggles mobile sidebar open state via slot prop"
        status: pass
    human_judgment: false
  - id: D2
    description: "Fuse.js search wrapper finds games by name and originalname with threshold 0.3."
    requirement: GQL-05
    verification:
      - kind: unit
        ref: "spec/frontend/filters.spec.ts#returns all games when query is empty"
        status: pass
      - kind: unit
        ref: "spec/frontend/filters.spec.ts#finds games by name using fuzzy matching"
        status: pass
      - kind: unit
        ref: "spec/frontend/filters.spec.ts#matches original names"
        status: pass
    human_judgment: false
  - id: D3
    description: "Player count and playtime filter utilities return correct results for range checks."
    requirement: COLL-15
    verification:
      - kind: unit
        ref: "spec/frontend/filters.spec.ts#playerCountFilter and playtimeFilter suites"
        status: pass
    human_judgment: false
  - id: D4
    description: "useCollectionFilters composable exposes reactive filter state and returns filtered games."
    requirement: COLL-15
    verification:
      - kind: unit
        ref: "spec/frontend/useCollectionFilters.spec.ts#returns all games when no filters are active"
        status: pass
      - kind: unit
        ref: "spec/frontend/useCollectionFilters.spec.ts#filters by player count"
        status: pass
      - kind: unit
        ref: "spec/frontend/useCollectionFilters.spec.ts#filters by search query after debounce"
        status: pass
      - kind: unit
        ref: "spec/frontend/useCollectionFilters.spec.ts#filters by selected owners"
        status: pass
    human_judgment: false
  - id: D5
    description: "Sidebar manages collector usernames and syncs with the URL query parameter."
    requirement: COLL-16
    verification:
      - kind: unit
        ref: "spec/frontend/Sidebar.spec.ts#renders add input and add button"
        status: pass
      - kind: unit
        ref: "spec/frontend/Sidebar.spec.ts#adds a username to the collectors store when add is clicked"
        status: pass
      - kind: unit
        ref: "spec/frontend/Sidebar.spec.ts#removes a username when remove is clicked"
        status: pass
    human_judgment: false
  - id: D6
    description: "MemberAvatar renders a deterministic username-based placeholder."
    requirement: COLL-16
    verification:
      - kind: unit
        ref: "spec/frontend/MemberAvatar.spec.ts#renders a deterministic avatar"
        status: pass
      - kind: unit
        ref: "spec/frontend/MemberAvatar.spec.ts#shows the username as a tooltip"
        status: pass
    human_judgment: false

# Metrics
duration: 27min
completed: 2026-07-07
status: complete
---

# Phase 03 Plan 06: Collection Filtering UI Foundation Summary

**Built a responsive Vue app shell with Tailwind v4, Fuse.js search, client-side filter utilities, and a Pinia-backed collector Sidebar that syncs with the URL.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-07-07T05:10:00Z
- **Completed:** 2026-07-07T05:36:53Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Responsive `AppShell` with `AppHeader`, `MobileDrawer`, and `Sidebar` slot for mobile and desktop breakpoints.
- Pure `filters.ts` and `fuseSearch.ts` helpers for player count, playtime, and fuzzy text search.
- `useCollectionFilters` composable that composes Fuse search, player count, playtime, rating, weight, and selected-owner filters.
- `collectors` Pinia store with `add`, `remove`, and `syncWithRoute` actions that mirror usernames to `?usernames=`.
- `Sidebar` component for managing collectors and `MemberAvatar` for deterministic username placeholders.
- `CollectionView` wired to the filter composable with a search input and player-count select.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tailwind v4 setup, App.vue, AppShell, and styles entrypoint** - `c7e18ab` (test: add failing tests for AppShell layout)
2. **Task 1 (GREEN)** - `8532d72` (feat: implement AppShell, AppHeader, MobileDrawer, and App.vue)
3. **Task 2: Filter utilities and Fuse.js search wrapper** - `0dbce50` (test: add failing tests for Fuse search and filters)
4. **Task 2 (GREEN)** - `b9339ba` (feat: implement Fuse.js search wrapper and filter utilities)
5. **Task 3: useCollectionFilters composable and UI store** - `451f6b1` (fix: add originalname to filter test fixtures to match Fuse keys)
6. **Task 3 (GREEN)** - `c94cb98` (feat: implement filter composables, collectors store, and Sidebar)

**Plan metadata:** pending (final docs commit)

## Files Created/Modified

- `app/frontend/components/layout/AppShell.vue` - Responsive shell with header, sidebar slot, and main content.
- `app/frontend/components/layout/AppHeader.vue` - Header with title and mobile sidebar toggle.
- `app/frontend/components/layout/MobileDrawer.vue` - Slide-out mobile drawer for the sidebar slot.
- `app/frontend/components/layout/Sidebar.vue` - Collector management list synced to URL query.
- `app/frontend/components/common/MemberAvatar.vue` - Deterministic username-based avatar placeholder.
- `app/frontend/composables/useCollectionFilters.ts` - Composable composing all filter criteria.
- `app/frontend/composables/useMemberColor.ts` - Deterministic username color hash.
- `app/frontend/stores/collectors.ts` - Pinia store for collector usernames.
- `app/frontend/stores/ui.ts` - UI state (sidebar open, theme).
- `app/frontend/utils/fuseSearch.ts` - Fuse.js index wrapper.
- `app/frontend/utils/filters.ts` - Player count and playtime filter helpers.
- `app/frontend/App.vue` - Mounts AppShell, Sidebar slot, and router-view.
- `app/frontend/views/CollectionView.vue` - Wires filter composable to GameGrid.
- `spec/frontend/*.spec.ts` - Unit tests for shell, filters, composable, and components.

## Decisions Made

- Created the minimal `ui` store in Task 1 because `AppHeader` depends on `sidebarOpen`; Task 3 only extended it with `theme`.
- Used Fuse keys `['name', 'originalname']` with threshold `0.3` because the generated `MergedThing` type does not include a nested `name.text` field.
- Did not commit `package-lock.json` because it had pre-existing uncommitted changes unrelated to this plan.
- `HomeView.vue` does not exist in the repository, so Sidebar integration was done through `App.vue` and `CollectionView.vue` instead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added the `ui` Pinia store in Task 1 instead of Task 3**
- **Found during:** Task 1 (AppShell layout implementation)
- **Issue:** The plan scheduled `stores/ui.ts` for Task 3, but `AppHeader.vue` requires a `sidebarOpen` toggle as part of the mobile shell.
- **Fix:** Created the minimal `ui` store in Task 1 with `sidebarOpen`, `toggleSidebar`, `closeSidebar`, and `openSidebar`. Task 3 later extended it with `theme`.
- **Files modified:** `app/frontend/stores/ui.ts`
- **Verification:** `AppShell.spec.ts` passes.
- **Committed in:** `8532d72` (Task 1 GREEN)

**2. [Rule 1 - Bug] Adjusted Fuse search keys to match the generated `MergedThing` type**
- **Found during:** Task 2 (Fuse search wrapper implementation)
- **Issue:** The plan specified keys `['name', 'name.text', 'originalname']`, but `MergedThing` does not expose `name.text` (only `name: string`).
- **Fix:** Used keys `['name', 'originalname']` with threshold `0.3` to match the available data shape.
- **Files modified:** `app/frontend/utils/fuseSearch.ts`, `spec/frontend/filters.spec.ts`
- **Verification:** `filters.spec.ts` passes.
- **Committed in:** `b9339ba` (Task 2 GREEN), `451f6b1` (test fix)

**3. [Rule 3 - Blocking] Fixed test router setup and debounce timing for new tests**
- **Found during:** Task 3 verification (after implementation)
- **Issue:** `Sidebar.spec.ts` failed because the test router had no route for `/`, and `useCollectionFilters.spec.ts` needed timers advanced past the 300ms debounce window.
- **Fix:** Added a home route to the test router, navigated to `/collection` before mounting, and used `vi.advanceTimersByTime(400)` plus `vi.runAllTimersAsync()` for the debounce test.
- **Files modified:** `spec/frontend/Sidebar.spec.ts`, `spec/frontend/useCollectionFilters.spec.ts`
- **Verification:** `npm run test` passes (25 tests).
- **Committed in:** `c94cb98` (Task 3 GREEN)

**4. [Rule 3 - Blocking] Added a type cast for `route.query.usernames` in `Sidebar.vue`**
- **Found during:** Task 3 type check (`npx vue-tsc --noEmit`)
- **Issue:** `route.query.usernames` is typed as `LocationQueryValue | LocationQueryValue[]` (includes `null`), which is not assignable to the `syncWithRoute` parameter.
- **Fix:** Cast to `string | string[] | null | undefined` in the component.
- **Files modified:** `app/frontend/components/layout/Sidebar.vue`
- **Verification:** `npx vue-tsc --noEmit` no longer reports a Sidebar error.
- **Committed in:** `c94cb98` (Task 3 GREEN)

---

**Total deviations:** 4 auto-fixed (1 missing critical, 1 bug, 2 blocking)
**Impact on plan:** All fixes were necessary for correctness and testability. No scope creep; the delivered features match the plan objective.

## Issues Encountered

- `package-lock.json` and `.planning/config.json` had pre-existing uncommitted changes, so they were intentionally left unstaged to avoid mixing unrelated work.
- `npx vue-tsc --noEmit` reports pre-existing errors in `app/frontend/generated/operations.ts` (missing `@vue/composition-api`, enum merge issues) and `app/frontend/views/HealthView.spec.ts` (missing `DeepMockProxy`). No new type errors were introduced by this plan.
- `HomeView.vue` does not exist in the repository, so Sidebar integration was wired through `App.vue` and `CollectionView.vue` instead of the home view mentioned in the plan action.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The collection filtering UI foundation is ready for wiring with the full merged-collection GraphQL query and game-detail navigation.
- All unit tests pass; only pre-existing type-check issues remain unrelated to this plan.
- No blockers.

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-07*
