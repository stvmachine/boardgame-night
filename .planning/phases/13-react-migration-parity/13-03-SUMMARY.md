---
phase: 13-react-migration-parity
plan: 03
subsystem: frontend-collection
tags: [react, apollo, graphql, react-router, vitest, playwright, accessibility]

requires:
  - phase: 13-react-migration-parity
    plan: 01
    provides: Generated React Apollo hooks and TypeScript verification infrastructure
  - phase: 13-react-migration-parity
    plan: 02
    provides: Deterministic collection permalink precedence and live product-data boundaries
provides:
  - Defensive URL-backed collection filter, sort, grouping, owner, source, and view state
  - Authorized direct group and username collection sources through mutually exclusive generated hooks
  - Rich responsive grid/list cards with grouped rendering and isolated BGG activation
  - Deterministic browser coverage for merged collections, group history, filters, grouping, and shared list views
affects: [13-04, 13-06, collection-permalinks, group-collection, game-cards]

actuals:
  tokens: 29109
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - Allowlisted URL codecs keep source parameters separate from collection presentation state
    - A discriminated collection source activates exactly one Apollo query per route
    - Article cards use one full-card overlay anchor with isolated nested controls
    - Grouping preserves the incoming sorted order inside deterministic collapsible sections

key-files:
  created:
    - tests/vitest/collection-browser.spec.tsx
  modified:
    - app/frontend/lib/collection.ts
    - app/frontend/lib/data.ts
    - app/frontend/lib/graphql/adapters.ts
    - app/frontend/lib/graphql/documents.ts
    - app/frontend/generated/operations.ts
    - app/frontend/components/collection/filter-panel.tsx
    - app/frontend/components/collection/collection-browser.tsx
    - app/frontend/components/game-card.tsx
    - tests/vitest/collection.spec.ts
    - tests/vitest/game-card.spec.tsx
    - tests/e2e/playwright.config.ts

key-decisions:
  - "Resolve collection sources in explicit group, explicit usernames, active group, then signed-in BGG username order, with only the selected Apollo hook enabled."
  - "Keep reserved group and usernames source parameters outside the filter codec; serialize presentation grouping only as groupBy."
  - "Use source-owned ARIA combobox/listbox controls so browser-visible options satisfy the established acceptance contract."
  - "Preserve backend BGG usernames for owner labels and persisted object identity for isolated external card links."

patterns-established:
  - "Collection URL boundary: allowlist enums, clamp ranges, migrate known legacy sorts, and omit defaults."
  - "Collection query boundary: choose one source before invoking generated query hooks and normalize both response shapes once."
  - "Card interaction boundary: semantic article root, one labelled overlay link, escaped text, noopener noreferrer, and independent nested controls."

requirements-completed:
  - RMP-01
  - RMP-02
  - RMP-03
  - RMP-05

coverage:
  - id: D1
    description: Direct username and authorized group permalinks resolve without prior browser context and activate exactly one collection query.
    requirement: RMP-02
    verification:
      - kind: integration
        ref: "tests/vitest/collection-browser.spec.tsx#collection source routing"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#loads merged collection from seed data and group mode history"
        status: pass
    human_judgment: false
  - id: D2
    description: Collection filters, four sorts, grouping, owners, source tokens, and grid/list view round-trip defensively through shareable URLs.
    requirement: RMP-03
    verification:
      - kind: unit
        ref: "tests/vitest/collection.spec.ts#collection filter, sorting, and URL codec contracts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#filter, sort, grouping, and permalink journeys"
        status: pass
    human_judgment: false
  - id: D3
    description: Rich grid and list cards expose images, descriptions, owner stacks, statistics, and safe BGG activation inside deterministic groups.
    requirement: RMP-01
    verification:
      - kind: integration
        ref: "tests/vitest/game-card.spec.tsx"
        status: pass
      - kind: integration
        ref: "tests/vitest/collection-browser.spec.tsx#collection grouping"
        status: pass
      - kind: e2e
        ref: "tests/e2e/collection.spec.ts#shares a rich list collection permalink"
        status: pass
    human_judgment: false
  - id: D4
    description: The seeded collection browser acceptance suite starts deterministically and passes against the React application.
    requirement: RMP-05
    verification:
      - kind: e2e
        ref: "npm run e2e -- tests/e2e/collection.spec.ts (13/13 passed)"
        status: pass
    human_judgment: false

duration: 43 min
completed: 2026-08-01
status: complete
---

# Phase 13 Plan 03: Collection Parity Summary

**React collection routes now resolve authorized username or group data into URL-stable filters, deterministic grouping, and rich accessible grid/list cards with isolated BoardGameGeek links.**

## Performance

- **Duration:** 43 min
- **Started:** 2026-08-01T11:19:44Z
- **Completed:** 2026-08-01T12:02:49Z
- **Tasks:** 3
- **Files modified:** 12 implementation, generated, configuration, and test files

## Accomplishments

- Replaced the drifted collection state with the exact four-sort, four-time-bucket, player-range, complexity, owner, grouping, and grid/list contract, including defensive URL parsing and deterministic ordering.
- Added direct authorized group collection loading alongside normalized username permalinks, with explicit source precedence and mutually exclusive generated Apollo hooks.
- Restored Tabletop Social rich collection cards in responsive grid/list modes, deterministic collapsible grouping, scoped history sorting, owner stacks, statistics, and safely isolated BGG activation.
- Proved the complete collection journey with 56 focused Vitest assertions, strict typecheck, production build, and all 13 seeded Playwright tests.

## Task Commits

Each TDD task was committed through its evidence and implementation steps:

