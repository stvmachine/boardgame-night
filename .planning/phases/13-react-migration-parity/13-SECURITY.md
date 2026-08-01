---
phase: 13-react-migration-parity
slug: react-migration-parity
status: secured
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
threats_blocking_open: 0
asvs_level: 1
block_on: high
created: 2026-08-02
threats_total: 27
threats_closed: 20
threats_accepted: 7
---

# Phase 13 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Overall marker/verdict: SECURED** — independent oracle audit dated 2026-08-02 (ASVS Level 1, block on `high`). All 27 registered threats are resolved: 20 mitigated threats CLOSED and 7 accepted risks documented; **all 11 HIGH-severity threats are CLOSED** (`threats_blocking_open: 0`). No OPEN rows remain.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Rails schema → generated hooks | Committed schema and GraphQL documents become executable React Apollo client hooks. | Schema-derived types, query/mutation operations |
| npm registry → toolchain | Package-manager artifacts can execute during generation or testing. | Third-party npm packages |
| Browser URL → collection state | User-entered BGG usernames and source/filter params become shareable URL state. | BGG usernames, filter/sort/group/view params |
| Browser → external BGG links | Card activation leaves the application origin. | Public BGG object IDs |
| Client → authorized Group.collection GraphQL | Group token crosses an authorization boundary enforced by Rails. | Group collection data |
| Viewer → manager controls | Client role display crosses a server-enforced authorization boundary. | Membership/role state |
| Invite token → preview/RSVP | A bearer-like token authorizes intentionally limited preview data. | Session preview fields, RSVP response |
| Viewer → host-only session mutations | Client role presentation crosses server authorization and lifecycle validation. | Session schedule/start/edit/pick operations |
| GraphQL suggestions → render/pick | Backend-ranked content and identity drive external links and the pick mutation. | Suggestions, picked game ID |
| E2E seed → fixtures | Tests seed and restore shared development fixtures/databases. | Test-only user/group/session IDs and fixture JSON |
| Mutation response → Apollo cache | Server-returned identities update normalized group/session state. | Mutation-returned ids/entities |

---

## Threat Register

