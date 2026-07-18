# Phase 11: Polish & E2E Hardening - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase closes the v1.1 milestone by making the existing Playwright lifecycle a required CI signal, completing the local Action Cable connection path, reconciling already-completed legacy cleanup and requirement evidence, and shipping the previously deferred dark-mode control plus responsive QA across the redesigned Home, Collection, Group Detail, and Picking surfaces.

The phase hardens existing behavior rather than adding a new product workflow. It may make narrowly scoped accessibility or testability fixes uncovered by the hardening checks, but it does not redesign the completed surfaces, add visual-regression snapshot infrastructure, replace the test harness, resolve unrelated legacy Vue type debt, or create new reusable form primitives.

</domain>

<decisions>
## Implementation Decisions

### CI Browser Execution and Failure Evidence
- **D-01:** Run the complete existing Chromium Playwright suite in a dedicated GitHub Actions job on every pull request and push to `main`. Keep it separate from the Rails unit-test job so browser failures are visible and independently rerunnable.
- **D-02:** The CI job must install the pinned Ruby and Node dependencies, install Chromium with its OS dependencies, prepare the Rails database, and use the repository's deterministic E2E seed/server harness. It must not contact BGG or depend on mutable external data.
- **D-03:** Keep browser retries at zero so deterministic failures remain visible. Configure screenshots and traces for failed runs and upload Playwright reports/artifacts only when the job fails.
- **D-04:** Preserve fixture files byte-for-byte even when a suite fails or is interrupted. Strengthen the repository-owned Playwright global setup/teardown to use an isolated temporary backup and unconditional restoration; local validation must continue to prove fixture integrity before and after the run.

### Action Cable Local Connectivity
- **D-05:** Complete the `/cable` path rather than replacing the existing subscription architecture. Mount `ActionCable.server` at `/cable` before the SPA catch-all in all environments; keep `solid_cable` as the development adapter and retain the existing Vite WebSocket proxy.
- **D-06:** Permit the Vite development origin with a narrow development-only Action Cable origin allowlist. Do not disable request-forgery protection globally or weaken production origin checks.
- **D-07:** Add focused evidence that the route and local proxy/consumer contract agree on `/cable`, plus a browser or integration check that establishes the development subscription connection without a console-level rejection.

### Legacy Cleanup and Requirements Evidence
- **D-08:** Treat DEBT-03 as a verification-and-reconciliation task: the duplicate root `app/jobs/import_collection_job.rb` and unsafe `Bgg::CollectionPersister#fetch_and_persist!` are already absent. Confirm the canonical namespaced import path remains, document the evidence, and do not manufacture replacement cleanup solely to create a diff.
- **D-09:** Restore explicit checked evidence for v1.0 requirements BGG-01, BGG-04, BGG-05, COLL-01, COLL-03, and COLL-05 in `REQUIREMENTS.md`, linking to the existing v1.0 milestone audit rather than duplicating its full narrative.
- **D-10:** Reconcile adjacent stale milestone metadata when implementation evidence is unambiguous, including DS-02's already-delivered app shell. Mark DEBT requirements complete only after their implementation or verification evidence passes.

### Theme Control and Responsive QA
- **D-11:** Add an accessible Appearance control to the existing Account/Settings surface with exactly three choices: Light, Dark, and System. Preserve light as the default when no preference has been saved, persist an explicit choice locally, and make System react to `prefers-color-scheme` changes.
- **D-12:** Apply the resolved theme to the document root using the existing semantic dark-token contract and `color-scheme`. Restore a saved preference before the Vue app mounts so returning dark-mode users do not see an avoidable light flash.
- **D-13:** Add bounded Playwright coverage for Home, Collection, Group Detail, and Picking at representative mobile and desktop viewports. Verify route content remains usable, semantic dark surfaces/text are applied, navigation and theme preference persist, and no page introduces horizontal viewport overflow.
- **D-14:** Prefer stable semantic and layout assertions over screenshot-golden comparisons. Failure screenshots/traces from D-03 provide visual diagnosis without creating a brittle visual-regression suite.
- **D-15:** Include the known shared `GameCard` nested-interaction ARIA correction because the card is exercised across redesigned surfaces. Other accessibility fixes may be included only when directly exposed by the Phase 11 checks and narrowly bounded.

### The Agent's Discretion
- Exact GitHub Actions cache keys, artifact names, and retention period, provided failure evidence is available and CI remains deterministic.
- Exact Appearance control composition and iconography within the established Material 3 primitives, provided it is keyboard accessible, labelled, and preserves the Account/Settings hierarchy.
- Exact mobile/desktop viewport widths and assertion helpers, provided all four redesigned surfaces and both theme modes receive meaningful coverage.
- Whether the Action Cable connection evidence is split between Rails route/config tests and Playwright, provided it proves the end-to-end development path without weakening security.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Milestone Evidence
- `.planning/ROADMAP.md` §Phase 11: Polish & E2E Hardening — Fixed phase goal, requirements, and five success criteria.
- `.planning/REQUIREMENTS.md` §Tech Debt and §Traceability — DEBT-01 through DEBT-04 plus milestone status metadata to reconcile.
- `.planning/PROJECT.md` §Current Milestone — v1.1 product boundary and active tech-debt commitment.
- `.planning/v1.0-MILESTONE-AUDIT.md` — Existing implementation evidence for BGG-01, BGG-04, BGG-05, COLL-01, COLL-03, and COLL-05.

