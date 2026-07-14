---
phase: 07-suggestion-engine-backend
verified: 2026-07-15T00:00:00Z
status: passed
score: 14/14 must-have truths verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
behavior_unverified_items: []
human_verification: []
---

# Phase 07: Suggestion Engine Backend — Verification Report

**Phase Goal:** As a session host, I want to see ranked game suggestions, so that I can choose a game that fits the attendees.

**Verified:** 2026-07-15T00:00:00Z

**Status:** `passed`

**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All 14 plan must-have truths are verified by code inspection and the focused Phase 7 RSpec gate.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An authenticated session host can query a picking session and receive attendee-owned games ranked by the fixed 40/20/20/10/10 score | ✓ VERIFIED | `Suggestions::Engine::WEIGHTS` constant is `0.40/0.20/0.20/0.10/0.10`; `spec/requests/night_session_suggestions_spec.rb` proves ranked output via HTTP GraphQL; `spec/services/suggestions/engine_spec.rb` verifies the weighted total and ordering. |
| 2 | Every returned suggestion exposes the game, total score, five numeric breakdown components, confidence, and backend-authored reason chips | ✓ VERIFIED | `Types::SuggestionType`, `Types::SuggestionBreakdownType`, and `Types::ConfidenceLevelEnum` expose the required fields; request spec asserts every breakdown field, confidence, and reasons are present. |
| 3 | Player-count fit uses persisted `suggested_numplayers` votes and only uses the 0–60 midpoint fallback when poll evidence is missing or thin | ✓ VERIFIED | `Suggestions::Engine#player_count_suitability` branches on `poll_data_fetched_at`, result count ≥20 vs <20, and applies the locked A1/A2 fallback; engine spec covers HIGH/MEDIUM/LOW thresholds and fallback boundaries. |
| 4 | Authorized callers receive `null` suggestions before picking and an empty list when a picking session has no attendees or no qualifying games | ✓ VERIFIED | `NightSessionType#suggestions` returns `nil` unless `state == "picking"`, returns `[]` for empty attendees or empty candidates; `spec/requests/night_session_suggestions_spec.rb` covers both branches. |
| 5 | A host can set a positive time budget and one of the five allowed complexity preferences while creating or scheduling a session | ✓ VERIFIED | `CreateNightSessionContract`/`ScheduleSessionContract` validate `time_budget_minutes` > 0 and `complexity_preference` in `NightSession::VALID_COMPLEXITY_PREFERENCES`; mutation specs cover create and schedule inputs. |
| 6 | A host can edit either preference while the session is draft or invited, and cannot edit them after picking begins | ✓ VERIFIED | `Mutations::UpdateSessionPreferences` enforces host-only, draft/invited state guard; `spec/graphql/update_session_preferences_mutation_spec.rb` covers pre- and post-picking rejection. |
| 7 | Omitted inputs retain the database defaults/current values, while malformed values are rejected at the dry-validation boundary | ✓ VERIFIED | Mutations build filtered contract payloads using `unless arg.nil?`; create/schedule/update specs assert defaults, preservation, and rejection of invalid values. |
| 8 | Thin/missing/unfetched poll data produces a LOW-confidence range fallback, while 20–49 and 50+ target-count votes produce MEDIUM and HIGH poll-based results | ✓ VERIFIED | `confidence_level` returns HIGH for ≥50, MEDIUM for 20–49, LOW otherwise; engine spec has exact threshold cases at 19/20/49/50 votes. |
| 9 | Out-of-range or over-budget games are excluded; nil BGG statistics never crash ranking; tied scores remain deterministic | ✓ VERIFIED | Engine returns `nil` for `player_fit == 0` or `time_fit == 0`; nil coalescing in `time_fit_for`, `complexity_fit_for`, `community_rating_for`; ties broken by ascending `objectid`; covered by engine specs. |
| 10 | Only authenticated hosts/group members can read suggestions, and the resolver performs no synchronous BGG request or per-game poll/owner query | ✓ VERIFIED | `NightSessionType#suggestions` requires auth and membership, batches polls/owners with `load_all`; request spec stubs `Bgg::Client.new` to raise and asserts exactly one poll query and one owner query regardless of candidate count. |
| 11 | Reason chips identify player fit, time, complexity, and attending ownership using stable backend text | ✓ VERIFIED | `Suggestions::Engine#reason_chips` generates poll-backed, limited-data, time, complexity, and alphabetically-sorted owner strings; engine specs assert exact reason content. |
| 12 | The committed GraphQL schema exposes session preferences, suggestions, the complete breakdown, confidence enum, and `updateSessionPreferences` | ✓ VERIFIED | `schema.graphql` and `schema.json` contain `Suggestion`, `SuggestionBreakdown`, `ConfidenceLevel`, `NightSession.timeBudgetMinutes/complexityPreference/suggestions`, and `Mutation.updateSessionPreferences`; `spec/graphql/boardgame_night_schema_spec.rb` asserts runtime reachability. |
| 13 | Generated TypeScript schema types reflect the backend contract | ✓ VERIFIED | `app/frontend/generated/types.ts` contains `Suggestion`, `SuggestionBreakdown`, `ConfidenceLevel`, `NightSession` preference fields, and `MutationUpdateSessionPreferencesArgs`; regenerated with `npm run codegen` and matched the committed SDL. |
| 14 | The full focused Phase 7 suite passes after schema generation | ✓ VERIFIED | Integrated gate: `bin/rails graphql:schema:dump && npm run codegen` exited 0; focused RSpec suite (99 examples) passed; RuboCop on all Phase 7 production files passed. |

