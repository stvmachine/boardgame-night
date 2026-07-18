---
phase: 10-picking-a-game-redesign
plan: 02
subsystem: api
status: complete
tags: [graphql, apollo, codegen, vue, typescript]

requires:
  - phase: 10-picking-a-game-redesign
    plan: 01
    provides: Host-only updateSessionDetails mutation and UpdateSessionDetailsContract

provides:
  - Committed schema.graphql/schema.json exposing updateSessionDetails with ordinary inputs only
  - Extended NightSession GraphQL operation selecting preferences and server-ranked suggestions
  - UpdateSessionDetails mutation operation returning a normalized NightSession shape
  - Generated TypeScript types and Vue Apollo composables for both operations

affects:
  - 10-picking-a-game-redesign

tech-stack:
  added: []
  patterns:
    - Source-derived schema/operation/codegen pipeline with byte-stable second-pass checksums
    - Codegen configured to import Vue Composition API from 'vue' for Vue 3 Apollo composables

key-files:
  created:
    - app/frontend/apollo/mutations/update_session_details.graphql
  modified:
    - schema.graphql
    - schema.json
    - app/frontend/apollo/queries/night_session.graphql
    - app/frontend/generated/types.ts
    - app/frontend/generated/operations.ts
    - codegen.ts

key-decisions:
  - Set codegen.ts vueCompositionApiImportFrom to 'vue' so generated operations.ts imports the Composition API from the installed Vue 3 package instead of the missing '@vue/composition-api' dependency

patterns-established:
  - "Details mutation document returns the same normalized NightSession shape as the query so Apollo updates header and shortlist without a parallel store"
  - "Schema dump must precede operation documents; codegen must be byte-stable across a second pass"

requirements-completed:
  - PICK-01
  - PICK-02
  - PICK-03

coverage:
  - id: D1
    description: "Committed schema exposes updateSessionDetails with ordinary inputs only and no preference arguments"
    requirement: PICK-01
    verification:
      - kind: other
        ref: "rg -n 'updateSessionDetails|timeBudgetMinutes|complexityPreference|suggestions' schema.graphql"
        status: pass
    human_judgment: false
  - id: D2
    description: "NightSession query selects timeBudgetMinutes, complexityPreference, and server-ranked suggestions with full thing metadata"
    requirement: PICK-02
    verification:
      - kind: other
        ref: "app/frontend/apollo/queries/night_session.graphql"
        status: pass
    human_judgment: false
  - id: D3
    description: "Generated Vue Apollo composables expose useNightSessionQuery and useUpdateSessionDetailsMutation"
    requirement: PICK-01
    verification:
      - kind: other
        ref: "rg -n 'useNightSessionQuery|useUpdateSessionDetailsMutation' app/frontend/generated/operations.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Schema dump and codegen are reproducible with identical checksums across two passes"
    requirement: PICK-02
    verification:
      - kind: other
        ref: "shasum schema.graphql schema.json app/frontend/generated/types.ts app/frontend/generated/operations.ts before/after second pass"
        status: pass
    human_judgment: false
  - id: D5
    description: "UpdateSessionDetails backend contract remains host-only and lifecycle-safe after schema publication"
    requirement: PICK-03
    verification:
      - kind: unit
        ref: "spec/graphql/update_session_details_mutation_spec.rb (24 examples, 0 failures)"
        status: pass
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-07-18
---

# Phase 10 Plan 02: Publish Details Mutation and Session Apollo Contract Summary

**Published the backend `updateSessionDetails` mutation to the committed GraphQL schema and generated the extended `NightSession` query and details mutation documents so the redesigned Picking screen consumes a single server-ranked Apollo contract per D-07.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-18T06:23:01Z
- **Completed:** 2026-07-18T06:30:18Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Dumped the registered Rails GraphQL schema to `schema.graphql` and `schema.json`, exposing `updateSessionDetails(sessionId, title, description, scheduledAt, location, capacity)` with no preference arguments.
- Extended `app/frontend/apollo/queries/night_session.graphql` with `timeBudgetMinutes`, `complexityPreference`, and `suggestions` (score, confidence, reasons, thing metadata, owners) so Apollo returns the server-ranked shortlist in the main session query.
- Added `app/frontend/apollo/mutations/update_session_details.graphql` returning the same normalized `NightSession` shape, allowing a details save to refresh the header and shortlist without a parallel store.
- Regenerated `app/frontend/generated/types.ts` and `app/frontend/generated/operations.ts` via `npm run codegen`, producing `useNightSessionQuery` and `useUpdateSessionDetailsMutation`.
- Verified a second `bin/rails graphql:schema:dump` + `npm run codegen` pass produces identical checksums for the generated artifacts.
- Ran the Plan 10-01 backend regression suite (`spec/graphql/update_session_details_mutation_spec.rb` and `spec/contracts/update_session_details_contract_spec.rb`) with 24 examples, 0 failures.

