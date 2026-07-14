---
phase: 07-suggestion-engine-backend
plan: 03
subsystem: api

tags: [rails, graphql, ruby, rspec, suggestions, dataloader, authorization]

requires:
  - phase: 07-suggestion-engine-backend
    plan: 01
    provides: persisted session context, Suggestions::Engine, GraphQL suggestion types
  - phase: 06-bgg-poll-data-layer
    provides: BggPoll/BggPollResult data and PollsLoader

provides:
  - Semantic BggPoll and BggPollResult helper methods
  - Exhaustive engine regression suite for confidence/fallback/filters/reasons
  - Hardened NightSessionType#suggestions resolver with membership enforcement and batching
  - HTTP authorization, state, attendee-isolation, and no-BGG regression coverage

affects:
  - 07-04-suggestion-engine-backend
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - Model-level semantic predicates for persisted BGG category strings
    - Pure engine with clamped components and float-only internal arithmetic
    - GraphQL resolver that authenticates and authorizes before assembling private data
    - Dataloader load_all batching for polls and owners

key-files:
  created: []
  modified:
    - app/models/bgg_poll.rb
    - app/models/bgg_poll_result.rb
    - spec/models/bgg_poll_spec.rb
    - spec/models/bgg_poll_result_spec.rb
    - app/services/suggestions/engine.rb
    - spec/services/suggestions/engine_spec.rb
    - app/graphql/types/night_session_type.rb
    - spec/requests/night_session_suggestions_spec.rb

key-decisions:
  - "Centralized BGG poll category comparisons in BggPollResult predicates keeps the engine free of string matching"
  - "All score components are clamped to 0..100 before entering the weighted total"
  - "Outsiders now receive a GraphQL ExecutionError instead of a silent null, satisfying the authorization threat model"
  - "Ownership reasons use display_name sorted alphabetically so they remain stable across identical scores"
  - "Thin/missing poll data generates a LOW-confidence reason with consistent limited-community-data wording"

patterns-established:
  - "BggPoll#results_for_player_count filters an already-loaded association; no per-count SQL"
  - "Suggestions::Engine consumes semantic predicates and never issues ActiveRecord queries"
  - "NightSessionType#suggestions authorizes membership before state and before any candidate/poll/owner data is loaded"

requirements-completed:
  - SUGG-02
  - SUGG-03
  - SUGG-04

coverage:
  - id: D1
    description: "BggPoll exposes results_for_player_count and BggPollResult exposes exact category predicates"
    requirement: SUGG-04
    verification:
      - kind: unit
        ref: "spec/models/bgg_poll_spec.rb#results_for_player_count returns the associated results for the requested player count"
        status: pass
      - kind: unit
        ref: "spec/models/bgg_poll_result_spec.rb#best? is true only for Best"
        status: pass
    human_judgment: false
  - id: D2
    description: "Engine applies locked formula, confidence bands, fallback, and explanations at all documented boundaries"
    requirement: SUGG-02
    verification:
      - kind: unit
        ref: "spec/services/suggestions/engine_spec.rb#confidence boundaries"
        status: pass
      - kind: unit
        ref: "spec/services/suggestions/engine_spec.rb#fallback and nil-data handling"
        status: pass
    human_judgment: false
  - id: D3
    description: "Suggestions resolver is secure, state-aware, attendee-isolated, and DB-only"
    requirement: SUGG-03
    verification:
      - kind: integration
        ref: "spec/requests/night_session_suggestions_spec.rb#rejects authenticated outsiders with a GraphQL error"
        status: pass
      - kind: integration
        ref: "spec/requests/night_session_suggestions_spec.rb#batch-loads polls and owners and never constructs Bgg::Client"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-14
status: complete
---

# Phase 07 Plan 03: Suggestion Engine Backend - Hardening

