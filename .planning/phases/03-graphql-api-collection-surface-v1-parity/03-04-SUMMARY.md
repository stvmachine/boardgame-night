---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 03-04
subsystem: api

tags: [graphql, ruby, vue, bgg, discovery, hot-items, search, username-validation]

requires:
  - phase: 02-bgg-integration-layer
    provides: Bgg::Client, Bgg::Normalizer, rate limiter, retry logic, XML parsing
  - phase: 03-01-graphql-api-foundation
    provides: GraphQL schema, types, Dataloader, dry-rails contracts
  - phase: 03-02-graphql-query-wiring
    provides: Vue router, Apollo client, generated types
  - phase: 03-03-import-sync-api
    provides: MutationType, AppShell, subscription patterns

provides:
  - Discovery GraphQL queries (hotItems, search) and types (HotItemType, SearchResultType, ValidationResultType)
  - BGG search service normalizer (app/services/bgg/search.rb)
  - validateBggUsername mutation and contract
  - Landing page views (HomeView, HotView) and components (HotList, UsernameForm)
  - Frontend GraphQL documents for hotItems, search, and validateBggUsername
  - Updated router and navigation for landing pages

affects:
  - 03-07-collection-view-polish
  - 04-auth-friend-groups

tech-stack:
  added: []
  patterns:
    - "GraphQL orphan types for objects not directly referenced by any field return type"
    - "Bgg:: service objects for XML normalization and API behavior"
    - "Vue <script setup> with typed props from generated Apollo operations"

key-files:
  created:
    - app/services/bgg/search.rb
    - app/graphql/types/hot_item_type.rb
    - app/graphql/types/search_result_type.rb
    - app/graphql/types/validation_result_type.rb
    - app/graphql/mutations/validate_bgg_username.rb
    - app/contracts/validate_bgg_username_contract.rb
    - app/frontend/views/HomeView.vue
    - app/frontend/views/HotView.vue
    - app/frontend/components/landing/HotList.vue
    - app/frontend/components/landing/UsernameForm.vue
    - app/frontend/apollo/queries/hot_items.graphql
    - app/frontend/apollo/queries/search.graphql
    - app/frontend/apollo/mutations/validate_bgg_username.graphql
    - spec/graphql/discovery_query_spec.rb
    - spec/graphql/validate_bgg_username_mutation_spec.rb
  modified:
    - app/graphql/types/query_type.rb
    - app/graphql/types/mutation_type.rb
    - app/graphql/boardgame_night_schema.rb
    - app/frontend/router/index.ts
    - app/frontend/components/layout/AppShell.vue
    - app/frontend/generated/operations.ts
    - app/frontend/generated/types.ts
    - schema.graphql
    - schema.json

key-decisions:
  - "Split discovery types into separate files per Zeitwerk convention (hot_item_type.rb, search_result_type.rb, validation_result_type.rb) instead of a single discovery_types.rb"
  - "Implemented format-only username validation in this plan; BGG existence check is deferred to preserve rate-limit budget for the collection-import flow"

patterns-established:
  - "GraphQL type files mirror the constant name and live directly in app/graphql/types/"
  - "Bgg:: service classes wrap XML endpoints and return normalized hashes"
  - "Vue landing components receive typed GraphQL data via generated composables"

requirements-completed:
  - COLL-11
  - COLL-12
  - GQL-02
  - GQL-05

# coverage: []  # prose-only summary

# duration: 29 min
# completed: 2026-07-07
# status: complete
---

# Phase 3 Plan 4: Landing Page + Discovery Surface Summary

**Discovery GraphQL API (hotItems, search, validateBggUsername) and Vue 3 landing pages (HomeView, HotView) with live username format validation.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-07-07T06:33:05Z
- **Completed:** 2026-07-07T07:02:16Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Added `hotItems` and `search` GraphQL fields backed by `Bgg::Client#hot` and a new `Bgg::Search` normalizer.
- Created `HotItemType`, `SearchResultType`, and `ValidationResultType` GraphQL types.
- Implemented `validateBggUsername` mutation with a `ValidateBggUsernameContract` format rule.
- Built `HomeView` with a `UsernameForm` that validates BGG username format via GraphQL.
- Built `HotView` and `HotList` to display BGG hot board games.
- Added `/`, `/hot`, `/collection`, and `/health` routes and updated `AppShell` navigation.
- Regenerated `schema.graphql`, `schema.json`, and frontend Apollo types.

## Task Commits

1. **Task 1 (RED):** `test(03-04): add failing specs for hotItems, search, and ValidationResult types` - `4635707`
2. **Task 1 (GREEN):** `feat(03-04): implement hotItems, search GraphQL fields and Bgg::Search service` - `ec105c1`
3. **Task 2:** `feat(03-04): add landing page, validateBggUsername mutation, and BGG search` - `fe672ad`

