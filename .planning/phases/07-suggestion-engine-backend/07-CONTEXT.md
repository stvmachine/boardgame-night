# Phase 7: Suggestion Engine Backend - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers a deterministic, poll-based suggestion scoring service that produces an explainable, ranked shortlist of games for a boardgame night session. The engine uses BGG community poll data (parsed and persisted in Phase 6) instead of the v1 min/max range heuristic, and is callable via GraphQL with no synchronous BGG calls.

**Deliverables:**
- `Suggestions::Engine` service — deterministic weighted scoring over the group's merged collection, constrained by session context (attendee count, time budget, complexity preference)
- `SuggestionType` and `SuggestionBreakdownType` GraphQL types — structured score breakdown with human-readable reason chips
- `suggestions` field on `NightSessionType` — computed on demand when session is in "picking" state
- `ConfidenceLevelEnum` GraphQL enum — HIGH / MEDIUM / LOW confidence indicator for poll data quality
- Migration: add `time_budget_minutes` and `complexity_preference` columns to `night_sessions`
- `BggPoll` / `BggPollResult` helper methods — `results_for_player_count(n)`, `best?`, `recommended?`, `not_recommended?`
- Tests: scoring service unit tests with fixture data, GraphQL type tests, edge case tests (no poll data, out-of-range, thin votes)

**Not in scope:**
- Frontend suggestion display (Phase 10 — Picking a Game Redesign)
- Suggestion persistence (suggestions are computed on demand, not stored)
- Freshness signal / play history (v2 — deferred)
- AI/LLM re-ranking (out of scope per FEATURES.md)
- Ranked voting on shortlist (v2 — deferred)
- Tunable weights per group/session (weights are fixed at 40/20/20/10/10 for v1.1)

</domain>

<decisions>
## Implementation Decisions

### Scoring Formula (Locked by Research)

The scoring formula is fully specified in `.planning/research/FEATURES.md` §"Poll-Based Suggestion Engine". The weights are locked by requirements (SUGG-02): player-count fit 40%, time fit 20%, complexity fit 20%, rating 10%, ownership diversity 10%.

- **D-01:** **player_count_suitability** uses the **Schmaus adjusted-rating formula**: `100 * (best_pct * 1.0 + rec_pct * 0.6 + nrec_pct * 0.0)` with +1 smoothing on rec and nrec for small samples. If `attendee_count` is outside `[minPlayers, maxPlayers]` → suitability = 0 (hard filter). If no poll data at that count (total votes < 20) → fall back to range-midpoint heuristic scaled to 0–60, flag confidence as LOW.
- **D-02:** **time_fit**: `maxPlayTime <= time_budget → 100`, `minPlayTime <= time_budget < maxPlayTime → 60`, `minPlayTime > time_budget → 0`.
- **D-03:** **complexity_fit**: `target = {Light: 1.8, Medium: 2.7, Medium-Heavy: 3.6, Heavy: 4.4}[pref]`, `distance = |g.averageWeight - target|`, `complexity_fit = max(0, 100 - distance * 30)`. "Any" → 50 (neutral).
- **D-04:** **community_rating**: `100 * (bayes_average / 10)`. Use `bayes_average` (BGG Bayesian-adjusted rank) if available, fall back to `average`.
- **D-05:** **ownership_bonus**: `min(100, 100 * (number_of_attending_owners / attendee_count))`. Rewards games owned by multiple attending members.

### Session Inputs

- **D-06:** Add **`time_budget_minutes:integer`** and **`complexity_preference:string`** columns to `night_sessions` via migration. Defaults: `time_budget_minutes = 120` (2 hours), `complexity_preference = "Any"`. Host sets them when creating/scheduling the session; editable before entering "picking" state.
- **D-07:** `complexity_preference` values: `"Light"`, `"Medium"`, `"Medium-Heavy"`, `"Heavy"`, `"Any"`. Stored as a plain string column (no enum type needed — validated by contract).

### GraphQL API Shape

