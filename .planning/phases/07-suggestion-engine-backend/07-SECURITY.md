---
phase: 07-suggestion-engine-backend
title: Suggestion Engine Backend
asvs_level: 1
block_on: high
threats_total: 19
threats_closed: 19
threats_open: 0
status: SECURED
audited_at: 2026-07-15
---

# Phase 07 Security Audit — Suggestion Engine Backend

## Summary

ASVS Level 1, block on `high`. All 19 threats declared across the four Phase 7
PLAN.md `<threat_model>` blocks are closed or documented as accepted risk.
No high-severity (or above) threat remains open, so the phase is not blocked.

- **Threats total:** 19
- **Threats closed:** 19
- **Threats open (blocking):** 0
- **Threats open (non-blocking):** 0
- **Unregistered flags:** 1 (review-debt warning, not a registered Phase 7 threat)

## Threat Register

| Threat ID | Plan | Category | Component | Severity | Disposition | Status | Evidence |
|-----------|------|----------|-----------|----------|-------------|--------|----------|
| T-07-01 | 07-01 | Information Disclosure | `NightSessionType#suggestions` | high | mitigate | CLOSED | `app/graphql/types/night_session_type.rb:31-32` requires auth and group membership before private data; `spec/requests/night_session_suggestions_spec.rb:202-289` covers anonymous, outsider, member, and host access |
| T-07-02 | 07-01 | Denial of Service | candidate scoring resolver | medium | mitigate | CLOSED | `app/graphql/types/night_session_type.rb:38-53` uses one `BggThing.merged_for_users` scope, one `PollsLoader.load_all`, one `OwnersLoader.load_all`, and `app/services/suggestions/engine.rb:54` caps output at 8; `app/graphql/boardgame_night_schema.rb:39-42` sets `max_depth`/`max_complexity`; `spec/requests/night_session_suggestions_spec.rb:348-401` asserts constant query count and no `Bgg::Client` construction |
| T-07-03 | 07-01 | Tampering | scoring component values | medium | mitigate | CLOSED | `app/services/suggestions/engine.rb:9-22` frozen `WEIGHTS`/`COMPLEXITY_TARGETS`; `app/services/suggestions/engine.rb:193-195` clamps every component to 0..100; `app/models/night_session.rb:11-18` and contracts validate preference inputs; `spec/services/suggestions/engine_spec.rb` asserts exact weighted/boundary outputs |
| T-07-04 | 07-01 | Repudiation | computed suggestions | low | accept | CLOSED | Accepted risk log #1: suggestions are read-only derived values, no irreversible action |
| T-07-SC (Plan 07-01) | 07-01 | Tampering | package supply chain | low | accept | CLOSED | Accepted risk log #2: no new packages installed in this plan |
| T-07-05 | 07-02 | Spoofing | all preference mutations | high | mitigate | CLOSED | `app/graphql/mutations/create_night_session.rb:18`, `schedule_session.rb:17`, `update_session_preferences.rb:12` all raise unless `context[:current_user]`; each mutation spec has an anonymous/empty-context rejection case |
| T-07-06 | 07-02 | Elevation of Privilege | `updateSessionPreferences` / `scheduleSession` | high | mitigate | CLOSED | `app/graphql/mutations/schedule_session.rb:36-38` and `update_session_preferences.rb:24-26` require `session.host_id == current_user.id` before any update; `spec/graphql/schedule_session_mutation_spec.rb:137-148` and `spec/graphql/update_session_preferences_mutation_spec.rb:87-98` reject non-host members |
| T-07-07 | 07-02 | Tampering | time/complexity inputs | medium | mitigate | CLOSED | `app/contracts/create_night_session_contract.rb:11-12`, `schedule_session_contract.rb:9-10`, `update_session_preferences_contract.rb:6-7` whitelist complexity strings and require positive integer budget; `app/models/night_session.rb:17-18` backstops with model validations; mutations update only supplied keys (`unless ...nil?`) |
| T-07-08 | 07-02 | Repudiation | preference edits | low | accept | CLOSED | Accepted risk log #3: edits are reversible before picking and `updated_at` is recorded |
| T-07-SC (Plan 07-02) | 07-02 | Tampering | package supply chain | low | accept | CLOSED | Accepted risk log #2: no new packages installed in this plan |
| T-07-09 | 07-03 | Information Disclosure | suggestions field authorization | high | mitigate | CLOSED | `app/graphql/types/night_session_type.rb:31-32` authorizes before assembling candidates/polls/owners; `spec/requests/night_session_suggestions_spec.rb:202-249` rejects unauthenticated/outsider callers with a GraphQL error and allows host/member callers |
| T-07-10 | 07-03 | Denial of Service | poll/owner association resolution | medium | mitigate | CLOSED | `app/models/bgg_poll.rb:9-11` filters already-loaded association; `app/graphql/types/night_session_type.rb:43-44` uses `load_all` once per source; `spec/requests/night_session_suggestions_spec.rb:348-401` asserts one poll query and one owner query regardless of candidate count and stubs `Bgg::Client.new` to raise |
| T-07-11 | 07-03 | Tampering | malformed/edge BGG score inputs | medium | mitigate | CLOSED | `app/services/suggestions/engine.rb:193-195` clamps all components; nil coalescing in `time_fit_for`, `complexity_fit_for`, `community_rating_for`, and `ownership_bonus_for`; `app/models/bgg_poll_result.rb:9-18` exact category predicates; `spec/services/suggestions/engine_spec.rb` covers nil stats, 19/20/49/50 vote thresholds, hard filters, and deterministic ties |
| T-07-12 | 07-03 | Information Disclosure | ownership reason strings | low | mitigate | CLOSED | `app/services/suggestions/engine.rb:254-263` includes only attending owners in reason chips; the enclosing `suggestions` field is gated to group members/host (`app/graphql/types/night_session_type.rb:31-32`) |
| T-07-SC (Plan 07-03) | 07-03 | Tampering | package supply chain | low | accept | CLOSED | Accepted risk log #2: no new packages installed in this plan |
| T-07-13 | 07-04 | Tampering | generated GraphQL/client artifacts | medium | mitigate | CLOSED | `schema.graphql` and `app/frontend/generated/types.ts` contain `Suggestion`, `SuggestionBreakdown`, `ConfidenceLevel`, `NightSession` preference/suggestion fields, and `updateSessionPreferences`; generated via `bin/rails graphql:schema:dump` and `npm run codegen`; `spec/graphql/boardgame_night_schema_spec.rb:47-133` asserts runtime reachability before generation |
| T-07-14 | 07-04 | Information Disclosure | committed schema artifacts | low | accept | CLOSED | Accepted risk log #4: schema files contain only public API shape, no credentials or private row data |
| T-07-15 | 07-04 | Repudiation | schema drift | low | mitigate | CLOSED | Source types, `schema.graphql`, `schema.json`, and `app/frontend/generated/types.ts` are committed together; the integrated Phase 7 gate (`bin/rails graphql:schema:dump && npm run codegen && rspec && rubocop`) is reproducible evidence against drift |
| T-07-SC (Plan 07-04) | 07-04 | Tampering | package supply chain | low | accept | CLOSED | Accepted risk log #2: no new packages installed in this plan |