## Files Created/Modified
- `app/services/bgg/search.rb` - Normalizes BGG `/search` XML into typed hashes.
- `app/graphql/types/hot_item_type.rb` - GraphQL type for a BGG hot item.
- `app/graphql/types/search_result_type.rb` - GraphQL type for a BGG search result.
- `app/graphql/types/validation_result_type.rb` - GraphQL type for username validation result.
- `app/graphql/types/query_type.rb` - Added `hotItems` and `search` fields.
- `app/graphql/boardgame_night_schema.rb` - Registered discovery types as orphan types.
- `app/graphql/mutations/validate_bgg_username.rb` - Mutation that validates username format.
- `app/contracts/validate_bgg_username_contract.rb` - dry-validation contract for username format.
- `app/frontend/views/HomeView.vue` - Landing page with title, description, and username form.
- `app/frontend/views/HotView.vue` - Hot games page shell.
- `app/frontend/components/landing/HotList.vue` - Lists hot game cards with thumbnails and links.
- `app/frontend/components/landing/UsernameForm.vue` - Input with debounced validation and status chips.
- `app/frontend/apollo/queries/hot_items.graphql` - Frontend query for `hotItems`.
- `app/frontend/apollo/queries/search.graphql` - Frontend query for `search`.
- `app/frontend/apollo/mutations/validate_bgg_username.graphql` - Frontend mutation for `validateBggUsername`.
- `app/frontend/router/index.ts` - Added landing and hot routes.
- `app/frontend/components/layout/AppShell.vue` - Added Home/Collection/Hot navigation links.
- `app/frontend/generated/operations.ts` and `app/frontend/generated/types.ts` - Regenerated Apollo types.
- `schema.graphql` and `schema.json` - Regenerated schema dumps.
- `spec/graphql/discovery_query_spec.rb` - Tests for discovery queries.
- `spec/graphql/validate_bgg_username_mutation_spec.rb` - Tests for username validation mutation.

## Decisions Made
- **Split discovery types into separate files.** A single `discovery_types.rb` would violate Zeitwerk (file `discovery_types.rb` cannot define `Types::HotItemType`). Placed each type in its own file under `app/graphql/types/`.
- **Format-only username validation.** The mutation validates format (3-20 chars, letters/digits/underscores, starts with letter, no `__`). It does not call the BGG API to confirm existence, preserving the rate-limit budget and matching the implementation instructions in the plan. This leaves a known stub/limitation documented below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Zeitwerk filename mismatch for discovery types**
- **Found during:** Task 1 (creating GraphQL types)
- **Issue:** `app/graphql/types/discovery_types.rb` defining `Types::HotItemType`, `Types::SearchResultType`, etc. causes `NameError` because Rails expects `hot_item_type.rb` to define `HotItemType`.
- **Fix:** Split into `hot_item_type.rb`, `search_result_type.rb`, and `validation_result_type.rb`.
- **Files modified:** `app/graphql/types/hot_item_type.rb`, `app/graphql/types/search_result_type.rb`, `app/graphql/types/validation_result_type.rb`
- **Verification:** Rails boots and GraphQL schema loads without `NameError`.
- **Committed in:** `ec105c1` (Task 1 GREEN commit)

**2. [Rule 1 - Bug] Test asserted non-existent schema introspection for ValidationResult**
- **Found during:** Task 1 (writing tests before ValidationResult was used by a mutation)
- **Issue:** Schema introspection test for `ValidationResult` passed before the type was reachable from the query root, producing a false positive; after separating files, the type did not appear in `schema.graphql` at all.
- **Fix:** Updated the test to verify the `ValidationResultType` class directly and added an assertion that the type is registered as an orphan type in the schema.
- **Files modified:** `spec/graphql/discovery_query_spec.rb`
- **Verification:** `bundle exec rspec spec/graphql/discovery_query_spec.rb` passes.
- **Committed in:** `ec105c1` (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for correctness and the build to pass. No scope creep.

## Issues Encountered
- `rspec -x` flag (used in the plan's verification command) is not supported by RSpec 8.0.4; used the default RSpec invocation without `-x` and tests passed.
- Two pre-existing `vue-tsc --noEmit` errors remain unrelated to this plan (missing `@vue/composition-api` in generated operations and a Vitest `DeepMockProxy` type issue in `HealthView.spec.ts`). They were present before this plan and are deferred.
- `npm run typecheck` (vue-tsc) fails due to the above pre-existing issues; `npm run build` and `npm run test` pass.

## Known Stubs

| File | Line | Stub | Reason / Resolution |
|------|------|------|---------------------|
| `app/graphql/mutations/validate_bgg_username.rb` | 15 | Returns `valid: true` based only on format validation; does not confirm the username exists on BGG. | Plan explicitly scoped to format validation. BGG existence check will be added when the import flow needs to reject non-existent usernames before triggering Solid Queue jobs. |
| `app/frontend/components/landing/UsernameForm.vue` | ~20 | `found` status message is "[username] looks valid" without an external BGG check. | Tied to the mutation above; will be updated to "found on BGG" when existence check is implemented. |

## User Setup Required
None - no external service configuration required beyond the existing `.env.bggeek` BGG credentials.

## Next Phase Readiness
- Discovery API and landing pages are complete.
- The username validation mutation is in place; extending it to call BGG should be done before or as part of the collection import UX in 03-07 or Phase 4.
- Pre-existing `vue-tsc` errors should be resolved before the 03-07 e2e test workstream.

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-07*

## Self-Check: PASSED

- All created implementation files exist on disk.
- All task commits exist in git history: `4635707`, `ec105c1`, `fe672ad`.
- SUMMARY.md exists at `.planning/phases/03-graphql-api-collection-surface-v1-parity/03-04-SUMMARY.md`.