### Design and Redesigned Surface Contracts
- `.planning/phases/05-design-system-foundation/05-CONTEXT.md` — Locked decision that dark semantic tokens ship before the Phase 11 toggle and QA.
- `.planning/phases/05-design-system-foundation/05-UI-SPEC.md` — Material 3 color, accessibility, responsive, and interaction contracts.
- `.planning/phases/08-group-detail-surface/08-CONTEXT.md` — Group Detail responsive hierarchy and role-aware interaction contracts.
- `.planning/phases/09-home-collection-redesign/09-CONTEXT.md` — Home/Collection responsive layouts, rich-card behavior, and nested-control contract.
- `.planning/phases/10-picking-a-game-redesign/10-CONTEXT.md` — Picking layout, card reuse, permissions, and lifecycle behavior.

### Existing Infrastructure
- `.github/workflows/ci.yml` — Current Rails security, lint, and test jobs; extension point for the dedicated E2E job.
- `tests/e2e/playwright.config.ts` — Current single-browser configuration and repository server harness.
- `tests/e2e/global-setup.ts` — Existing fixture-safety mechanism to harden with unconditional isolated restoration.
- `config/cable.yml` — Existing `solid_cable` development adapter.
- `config/routes.rb` — Missing Action Cable mount before the SPA catch-all.
- `vite.config.ts` — Existing `/cable` WebSocket proxy.
- `app/frontend/apollo/client.ts` — Existing Apollo subscription consumer and `/cable` URL contract.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/e2e/collection.spec.ts`, `tests/e2e/group_detail.spec.ts`, and `tests/e2e/session_lifecycle.spec.ts` already cover the principal authenticated redesign journeys and should be extended rather than replaced.
- `bin/dev-e2e`, `lib/tasks/e2e.rake`, and the deterministic fixture JSON files already provide the no-live-BGG browser harness needed by CI.
- `app/frontend/stores/ui.ts` already defines the `light | dark | system` theme field and setter.
- `app/frontend/entrypoints/styles.css` already defines matching light and `.dark` semantic Material 3 token palettes.
- `app/frontend/views/AccountView.vue` and the existing Settings navigation entry provide the intended home for the Appearance control.
- `app/frontend/components/collection/GameCard.vue` is the shared rich card used by Collection and Picking and is the bounded ARIA correction target.

### Established Patterns
- Vue uses `<script setup lang="ts">`, Pinia for UI-only state, and semantic Tailwind/Material 3 utilities rather than hard-coded light/dark colors.
- Playwright tests use deterministic Rails-seeded data and must restore both fixture files byte-for-byte after every invocation.
- The Apollo client already splits subscription operations to an Action Cable link; the missing route/origin path is infrastructure wiring, not a new real-time feature.
- Phase verification starts with focused specs and then runs the full RSpec, Vitest, build, and protected Playwright lifecycle only when integration scope warrants it.

### Integration Points
- Extend `.github/workflows/ci.yml` with Node, Chromium, database preparation, E2E execution, and failure artifact upload.
- Add the Action Cable mount to `config/routes.rb` and the narrow development origin configuration under `config/environments/development.rb`.
- Initialize and observe theme state from the frontend bootstrap/store, then render the selector in `AccountView.vue` or a source-owned child component.
- Add a dedicated bounded dark/responsive E2E spec or shared helpers while reusing existing seeded routes and authentication setup.
- Reconcile `.planning/REQUIREMENTS.md` only after code/test evidence is present.

</code_context>

<specifics>
## Specific Ideas

- Hardening should make failures actionable: CI shows the browser job separately and retains traces/screenshots only when needed.
- Dark mode should feel like the same Tabletop Social system, not a second design; semantic tokens already define that continuity.
- Responsive QA should protect the completed surfaces against overflow and unusable controls without introducing brittle pixel-perfect snapshots.
- Cleanup requirements may be satisfied by evidence when the stale code has already been removed; do not create unnecessary replacement code.

</specifics>

<deferred>
## Deferred Ideas

- A full visual-regression screenshot baseline suite is deferred; Phase 11 uses semantic/layout assertions and failure-only diagnostics.
- Broad remediation of pre-existing `vue-tsc --noEmit` diagnostics is deferred unless a changed Phase 11 file introduces a new error.
- New form primitives or a broad component-library accessibility rewrite are outside this phase.

</deferred>

---

*Phase: 11-Polish & E2E Hardening*
*Context gathered: 2026-07-18*
