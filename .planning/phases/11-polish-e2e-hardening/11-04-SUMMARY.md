---
phase: 11-polish-e2e-hardening
plan: 04
subsystem: ui/testing
tags: [gamecard, aria, dark-mode, responsive, playwright, e2e-hardening]
requires:
  - phase: 11-polish-e2e-hardening
    plan: 03
    provides: Action Cable path, fixture-safe Playwright harness, CI contract
  - phase: 09-home-collection-redesign
    provides: Rich GameCard anatomy and collection/picking surfaces
  - phase: 05-design-system-foundation
    provides: Semantic M3 light/dark tokens and source-owned primitives
provides:
  - Valid article/card ARIA model with one labelled external BGG link and independently operable nested controls
  - Bounded Light/Dark responsive acceptance matrix across Home, Collection, Group Detail, and Picking at 375px and 1280px
  - Serialized deterministic Playwright execution (workers: 1) with CI contract assertion
  - Disabled auth throttle in development for deterministic E2E sign-in
affects: [requirements-closeout, v1.1-milestone]
tech-stack:
  added: []
  patterns:
    - Overlay link with pointer-events-none content wrapper for full-card click target while preserving nested control interactivity
    - Context.route interception for BGG overlay link testing without live external dependency
key-files:
  modified:
    - app/frontend/components/collection/GameCard.vue
    - spec/frontend/GameCard.spec.ts
    - tests/e2e/theme.spec.ts
    - tests/e2e/playwright.config.ts
    - spec/config/ci_workflow_spec.rb
    - config/initializers/rack_attack.rb
key-decisions:
  - "Card container uses role=article with no button role/tabindex; the BGG link overlay receives full-card clicks via z-10 + pointer-events-none non-control wrapper."
  - "Only disclosure and action slot use pointer-events-auto + z-20 for independent interactivity; verified by structural CSS assertions, not window.open spies."
  - "Playwright runs with workers: 1 and 60s default timeout to eliminate parallel-resource timeouts against shared development DB/fixtures."
  - "Auth throttle disabled in development so deterministic E2E localhost sign-ins share a single IP bucket without rate limiting."
patterns-established:
  - "Card click: overlay link covers full card; non-control content passes events through; nested controls sit above with pointer-events-auto."
  - "Responsive matrix: per-route theme/surface/overflow assertions inside every theme×viewport cell."
requirements-completed: [DEBT-01, DEBT-02]
coverage:
  - id: D1
    description: "Shared GameCard uses valid article semantics with one labelled BGG external link and independent nested controls."
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: "spec/frontend/GameCard.spec.ts (28 tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/theme.spec.ts#keeps redesigned surfaces usable in both themes"
        status: pass
    human_judgment: false
  - id: D2
    description: "Home, Collection, Group Detail, and Picking are usable in Light and Dark at 375px and 1280px with semantic tokens and no overflow."
    requirement: DEBT-01
    verification:
      - kind: e2e
        ref: "tests/e2e/theme.spec.ts#keeps redesigned surfaces usable in both themes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Playwright serializes to 1 worker with 60s timeout for deterministic execution."
    requirement: DEBT-02
    verification:
      - kind: integration
        ref: "spec/config/ci_workflow_spec.rb#workers and timeout assertions"
        status: pass
    human_judgment: false
  - id: D4
    description: "Auth rate limit is disabled in development so E2E sign-in is deterministic."
    requirement: DEBT-02
    verification:
      - kind: integration
        ref: "rails runner check"
        status: pass
    human_judgment: false
duration: 35min
completed: 2026-07-18
status: complete
---

# Phase 11 Plan 04: GameCard ARIA Correction and Final Implementation Gate

**Valid shared-card ARIA model, bounded Light/Dark responsive browser matrix, serialized deterministic Playwright, and green full implementation gate**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-18T17:00:00Z
- **Completed:** 2026-07-18T17:35:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Corrected the bounded shared GameCard ARIA defect: replaced invalid interactive-container nesting (`role=button` on card with nested buttons) with a labelled external BGG anchor overlay, article semantics, and pointer-events content/control separation.
- Proved all four redesigned surfaces (Home, Collection, Group Detail, Picking) in both themes at mobile and desktop with per-route semantic/overflow assertions, navigation usability, and on-card cross-activation tests.
- Serialized Playwright to 1 worker with 60s timeout, eliminating parallel-resource failures in the full 30-test suite.
- Disabled the auth throttle in development so deterministic E2E localhost sign-ins never hit rate limits.
- Full implementation gate: 388 Vitest / 480 RSpec / production build / 30/30 protected Chromium suite all green.

## Task Commits

1. **Task 1: Correct GameCard's nested-interaction ARIA model** - `fa722d1` (feat)
2. **Task 2: Prove semantic dark and responsive behavior on all redesigned routes** - `3bd8862` (feat)
3. **Discovered hardening: Rack::Attack development throttle** - `2e70c32` (fix)

## Files Modified
- `app/frontend/components/collection/GameCard.vue` - Article semantics, link overlay, pointer-events separation.
- `spec/frontend/GameCard.spec.ts` - 28 tests: ARIA, structural stacking, suggestion anatomy.
- `tests/e2e/theme.spec.ts` - Responsive/dark matrix with BGG interception and popup tests.
- `tests/e2e/playwright.config.ts` - workers: 1, timeout: 60_000.
- `spec/config/ci_workflow_spec.rb` - workers/timeout assertions (18 examples).
- `config/initializers/rack_attack.rb` - Development throttle disabled.

## Decisions Made
- Used `context.route('https://boardgamegeek.com/**')` interception to prove BGG overlay popup without contacting live BGG.
- Adopted a `pointer-events-none` wrapper pattern for the non-interactive card content so the overlay link captures clicks across the full card area.
- Kept disclosure and action slot at `pointer-events-auto + relative z-20` so they remain independently operable.

## Deviations from Plan
- **Found during execution:** The multi-worker Playwright suite (default 5 workers) produced 5 timeout failures against the shared development DB/fixtures. Fixed with `workers: 1` in the Playwright config and added CI workflow assertions.
- **Found during execution:** The development-mode auth throttle blocked E2E sign-in when 30 tests ran serialized through the same localhost IP. Fixed by wrapping the throttle in `unless Rails.env.development?`.

## Issues Encountered
- The overlay link stacking required three correction passes: initial z-0 vs content z-10 made most of the card unclickable; final pattern uses z-10 link + pointer-events-none content + pointer-events-auto controls.
- The responsive matrix test sign-in function hit strict-mode violations from duplicate "Home" text in sidebar + drawer. Fixed with `#app` presence check.

## User Setup Required

None - existing lockfiles and deterministic data.

## Self-Check: PASSED
- All six Plan 11-04 artifacts exist and are committed.
- GameCard Vitest: 28/28 passed (+ GamePicker 62/62 total).
- CI workflow RSpec: 19/19 passed.
- Protected theme E2E: 2/2 passed with byte-identical fixture restoration.
- Protected full Playwright suite: 30/30 passed with byte-identical fixtures.
- Full Vitest (388), full RSpec (480), production build all pass.
- `git diff --check` passed for all owned files.