**Score:** 14/14 must-have truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/services/suggestions/engine.rb` | Pure deterministic scorer with Result/Breakdown structs | ✓ VERIFIED | No ActiveRecord queries, no BGG calls; constants for weights and complexity targets; clamped components; top-eight cap. |
| `app/graphql/types/night_session_type.rb` | Authenticated picking-state suggestions resolver | ✓ VERIFIED | Auth + membership guard; returns nil for non-picking; returns [] for empty attendees/candidates; delegates to `Suggestions::Engine`. |
| `app/graphql/types/suggestion_type.rb` | GraphQL suggestion contract | ✓ VERIFIED | Non-null `thing`, `score`, `breakdown`, `confidence`, `reasons`. |
| `app/graphql/types/suggestion_breakdown_type.rb` | Five component fields | ✓ VERIFIED | Non-null Floats for `playerCountFit`, `timeFit`, `complexityFit`, `communityRating`, `ownershipBonus`. |
| `app/graphql/types/confidence_level_enum.rb` | HIGH/MEDIUM/LOW enum | ✓ VERIFIED | Three values with threshold descriptions. |
| `db/migrate/20260714000002_add_suggestion_preferences_to_night_sessions.rb` | Non-null columns with defaults | ✓ VERIFIED | `time_budget_minutes` default 120, `complexity_preference` default "Any"; reflected in `db/schema.rb`. |
| `app/contracts/update_session_preferences_contract.rb` | Preference input boundary | ✓ VERIFIED | Validates optional positive time budget and allowed complexity; base rule requires at least one preference. |
| `app/models/bgg_poll.rb` | Target-count result lookup | ✓ VERIFIED | `results_for_player_count` filters already-loaded association; no hidden query. |
| `app/models/bgg_poll_result.rb` | Semantic category predicates | ✓ VERIFIED | `best?`, `recommended?`, `not_recommended?` compare exact BGG strings. |
| `spec/services/suggestions/engine_spec.rb` | Formula, confidence, fallback, nil-data, top-eight, reason matrix | ✓ VERIFIED | 680-line boundary matrix covering all thresholds. |
| `spec/requests/night_session_suggestions_spec.rb` | Auth, state, batching, no-BGG HTTP coverage | ✓ VERIFIED | 402 lines; real POST to `/graphql` with Bearer token; stubs `Bgg::Client`. |
| `spec/graphql/boardgame_night_schema_spec.rb` | Runtime contract reachability | ✓ VERIFIED | `suggestion engine contract` context asserts type/enum/field names and nullability. |
| `schema.graphql` / `schema.json` | Canonical SDL/introspection artifacts | ✓ VERIFIED | Regenerated via `bin/rails graphql:schema:dump`; no hand-authored divergence. |
| `app/frontend/generated/types.ts` | Client-side contract types | ✓ VERIFIED | Regenerated via `npm run codegen`; no hand-authored divergence. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/graphql/types/night_session_type.rb` | `app/services/suggestions/engine.rb` | `Suggestions::Engine.call(...)` | ✓ WIRED | Resolver passes session, candidates, attendee IDs/count, and preloaded poll/owner maps. |
| `app/graphql/types/night_session_type.rb` | `app/graphql/loaders/polls_loader.rb` | `dataloader.with(Loaders::PollsLoader).load_all(thing_ids)` | ✓ WIRED | One batch query for all candidate poll rows. |
| `app/graphql/types/night_session_type.rb` | `app/graphql/loaders/owners_loader.rb` | `dataloader.with(Loaders::OwnersLoader).load_all(thing_ids)` | ✓ WIRED | One batch query for all candidate owner rows. |
| `app/services/suggestions/engine.rb` | `app/models/bgg_poll_result.rb` | `results.select(&:best? / &:recommended?)` | ✓ WIRED | Engine uses semantic predicates instead of raw string comparisons. |
| `app/services/suggestions/engine.rb` | `app/models/bgg_poll.rb` | `poll.results_for_player_count(attendee_count)` | ✓ WIRED | Filters already-loaded association; no per-count SQL. |
| `app/graphql/mutations/create_night_session.rb` | `app/contracts/create_night_session_contract.rb` | Contract call with filtered payload | ✓ WIRED | Optional preference arguments validated before persistence. |
| `app/graphql/mutations/update_session_preferences.rb` | `app/models/night_session.rb` | Host/state guard + `session.update!` | ✓ WIRED | Draft/invited lifecycle guard enforced before persistence. |
| `app/graphql/types/night_session_type.rb` | `schema.graphql` | `bin/rails graphql:schema:dump` | ✓ WIRED | SDL regenerated and contains all suggestion types. |
| `schema.graphql` | `app/frontend/generated/types.ts` | `npm run codegen` | ✓ WIRED | Codegen output reflects the SDL. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `NightSessionType#suggestions` | `attendee_ids` | `object.attendances.where(response: "going").pluck(:user_id).uniq` | DB attendance rows | ✓ FLOWING |
| `NightSessionType#suggestions` | `things` | `BggThing.merged_for_users(attendee_ids)` | DB collection ownership rows | ✓ FLOWING |
| `NightSessionType#suggestions` | `polls` | `Loaders::PollsLoader.load_all(thing_ids)` | DB `bgg_polls` + `bgg_poll_results` | ✓ FLOWING |
| `NightSessionType#suggestions` | `owners` | `Loaders::OwnersLoader.load_all(thing_ids)` | DB `bgg_collections` + users | ✓ FLOWING |
| `Suggestions::Engine` | `score`/`breakdown`/`confidence`/`reasons` | Computed from above maps + session preferences | Derived from persisted rows | ✓ FLOWING |

