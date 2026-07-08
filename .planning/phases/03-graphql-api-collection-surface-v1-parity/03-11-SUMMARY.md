---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 11
subsystem: ui
tags: [vue, apollo, graphql, refresh, cooldown, vitest]

requires:
  - phase: 03-graphql-api-collection-surface-v1-parity
    provides: importCollection mutation with 15-minute cooldown and persisted last_synced_at (03-10)

provides:
  - Per-user RefreshButton component with countdown timer
  - useRefreshCollection composable for per-user cooldown state
  - Sidebar/CollectorsSection wiring that calls importCollection on refresh

affects:
  - 03-graphql-api-collection-surface-v1-parity

tech-stack:
  added: []
  patterns:
    - "Composables wrap generated Apollo mutations for UI-specific state"
    - "Per-user cooldown tracked in a reactive Record<string, number>"

key-files:
  created:
    - app/frontend/components/sidebar/RefreshButton.vue
    - app/frontend/composables/useRefreshCollection.ts
    - spec/frontend/RefreshButton.spec.ts
  modified:
    - app/frontend/components/layout/CollectorsSection.vue
    - app/frontend/components/layout/Sidebar.vue
    - spec/frontend/Sidebar.spec.ts

key-decisions: []

patterns-established:
  - "Per-user refresh state: one composable instance in Sidebar, shared via props and callbacks"
  - "Cooldown countdowns are UI-only; server mutation is the authoritative gate"

requirements-completed:
  - COLL-18

coverage:
  - id: D1
    description: "RefreshButton component renders enabled/disabled states, countdown timer, and emits refresh with username"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/frontend/RefreshButton.spec.ts#RefreshButton"
        status: pass
    human_judgment: false
  - id: D2
    description: "useRefreshCollection wraps importCollection mutation and tracks per-user cooldown from error messages and persisted lastSyncedAt"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/frontend/RefreshButton.spec.ts#useRefreshCollection"
        status: pass
    human_judgment: false
  - id: D3
    description: "CollectorsSection renders a RefreshButton per collector and re-emits refresh; Sidebar wires refresh to useRefreshCollection and seeds cooldown from mergedCollection syncStatuses"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/frontend/CollectorsSection.spec.ts and spec/frontend/Sidebar.spec.ts"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-07-08
status: complete
---

# Phase 03 Plan 11: RefreshButton + Per-User Cooldown Summary

**Per-user refresh UI with a countdown timer, a useRefreshCollection composable for per-user cooldown state, and wiring through the sidebar collectors list.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-08T12:23:00Z
- **Completed:** 2026-07-08T12:36:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added `RefreshButton.vue` with enabled/disabled states, live countdown display, and accessible aria-label.
- Added `useRefreshCollection.ts` composable wrapping `importCollection` with a `Record<string, number>` cooldown map.
- Wired `CollectorsSection` to render a `RefreshButton` per collector and re-emit `refresh(username)`.
- Wired `Sidebar` to instantiate the shared composable, seed cooldown from `mergedCollection.syncStatuses`, and call `refresh(username)` on `@refresh`.
- Verified `merged_collection.graphql` already requests `lastSyncedAt`, enabling client-side cooldown calculation on load.
- Added unit tests covering enabled/disabled rendering, countdown decrement, mutation trigger, cooldown parsing, per-user independence, and `initFromSyncStatuses`.

## Task Commits

Each task was committed atomically:

1. **RED: RefreshButton spec** - `1e918ce` (test)
2. **GREEN: RefreshButton + useRefreshCollection** - `60472c3` (feat)
3. **Wiring through CollectorsSection and Sidebar** - `8974694` (feat)

**Plan metadata:** `docs(03-11): complete refresh-button plan` (to be committed)

## Files Created/Modified

- `app/frontend/components/sidebar/RefreshButton.vue` - Countdown refresh button
- `app/frontend/composables/useRefreshCollection.ts` - Per-user cooldown composable
- `spec/frontend/RefreshButton.spec.ts` - Unit tests for component and composable
- `app/frontend/components/layout/CollectorsSection.vue` - Renders RefreshButton per collector
- `app/frontend/components/layout/Sidebar.vue` - Instantiates composable, wires events, seeds cooldown
- `spec/frontend/Sidebar.spec.ts` - Updated to provide Apollo client for new query usage

## Decisions Made

None - followed plan as specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Guarded `onUnmounted` in useRefreshCollection**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Calling `useRefreshCollection()` directly in unit tests triggered Vue warnings: "onUnmounted is called when there is no active component instance". The warning did not fail tests but indicated a composable lifecycle misuse.
- **Fix:** Wrapped `onUnmounted` with `if (getCurrentInstance())` so the cleanup hook only registers inside a component setup.
- **Files modified:** `app/frontend/composables/useRefreshCollection.ts`
- **Verification:** `npm run test` passes without Vue warnings.
- **Committed in:** `60472c3` (Task 1 GREEN commit)

**2. [Rule 3 - Blocking] Used `UserSyncStatus` for `initFromSyncStatuses` parameter type**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** The plan specified `initFromSyncStatuses(syncStatuses: Ref<SyncStatus[]> | SyncStatus[])`, but `SyncStatus` exported from `@/generated/operations` is the GraphQL enum (e.g., `READY`), not the object containing `username`/`lastSyncedAt`. Using it caused TypeScript errors because the enum lacks those fields.
- **Fix:** Changed the parameter type to `UserSyncStatus[] | Ref<UserSyncStatus[]>` from the same generated module, matching the actual GraphQL `UserSyncStatus` object type.
- **Files modified:** `app/frontend/composables/useRefreshCollection.ts`
- **Verification:** `npx vue-tsc --noEmit` reports no new type errors from this file.
- **Committed in:** `60472c3` (Task 1 GREEN commit)

**3. [Rule 3 - Blocking] Added runtime type guard for `lastSyncedAt`**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** The generated `lastSyncedAt` scalar is typed as `unknown`, so `Date.parse(status.lastSyncedAt)` raised a TypeScript error.
- **Fix:** Added `typeof status.lastSyncedAt === 'string'` before calling `Date.parse`.
- **Files modified:** `app/frontend/composables/useRefreshCollection.ts`
- **Verification:** `npx vue-tsc --noEmit` reports no new type errors from this file.
- **Committed in:** `60472c3` (Task 1 GREEN commit)

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 blocking)
**Impact on plan:** All fixes were necessary for correctness and type safety. No scope creep.

## Issues Encountered

None beyond the deviations noted above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- COLL-18 (per-user refresh) is now complete on both frontend and backend.
- The collection surface can display a per-user refresh button with a 15-minute cooldown.
- Ready for any remaining Phase 03 UI polish or verification plans.

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-08*
