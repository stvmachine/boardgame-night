---
phase: 10-picking-a-game-redesign
plan: 05
subsystem: ui
tags: [vue, apollo, graphql, playwright, rails, e2e, picking]

requires:
  - phase: 10-03
    provides: GamePicker suggestion cards and PickingSessionHeader components
  - phase: 10-04
    provides: SessionDetailsEditor host-only editing behavior and pickGame mutation

provides:
  - Integrated PICKING route composition in NightSessionView
  - Route-level Vue integration tests covering loading, edit, partial error, start picking, and pick
  - Deterministic e2e:seed fixture data for Wingspan suggestions and Bob RSVP
  - Protected Playwright host/member lifecycle acceptance across six responsive widths

affects:
  - 10-06

key-files:
  created:
    - spec/frontend/NightSessionView.spec.ts
  modified:
    - app/frontend/views/NightSessionView.vue
    - lib/tasks/e2e.rake
    - tests/e2e/session_lifecycle.spec.ts
    - tests/e2e/global-setup.ts

key-decisions:
  - "Back up and restore fixture JSON files inside Playwright globalSetup to keep git state stable across every E2E run."
  - "Use [data-testid=game-card] for the E2E card locator because Card renders a div with role=button, not an article."
  - "Disable Spring during e2e:seed to prevent stale rake code from being cached."

patterns-established:
  - "Route-level Apollo integration: single NightSession operation with errorPolicy: 'all' and refetch after startPicking."
  - "Playwright fixture preservation: copy tracked fixtures before seed, restore in teardown."

requirements-completed:
  - PICK-01
  - PICK-02
  - PICK-03

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "PICKING route composition with header, suggestion context, ranked cards, host edit, and normalized pick transition"
    requirement: PICK-01
    verification:
      - kind: unit
        ref: "spec/frontend/NightSessionView.spec.ts#13 tests"
        status: pass
      - kind: e2e
        ref: "tests/e2e/session_lifecycle.spec.ts#picking lifecycle: host edits, member views, host picks, completed summary"
        status: pass
    human_judgment: false
  - id: D2
    description: "Host-only session details editing while picking with focus restoration and polite success announcement"
    requirement: PICK-01
    verification:
      - kind: unit
        ref: "spec/frontend/SessionDetailsEditor.spec.ts#16 tests"
        status: pass
      - kind: integration
        ref: "spec/frontend/NightSessionView.spec.ts#edit details and pick flows"
        status: pass
      - kind: e2e
        ref: "tests/e2e/session_lifecycle.spec.ts#host edits ordinary details while picking"
        status: pass
    human_judgment: false
  - id: D3
    description: "Responsive picking layout at 320/375/414/768/1024/1280px with no horizontal overflow and correct column counts"
    requirement: PICK-02
    verification:
      - kind: e2e
        ref: "tests/e2e/session_lifecycle.spec.ts#responsive layout checks at all approved widths"
        status: pass
    human_judgment: false
  - id: D4
    description: "Member read-only picking view: sees ranking/guidance but cannot edit or pick"
    requirement: PICK-02
    verification:
      - kind: e2e
        ref: "tests/e2e/session_lifecycle.spec.ts#member sees the redesigned picking view without host controls"
        status: pass
    human_judgment: false
  - id: D5
    description: "Deterministic E2E fixture seed with Wingspan suggested_numplayers poll and byte-restored fixture JSON files"
    requirement: PICK-03
    verification:
      - kind: e2e
        ref: "tests/e2e/session_lifecycle.spec.ts#Wingspan card is suggested, picked, and shown in completed summary"
        status: pass
      - kind: other
        ref: "git diff tests/e2e/fixtures/ is empty after E2E run"
        status: pass
    human_judgment: false

# Metrics
duration: 33min
completed: 2026-07-18
status: complete
---

# Phase 10 Plan 05: Picking a Game Redesign Summary

**Integrated PICKING route with PickingSessionHeader, GamePicker, and SessionDetailsEditor; host/member lifecycle and responsive acceptance passing end-to-end.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-07-18T10:32:10Z
- **Completed:** 2026-07-18T11:05:13Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- State-driven PICKING route composition in `NightSessionView` using `errorPolicy: 'all'`, main-query refetch, and Apollo normalized pick transitions.
- Route-level Vue integration tests covering loading, partial error, edit details, start picking, and picked announcement.
- Deterministic E2E fixture seed with Wingspan `suggested_numplayers` poll and Bob invite assignment, avoiding live BGG calls.
- Protected Playwright acceptance proving host controls, member read-only view, responsive widths, keyboard interaction, and completed summary.

