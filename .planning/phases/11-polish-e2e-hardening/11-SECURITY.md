---
phase: 11-polish-e2e-hardening
threats_open: 0
asvs_level: 1
block_on: high
total_threats: 22
closed: 22
open_blocking: 0
open_non_blocking: 0
accepted: 2
verdict: PASS
---

# Phase 11 Security Audit: Threat Mitigation Verification

**Audited:** 2026-07-19  
**ASVS Level:** L1  
**Block threshold:** High (open high/critical threats block ship)  
**Verdict:** PASS — all declared threat mitigations are present in implemented code/config/tests.

No implementation files were modified during this audit. Only this `.planning/phases/11-polish-e2e-hardening/11-SECURITY.md` file was created.

## Scope

All five Phase 11 plans were audited against live implementation, configuration, and test files. The audit focused on the specific concerns called out for this review:

- CI permissions and artifact leakage
- Fixture restoration / tampering protection
- Action Cable route order and origin restrictions
- External BGG link safety
- Nested-control behavior in GameCard
- Evidence-ledger integrity
- Exact requirement allowlisting in REQUIREMENTS.md
- Rack::Attack development-only exemption

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Status | Evidence |
|-----------|----------|-----------|----------|-------------|--------|----------|
| T-11-01 | Tampering | localStorage theme value | medium | mitigate | CLOSED | `app/frontend/index.html:7-24` and `app/frontend/stores/ui.ts:8-20` enforce exact three-value allowlist (`light`/`dark`/`system`); invalid values fall back to unsaved light. `spec/frontend/uiStore.spec.ts:29-34` covers invalid value rejection. |
| T-11-02 | Information Disclosure | localStorage | low | accept | ACCEPTED | Only the non-sensitive appearance enum is stored; no identity, token, or server data is persisted. See [Accepted Risks](#accepted-risks). |
| T-11-03 | Denial of Service | matchMedia listeners | low | mitigate | CLOSED | `app/frontend/stores/ui.ts:93-117` removes the old listener before adding a new one; `spec/frontend/uiStore.spec.ts:95-119` proves repeated `initializeTheme` does not multiply listeners. |
| T-11-04 | Spoofing | selected Appearance state | low | mitigate | CLOSED | `app/frontend/views/AccountView.vue:22-30` uses a single computed store value; `spec/frontend/AccountView.spec.ts:87-103` asserts exactly one selected item and correct label/state. |
| T-11-05 | Elevation of Privilege | GitHub Actions permissions | high | mitigate | CLOSED | `.github/workflows/ci.yml:8-9` sets top-level `permissions: contents: read`; the `e2e` job at `:86-87` also restricts itself to `contents: read`. `spec/config/ci_workflow_spec.rb:16-32` assert least privilege. |
| T-11-06 | Information Disclosure | Playwright artifacts | high | mitigate | CLOSED | `.github/workflows/ci.yml:123-131` uploads `playwright-report/` and `test-results/` only `if: failure()` with `retention-days: 7`; `spec/config/ci_workflow_spec.rb:75-89` assert failure-only upload and bounded retention. E2E data is deterministic seed only. |
| T-11-07 | Tampering | E2E fixture files | high | mitigate | CLOSED | `tests/e2e/fixture-guard.ts:68-246` creates `mkdtempSync` backup under `os.tmpdir()`, copies raw bytes, SHA-256 verifies, and preserves evidence on failure. `tests/e2e/global-setup.ts:44-80` and `tests/e2e/global-teardown.ts:24-34` orchestrate restore/verify. `spec/frontend/e2eFixtureGuard.spec.ts` covers mutation, stale recovery, and tampered-path rejection. |
| T-11-08 | Denial of Service | flaky CI retries | medium | mitigate | CLOSED | `tests/e2e/playwright.config.ts:11-13` sets `fullyParallel: false`, `workers: 1`, `retries: 0`, and `timeout: 60_000`. `spec/config/ci_workflow_spec.rb:100-117` assert these values. |
| T-11-09 | Tampering | dependency supply chain | medium | mitigate | CLOSED | `.github/workflows/ci.yml:95-107` use `ruby/setup-ruby` with `bundler-cache: true` and `npm ci`; `spec/config/ci_workflow_spec.rb:34-53` assert lockfile-based installs and no `npm install`. |
| T-11-10 | Spoofing | Action Cable origin | high | mitigate | CLOSED | `config/environments/development.rb:74` allows only `http://localhost:5173` and `http://127.0.0.1:5173`. `spec/config/action_cable_contract_spec.rb:38-46` assert the exact allowlist and reject wildcards. Production origin configuration is untouched. |
| T-11-11 | Elevation of Privilege | WebSocket forgery protection | high | mitigate | CLOSED | `config/environments/development.rb:74` does not call `disable_request_forgery_protection`. `spec/config/action_cable_contract_spec.rb:29-36` asserts no uncommented global disable exists. `config/routes.rb:14` mounts `ActionCable.server` before the SPA catch-all. |
| T-11-12 | Tampering | route/proxy/consumer path | medium | mitigate | CLOSED | `config/routes.rb:14` mounts `/cable` before `root`/`get *path`. `vite.config.ts:17-20` proxies `/cable` with `ws: true`. `app/frontend/apollo/client.ts:14` uses `createConsumer('/cable')`. `spec/config/action_cable_contract_spec.rb:8-85` and `tests/e2e/action_cable.spec.ts:26-29` prove the canonical path end-to-end. |
| T-11-13 | Denial of Service | persistent WebSocket test | low | mitigate | CLOSED | `tests/e2e/action_cable.spec.ts:22-58` uses a 10-second timeout and closes the socket after receiving `{"type":"welcome"}`. The Playwright suite is serialized (`workers: 1`). |
| T-11-14 | Spoofing | external BGG link | high | mitigate | CLOSED | `app/frontend/components/collection/GameCard.vue:109-113,137-145` builds a fixed `https://boardgamegeek.com/boardgame/{objectid}` link with `target="_blank"` and `rel="noopener noreferrer"`, and only renders when `objectid` is present. `spec/frontend/GameCard.spec.ts:165-186` and `tests/e2e/theme.spec.ts:220-222` assert the exact href, target, rel, and opener isolation. |
| T-11-15 | Elevation of Privilege | nested pick/disclosure controls | medium | mitigate | CLOSED | `app/frontend/components/collection/GameCard.vue:148,196,236,332` wraps non-control content in `pointer-events-none` and places disclosure/action slot with `pointer-events-auto z-20`. `spec/frontend/GameCard.spec.ts:191-235` and `tests/e2e/theme.spec.ts:228-244` verify non-cross-activation. |
| T-11-16 | Tampering | theme preference | medium | mitigate | CLOSED | `app/frontend/stores/ui.ts:86-90` and `app/frontend/index.html:7-24` are the only root-class writers; they accept only the allowlisted enum. The responsive matrix in `tests/e2e/theme.spec.ts:120-248` exercises this across routes. |
| T-11-17 | Information Disclosure | failure screenshots/traces | high | mitigate | CLOSED | Artifacts are deterministic seeded data only (no secrets/live BGG). Upload is failure-only with 7-day retention (`.github/workflows/ci.yml:123-131`). Failure diagnostics are covered by the Plan 11-02 mitigation path. |
| T-11-18 | Tampering | fixture integrity | high | mitigate | CLOSED | Same evidence as T-11-07: repository-owned guard + outer tmp backup + SHA equality is verified immediately after every Playwright run (`tests/e2e/global-teardown.ts:24-34`). |
| T-11-19 | Repudiation | 11-EVIDENCE.md | high | mitigate | CLOSED | `.planning/phases/11-polish-e2e-hardening/11-EVIDENCE.md` records dated commands, pass/fail results, source paths, and audit links for every closeout row. |
| T-11-20 | Tampering | REQUIREMENTS status | high | mitigate | CLOSED | `11-EVIDENCE.md` must pass before REQUIREMENTS is edited; `.planning/REQUIREMENTS.md:68-78,113-149` shows only the eleven authorized IDs (six v1.0, DS-02, DEBT-01–04) are checked and marked Complete. The verifier in `11-05-PLAN.md:146` enforces this allowlist. |
| T-11-21 | Spoofing | legacy absence evidence | high | mitigate | CLOSED | `11-EVIDENCE.md:7-27` checks canonical path existence, duplicate root job absence, class-definition count, `fetch_and_persist!` absence from `app/`, canonical `CollectionFetcher` → `persist_collection!` wiring, and `key: "bgg_api"`. The canonical job is `app/jobs/bgg/import_collection_job.rb:14`; no duplicate root job exists; `rg` confirms `fetch_and_persist!` is absent from `app/`. |
| T-11-22 | Information Disclosure | evidence document | low | accept | ACCEPTED | The evidence ledger contains only repository paths and commands; no tokens, fixture credentials, traces, or environment values. See [Accepted Risks](#accepted-risks). |

## Additional Security-Relevant Findings

### Rack::Attack development-only exemption

The auth throttle is correctly gated:

- `config/initializers/rack_attack.rb:10-18` wraps the only `Rack::Attack.throttle` in `unless Rails.env.development?`.
- The single existing throttle targets `/graphql` POST requests containing `signIn` or `signUp` and is active in production and test environments.
- No other `Rack::Attack.throttle`/`block`/`safelist` definitions were found in the repository.

This is a necessary exception for deterministic localhost E2E sign-in and does not weaken production rate limiting.

## Accepted Risks

| Threat ID | Category | Severity | Rationale | Review Trigger |
|-----------|----------|----------|-----------|----------------|
| T-11-02 | Information Disclosure via localStorage | low | Only the non-sensitive `light`/`dark`/`system` enum string is persisted; no credentials, identity data, or server state are stored. | Re-audit if the store begins persisting session tokens, PII, or server data. |
| T-11-22 | Information Disclosure via evidence document | low | The evidence ledger contains only repository paths and command references; no credentials, traces, or environment values are embedded. | Re-audit if the ledger is updated to include screenshots, tokens, or CI secrets. |

## Unregistered Flags

No `## Threat Flags` section was present in the Phase 11 summaries. No new unregistered attack surface was identified during this audit.

## Gaps / Blockers

None. All declared mitigations are evidenced in the implementation, configuration, or test files at the cited locations.

## Auditor Notes

- Implementation files were read but not modified.
- No repository commits were made.
- No broad test runs were executed; verification relied on reading existing source, config, and test evidence.
- Unrelated dirty files in the working tree were left untouched.