- **D-08:** `suggestions` is a **field on `NightSessionType`**, computed on demand (no persistence). Returns `[SuggestionType]` sorted by score descending. Uses session's `time_budget_minutes`, `complexity_preference`, and `attendee_count`. Follows the existing pattern of computed fields on NightSessionType (e.g., `attendee_count`).
- **D-09:** The `suggestions` field **only returns data when `session.state == "picking"`**. In other states, returns `nil` (not an empty array — distinguishes "not available" from "no matches"). This matches the UX flow: host enters picking mode → frontend fetches suggestions → host picks from shortlist.
- **D-10:** `SuggestionType` contains: `thing: MergedThing` (the game with owners), `score: Float` (0–100), `breakdown: SuggestionBreakdownType` (structured score components), `confidence: ConfidenceLevelEnum`, `reasons: [String]` (human-readable reason chips).
- **D-11:** `SuggestionBreakdownType` contains: `playerCountFit: Float`, `timeFit: Float`, `complexityFit: Float`, `communityRating: Float`, `ownershipBonus: Float` — all 0–100 numeric values.
- **D-12:** `ConfidenceLevelEnum` values: `HIGH` (≥50 total votes at attendee_count), `MEDIUM` (20–49 votes), `LOW` (<20 votes, fallback heuristic in use).

### Candidate Pool