No live BoardGameGeek API calls are used in the suggestion path; the only network class in the query chain is stubbed to raise in the request spec and is never constructed.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Focused Phase 7 RSpec suite | `rtk rspec spec/services/suggestions/engine_spec.rb spec/requests/night_session_suggestions_spec.rb spec/graphql/create_night_session_mutation_spec.rb spec/graphql/schedule_session_mutation_spec.rb spec/graphql/update_session_preferences_mutation_spec.rb spec/graphql/boardgame_night_schema_spec.rb spec/models/night_session_spec.rb spec/models/bgg_poll_spec.rb spec/models/bgg_poll_result_spec.rb` | 99 passed, 0 failures | ✓ PASS |
| RuboCop on Phase 7 production files | `rtk rubocop db/migrate/20260714000002_add_suggestion_preferences_to_night_sessions.rb app/services/suggestions/engine.rb app/models/night_session.rb app/models/bgg_poll.rb app/models/bgg_poll_result.rb app/contracts/create_night_session_contract.rb app/contracts/schedule_session_contract.rb app/contracts/update_session_preferences_contract.rb app/graphql/mutations/create_night_session.rb app/graphql/mutations/schedule_session.rb app/graphql/mutations/update_session_preferences.rb app/graphql/types/mutation_type.rb app/graphql/types/night_session_type.rb app/graphql/types/suggestion_type.rb app/graphql/types/suggestion_breakdown_type.rb app/graphql/types/confidence_level_enum.rb` | 16 files inspected, 0 offenses | ✓ PASS |
| Schema dump + codegen | `rtk rails graphql:schema:dump && rtk npm run codegen` | SDL, JSON, and TypeScript generated successfully | ✓ PASS |
| No BGG calls in suggestion path | `grep -R "Bgg::Client" app/services/suggestions/engine.rb app/graphql/types/night_session_type.rb app/graphql/loaders/polls_loader.rb app/graphql/loaders/owners_loader.rb` | No matches | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUGG-02 | 07-01, 07-02, 07-03 | Fixed 40/20/20/10/10 ranked shortlist | ✓ SATISFIED | `Suggestions::Engine` weights, breakdown, ranking, and cap; mutation/model preferences. |
| SUGG-03 | 07-01, 07-03 | Explainable chips and thin-data confidence | ✓ SATISFIED | `SuggestionType.reasons`, `ConfidenceLevelEnum`, LOW/MEDIUM/HIGH thresholds, and reason generation. |
| SUGG-04 | 07-01, 07-03 | Community poll data replaces range-only fit | ✓ SATISFIED | `BggPoll`/`BggPollResult` helpers, poll-first scoring, fallback only for missing/unfetched/<20 votes. |

