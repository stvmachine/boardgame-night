---
phase: 07-suggestion-engine-backend
plan: 04
subsystem: api

tags: [rails, graphql, ruby, rspec, rubocop, codegen, suggestions]

requires:
  - phase: 07-suggestion-engine-backend
    plan: 02
    provides: persisted session context and updateSessionPreferences mutation
  - phase: 07-suggestion-engine-backend
    plan: 03
    provides: hardened Suggestions::Engine, poll helpers, authorization/batching coverage

provides:
  - Runtime schema reachability tests for Suggestion, SuggestionBreakdown, ConfidenceLevel, and updateSessionPreferences
  - Regenerated schema.graphql, schema.json, and app/frontend/generated/types.ts in sync with the final Phase 7 contract
  - Green integrated Phase 7 RSpec + RuboCop verification gate

affects:
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - GraphQL schema introspection and Ruby API assertions for runtime contract verification
    - Rake-driven schema dump and npm-driven codegen as the single source of truth for client types
    - Integrated gate covering Phase 7 specs plus RuboCop on all Phase 7 production files

key-files:
  created: []
  modified:
    - spec/graphql/boardgame_night_schema_spec.rb
    - app/frontend/generated/types.ts
    - app/services/suggestions/engine.rb
    - app/graphql/types/night_session_type.rb
    - app/graphql/types/suggestion_type.rb
    - schema.graphql
    - schema.json

key-decisions:
  - "Kept Suggestion, SuggestionBreakdown, and ConfidenceLevel out of orphan_types because they are reachable through NightSession.suggestions; the new schema spec provides test-backed proof"
  - "Regenerated schema.graphql/schema.json via bin/rails graphql:schema:dump and client types via npm run codegen without hand-editing generated artifacts"

patterns-established:
  - "Runtime reachability assertions replace redundant orphan_type registration when types are already wired into the schema graph"
  - "Phase gate includes both focused RSpec and RuboCop on every Phase 7 production file to catch drift before it reaches the frontend"

requirements-completed:
  - SUGG-02
  - SUGG-03
  - SUGG-04

coverage:
  - id: D1
    description: "Runtime schema contract spec proves Suggestion, SuggestionBreakdown, ConfidenceLevel, NightSession preferences, and updateSessionPreferences are reachable with correct nullability"
    requirement: SUGG-02
    verification:
      - kind: unit
        ref: "spec/graphql/boardgame_night_schema_spec.rb#suggestion engine contract"
        status: pass
    human_judgment: false
  - id: D2
    description: "Schema dump and codegen regenerate the canonical GraphQL SDL/JSON and TypeScript client types from the Rails schema"
    requirement: SUGG-03
    verification:
      - kind: other
        ref: "bin/rails graphql:schema:dump && npm run codegen exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Integrated Phase 7 RSpec suite and RuboCop gate pass on all Phase 7 Ruby production files"
    requirement: SUGG-04
    verification:
      - kind: integration
        ref: "bundle exec rspec spec/services/suggestions/engine_spec.rb spec/requests/night_session_suggestions_spec.rb spec/graphql/create_night_session_mutation_spec.rb spec/graphql/schedule_session_mutation_spec.rb spec/graphql/update_session_preferences_mutation_spec.rb spec/graphql/boardgame_night_schema_spec.rb spec/models/night_session_spec.rb spec/models/bgg_poll_spec.rb spec/models/bgg_poll_result_spec.rb"
        status: pass
      - kind: other
        ref: "bundle exec rubocop [Phase 7 Ruby production files]"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-14
status: complete
---

# Phase 07 Plan 04: Suggestion Engine Backend - Contract Publication

**Runtime GraphQL contract verification, schema/codegen regeneration, and integrated Phase 7 gate proving the suggestion backend is ready for the Picking screen**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-14T15:20:00Z
- **Completed:** 2026-07-14T15:29:15Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Extended the schema spec with a `suggestion engine contract` context that introspects `BoardgameNightSchema.types` and proves the runtime reachability chain `Query.nightSession` → `NightSession.suggestions` → `Suggestion` → `SuggestionBreakdown`/`ConfidenceLevel`.
- Asserted exact type/enum names, ConfidenceLevel values, and GraphQL nullability for `NightSession`, `Suggestion`, `SuggestionBreakdown`, and the `Mutation.updateSessionPreferences` field.
- Regenerated `schema.graphql`/`schema.json` via `bin/rails graphql:schema:dump` and `app/frontend/generated/types.ts` via `npm run codegen`; confirmed the TypeScript output now exposes `Suggestion`, `SuggestionBreakdown`, `ConfidenceLevel`, `NightSession` preference fields, and `updateSessionPreferences`.
- Ran the complete focused Phase 7 RSpec suite (99 examples, 0 failures) and RuboCop on all Phase 7 Ruby production files, fixing the discovered offenses and re-running until both gates were green.
- Left no hand-authored divergence in generated artifacts and did not add a frontend suggestion query or component in this backend phase.