- **D-13:** Only score games **owned by ≥1 attending member** (RSVP'd "going"). Uses `BggThing.merged_for_users(attendee_user_ids)` to get the candidate pool. Games nobody brings can't be played. `ownership_bonus` naturally rewards multi-owner games.

### Shortlist Sizing

- **D-14:** Return **top 8** suggestions, sorted by score descending. Games with score = 0 are excluded from the shortlist. Fixed number (no configurable limit argument) — matches FEATURES.md spec.

### Explanation Format

- **D-15:** Each suggestion includes **structured numeric fields** (for tooltips/sorting) AND a **`reasons: [String]` array** of human-readable chips. Reason chip examples from FEATURES.md: "Best at 5 players (72% Best votes)", "75 min fits your 2h budget", "Medium complexity (2.8)", "Owned by Alex & Sam". The backend generates these strings; the frontend renders them directly.

### Agent's Discretion

- Exact service class structure (`Suggestions::Engine` vs `Suggestions::Scorer` vs module pattern) — researcher/planner to determine based on existing service patterns.
- Whether to add helper methods on `BggPoll`/`BggPollResult` models or compute in the service — researcher to decide.
- Dataloader usage for batch-loading poll data and ownership in the suggestion resolver — planner to design based on existing `PollsLoader`/`OwnersLoader` patterns.
- Whether `complexity_preference` needs a GraphQL enum type or can be a plain string — planner to decide.
- Edge case handling for games with no `poll_data_fetched_at` (never backfilled) vs games with poll data but 0 votes at the target count — researcher to specify.
- Whether the `time_budget_minutes` and `complexity_preference` columns should be set via existing mutations (`createSession`, `scheduleSession`) or a new `updateSessionPreferences` mutation — planner to decide.
- Exact reason chip text format — researcher to refine based on FEATURES.md examples.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Feature Specification (CRITICAL — scoring formula is defined here)
- `.planning/research/FEATURES.md` §"Poll-Based Suggestion Engine" (lines 93-203) — **THE spec for the scoring formula.** Contains the Schmaus adjusted-rating formula, time_fit, complexity_fit, community_rating, ownership_bonus formulas, inputs, outputs, and explainability requirements. Downstream agents MUST follow this spec exactly.

### Project Requirements & Planning
- `.planning/REQUIREMENTS.md` §SUGG-02, SUGG-03, SUGG-04 — Phase 7 requirements: weighted scoring, explainable shortlist, poll-based player-count fit.
- `.planning/ROADMAP.md` §Phase 7 — Goal, mode (mvp), dependencies (Phase 6), success criteria (4 criteria).
- `.planning/STATE.md` — Current position (Phase 7 next), carried concerns (live BGG poll XML validation flag).

### Existing Models (Integration Points)
- `app/models/night_session.rb` — Session model with state machine (draft→invited→picking→completed). Will get `time_budget_minutes` and `complexity_preference` columns (D-06). `attendee_count` is computed in GraphQL type, not on model.
- `app/models/attendance.rb` — Attendance model with `response` ∈ `[going, not_going]`. `attendances.where(response: "going")` gives the attendee set.
- `app/models/bgg_thing.rb` — BggThing model with `merged_for_users(user_ids)` scope, statistics columns (min_players, max_players, min_playtime, max_playtime, average, bayes_average, average_weight, users_rated), and `has_many :bgg_polls`.
- `app/models/bgg_poll.rb` — Poll model: `belongs_to :bgg_thing`, `has_many :bgg_poll_results`. Columns: name, title, total_votes. Needs helper methods for player-count lookups.
- `app/models/bgg_poll_result.rb` — Poll result: `belongs_to :bgg_poll`. Columns: player_count, level, value ("Best"/"Recommended"/"Not Recommended"), num_votes. Needs `best?`/`recommended?`/`not_recommended?` helpers.
- `app/models/group.rb` — Group model with `member_ids` method. `session.group.member_ids` gives the group's member IDs.
- `app/models/bgg_collection.rb` — Collection join: `user_id`, `bgg_thing_id`, `quantity`. Used to determine which attendees own which games.

### GraphQL Types & Loaders (Integration Points)
- `app/graphql/types/night_session_type.rb` — Session type with `attendee_count` (computed). `suggestions` field will be added here (D-08).
- `app/graphql/types/thing_fields.rb` — Shared concern with `best_player_count` (computed via PollsLoader). SuggestionType's `thing` field will use `MergedThingType`.
- `app/graphql/types/merged_thing_type.rb` — Includes ThingFields + `owners` field. SuggestionType.thing will return this type.
- `app/graphql/loaders/polls_loader.rb` — Batches `BggPoll.where(bgg_thing_id:)` with `includes(:bgg_poll_results)`. Reusable for batch-loading poll data in the scoring service.
- `app/graphql/loaders/owners_loader.rb` — Batches `BggCollection.where(bgg_thing_id:)` with `includes(:user)`. Reusable for batch-loading ownership data in the scoring service.
- `app/graphql/types/session_state_enum.rb` — `DRAFT, INVITED, PICKING, COMPLETED, CANCELLED`. Used to gate suggestions field (D-09).

### Contracts (Pattern Reference)
- `app/contracts/application_contract.rb` — Base dry-validation contract. Pattern for any new contracts (e.g., if session preference updates need validation).
- `app/contracts/pick_game_contract.rb` — Existing contract for the pick game mutation. Reference for session-related contract patterns.

### Architecture Decision Records
- `docs/adr/003-graphql-n-plus-one-dataloader.md` — Dataloader pattern for N+1 prevention. Suggestion resolver must use Dataloader for poll/ownership batch loading.
- `docs/adr/004-solid-queue-cache-cable.md` — Solid Queue/Cache/Cable (no Redis). No background jobs needed for suggestions (computed on demand), but pattern is relevant.
- `docs/adr/007-dry-rails-validation-contracts.md` — Every mutation uses a dry-validation contract. If session preference updates are added as mutations, they need contracts.

### Prior Phase Context
- `.planning/phases/06-bgg-poll-data-layer/06-CONTEXT.md` — Poll data layer: BggPoll/BggPollResult schema, PollsLoader, bestPlayerCount computation, poll_data_fetched_at tracking. Phase 7 builds directly on this.
- `.planning/phases/04-auth-friend-groups-session-lifecycle/04-CONTEXT.md` — NightSession state machine, Attendance model, BggThing.merged_for_users scope, mutation pattern (contract → mutation → service).

### Test Fixtures
- `spec/fixtures/files/stevmachine_thing.xml` — Contains real `suggested_numplayers` poll data with 4 player-count results. Usable for scoring service tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`BggThing.merged_for_users(user_ids)`** — Existing scope that joins `bgg_collections` to get the merged collection for a set of users. Use this with `attendee_user_ids` to get the candidate pool (D-13).
- **`Loaders::PollsLoader`** — `GraphQL::Dataloader::Source` that batch-loads `BggPoll` with `bgg_poll_results` per thing ID. Reusable in the suggestion resolver for efficient poll data access.
- **`Loaders::OwnersLoader`** — Batch-loads `BggCollection` with `user` per thing ID. Reusable for ownership_bonus computation (D-05).
- **`Types::ThingFields#best_player_count`** — Already computes bestPlayerCount via PollsLoader (ties → lower count). The scoring service can use this or compute directly from poll results.
- **`NightSessionType#attendee_count`** — Computed field: `attendances.where(response: "going").count`. The suggestion resolver needs both the count and the user IDs.
- **`Group#member_ids`** — Returns `group_memberships.pluck(:user_id)`. Used to get the full group membership for the merged collection.
- **`stevmachine_thing.xml` fixture** — Real BGG thing XML with poll data. Usable for scoring service unit tests.

### Established Patterns
- **Service object pattern:** `Bgg::CollectionFetcher`, `Bgg::PollPersister` — plain Ruby service objects in `app/services/`. The suggestion engine should follow this pattern (`Suggestions::Engine` or similar).
- **GraphQL Dataloader pattern:** `GraphQL::Dataloader::Source` subclasses with `def fetch(ids)`. Batch-loads data to avoid N+1. The suggestion resolver should use Dataloader for poll and ownership data.
- **GraphQL computed fields:** `NightSessionType#attendee_count` is computed on demand, not persisted. `suggestions` follows the same pattern (D-08).
- **dry-validation contracts:** Every mutation has a contract in `app/contracts/`. If session preference updates are exposed as mutations, they need contracts.
- **No synchronous BGG calls in resolvers:** ARCHITECTURE.md Anti-Pattern 1. All data comes from DB. Suggestions are computed from persisted poll data, not live BGG API calls.

### Integration Points
- **`NightSessionType`** — Add `suggestions` field (D-08). Gate on `state == "picking"` (D-09).
- **`night_sessions` table** — Add `time_budget_minutes` and `complexity_preference` columns (D-06).
- **`BggPoll` model** — Add `results_for_player_count(n)` helper to look up poll results at a specific player count.
- **`BggPollResult` model** — Add `best?`, `recommended?`, `not_recommended?` convenience methods.
- **`app/services/suggestions/`** — New directory for the scoring engine service.
- **`app/graphql/types/suggestion_type.rb`** — New GraphQL type for suggestions.
- **`app/graphql/types/suggestion_breakdown_type.rb`** — New GraphQL type for score breakdown.
- **`app/graphql/types/confidence_level_enum.rb`** — New GraphQL enum for confidence levels.
- **`db/migrate/`** — New migration for `time_budget_minutes` and `complexity_preference` columns.
- **`schema.graphql`** — Will be updated by `rails graphql:schema:dump` after new types are added. Codegen will regenerate frontend types.

</code_context>

<specifics>
## Specific Ideas

- The scoring formula is fully specified in FEATURES.md — downstream agents should follow it exactly, not invent alternative formulas.
- Reason chips should be generated by the backend as human-readable strings. Examples from FEATURES.md: "Best at 5 players (72% Best votes)", "75 min fits your 2h budget", "Medium complexity (2.8)", "Owned by Alex & Sam".
- The `suggestions` field returning `nil` (not empty array) when not in "picking" state lets the frontend distinguish "not available" from "no good matches".
- The `freshness` input mentioned in FEATURES.md is explicitly not used in v1.1 — leave a hook in the schema but don't implement scoring for it.
- Games with `poll_data_fetched_at IS NULL` (never backfilled) should be treated as LOW confidence with the range-midpoint fallback heuristic.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 7-Suggestion Engine Backend*
*Context gathered: 2026-07-14*