---
phase: 13-react-migration-parity
plan: 02
subsystem: frontend-home
tags: [react, apollo, react-router, vitest, playwright, boardgamegeek]

requires:
  - phase: 13-react-migration-parity
    plan: 01
    provides: Generated React Apollo hooks and the repository-wide TypeScript verification gate
provides:
  - Account-free collection merge navigation alongside the existing anonymous group quick-start
  - GraphQL-backed Home statistics and six-card BGG trending preview with isolated external links
  - Full live Hot Games route and active-group-derived mobile quick actions
  - Test-only product fixtures and component-local decorative landing data
affects: [13-03, 13-04, 13-06, collection-permalinks, mobile-navigation]

actuals:
  tokens: 15128
  tasks: 3
  commits: 9

tech-stack:
  added: []
  patterns:
    - Generated Apollo query hooks own Home and Hot server data
    - Shareable collection usernames remain authoritative URL state through filter synchronization
    - Product fixtures live under tests while decorative records stay component-local

key-files:
  created:
    - app/frontend/components/landing/collection-merge-form.tsx
    - app/frontend/components/trending-card.tsx
    - app/frontend/pages/HotGamesPage.tsx
    - tests/vitest/fixtures/sample-data.ts
    - tests/vitest/landing-page.spec.tsx
    - tests/vitest/hot-games-page.spec.tsx
    - tests/vitest/mobile-tab-bar.spec.tsx
  modified:
    - app/frontend/pages/LandingPage.tsx
    - app/frontend/components/mobile-tab-bar.tsx
    - app/frontend/components/collection/collection-browser.tsx
    - app/frontend/components/landing/hero-flow.tsx
    - app/frontend/components/landing/chapter-visuals.tsx
    - app/frontend/lib/data.ts
    - app/frontend/App.tsx

key-decisions:
  - "Keep CollectionMergeForm as the primary Home action while retaining QuickStartForm as the mutation-backed no-account group journey."
  - "Use generated DashboardStats and HotItems hooks without fabricated fallback metrics or shared production sample arrays."
  - "Treat permalink usernames as the collection source of truth ahead of active-group and signed-in-user fallbacks, and preserve route-source parameters during filter updates."

patterns-established:
  - "Home data boundary: render scoped GraphQL responses, neutral unavailable values, and explicit loading/error states."
  - "BGG card boundary: use backend identity in an escaped URL and isolate every new tab with noopener noreferrer."
  - "Mobile route boundary: derive entity routes only from ActiveGroupContext; otherwise use known top-level routes."

requirements-completed:
  - RMP-01
  - RMP-02
  - RMP-03

coverage:
  - id: D1
    description: Home supports normalized multi-username collection merge without removing the mutation-backed anonymous group quick-start.
    requirement: RMP-02
    verification:
      - kind: integration
        ref: "tests/vitest/landing-page.spec.tsx#keeps merge and anonymous quick-start journeys together"
        status: pass
      - kind: e2e
        ref: "tests/e2e/home.spec.ts#merges usernames from the redesigned Home hero"
        status: pass
    human_judgment: false
  - id: D2
    description: Home statistics and the six-card trending preview render from generated GraphQL hooks with safe external BGG cards.
    requirement: RMP-01
    verification:
      - kind: integration
        ref: "tests/vitest/landing-page.spec.tsx#renders live dashboard statistics and a six-card hot preview"
        status: pass
      - kind: e2e
        ref: "tests/e2e/home.spec.ts#keeps a six-card Home preview and standalone Hot route"
        status: pass
    human_judgment: false
  - id: D3
    description: The Hot route renders the complete live list with loading and retry states while mobile actions use active-group context or known fallbacks.
    requirement: RMP-02
    verification:
      - kind: integration
        ref: "tests/vitest/hot-games-page.spec.tsx"
        status: pass
      - kind: unit
        ref: "tests/vitest/mobile-tab-bar.spec.tsx"
        status: pass
      - kind: e2e
        ref: "tests/e2e/home.spec.ts#keeps a six-card Home preview and standalone Hot route"
        status: pass
    human_judgment: false
  - id: D4
    description: Static product fixtures are confined to tests, decorative records are component-local, and shareable collector parameters survive collection filter synchronization.
    requirement: RMP-03
    verification:
      - kind: unit
        ref: "tests/vitest/collection.spec.ts#landing fixture boundaries"
        status: pass
      - kind: integration
        ref: "tests/e2e/home.spec.ts (two consecutive passing runs after permalink repair)"
        status: pass
    human_judgment: false

duration: 18 min
completed: 2026-07-31
status: complete
---

# Phase 13 Plan 02: Live Home and Hot Parity Summary

**Home now merges shareable BGG collections beside the anonymous quick-start, while generated Apollo hooks drive scoped statistics, safe trending cards, the full Hot route, and context-aware mobile actions.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-31T23:14:30Z
- **Completed:** 2026-07-31T23:33:10Z
- **Tasks:** 3
- **Files modified:** 16 implementation/test files

## Accomplishments

- Added a trimmed, case-insensitive deduplicating username-tag merge form that encodes shareable collection URLs while preserving the existing anonymous `createAnonymousGroup` path.
- Replaced fabricated Home metrics and testimonials with authorization-scoped dashboard statistics, neutral unavailable values, and six live BGG trending cards.
- Added a reusable safe external-link card, a complete query-backed `/hot` page with loading/error/retry states, and mobile routes derived only from `ActiveGroupContext` or known fallbacks.
- Removed every runtime sample array/function from `lib/data.ts`, moved test fixtures under Vitest, and localized decorative records to their owning landing components.