## Accepted Risks Log

1. **T-07-04 — Repudiation of computed suggestions:** Suggestions are read-only,
   derived on demand from persisted rows, and produce no state transition or
   irreversible effect. A separate suggestion-view audit log is not
   proportionate for this data. Rationale matches the plan disposition.

2. **T-07-SC — Package supply chain:** All four plan blocks explicitly accepted
   this risk because no new gems or npm packages were installed during Phase 7;
   only already-audited project dependencies are used.

3. **T-07-08 — Repudiation of preference edits:** Preference edits are reversible
   while the session is in `draft` or `invited` state, and ActiveRecord
   `updated_at` records modification time. An actor-by-actor audit log is not
   proportionate for non-sensitive planning metadata.

4. **T-07-14 — Information Disclosure via committed schema artifacts:** The
   generated `schema.graphql`/`schema.json` and `app/frontend/generated/types.ts`
   expose only public API shape (fields, types, enums). They contain no
   credentials, user data, or private row content. Production introspection is
   disabled (`app/graphql/boardgame_night_schema.rb:45`).

## Audit Trail

- All required reading loaded: four PLAN.md, four SUMMARY.md, `07-VERIFICATION.md`,
  `07-REVIEW.md`, and `AGENTS.md`.
- Implementation files inspected, not modified.
- Verification commands executed on the current working tree:
  - `rtk rspec spec/services/suggestions/engine_spec.rb spec/requests/night_session_suggestions_spec.rb spec/graphql/create_night_session_mutation_spec.rb spec/graphql/schedule_session_mutation_spec.rb spec/graphql/update_session_preferences_mutation_spec.rb spec/graphql/boardgame_night_schema_spec.rb spec/models/night_session_spec.rb spec/models/bgg_poll_spec.rb spec/models/bgg_poll_result_spec.rb` → **99 passed, 0 failures**
  - `rtk rubocop <Phase 7 production files>` → **0 offenses**
- The `07-VERIFICATION.md` report confirms all 14 must-have truths are backed by
  executable tests and the generated schema contract.
- Code review findings from `07-REVIEW.md` were evaluated against the registered
  Phase 7 threat boundary. None are failed mitigations of the declared threats.

## Unregistered Flags / Review Debt Outside Phase 7 Boundary

- **CR-01 (07-REVIEW.md):** `QueryType.night_session` (`app/graphql/types/query_type.rb:68-69`)
  returns session metadata by ID without authentication or group-membership
  checks. This is a genuine access-control issue, but it is **outside the
  Phase 7 suggestion-engine boundary**: the registered threats only protect
  the `NightSession.suggestions` field, which is independently guarded. It is
  tracked as review debt, not as a blocking Phase 7 threat.

- **CR-02 / WR-05 / WR-06:** These are product-locked scoring decisions
  (A2 fallback curve, "Any" = 50, unknown playtime = 60) documented in the plan
  and codified by tests. They are not security threats.

- **WR-01 / WR-02 / WR-03 / WR-04 / WR-07 / WR-08:** Authorization consistency,
  mutation atomicity, GlobalID decoding, invite email handling, and poll-model
  uniqueness are valid review debt but do not break any declared Phase 7
  mitigation.