*Register consolidated from the `13-01`–`13-06` PLAN `<threat_model>` blocks; severity/disposition/mitigation wording extracted verbatim. Disposition `accept` rows are documented in the Accepted Risks Log below.*

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-13-01-01 | Tampering | `codegen.ts` and generated artifacts | high | mitigate | Generate only from committed `schema.graphql` and source documents; require a byte-stable second pass and prohibit hand edits. — `13-01-PLAN.md` §STRIDE; `codegen.ts` + `app/frontend/generated/{types,operations}.ts` (13-01-SUMMARY.md) | closed |
| T-13-01-02 | Information Disclosure | generated schema types | low | accept | Types mirror the committed client schema and contain no credentials or runtime values. | closed |
| T-13-SC | Tampering | npm installs | high | accept | Install only `[OK]` packages recorded in the Phase 13 Package Legitimacy Audit (`13-RESEARCH.md` §Package Legitimacy Audit — all official repos, "Keep" verdicts), preserve the npm lockfile, and run type/test gates after installation. | closed |
| T-13-02-01 | Tampering | `CollectionMergeForm` URL input | medium | mitigate | Trim/deduplicate entries, encode URL values, and leave authoritative username validation/import to Rails. — `app/frontend/components/landing/collection-merge-form.tsx`; `tests/vitest/collection.spec.ts` | closed |
| T-13-02-03 | Spoofing | Mobile quick-action routes | medium | mitigate | Derive destinations only from `ActiveGroupContext` or known application routes; remove fixed tokens. — `app/frontend/components/mobile-tab-bar.tsx`; `app/frontend/App.tsx` | closed |
| T-13-02-04 | Elevation of Privilege | Anonymous quick-start | high | mitigate | Keep the existing `CREATE_ANONYMOUS_GROUP` backend mutation as authority; do not infer privileged role client-side. — `app/frontend/components/landing/hero-flow.tsx`; `QuickStartForm` (13-02-PLAN.md) | closed |
| T-13-02-05 | Tampering | BGG external links | medium | mitigate | Build URLs from backend object identity and isolate new tabs with `noopener noreferrer`; render all text through React escaping. — `app/frontend/components/trending-card.tsx`; `tests/vitest/game-card.spec.tsx` | closed |
| T-13-03-01 | Tampering | `fromParams` | medium | mitigate | Allowlist enum values, clamp numbers, discard malformed ranges, and preserve reserved source keys separately. — `app/frontend/lib/collection.ts` (`toParams`/`fromParams`); `tests/vitest/collection.spec.ts` | closed |
| T-13-03-02 | Information Disclosure | GroupCollection | high | mitigate | Consume the existing server-authorized `Group.collection`; never reconstruct group membership authorization in React. — `GroupCollection` op in `app/frontend/lib/graphql/documents.ts`; `useGroupCollectionQuery` | closed |
| T-13-03-03 | Denial of Service | simultaneous queries/grouping | medium | mitigate | Enforce one source query per route and memoize bounded client transforms over the returned collection. — `app/frontend/components/collection/collection-browser.tsx` | closed |
| T-13-03-04 | Spoofing | owner grouping | low | accept | Labels use backend-provided BGG usernames; grouping grants no authority. | closed |
| T-13-03-05 | Tampering | BGG card activation | medium | mitigate | Use persisted object identity, React text escaping, one isolated overlay anchor, and nested-control pointer/keyboard isolation. — `app/frontend/components/game-card.tsx`; `tests/vitest/game-card.spec.tsx` | closed |
| T-13-04-01 | Elevation of Privilege | membership/create/invite controls | high | mitigate | Match shipped role visibility for usability, but call only Rails mutations that re-authorize every operation; add negative component cases. — `app/frontend/pages/GroupPage.tsx`; `tests/vitest/group-page.spec.tsx` | closed |
| T-13-04-02 | Information Disclosure | Group sessions/collection | high | mitigate | Render only GetGroup's authorized fields; do not issue a parallel unscoped collection query. — `app/frontend/pages/GroupPage.tsx` (GetGroup) | closed |
| T-13-04-03 | Tampering | Apollo mutation reconciliation | medium | mitigate | Cache only mutation-returned ids/entities or refetch the scoped group; never synthesize privileged roles. — `tests/vitest/group-page.spec.tsx` | closed |
| T-13-04-04 | Information Disclosure | invite link/email | medium | accept | Link is intentionally shareable and email is required for invitation; do not log either value client-side. | closed |
| T-13-04-05 | Tampering | external spotlight link | medium | mitigate | Use backend objectid, React escaping, and `noopener noreferrer`. — `app/frontend/pages/GroupPage.tsx` (CollectionSpotlight) | closed |
| T-13-05-01 | Elevation of Privilege | Invite RSVP | high | mitigate | Require AuthContext for controls while relying on Rails to validate session token, user, and response; cover signed-out UI negatively. — `app/frontend/pages/InvitePage.tsx`; `tests/vitest/invite-page.spec.tsx`; 13-05-SUMMARY.md §Threat Flags | closed |
| T-13-05-02 | Information Disclosure | invite preview | medium | accept | Session title/group/host/date/location are intentionally shareable with a valid invite; render no collection/member data. | closed |
| T-13-05-03 | Information Disclosure | past sessions | high | mitigate | Query through authorized `group(token)` and do not fall back to unscoped history. — `app/frontend/pages/GroupSessionsPage.tsx`; `tests/vitest/group-sessions-page.spec.tsx` | closed |
| T-13-05-04 | Tampering | RSVP cache update | medium | mitigate | Use only mutation-returned identities/state and de-duplicate attendance references. — `tests/vitest/invite-page.spec.tsx` | closed |
| T-13-05-05 | Repudiation | RSVP confirmation | low | accept | Server persistence is authoritative; UI confirms returned response and exposes failures without claiming success. | closed |
| T-13-06-01 | Elevation of Privilege | schedule/start/edit/pick controls | high | mitigate | Hide controls by authenticated host identity for usability and retain Rails authorization on every mutation; cover non-host cases. — `app/frontend/pages/SessionPage.tsx`; `tests/vitest/session-page.spec.tsx` | closed |
| T-13-06-02 | Tampering | PickGame selection/cache | high | mitigate | Submit only a server-returned eligible suggestion id, disable competing submissions, and transition only from mutation-returned session state. — `app/frontend/components/game-card.tsx`; `tests/vitest/session-page.spec.tsx` | closed |
| T-13-06-03 | Information Disclosure | attendee/suggestion data | medium | accept | Authorized group/session viewers intentionally see this data; no token, email, or BGG credential is rendered. | closed |
| T-13-06-04 | Tampering | descriptions/reasons/external links | medium | mitigate | Render through React escaping, prohibit HTML injection, use persisted objectid, and isolate new tabs. — `app/frontend/pages/SessionPage.tsx`; `tests/vitest/game-card.spec.tsx` | closed |
| T-13-06-05 | Denial of Service | browser acceptance suite | medium | mitigate | Retain serialized workers, zero retries, deterministic cache/seed, bounded top-eight rendering, and byte-safe fixture teardown. — `tests/e2e/playwright.config.ts`; `tests/e2e/fixture-guard.ts` (13-06-PLAN.md) | closed |

*Status: open · closed — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Severity: critical > high > medium > low*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**Register reconciliation:** 27 threats = 20 CLOSED (mitigate) + 7 accepted (accept, disposition-closed). All 11 HIGH-severity threats are CLOSED (`threats_blocking_open: 0`). No OPEN rows.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-13-01 | T-13-01-02 | Types mirror the committed client schema and contain no credentials or runtime values; disclosure surface is the public API shape only. | Plan-approved disposition | 2026-08-02 |
| R-13-02 | T-13-03-04 | Labels use backend-provided BGG usernames; grouping grants no authority — spoofed grouping cannot escalate. | Plan-approved disposition | 2026-08-02 |
| R-13-03 | T-13-04-04 | Link is intentionally shareable and email is required for invitation; neither value is logged client-side. | Plan-approved disposition | 2026-08-02 |
| R-13-04 | T-13-05-02 | Session title/group/host/date/location are intentionally shareable with a valid invite; no collection/member data is rendered. | Plan-approved disposition | 2026-08-02 |
| R-13-05 | T-13-05-05 | Server persistence is authoritative; UI confirms the returned response and exposes failures without claiming success. | Plan-approved disposition | 2026-08-02 |
| R-13-06 | T-13-06-03 | Authorized group/session viewers intentionally see attendee/suggestion data; no token, email, or BGG credential is rendered. | Plan-approved disposition | 2026-08-02 |
| R-13-07 | T-13-SC | Phase 13 Package Legitimacy Audit (`13-RESEARCH.md` §Package Legitimacy Audit) verified all installed packages as official repositories ("Keep" verdicts); npm lockfile preserved and type/test gates run after installation — supply-chain surface accepted on audit evidence. | Plan-approved disposition | 2026-08-02 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Accepted | Open | Run By |
|------------|---------------|--------|----------|------|--------|
| 2026-08-02 | 27 | 20 | 7 | 0 | gsd-secure-phase / independent oracle (ASVS L1, short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `threats_blocking_open: 0` confirmed
- [x] `status: secured` set in frontmatter

**Approval:** verified 2026-08-02
