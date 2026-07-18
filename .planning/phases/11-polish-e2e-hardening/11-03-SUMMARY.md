---
phase: 11-polish-e2e-hardening
plan: 03
subsystem: infrastructure
tags: [action-cable, websocket, vite, solid-cable, security, playwright]

requires:
  - phase: 11-polish-e2e-hardening
    plan: 02
    provides: Protected deterministic Playwright harness and credential-free services
  - phase: 01-foundation-monorepo-shell
    provides: Apollo Action Cable subscription client and Vite proxy
provides:
  - Canonical Rails `/cable` mount before the SPA wildcard in every environment
  - Narrow development-only Vite origin allowlist with forgery protection retained
  - Cross-config contract tests and a real browser WebSocket welcome proof
affects: [11-04-final-qa, subscriptions, local-development]

tech-stack:
  added: []
  patterns:
    - One canonical relative `/cable` path shared by Rails, Vite, and Apollo
    - Browser-level Action Cable protocol handshake as infrastructure acceptance evidence

key-files:
  created:
    - spec/config/action_cable_contract_spec.rb
    - tests/e2e/action_cable.spec.ts
  modified:
    - config/routes.rb
    - config/environments/development.rb

key-decisions:
  - "Mount Action Cable unconditionally; only the Vite origin allowance is development-specific."
  - "Allow exactly localhost:5173 and 127.0.0.1:5173 without disabling request-forgery protection."
  - "Preserve the existing Solid Cable adapter, Vite ws proxy, and Apollo relative consumer path."

patterns-established:
  - "Cable contract: source/config RSpec plus real browser Action Cable welcome through the development proxy."

requirements-completed: [DEBT-02]

coverage:
  - id: D1
    description: "Rails exposes `/cable` before the SPA wildcard while development continues using Solid Cable."
    requirement: DEBT-02
    verification:
      - kind: integration
        ref: "spec/config/action_cable_contract_spec.rb (9 examples)"
        status: pass
      - kind: other
        ref: "bin/rails routes"
        status: pass
    human_judgment: false
  - id: D2
    description: "Development accepts only explicit Vite origins and leaves request-forgery and production origin checks intact."
    requirement: DEBT-02
    verification:
      - kind: integration
        ref: "spec/config/action_cable_contract_spec.rb#origin and forgery contracts"
        status: pass
    human_judgment: false
  - id: D3
    description: "A browser receives a real Action Cable welcome through Vite `/cable` with no origin rejection."
    requirement: DEBT-02
    verification:
      - kind: e2e
        ref: "tests/e2e/action_cable.spec.ts#connects to Action Cable through the Vite /cable proxy"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-18
status: complete
---

# Phase 11 Plan 03: Action Cable Development Path Summary

**Secure end-to-end `/cable` path from the browser through Vite to Rails Solid Cable with a real protocol welcome**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-18T23:25:00Z
- **Completed:** 2026-07-18T23:35:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Mounted Action Cable before the SPA wildcard for the canonical production/development route.
- Added a narrow development-only origin allowlist without disabling forgery protection or touching production policy.
- Proved route, adapter, proxy, consumer, and real WebSocket handshake agreement with focused RSpec and Playwright evidence.

## Task Commits

1. **Task 1: Establish the Action Cable contract and browser journey** - `e9f6ed0` (test)
2. **Task 2: Mount and secure the development Action Cable path** - `1189a79` (fix)

## Files Created/Modified
- `config/routes.rb` - Unconditional `/cable` mount before root/wildcard routes.
- `config/environments/development.rb` - Exact Vite origin allowlist.
- `spec/config/action_cable_contract_spec.rb` - Nine route/adapter/security/proxy/client contract examples.
- `tests/e2e/action_cable.spec.ts` - Real Action Cable WebSocket welcome journey.

## Decisions Made
- Kept the existing `createConsumer('/cable')`, Vite `ws: true` proxy, and `solid_cable` configuration unchanged because focused evidence confirmed them.
- Used both common Vite loopback origins explicitly rather than a wildcard or regular expression.

## Deviations from Plan

None - all D-05 through D-07 behavior was delivered in the four owned files.

## Issues Encountered

None.

## User Setup Required

None - Rails serves Action Cable in-process through the existing development harness.

## Next Phase Readiness
- Plan 11-04 can include Action Cable in the final complete protected browser gate.
- Production retains its existing origin security while sharing the canonical route.

## Self-Check: PASSED
- All four Plan 11-03 artifacts exist and are committed.
- Action Cable contract RSpec: 9/9 passed.
- Rails route table places `/cable` before `spa#index`.
- Protected browser WebSocket test: 1/1 passed after receiving `{type: "welcome"}`.
- Outer and permanent fixture guards restored byte-identical fixtures.
- `git diff --check` passed for all owned files.

---
*Phase: 11-polish-e2e-hardening*
*Completed: 2026-07-18*
