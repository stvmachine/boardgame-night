---
phase: 10
slug: picking-a-game-redesign
status: verified
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: 2026-07-18
---

# Phase 10 — Security

> Per-phase verification of the PLAN threat registers against the implemented Picking redesign.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|---|---|---|
| Authenticated viewer → GraphQL | Session and mutation operations cross the Rails authorization boundary. | User identity, session IDs, ordinary detail inputs, selected game ID |
| GraphQL schema → generated Apollo client | Source operations are generated into the Vue client contract. | Session fields, preferences, suggestions, mutation results |
| Authorized session payload → Vue UI | Host/member role and server state determine visible actions and lifecycle composition. | Attendees, suggestions, role controls, state transitions |
| Apollo cache → lifecycle UI | Normalized server results select Picking versus Completed composition. | NightSession state and picked game |
| Game card → external BGG | Card activation opens the persisted BoardGameGeek object identity. | Public game object ID |
| E2E seed → database and tracked fixtures | Deterministic records generate browser test fixture references. | Test-only user/group/session IDs and JSON fixtures |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Evidence | Status |
|---|---|---|---|---|---|---|
| T-10-01 | Spoofing | updateSessionDetails caller | high | mitigate | `context[:current_user]` authentication and direct mutation specs | closed |
| T-10-02 | Elevation of Privilege | updateSessionDetails resolver | high | mitigate | Resolver compares caller ID to persisted `host_id`; non-host regression passes | closed |
| T-10-03 | Tampering | detail/state/preference payload | high | mitigate | GraphQL allowlist plus dry contract excludes state and preferences; preservation specs pass | closed |
| T-10-04 | Denial of Service | detail strings | medium | mitigate | Contract bounds title/description/location and positive capacity | closed |
| T-10-05 | Repudiation | lifecycle update | low | mitigate | State-matrix tests restrict updates to draft/invited/picking and preserve state | closed |
| T-10-06 | Tampering | generated schema/client artifacts | medium | mitigate | Schema dump/codegen commands are checksum-stable across consecutive passes | closed |
| T-10-07 | Elevation of Privilege | updateSessionDetails operation | high | mitigate | Client operation cannot express state/preference inputs; resolver independently authorizes | closed |
| T-10-08 | Information Disclosure | NightSession operation | medium | mitigate | Existing authenticated group-membership resolver remains the only fetch boundary | closed |
| T-10-09 | Repudiation | schema/operation drift | low | mitigate | Source documents and generated outputs are committed together and reproducible | closed |
| T-10-10 | Denial of Service | suggestions selection | low | accept | Existing persisted resolver batches data and engine caps output at eight; no unbounded input added | closed |
| T-10-11 | Information Disclosure | attendee avatar group | medium | mitigate | Authorized session payload is filtered to confirmed-going attendees and a bounded group | closed |
| T-10-12 | Tampering | SessionDetailsEditor payload | medium | mitigate | Editor emits explicit ordinary fields only; server contract remains authoritative | closed |
| T-10-13 | Elevation of Privilege | Edit Details UI | medium | mitigate | Non-host trigger is absent and resolver host authorization is independently tested | closed |
| T-10-14 | Information Disclosure | title/location/attendee names | high | mitigate | Vue interpolation only; markup-shaped text component coverage passes | closed |
| T-10-15 | Denial of Service | local form strings | low | mitigate | UI mirrors server lengths and positive-capacity rules | closed |
| T-10-16 | Tampering | suggestion order | high | mitigate | First eight suggestions render in received order; tests forbid client reranking/filtering | closed |
| T-10-17 | Information Disclosure | reason/description DOM | high | mitigate | Vue text interpolation only; no raw HTML rendering path | closed |
| T-10-18 | Elevation of Privilege | pick action | high | mitigate | UI hides non-host controls and existing pickGame mutation enforces host/state/eligibility | closed |
| T-10-19 | Denial of Service | duplicate pick submission | medium | mitigate | In-flight guard disables all actions and one-call regression passes | closed |
| T-10-20 | Spoofing | BGG card navigation | medium | mitigate | Fixed BGG host/path, persisted object ID, opener isolation, nested event guards | closed |
| T-10-21 | Elevation of Privilege | route edit/pick controls | high | mitigate | Host-derived visibility plus direct authorization suites for both mutations | closed |
| T-10-22 | Tampering | Apollo session lifecycle | high | mitigate | No optimistic/manual completion; normalized server response drives SessionSummary | closed |
| T-10-23 | Information Disclosure | partial GraphQL errors | medium | mitigate | Only already-authorized session context remains visible; outsider resolver tests pass | closed |
| T-10-24 | Denial of Service | retry/start/pick interactions | medium | mitigate | Main-query refetch only, fixed top eight, in-flight guards, no collection query | closed |
| T-10-25 | Tampering | E2E fixture JSON | medium | mitigate | External EXIT-trap backup plus portable setup restoration; fixture diff is byte-clean | closed |
| T-10-26 | Spoofing | E2E attendee ownership | low | mitigate | Seed resolves persisted Bob with deterministic collection/poll ownership; browser role assertions pass | closed |
| T-10-27 | Spoofing | host/member affordances | medium | mitigate | Component and E2E tests prove role-specific controls and neutral member guidance | closed |
| T-10-28 | Denial of Service | responsive Dialog/cards | low | mitigate | Browser matrix covers 320/375/414/768/1024/1280 widths without overflow | closed |
| T-10-29 | Information Disclosure | dark/focus/error presentation | low | accept | Text/auth controls, semantic tokens, focus/error states, and automated UI checks pass; residual visual judgment accepted under auto-mode | closed |

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---|---|---|---|---|
| AR-10-01 | T-10-10 | Existing batching, persisted data, and fixed top-eight output bound the low DoS risk; Phase 10 adds no unbounded argument. | Phase 10 plan | 2026-07-18 |
| AR-10-02 | T-10-29 | Automated semantic-token, focus, role, responsive, and transition checks satisfy requirements; residual visual judgment is non-blocking under configured auto-mode. | Phase 10 execution policy | 2026-07-18 |

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|---|---:|---:|---:|---|
| 2026-07-18 | 29 | 29 | 0 | GSD ASVS L1 artifact audit |

## Sign-Off

- [x] All threats have a disposition.
- [x] Accepted risks are documented.
- [x] All high-severity mitigations are present in implementation and tests.
- [x] `threats_open: 0` confirmed at the configured high blocking threshold.
- [x] `status: verified` set in frontmatter.

**Approval:** verified 2026-07-18
