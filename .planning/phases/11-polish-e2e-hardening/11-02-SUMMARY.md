---
phase: 11-polish-e2e-hardening
plan: 02
subsystem: testing
tags: [playwright, github-actions, fixture-integrity, ci, chromium]

requires:
  - phase: 11-polish-e2e-hardening
    plan: 01
    provides: Theme browser journey included in the complete suite
  - phase: 09-home-collection-redesign
    provides: Deterministic E2E Rails seed and persisted cache harness
provides:
  - Byte-safe fixture backup, stale recovery, teardown, and interrupt handling
  - Credential-free deterministic Rails/Vite/job E2E process harness
  - Dedicated least-privilege Chromium GitHub Actions job on PRs and main
  - Failure-only Playwright screenshots, traces, and reports with zero retries
affects: [11-03-action-cable, 11-04-responsive-dark-qa]

tech-stack:
  added: []
  patterns:
    - Unique mkdtemp fixture guards with verified cleanup only after SHA parity
    - CI contract tests parse workflow YAML and source-owned Playwright config

key-files:
  created:
    - tests/e2e/fixture-guard.ts
    - tests/e2e/global-teardown.ts
    - spec/frontend/e2eFixtureGuard.spec.ts
    - Procfile.e2e
    - spec/config/ci_workflow_spec.rb
  modified:
    - tests/e2e/global-setup.ts
    - tests/e2e/playwright.config.ts
    - bin/dev-e2e
    - .github/workflows/ci.yml

key-decisions:
  - "Fixture backup/state is deleted only after byte restoration verifies; failures retain recoverable evidence."
  - "Signal handlers restore synchronously and re-raise SIGINT/SIGTERM/SIGHUP so interruption semantics remain intact."
  - "The E2E Procfile boots deterministic development services without dotenvx, BGG keys, or live BGG calls."
  - "Playwright owns Chromium OS dependency installation; CI separately installs only app-specific libvips."

patterns-established:
  - "Protected E2E: repository guard is authoritative; an outer shell trap remains an independent execution witness."
  - "CI E2E: development db:prepare, complete npm run e2e, zero retries, failure-only diagnostics."

requirements-completed: [DEBT-01]

coverage:
  - id: D1
    description: "Both mutable E2E fixtures are restored byte-for-byte after normal, failing, stale, and interrupted runs."
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: "spec/frontend/e2eFixtureGuard.spec.ts (15 tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/health.spec.ts protected run with outer byte comparison"
        status: pass
    human_judgment: false
  - id: D2
    description: "A dedicated least-privilege Chromium job runs the complete deterministic Playwright suite on pull requests and main."
    requirement: DEBT-01
    verification:
      - kind: integration
        ref: "spec/config/ci_workflow_spec.rb (17 examples)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Playwright keeps zero retries and emits screenshots, traces, and HTML/line reports for failed runs without golden baselines."
    requirement: DEBT-01
    verification:
      - kind: integration
        ref: "spec/config/ci_workflow_spec.rb + tests/e2e/playwright.config.ts"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-07-18
status: complete
---

# Phase 11 Plan 02: Fixture-Safe Playwright CI Summary

**Byte-safe deterministic Playwright harness promoted to a dedicated least-privilege Chromium CI signal with failure-only diagnostics**

## Performance

- **Duration:** 24 min
- **Started:** 2026-07-18T23:00:00Z
- **Completed:** 2026-07-18T23:24:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added repository-owned raw-byte fixture protection using unique OS temporary backups, validated stale recovery, verified teardown, and interrupt-safe restoration.
- Removed BGG credential dependence from E2E service startup while retaining deterministic Rails, Vite, worker, and Solid Cache behavior.
- Added a dedicated Chromium GitHub Actions job with pinned lockfile installation, development database preparation, least privilege, zero retries, and failure-only artifacts.

## Task Commits

1. **Task 1: Make local Playwright runs byte-safe and diagnosable** - `9cfd687` (test)
2. **Task 2: Promote the deterministic suite to CI** - `865697c` (ci)

## Files Created/Modified
- `tests/e2e/fixture-guard.ts` - Backup, validation, stale recovery, and fail-safe teardown primitives.
- `tests/e2e/global-setup.ts` - Pre-seed backup plus seed-failure/interrupt restoration.
- `tests/e2e/global-teardown.ts` - Authoritative verified restoration after every suite.
- `tests/e2e/playwright.config.ts` - Chromium, reporters, global teardown, and failure diagnostics.
- `spec/frontend/e2eFixtureGuard.spec.ts` - Fifteen guard and recovery tests.
- `Procfile.e2e` - Credential-free deterministic service topology.
- `bin/dev-e2e` - E2E-specific Foreman launcher.
- `.github/workflows/ci.yml` - Dedicated browser job and least-privilege permissions.
- `spec/config/ci_workflow_spec.rb` - Seventeen workflow/harness contract examples.

## Decisions Made
- Used real `mkdtempSync` direct children under the approved OS state directory and rejected persisted or orphan paths outside the guard prefix.
- Preserved backup/state evidence whenever restoration cannot prove original SHA parity.
- Re-raised termination signals after synchronous restoration so fixture safety cannot turn Ctrl+C into a hung process.
- Replaced brittle database fallback commands with one canonical `RAILS_ENV=development bin/rails db:prepare` step.

## Deviations from Plan

### Auto-fixed Issues

**1. Fixture guard recovery and signal semantics required hardening during review**
- **Found during:** Task 1 review
- **Issue:** Initial implementation simulated uniqueness without `mkdtemp`, could delete failed-recovery evidence, and intercepted termination signals without exiting.
- **Fix:** Adopted `mkdtempSync`, validated paths, retained failed recovery state, and re-raised one-shot signals.
- **Files modified:** `tests/e2e/fixture-guard.ts`, `tests/e2e/global-setup.ts`, `tests/e2e/global-teardown.ts`, `spec/frontend/e2eFixtureGuard.spec.ts`
- **Verification:** 15 Vitest tests and protected Playwright health smoke pass.
- **Committed in:** `9cfd687`

**2. CI database/browser dependency setup was simplified to canonical owners**
- **Found during:** Task 2 review
- **Issue:** Initial commands redundantly enumerated Chromium libraries and contained an invalid Rails environment argument.
- **Fix:** Kept app-specific `libvips`, delegated browser OS packages to Playwright, and used development `db:prepare`.
- **Files modified:** `.github/workflows/ci.yml`, `spec/config/ci_workflow_spec.rb`
- **Verification:** 17 RSpec workflow examples pass.
- **Committed in:** `865697c`

---

**Total deviations:** 2 auto-fixed correctness issues
**Impact on plan:** Both fixes enforce the locked D-01 through D-04 contract without expanding scope.

## Issues Encountered
- The first health smoke reused stale local Rails/Vite processes and failed to show the Health route. A fresh-server rerun proved Rails `/up`, GraphQL health, Playwright health, and fixture parity all pass.

## User Setup Required

None - CI and local E2E use existing lockfiles and deterministic data.

## Next Phase Readiness
- Plan 11-03 can add a real `/cable` browser connection spec under the now-protected complete suite.
- Plan 11-04 can rely on failure traces/screenshots without introducing a screenshot baseline system.

## Self-Check: PASSED
- All nine Plan 11-02 artifacts exist and are committed.
- Fixture guard Vitest: 15/15 passed.
- CI workflow RSpec: 17/17 passed.
- Protected Playwright health smoke: 1/1 passed with byte-identical outer restoration.
- `git diff --check` passed for all owned files.

---
*Phase: 11-polish-e2e-hardening*
*Completed: 2026-07-18*