All three Phase 7 requirement IDs from `.planning/REQUIREMENTS.md` are accounted for. No additional requirement IDs are mapped to this phase.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No stub markers, debt comments, or placeholder implementations found in Phase 7 files. |

The two `return []` short-circuits in `app/graphql/types/night_session_type.rb` are intentional empty-set guards, not stubs.

---

### Review Findings from `07-REVIEW.md`

All findings were inspected and classified against Phase 7 must-haves. None block Phase 7 goal achievement.

| Finding | Severity | Phase 7 Impact | Verdict |
|---------|----------|----------------|---------|
| **CR-01** `QueryType.night_session` exposes session metadata without auth | Critical | Does **not** break the `suggestions` field authorization or any Phase 7 must-have. The new `suggestions` field is independently guarded. General session-privacy issue to track as review debt. | Review debt / warning |
| **CR-02** Fallback score is zero at exact player-count range edges | Critical | Matches the locked D-01/A2 fallback decision (0 at edges/outside, 60 at midpoint). The spec codifies this boundary behavior. | Product decision, not a gap |
| **WR-01** Host-only authorization for `schedule_session`/`update_session_preferences` | Warning | Matches the D-06 host-only requirement; group-admin access is not part of this phase. | Not a gap |
| **WR-02** `schedule_session` uses two separate `update!` calls | Warning | Could leave a partial state if the second update fails after invitations; does not break any Phase 7 must-have and tests pass. | Review debt |
| **WR-03** Mutations check raw args instead of contract values for nil guard | Warning | No behavioral impact because the contract is already enforced and values are identical; tests pass. | Review debt |
| **WR-04** GraphQL ID arguments are not decoded as GlobalIDs | Warning | General pattern across multiple mutations; does not break the Phase 7 suggestion path or its tests. | Review debt |
| **WR-05** "Any" complexity preference returns 50.0 | Warning | Matches the locked D-03 plan (Any = 50). | Product decision |
| **WR-06** Unknown playtime returns 60% time fit | Warning | Matches the locked D-02 plan (absent playtime → min 0 / max infinity → 60 fit). | Product decision |
| **WR-07** `schedule_session` fails if a member has no email | Warning | Scheduling/invite issue outside the suggestion engine. | Review debt |
| **WR-08** Missing uniqueness validations on poll models | Warning | Race window for duplicate rows; no Phase 7 behavior blocked. | Review debt |
| **IN-01** Schema missing descriptions for new session mutations | Info | Cosmetic; schema dump reflects the current source. | Info |
| **IN-02** `night_session_spec` omits `cancelled` from state inclusion test | Info | Coverage gap; model still validates all five states. | Info |
| **IN-03** Outdated comment in `BoardgameNightSchema` orphan types | Info | Documentation debt; no runtime impact. | Info |

---

### Human Verification Required

None. All Phase 7 must-haves are backed by executable RSpec examples and the generated schema contract.

---

### Gaps Summary

No gaps found. The Phase 7 goal is achieved: a host can query an authenticated GraphQL endpoint, receive up to eight attendee-owned game suggestions ranked by the locked weighted score, with a structured breakdown, confidence indicator, and backend-authored reason chips, all driven by persisted BGG poll data and session preferences without synchronous BGG calls.

---

_Verified: 2026-07-15T00:00:00Z_  
_Verifier: the agent (gsd-verifier)_