## Task Commits

Each TDD task was committed through its evidence and implementation steps:

1. **Task 1 RED: Add fixture boundary coverage** — `c12822e` (test)
2. **Task 1 GREEN: Localize decorative landing fixtures** — `70b429a` (refactor)
3. **Task 2 RED: Add Home parity coverage** — `061a427` (test)
4. **Task 2 GREEN: Restore live Home collection parity** — `0494b96` (feat)
5. **Task 3 RED: Add mobile action routing coverage** — `f20a769` (test)
6. **Task 3 GREEN: Add live Hot route and contextual mobile actions** — `10f1d47` (feat)
7. **Integrated parity repair: Preserve collection permalink state** — `e9ba8e0` (fix)

## Files Created/Modified

- `app/frontend/components/landing/collection-merge-form.tsx` — Normalizes username tags and navigates to the encoded collection permalink.
- `app/frontend/components/trending-card.tsx` — Presents Home/Hot metadata through an isolated BGG link and provides a matching skeleton.
- `app/frontend/pages/LandingPage.tsx` — Composes both account-free journeys and generated dashboard/hot queries without fabricated product data.
- `app/frontend/pages/HotGamesPage.tsx` — Renders the complete HotItems result with loading, empty, and recoverable error states.
- `app/frontend/components/mobile-tab-bar.tsx` — Builds quick actions from active-group context or known application routes.
- `app/frontend/components/collection/collection-browser.tsx` — Consumes and preserves shareable username/group route state while synchronizing filters.
- `app/frontend/lib/data.ts` — Retains shared UI types only; all runtime sample arrays/functions were removed.
- `tests/vitest/fixtures/sample-data.ts` — Owns representative product records for collection and card tests.
- `tests/vitest/landing-page.spec.tsx` — Covers dual Home journeys, live statistics, and the six-card preview.
- `tests/vitest/hot-games-page.spec.tsx` — Covers full-list rendering and recoverable query failure.
- `tests/vitest/mobile-tab-bar.spec.tsx` — Covers active-group and fallback quick-action destinations.
- `.planning/phases/13-react-migration-parity/deferred-items.md` — Records the pre-existing Vite bundle-size warning for final hardening.

## Decisions Made

- Retained `QuickStartForm` unchanged as the backend-authorized anonymous group path and added `CollectionMergeForm` beside it rather than replacing one journey with the other.
- Used only generated `useDashboardStatsQuery` and `useHotItemsQuery` hooks for new Home/Hot server data; missing authorization or data renders neutral values instead of invented counts.
- Made explicit `usernames` permalink state outrank ambient active-group or signed-in-user collection fallbacks so shareable links remain deterministic.
- Kept decorative landing data intentionally local and non-product while moving reusable test records to a test-only fixture module.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed the matching Playwright Chromium runtime**
- **Found during:** Task 3 integrated E2E verification
- **Issue:** The audited Playwright dependency was present, but its matching Chromium/headless-shell binaries were absent from the local cache, so browser launch could not begin.
- **Fix:** Used the repository-local Playwright CLI to download Chromium v1234 and its headless shell.
- **Files modified:** None in the repository; runtime cache only.
- **Verification:** `npm run e2e -- tests/e2e/home.spec.ts` launched Chromium and completed both journeys.
- **Committed in:** Runtime-only fix; no repository commit required.

**2. [Rule 1 - Bug] Preserved shareable collection route state during filter synchronization**
- **Found during:** Final repeated Home E2E verification
- **Issue:** `CollectionBrowser` ignored `usernames` as a collection source and its initial filter effect replaced `/collection?usernames=e2e_alice` with `/collection`, making the merge journey timing-dependent.
- **Fix:** Normalized/deduplicated permalink collectors, prioritized them as query input, and retained `usernames` plus `group` while rewriting filter parameters.
- **Files modified:** `app/frontend/components/collection/collection-browser.tsx`
- **Verification:** TypeScript and all 151 Vitest assertions passed; the two-test Home Playwright suite passed twice consecutively.
- **Committed in:** `e9ba8e0`

---

**Total deviations:** 2 auto-fixed (1 blocking environment issue, 1 behavior bug)
**Impact on plan:** Both fixes were required for truthful browser verification and a deterministic shareable merge contract; no product scope was added.

## Issues Encountered

- The production build continues to report the pre-existing main-chunk size warning (`621.08 kB` minified). It does not fail the build and is recorded in `deferred-items.md` for final migration hardening.
- The first browser attempt could not launch until the matching Playwright browser runtime was downloaded; no dependency or lockfile changed.

## Known Stubs

None. `placeholder` matches are intentional input attributes or image fallbacks, empty arrays are local collection accumulators/test state, and all Home/Hot product content is wired to GraphQL.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 13-03 can build collection filter/sort/card parity on a deterministic URL collector source with no shared production sample arrays.
- Home and Hot now consume the generated Plan 13-01 hooks, and anonymous quick-start remains mutation-backed and E2E-reachable.
- No blockers remain for the next plan.

## Self-Check: PASSED

- All key created files exist on disk.
- Task and integrated repair commits `c12822e`, `70b429a`, `061a427`, `0494b96`, `f20a769`, `10f1d47`, and `e9ba8e0` exist in git history.
- TypeScript, all 151 Vitest assertions, the production build, and two consecutive Home Playwright runs passed after the permalink repair.
- Unrelated `.planning/research/.cache/*.json` files remain untracked and untouched.

---
*Phase: 13-react-migration-parity*
*Completed: 2026-07-31*