1. **Task 1 RED: Add failing collection contract coverage** — `49e4545` (test)
2. **Task 1 GREEN: Implement collection state contract** — `c941514` (feat)
3. **Task 2 RED: Add failing collection source coverage** — `75f3957` (test)
4. **Task 2 GREEN: Wire authorized collection sources** — `684473f` (feat)
5. **Task 3 RED: Add failing rich collection coverage** — `13975c4` (test)
6. **Task 3 GREEN: Build rich collection browser** — `d30476f` (feat)

## Files Created/Modified

- `app/frontend/lib/collection.ts` — Defines typed collection state, allowlisted URL codecs, filtering, and deterministic sorting.
- `app/frontend/lib/graphql/documents.ts` — Adds the authorized `GroupCollection` operation using the existing server-owned group boundary.
- `app/frontend/generated/operations.ts` — Publishes generated GroupCollection types, document, and React Apollo hook.
- `app/frontend/components/collection/filter-panel.tsx` — Exposes the exact accessible owner, player-range, time, and complexity controls.
- `app/frontend/components/collection/collection-browser.tsx` — Resolves one collection source, preserves source parameters, groups results, and renders grid/list workspaces.
- `app/frontend/components/game-card.tsx` — Provides rich article-based grid/list variants, owner stacks, statistics, descriptions, and safe BGG links.
- `app/frontend/lib/data.ts` — Extends the shared `Game` UI contract with optional description and play-history fields.
- `app/frontend/lib/graphql/adapters.ts` — Maps GraphQL description and last-played data into the shared game model.
- `tests/vitest/collection.spec.ts` — Locks filter, sort, range, migration, and URL round-trip behavior.
- `tests/vitest/collection-browser.spec.tsx` — Locks source precedence, generated group hooks, accessible controls, and deterministic grouping.
- `tests/vitest/game-card.spec.tsx` — Proves rich anatomy, escaped descriptions, safe link isolation, and independent nested actions.
- `tests/e2e/playwright.config.ts` — Waits for Rails health before launching browser requests on a cold E2E start.

## Decisions Made

- Explicit `group` permalinks outrank explicit `usernames`; both outrank ambient active-group and account fallbacks so shared links remain deterministic.
- Source keys remain outside `fromParams`/`toParams`, preventing the reserved `group` token from being conflated with `groupBy` presentation state.
- Grouping operates after sorting and never reorders games inside a group; only deterministic group headings are ordered.
- Source-owned ARIA combobox/listbox controls replace native selects because the established Playwright contract requires visible role-option activation after opening the control.
- Cards use the persisted BGG object identity in one encoded overlay anchor; owner attribution uses only backend-provided BGG usernames.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced native sort/group selects with visible ARIA listboxes**
- **Found during:** Task 3 browser verification
- **Issue:** Browser-native option popups are not represented as visible DOM options, so the established Playwright role-based option activation timed out despite the controls being labelled correctly.
- **Fix:** Added source-owned labelled combobox buttons with visible listbox options while preserving the exact values, labels, and shared filter state.
- **Files modified:** `app/frontend/components/collection/collection-browser.tsx`
- **Verification:** Focused Vitest suites passed and Playwright activated all four sorts plus grouping by accessible role/name.
- **Committed in:** `d30476f`

**2. [Rule 3 - Blocking] Made cold E2E startup wait for Rails, not only Vite**
- **Found during:** Task 3 integrated E2E verification
- **Issue:** Playwright considered the stack ready as soon as Vite answered on port 5173, allowing the first GraphQL request to race Puma during a cold start; the first test failed while the following 12 passed.
- **Fix:** Changed the web-server readiness URL to Rails' `/up` endpoint. Vite starts earlier in the same Foreman stack, so Rails readiness now proves both services are available before browser execution.
- **Files modified:** `tests/e2e/playwright.config.ts`
- **Verification:** A fresh full collection run passed all 13 Playwright tests in 20 seconds.
- **Committed in:** `d30476f`

---

**Total deviations:** 2 auto-fixed (2 blocking verification issues)
**Impact on plan:** Both changes were required to satisfy the existing accessible browser contract and produce deterministic cold-start evidence; no product scope or authorization boundary changed.

## Issues Encountered

- A reused Foreman stack had a responsive Vite process and queue heartbeats but a non-responsive Puma process. The stale process group was terminated before the deterministic cold-start run.
- The production build retains the pre-existing main-chunk size warning (`625.69 kB` minified). It remains recorded in `deferred-items.md` for final migration hardening and does not fail the build.

## Known Stubs

- `app/frontend/lib/graphql/adapters.ts:154` — Pre-existing TODO: categories/mechanics are not exposed by `MergedThing`; `extractCategories` intentionally returns an empty array. Category facets were explicitly removed from this plan, so this does not block collection parity.
- `/placeholder.svg` in `GameCard` is an intentional visible image fallback covered by tests, not unwired product data.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 13-04 can consume direct authorized group collection routes and the shared rich `GameCard` without relying on prior navigation context.
- Plan 13-06 has deterministic collection E2E coverage, generated group hooks, and cold-start server readiness for the final integrated gate.
- No blockers remain for the next plan.

## Self-Check: PASSED

- All key implementation, generated, test, configuration, and summary files exist on disk.
- TDD commits `49e4545`, `c941514`, `75f3957`, `684473f`, `13975c4`, and `d30476f` exist in git history.
- The latest evidence is green: 56 focused Vitest assertions, TypeScript, production build, and 13/13 collection Playwright tests.
- The known category-schema TODO was added to the cross-phase broken-windows register; unrelated research cache files remain untracked and untouched.

---
*Phase: 13-react-migration-parity*
*Completed: 2026-08-01*
