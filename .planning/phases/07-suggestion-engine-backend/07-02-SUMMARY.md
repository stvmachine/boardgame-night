---
phase: 07-suggestion-engine-backend
plan: 02
subsystem: api

tags: [rails, graphql, ruby, rspec, dry-validation, suggestions]

requires:
  - phase: 07-suggestion-engine-backend
    plan: 01
    provides: persisted session context (time_budget_minutes, complexity_preference) and suggestion engine

provides:
  - NightSession preference invariants and shared allowed-value constant
  - Extended createNightSession and scheduleSession preference inputs
  - Host-only updateSessionPreferences mutation for pre-picking edits
  - Mutation/model regression coverage for defaults, validation, authorization, and lifecycle

affects:
  - 07-03-suggestion-hardening
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - dry-validation contract as the single input boundary for optional preference fields
    - GraphQL mutation payloads filtered to only supplied non-nil keys
    - Host-only authorization with draft/invited lifecycle guard

key-files:
  created:
    - app/contracts/update_session_preferences_contract.rb
    - app/graphql/mutations/update_session_preferences.rb
    - spec/graphql/update_session_preferences_mutation_spec.rb
  modified:
    - app/models/night_session.rb
    - spec/models/night_session_spec.rb
    - app/contracts/create_night_session_contract.rb
    - app/graphql/mutations/create_night_session.rb
    - spec/graphql/create_night_session_mutation_spec.rb
    - app/contracts/schedule_session_contract.rb
    - app/graphql/mutations/schedule_session.rb
    - spec/graphql/schedule_session_mutation_spec.rb
    - app/graphql/types/mutation_type.rb
    - schema.graphql
    - schema.json

key-decisions:
  - "Preference edits are restricted to the session host only (not group admins), per D-06"
  - "Omitted optional inputs retain DB defaults or current values via filtered contract payload, never overwritten with nil"
  - "Complexity preference stays a plain String column validated by contract/model, not a GraphQL enum"

patterns-established:
  - "Optional GraphQL mutation arguments use filtered contract payloads so database defaults remain authoritative"
  - "UpdateSessionPreferencesContract uses a base rule requiring at least one preference key to reject no-op calls"
  - "Preference updates are gated on draft/invited state before any persistence"

requirements-completed:
  - SUGG-02

coverage:
  - id: D1
    description: "NightSession model enforces positive time budget and one of five allowed complexity values"
    requirement: SUGG-02
    verification:
      - kind: unit
        ref: "spec/models/night_session_spec.rb#validates complexity_preference and time_budget_minutes"
        status: pass
    human_judgment: false
  - id: D2
    description: "createNightSession and scheduleSession accept, validate, and persist optional time/complexity preferences while preserving defaults/current values"
    requirement: SUGG-02
    verification:
      - kind: integration
        ref: "spec/graphql/create_night_session_mutation_spec.rb"
        status: pass
      - kind: integration
        ref: "spec/graphql/schedule_session_mutation_spec.rb"
        status: pass
    human_judgment: false
  - id: D3
    description: "updateSessionPreferences allows host-only edits in draft/invited states, rejects empty/invalid/post-picking updates, and leaves stored values unchanged on failure"
    requirement: SUGG-02
    verification:
      - kind: integration
        ref: "spec/graphql/update_session_preferences_mutation_spec.rb"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-07-15
status: complete
---

# Phase 07 Plan 02: Suggestion Engine Backend - Session Preferences

**Host-controlled time/complexity preference inputs for create, schedule, and pre-picking update flows, validated by dry-validation and enforced by model invariants**

## Performance

- **Duration:** 40 min
- **Started:** 2026-07-15T14:10:00Z
- **Completed:** 2026-07-15T14:50:00Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Extended `NightSession` with a frozen `VALID_COMPLEXITY_PREFERENCES` constant and validations for positive time budget and allowed complexity strings.
- Added optional `timeBudgetMinutes` and `complexityPreference` arguments to `createNightSession` and `scheduleSession`, with contract-owned validation and default preservation.
- Implemented a new host-only `updateSessionPreferences` mutation guarded by draft/invited lifecycle state and a contract base rule requiring at least one preference.
- Regenerated `schema.graphql` and `schema.json` so the frontend contract sees the new mutation and arguments.
- Covered all three mutation paths with focused regression tests for success, defaults, partial updates, authorization, validation, and post-picking rejection.