**Poll semantic helpers, exhaustive formula/confidence/fallback engine regression suite, and hardened authorization/batching/no-BGG GraphQL resolver**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-14T15:01:17Z
- **Completed:** 2026-07-14T15:16:23Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `BggPoll#results_for_player_count` and exact `BggPollResult` predicates (`best?`, `recommended?`, `not_recommended?`) so the engine no longer repeats BGG string comparisons.
- Expanded the engine spec into a public-input/public-output matrix covering every confidence boundary (19/20/49/50 votes), range fallback, nil poll data, missing target count, all five complexity preferences, rating fallback, attending/non-attending ownership, hard filters, top-eight truncation, nil-statistic safety, and deterministic ties.
- Refactored `Suggestions::Engine` to use the new predicates, clamp every component to 0..100, keep ratios as floats, and produce stable D-15 reason chips including a LOW-confidence limited-community-data player reason.
- Hardened `NightSessionType#suggestions` to authenticate, enforce group membership before any private data is assembled, return a GraphQL error for outsiders, and short-circuit empty attendee/candidate sets before invoking the batch loaders.
- Added HTTP request regression coverage for authorization, state semantics (null for non-picking, [] for picking with no Going attendees), attendee-owner candidate isolation, batch-loaded polls/owners, and a `Bgg::Client` construction guard.
- Verified the full RSpec suite (362 examples) remains green after the changes.

## Task Commits

Each task was committed atomically (TDD tasks include separate test and feat commits):

1. **Task 1: Add semantic poll-result helpers without hidden queries**
   - `9bc9706` (test): add failing tests for poll-result helpers
   - `8cdcb9c` (feat): add semantic poll-result helpers
2. **Task 2: Lock formula, fallback, confidence, and explanation edge behavior**
   - `d1ebdd0` (test): add exhaustive engine edge-case tests
   - `6eff819` (feat): lock engine formula, fallback, confidence, and explanations
3. **Task 3: Prove authorization, state semantics, candidate isolation, and DB-only resolution**
   - `ab3507a` (test): add authorization, state, and batching regression tests
   - `3a483d1` (feat): harden suggestions resolver authorization and data boundaries

**Plan metadata:** to be committed after summary

## Files Created/Modified

- `app/models/bgg_poll.rb` - Added `results_for_player_count(count)` using the already-loaded association
- `app/models/bgg_poll_result.rb` - Added `best?`, `recommended?`, and `not_recommended?` predicates
- `spec/models/bgg_poll_spec.rb` - Lookup, empty-count, and no-hidden-query coverage
- `spec/models/bgg_poll_result_spec.rb` - True/false predicate coverage for all three categories
- `app/services/suggestions/engine.rb` - Refactored to use predicates, clamp components, stable reasons, and `display_name`-based ownership chips
- `spec/services/suggestions/engine_spec.rb` - Exhaustive boundary and edge-case regression suite
- `app/graphql/types/night_session_type.rb` - Membership-first authorization, empty short-circuit, and batch loader wiring
- `spec/requests/night_session_suggestions_spec.rb` - Authorization, state, isolation, batching, and no-BGG HTTP regressions

## Decisions Made

- Centralized exact BGG poll category comparisons in `BggPollResult` predicates; the engine now delegates instead of comparing strings.
- Clamped every score component to 0..100 before it enters the weighted total, preventing malformed BGG metadata from distorting scores.
- Changed outsider access from a silent `null` to a `GraphQL::ExecutionError` so unauthorized callers cannot probe session state by absence of data.
- Short-circuited empty attendee and candidate sets before invoking `PollsLoader` or `OwnersLoader`, keeping the no-attendee path DB-free.
- Used `User#display_name` (sorted alphabetically) for ownership reason chips, making them stable and human-readable across identical scores.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- None. All focused specs and the full RSpec suite pass. No new dependencies, authentication gates, or architectural changes were required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 07-03 is complete. Wave 2 hardening of the suggestion engine is finished.
- The GraphQL suggestion slice is now secure, deterministic, explainable, and fully DB-only, ready for the Picking a Game redesign in Phase 10.

---
*Phase: 07-suggestion-engine-backend*
*Completed: 2026-07-14*

## Self-Check: PASSED

- All modified files exist and are tracked.
- All task commits (9bc9706, 8cdcb9c, d1ebdd0, 6eff819, ab3507a, 3a483d1) exist in git history.
- Focused verification passes: `bundle exec rspec spec/models/bgg_poll_spec.rb spec/models/bgg_poll_result_spec.rb spec/services/suggestions/engine_spec.rb spec/requests/night_session_suggestions_spec.rb` (41 examples, 0 failures).
- Full suite passes: `bundle exec rspec` (362 examples, 0 failures).
- Unrelated dirty files `.planning/config.json` and `tests/e2e/fixtures/e2e_session.json` remain unmodified and unstaged.