## Task Commits

Each task was committed atomically:

1. **Task 1: Dump the registered backend schema** - `65905a4` (chore)
2. **Task 2: Define operations and regenerate typed Vue composables** - `de7079b` (feat)

## Files Created/Modified

- `schema.graphql` - Source-derived SDL now includes `updateSessionDetails` and the `NightSession` preferences/suggestions contract
- `schema.json` - Source-derived JSON schema mirror
- `app/frontend/apollo/queries/night_session.graphql` - Extended with preferences and server-ranked suggestions
- `app/frontend/apollo/mutations/update_session_details.graphql` - New typed mutation document returning a normalized session
- `app/frontend/generated/types.ts` - Regenerated TypeScript schema types
- `app/frontend/generated/operations.ts` - Regenerated `useNightSessionQuery` and `useUpdateSessionDetailsMutation` composables
- `codegen.ts` - Added `vueCompositionApiImportFrom: 'vue'` so generated composables import from the installed Vue 3 package

## Decisions Made
- Set `vueCompositionApiImportFrom: 'vue'` in `codegen.ts` because the default `@vue/composition-api` package is not installed in this Vue 3 project; importing from `vue` keeps the generated operations type-correct without adding a package.
- Followed the plan's strict schema-dump → operation-document → codegen order and required byte-stable second-pass checksums.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Generated operations.ts imported from missing `@vue/composition-api` package**
- **Found during:** Task 2 (codegen verification)
- **Issue:** `typescript-vue-apollo` defaulted to `import * as VueCompositionApi from '@vue/composition-api'`, which is not installed; this would fail the generated-artifact typecheck.
- **Fix:** Added `vueCompositionApiImportFrom: 'vue'` to `codegen.ts` so the generated code imports the Composition API from the installed Vue 3 package.
- **Files modified:** `codegen.ts`
- **Verification:** Regenerated `operations.ts` and confirmed the import is now `import * as VueCompositionApi from 'vue'`.
- **Committed in:** `de7079b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal scope adjustment to the codegen source config; generated artifacts remain source-derived and byte-stable. No behavior change beyond making the generated code type-correct.

## Issues Encountered
- The full-project `vue-tsc --noEmit` command fails with pre-existing TypeScript errors in unrelated files (e.g., `ComplexityToggleGroup.vue`, `TimeBucketCheckboxes.vue`, `GroupMembersPanel.vue`, `RsvpDashboard.vue`, `SessionSummary.vue`, `useAuth.ts`, `CollectionView.vue`, `GroupsView.vue`, `GroupView.vue`, `HealthView.spec.ts`, `InviteView.vue`, and `NightSessionView.vue`). These errors are not introduced by this plan's generated files or operation documents. The generated `operations.ts` and `types.ts` themselves have no internal type errors after the `vueCompositionApiImportFrom` fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The Apollo contract for the redesigned Picking screen is complete: the main session query carries server-ranked suggestions and read-only preferences, and the details mutation refreshes the same normalized shape.
- Next: implement the Picking header, suggestion cards, host-only Edit Details dialog, and pick interaction in Vue components.

## Self-Check: PASSED
- All committed files exist on disk.
- All task commits (`65905a4`, `de7079b`) exist in `git log --oneline -3`.
- Generated artifact checksums are byte-stable across a second schema-dump/codegen pass.
- Backend regression suite for `updateSessionDetails` passes (24 examples, 0 failures).

---
*Phase: 10-picking-a-game-redesign*
*Completed: 2026-07-18*
