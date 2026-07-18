---
phase: 10-picking-a-game-redesign
plan: 01
subsystem: api
tags: [ruby, rails, graphql, dry-validation, rspec]

requires:
  - phase: 04-auth-friend-groups-session-lifecycle
    provides: NightSession model, host authorization, and state machine
  - phase: 07-suggestion-engine-backend
    provides: Locked preference boundary that details mutation must preserve

provides:
  - Host-only updateSessionDetails GraphQL mutation
  - UpdateSessionDetailsContract ordinary-detail validation boundary
  - Focused backend regression suite for authorization and lifecycle invariants

affects:
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - Dry-validation contract with supplied-key semantics to preserve omitted fields
    - GraphQL current_arguments metadata to distinguish omitted args from explicit null
    - Separate ordinary-details mutation that does not accept preference inputs

key-files:
  created:
    - app/contracts/update_session_details_contract.rb
    - app/graphql/mutations/update_session_details.rb
    - spec/contracts/update_session_details_contract_spec.rb
    - spec/graphql/update_session_details_mutation_spec.rb
  modified:
    - app/graphql/types/mutation_type.rb

key-decisions:
  - Used context[:current_arguments].argument_values.key? to preserve omitted fields while allowing explicit null to clear nullable fields
  - Kept timeBudgetMinutes and complexityPreference outside the mutation schema so GraphQL validation rejects them before persistence

patterns-established:
  - "Ordinary details mutation: only title, description, scheduledAt, location, capacity; no state or preference changes"
  - "Supplied-key detection: GraphQL resolver inspects current_arguments to build a filtered contract payload"

requirements-completed:
  - PICK-01

coverage:
  - id: D1
    description: "UpdateSessionDetailsContract validates ordinary session details and rejects no-op payloads"
    requirement: PICK-01
    verification:
      - kind: unit
        ref: "spec/contracts/update_session_details_contract_spec.rb"
        status: pass
    human_judgment: false
  - id: D2
    description: "updateSessionDetails GraphQL mutation is host-only, lifecycle-safe, and preserves locked preferences"
    requirement: PICK-01
    verification:
      - kind: integration
        ref: "spec/graphql/update_session_details_mutation_spec.rb"
        status: pass
    human_judgment: false
  - id: D3
    description: "New and modified Ruby files pass RuboCop linting"
    requirement: PICK-01
    verification:
      - kind: other
        ref: "bundle exec rubocop app/contracts/update_session_details_contract.rb app/graphql/mutations/update_session_details.rb app/graphql/types/mutation_type.rb spec/contracts/update_session_details_contract_spec.rb spec/graphql/update_session_details_mutation_spec.rb"
        status: pass
    human_judgment: false

# Metrics
duration: 3h 55m
completed: 2026-07-18
status: complete
---

# Phase 10 Plan 01: Host-only Ordinary Details Mutation Summary

**Added a narrowly scoped `updateSessionDetails` mutation and dry-validation contract so the redesigned Picking header can edit ordinary session details without bypassing preference locking or the session state machine.**

## Performance

- **Duration:** 3h 55m
- **Started:** 2026-07-17T23:05:03Z
- **Completed:** 2026-07-18T03:00:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Implemented `UpdateSessionDetailsContract` to validate `title`, `description`, `scheduledAt`, `location`, and `capacity` while rejecting no-op payloads and keeping preference keys out of the schema.
- Implemented and registered `updateSessionDetails` on `MutationType` with host-only authorization and a `draft`/`invited`/`picking` state guard.
- Used GraphQL `current_arguments` metadata to preserve omitted fields and allow explicit null to clear nullable fields.
- Added focused contract and GraphQL mutation specs covering authentication, host checks, lifecycle states, field preservation, and rejection of preference arguments.
- Verified all new and modified Ruby files pass RuboCop.

## Task Commits

Each task was committed atomically using TDD-style RED/GREEN commits:

1. **Task 1: Define the ordinary-details validation boundary** - `d0cee60` (test)
2. **Task 1: Implement UpdateSessionDetailsContract** - `c11ef94` (feat)
3. **Task 2: Register and secure updateSessionDetails** - `e4a20e5` (test)
4. **Task 2: Implement and register updateSessionDetails mutation** - `f6fece3` (feat)

## Files Created/Modified

- `app/contracts/update_session_details_contract.rb` - Dry-validation contract for ordinary session details
- `app/graphql/mutations/update_session_details.rb` - Host-only GraphQL mutation for editing details
- `app/graphql/types/mutation_type.rb` - Registered `updateSessionDetails` field
- `spec/contracts/update_session_details_contract_spec.rb` - Contract validation unit tests
- `spec/graphql/update_session_details_mutation_spec.rb` - GraphQL integration regression tests

## Decisions Made
- Used `context[:current_arguments].argument_values.key?` to distinguish omitted arguments from explicitly provided `null` values, preserving the "omitted fields remain unchanged, explicit null clears" contract without sentinel defaults.
- Kept `timeBudgetMinutes` and `complexityPreference` entirely off the mutation schema so GraphQL validation rejects them; the contract never sees them, reinforcing the D-05 preference lock.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend for ordinary details editing is complete and tested.
- Next: extend the frontend session query and wire the Edit Details control in the redesigned Picking surface.

---
*Phase: 10-picking-a-game-redesign*
*Completed: 2026-07-18*
