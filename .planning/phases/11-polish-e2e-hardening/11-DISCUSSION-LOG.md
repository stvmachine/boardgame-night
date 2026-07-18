# Phase 11: Polish & E2E Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 11-Polish & E2E Hardening
**Areas discussed:** CI browser execution, Action Cable connectivity, legacy/evidence reconciliation, dark-mode and responsive QA

---

## CI Browser Execution

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated full-suite job | Run the existing Chromium suite on every PR/push, keep retries at zero, and upload failure-only evidence. | ✓ |
| Fold into Rails test job | Run Playwright after the Rails suite in one combined job. | |
| Minimal smoke subset | Run only a reduced route smoke suite in CI. | |

**User's choice:** Auto-selected the recommended dedicated full-suite job.
**Notes:** The existing deterministic E2E seed/server harness remains authoritative. Fixture preservation becomes an unconditional repository-owned setup/teardown guarantee.

---

## Action Cable Connectivity

| Option | Description | Selected |
|--------|-------------|----------|
| Complete existing `/cable` path | Mount Action Cable, retain Solid Cable and Vite proxy, and use a narrow development origin allowlist. | ✓ |
| Disable forgery checks | Make local development connect by disabling Action Cable request verification. | |
| Replace transport | Move subscriptions to another WebSocket/SSE implementation. | |

**User's choice:** Auto-selected the recommended completion of the existing `/cable` path.
**Notes:** Mounting is environment-independent; only the Vite-origin allowance is development-specific.

---

## Legacy and Evidence Reconciliation

| Option | Description | Selected |
|--------|-------------|----------|
| Verify absence and reconcile evidence | Confirm stale classes are already gone, preserve the canonical path, and restore explicit requirement evidence. | ✓ |
| Recreate then delete artifacts | Add artificial cleanup changes so every requirement has a code diff. | |
| Documentation only | Mark requirements complete without validating the live codebase. | |

**User's choice:** Auto-selected verification plus evidence reconciliation.
**Notes:** The six named v1.0 IDs receive explicit checked evidence linked to the milestone audit. Adjacent unambiguous stale metadata such as DS-02 may also be corrected.

---

## Dark Mode and Responsive QA

| Option | Description | Selected |
|--------|-------------|----------|
| Persisted Light/Dark/System selector | Add the control to Account/Settings, preserve light default, and test semantic/layout behavior at mobile and desktop sizes. | ✓ |
| Two-state sidebar toggle | Add only a light/dark switch directly to global navigation. | |
| Test-only dark class | Exercise the CSS dark class without exposing a user control. | |

**User's choice:** Auto-selected the recommended persisted three-choice selector and bounded E2E checks.
**Notes:** Use semantic and overflow assertions rather than golden screenshots. Include the known shared GameCard nested-interaction ARIA correction but not a broad component rewrite.

## The Agent's Discretion

- Exact CI cache/artifact names and retention.
- Exact Material 3 selector composition inside the Account/Settings hierarchy.
- Exact representative viewport sizes and assertion-helper structure.
- Exact split between route/config tests and browser evidence for Action Cable.

## Deferred Ideas

- Full screenshot-based visual regression.
- Broad legacy Vue type-debt remediation.
- New form primitives or a component-library-wide accessibility rewrite.