## Task Commits

Each task was committed atomically:

1. **Task 1: Assert the final runtime GraphQL contract is reachable** - `fe99345` (test)
2. **Task 2: Regenerate schema/client types and run the integrated phase gate** - `2322461` (feat)

**Plan metadata:** to be committed after summary

## Files Created/Modified

- `spec/graphql/boardgame_night_schema_spec.rb` - Added `suggestion engine contract` context with runtime reachability, type, enum, field, and nullability assertions
- `app/frontend/generated/types.ts` - Regenerated client-side TypeScript types for Suggestion, SuggestionBreakdown, ConfidenceLevel, NightSession preferences, and updateSessionPreferences
- `schema.graphql` / `schema.json` - Regenerated (already in sync with the Rails schema)
- `app/services/suggestions/engine.rb` - Auto-corrected RuboCop Layout/SpaceInsideArrayLiteralBrackets offenses
- `app/graphql/types/night_session_type.rb` - Auto-corrected RuboCop Layout/SpaceInsideArrayLiteralBrackets offenses
- `app/graphql/types/suggestion_type.rb` - Auto-corrected RuboCop Layout/SpaceInsideArrayLiteralBrackets offenses

## Decisions Made

- Deliberately did not add `SuggestionType`, `SuggestionBreakdownType`, or `ConfidenceLevelEnum` to `orphan_types` in `BoardgameNightSchema`; the runtime reachability spec proves they are discoverable through `NightSessionType.suggestions`, making redundant registration unnecessary.
- Kept the generated artifacts source-derived: `schema.graphql`/`schema.json` from `graphql:schema:dump` and `types.ts` from `npm run codegen`, with no hand-editing.
- Fixed the RuboCop offenses discovered by the gate rather than ignoring them, so the committed Phase 7 production files remain lint-clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed RuboCop Layout/SpaceInsideArrayLiteralBrackets offenses in Phase 7 production files**
- **Found during:** Task 2 (integrated Phase 7 gate)
- **Issue:** `bundle exec rubocop` on the listed Phase 7 Ruby production files reported 12 offenses (6 distinct array literals) for missing spaces inside brackets in `app/services/suggestions/engine.rb`, `app/graphql/types/night_session_type.rb`, and `app/graphql/types/suggestion_type.rb`. The gate could not pass until these were resolved.
- **Fix:** Ran `bundle exec rubocop -a` on the listed Phase 7 files to auto-correct spacing inside array brackets, then re-ran both the RSpec and RuboCop gates until both exited 0.
- **Files modified:** `app/services/suggestions/engine.rb`, `app/graphql/types/night_session_type.rb`, `app/graphql/types/suggestion_type.rb`
- **Verification:** `bundle exec rubocop [Phase 7 Ruby production files]` exits 0
- **Committed in:** `2322461` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-corrected offenses were whitespace-only changes required for the integrated gate to pass. No scope creep or behavior change.

## Issues Encountered

- None beyond the RuboCop offenses documented above. No package installations, authentication gates, or architectural changes were required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 is complete. The backend now exposes a committed, generated, typed GraphQL contract for the suggestion engine.
- Phase 10 (Picking a Game Redesign) can consume the contract without reproducing score formulas or making BGG calls.
- Unrelated dirty files `.planning/config.json` and `tests/e2e/fixtures/e2e_session.json` remain unmodified and unstaged.

---
*Phase: 07-suggestion-engine-backend*
*Completed: 2026-07-14*

## Self-Check: PASSED

- All modified files exist and are tracked.
- All task commits (`fe99345`, `2322461`) exist in git history.
- Focused verification passes: 99 RSpec examples, 0 failures; RuboCop exits 0 on all Phase 7 production files listed in the gate.
- Generated artifacts contain no hand-authored divergence.
- Unrelated dirty files `.planning/config.json` and `tests/e2e/fixtures/e2e_session.json` remain unmodified and unstaged.