## Task Commits

Each task was committed atomically:

1. **Task 1: Compose the complete state-driven PICKING route** - `8d30be9` (test), `ab84ed1` (feat)
2. **Task 2: Complete UI-SPEC compliance and protected lifecycle acceptance** - `3106e54` (test), `45efef4` (test)

**Plan metadata:** `45efef4`

## Files Created/Modified
- `app/frontend/views/NightSessionView.vue` - Integrated PICKING route composition with header, editor, GamePicker, and SessionSummary.
- `spec/frontend/NightSessionView.spec.ts` - Route-level integration tests for loading, edit, retry, and pick transitions.
- `lib/tasks/e2e.rake` - Deterministic Wingspan poll seed, Bob invite email, and BGG hot list cache.
- `tests/e2e/session_lifecycle.spec.ts` - Host/member lifecycle, responsive widths, edit, reason disclosure, and completed summary.
- `tests/e2e/global-setup.ts` - Fixture backup/restore around `bin/e2e-seed` and `DISABLE_SPRING=1`.

## Decisions Made
- Back up and restore fixture JSON files inside Playwright `globalSetup` so tracked files remain unchanged after every E2E run.
- Use `[data-testid="game-card"]` for the E2E card locator because the Card primitive renders a `<div>` with `role="button"`, not an `<article>`.
- Disable Spring during `e2e:seed` to prevent stale rake code from being cached.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed E2E GameCard selector mismatch**
- **Found during:** Task 2 (protected browser acceptance)
- **Issue:** The test used `hostPage.locator('article', ...)` but `GameCard` renders a `<div data-testid="game-card" role="button">`; the locator never matched the Wingspan card.
- **Fix:** Changed the locator to `hostPage.locator('[data-testid="game-card"]', ...)`.
- **Files modified:** `tests/e2e/session_lifecycle.spec.ts`
- **Verification:** `npm run e2e -- tests/e2e/session_lifecycle.spec.ts` passed.
- **Committed in:** `45efef4`

**2. [Rule 1 - Bug] Disabled Spring during e2e:seed**
- **Found during:** Task 2 (first Playwright run)
- **Issue:** Spring cached stale rake code, so the `e2e:seed` task was not running the updated Wingspan poll/invite changes.
- **Fix:** Set `DISABLE_SPRING=1` in the environment for `bin/e2e-seed` in `tests/e2e/global-setup.ts`.
- **Files modified:** `tests/e2e/global-setup.ts`
- **Verification:** Seed debug output showed the correct Wingspan poll results and the E2E run passed.
- **Committed in:** `45efef4`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes were necessary for the E2E acceptance to pass. No scope creep.

## Issues Encountered
- None beyond the two auto-fixed bugs above.

## Verification Results
- `bundle exec rspec spec/contracts/update_session_details_contract_spec.rb spec/graphql/update_session_details_mutation_spec.rb spec/graphql/pick_game_mutation_spec.rb spec/requests/night_session_suggestions_spec.rb` → **36 examples, 0 failures**
- `npm test -- spec/frontend/NightSessionView.spec.ts spec/frontend/PickingSessionHeader.spec.ts spec/frontend/SessionDetailsEditor.spec.ts spec/frontend/GamePicker.spec.ts spec/frontend/GameCard.spec.ts` → **83 tests passed**
- `vue-tsc --noEmit` → **no new diagnostics in Plan 10 files** (pre-existing unrelated failures remain)
- `npm run build` → **passed**
- `bin/rails graphql:schema:dump` + `npm run codegen` twice → **checksums stable**
- `npm run e2e -- tests/e2e/session_lifecycle.spec.ts` → **1 passed**
- `git diff tests/e2e/fixtures/` after E2E run → **empty** (fixtures restored)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 10 Plan 05 complete.
- Phase 10 Plan 06 is the remaining plan in this phase and is ready to execute.

## Known Stubs
None - all plan goals are wired and verified.

## Threat Flags
No new threat surface beyond the plan's `<threat_model>` was introduced. The implementation satisfies the listed mitigations:
- Host-only controls are enforced by the route and mutations.
- Pick transitions are driven by normalized Apollo mutation responses, not optimistic local state.
- Partial GraphQL errors preserve authorized session context only.
- Fixture JSON files are byte-restored after every E2E run.

---
*Phase: 10-picking-a-game-redesign*
*Completed: 2026-07-18*

## Self-Check: PASSED
- `10-05-SUMMARY.md` exists at the expected path.
- Commits `8d30be9`, `ab84ed1`, `3106e54`, and `45efef4` are present in git history.