## Task Commits

Each task was committed atomically (TDD tasks include separate test and feat commits):

1. **Task 1: Set validated suggestion preferences when creating a session**
   - `df69aad` (test): add failing tests for create-time preference inputs
   - `1d1e976` (feat): implement create-time preference validation and persistence
2. **Task 2: Set or retain suggestion preferences while scheduling**
   - `6240649` (test): add failing tests for schedule-time preference inputs
   - `b526bb7` (feat): implement schedule-time preference validation and preservation
3. **Task 3: Edit preferences securely before picking starts**
   - `efb8392` (test): add failing tests for updateSessionPreferences mutation
   - `5d36aff` (feat): implement host-only updateSessionPreferences mutation

**Plan metadata:** to be committed after summary

## Files Created/Modified

- `app/models/night_session.rb` - Added `VALID_COMPLEXITY_PREFERENCES` constant and validations for `time_budget_minutes`/`complexity_preference`
- `spec/models/night_session_spec.rb` - Model validation examples for defaults, valid/invalid complexity, and positive time budget
- `app/contracts/create_night_session_contract.rb` - Optional `time_budget_minutes` and `complexity_preference` validation
- `app/graphql/mutations/create_night_session.rb` - Optional GraphQL arguments and filtered contract payload
- `spec/graphql/create_night_session_mutation_spec.rb` - Tests for preference inputs, defaults, and invalid values
- `app/contracts/schedule_session_contract.rb` - Optional `time_budget_minutes` and `complexity_preference` validation
- `app/graphql/mutations/schedule_session.rb` - Optional GraphQL arguments and preference preservation logic
- `spec/graphql/schedule_session_mutation_spec.rb` - Tests for setting/retaining preferences and rejection before invites
- `app/contracts/update_session_preferences_contract.rb` - New contract with base rule requiring at least one preference
- `app/graphql/mutations/update_session_preferences.rb` - New host-only mutation with draft/invited guard
- `app/graphql/types/mutation_type.rb` - Registered `update_session_preferences`
- `spec/graphql/update_session_preferences_mutation_spec.rb` - Full authorization/validation/lifecycle coverage
- `schema.graphql` / `schema.json` - Regenerated schema artifacts

## Decisions Made

- Kept preference edits restricted to the session host, matching D-06; group admins are not given access to these inputs.
- Preserved existing values when optional preference arguments are omitted by filtering the contract payload and only updating supplied keys.
- Left `complexity_preference` as a plain String column and GraphQL argument, validated by contract and model, rather than introducing a GraphQL enum.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All focused specs pass; no new dependencies, authentication gates, or architectural changes were required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 07-02 is complete. Wave 2 (session preferences) is ready for 07-03 (poll helpers, confidence, authorization, and batching hardening).
- The persisted `time_budget_minutes` and `complexity_preference` fields are now editable by the host through picking start, giving the 07-01 engine real session data to rank against.

---
*Phase: 07-suggestion-engine-backend*
*Completed: 2026-07-15*

## Self-Check: PASSED

- All created files exist.
- All task commits (df69aad, 1d1e976, 6240649, b526bb7, efb8392, 5d36aff) exist in git history.
- Focused verification passes: `bundle exec rspec spec/graphql/create_night_session_mutation_spec.rb spec/graphql/schedule_session_mutation_spec.rb spec/graphql/update_session_preferences_mutation_spec.rb spec/models/night_session_spec.rb` (45 examples, 0 failures).
- 07-01 suggestion engine specs remain green (6 examples, 0 failures).
- Unrelated dirty files `.planning/config.json` and `tests/e2e/fixtures/e2e_session.json` remain unmodified and unstaged.
