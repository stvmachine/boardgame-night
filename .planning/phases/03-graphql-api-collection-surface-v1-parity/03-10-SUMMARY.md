---
phase: 03-graphql-api-collection-surface-v1-parity
plan: 10
subsystem: api
tags: [rails, graphql, bgg, cache, solid-cable, rspec]

requires:
  - phase: 03-graphql-api-collection-surface-v1-parity
    provides: GraphQL collection surface, ImportCollectionJob, Bgg::Client, UserType sync status

provides:
  - 15-minute per-username cooldown enforcement in importCollection mutation
  - Persisted last_synced_at on User updated by ImportCollectionJob
  - Stale-while-revalidate Rails.cache wrapper for Bgg::Client#collection
  - Bgg::* error-class alignment in ImportCollectionJob retry/discard declarations (CR-01)
  - Persisted last_synced_at surfaced in UserType and mergedCollection sync status

affects:
  - 03-11 (frontend RefreshButton wiring)

tech-stack:
  added: []
  patterns:
    - "Mutation-side cooldown guard before enqueueing background jobs"
    - "Rails.cache.fetch with stale-while-revalidate rescue for external API calls"
    - "Bgg wrapper error classes as the single retry/discard boundary for BGG jobs"

key-files:
  created:
    - db/migrate/20260708000001_add_last_synced_at_to_users.rb
  modified:
    - db/schema.rb
    - app/graphql/mutations/import_collection.rb
    - app/jobs/bgg/import_collection_job.rb
    - app/services/bgg/client.rb
    - app/graphql/types/user_type.rb
    - app/graphql/types/query_type.rb
    - spec/graphql/import_collection_mutation_spec.rb
    - spec/jobs/bgg/import_collection_job_spec.rb
    - spec/services/bgg/client_spec.rb
    - spec/graphql/merged_collection_query_spec.rb

key-decisions:
  - "Cache the raw XML string rather than the Nokogiri document because Nokogiri::XML::Document is not Marshal-serializable, which is required by Rails.cache."
  - "Update QueryType#sync_status_for to read user.last_synced_at as well as UserType#sync_status, because the mergedCollection query returns sync statuses independently of UserType."

patterns-established:
  - "Bgg::Client endpoint methods that hit the network should wrap fetch/parse in Rails.cache with explicit stale-cache fallback."
  - "Job retry/discard declarations must consume the Bgg wrapper errors actually raised by Bgg::Client, not the underlying Faraday classes."

requirements-completed:
  - COLL-18

coverage:
  - id: D1
    description: "importCollection mutation rejects re-imports within a 15-minute cooldown window"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/graphql/import_collection_mutation_spec.rb#rejects a re-import within the 15-minute cooldown window"
        status: pass
    human_judgment: false
  - id: D2
    description: "importCollection mutation allows imports when last sync was more than 15 minutes ago or nil"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/graphql/import_collection_mutation_spec.rb#allows import when the last sync was more than 15 minutes ago"
        status: pass
      - kind: unit
        ref: "spec/graphql/import_collection_mutation_spec.rb#allows import when the user has never been synced"
        status: pass
    human_judgment: false
  - id: D3
    description: "ImportCollectionJob updates user.last_synced_at on successful completion"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/jobs/bgg/import_collection_job_spec.rb#updates user.last_synced_at after a successful import"
        status: pass
    human_judgment: false
  - id: D4
    description: "ImportCollectionJob retry/discard declarations use Bgg::* error classes (CR-01)"
    verification:
      - kind: unit
        ref: "spec/jobs/bgg/import_collection_job_spec.rb#retry/discard configuration"
        status: pass
    human_judgment: false
  - id: D5
    description: "UserType and mergedCollection sync status read persisted user.last_synced_at"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/graphql/merged_collection_query_spec.rb#returns the user's persisted last_synced_at in sync status"
        status: pass
    human_judgment: false
  - id: D6
    description: "Bgg::Client#collection caches collection responses and returns stale cache on network failure"
    requirement: COLL-18
    verification:
      - kind: unit
        ref: "spec/services/bgg/client_spec.rb#caches the collection response and returns the cached doc on the next call"
        status: pass
      - kind: unit
        ref: "spec/services/bgg/client_spec.rb#returns stale cache when the network request fails"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-07-08
status: complete
---

# Phase 03 Plan 10: Cooldown, last_synced_at persistence, and CR-01 alignment

**Enforces a 15-minute BGG collection import cooldown, persists `last_synced_at` on users, caches BGG collection responses with stale-while-revalidate, and aligns job retry/discard declarations with Bgg wrapper errors.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-08T01:48:56Z
- **Completed:** 2026-07-08T02:07:46Z
- **Tasks:** 1
- **Files modified:** 10

## Accomplishments
- Added `last_synced_at` datetime column to `users` via migration and applied it.
- Enforced a 15-minute per-username cooldown in the `importCollection` mutation.
- Updated `Bgg::ImportCollectionJob` to persist `user.last_synced_at` on successful imports.
- Replaced raw Faraday error classes with `Bgg::*` wrapper classes in `ImportCollectionJob` retry/discard declarations (CR-01).
- Updated `UserType` and `QueryType` sync status resolvers to return the persisted `last_synced_at` value.
- Wrapped `Bgg::Client#collection` in `Rails.cache.fetch` with a 30-minute TTL and stale-while-revalidate fallback on network failure.

## Task Commits

Each task was committed atomically:

1. **Task 1: last_synced_at migration + cooldown + cache + CR-01 alignment (RED)** - `782d250` (test)
2. **Task 1: last_synced_at migration + cooldown + cache + CR-01 alignment (GREEN)** - `cc202aa` (feat)

**Plan metadata:** `cc202aa` (docs: complete plan)

## Files Created/Modified
- `db/migrate/20260708000001_add_last_synced_at_to_users.rb` - Migration adding `last_synced_at` to users
- `db/schema.rb` - Updated schema with new `last_synced_at` column
- `app/graphql/mutations/import_collection.rb` - 15-minute cooldown check before enqueueing job
- `app/jobs/bgg/import_collection_job.rb` - Persist `last_synced_at` and use Bgg::* error classes for retry/discard
- `app/services/bgg/client.rb` - Cache collection responses with stale-while-revalidate
- `app/graphql/types/user_type.rb` - Read persisted `last_synced_at` in sync status
- `app/graphql/types/query_type.rb` - Read persisted `last_synced_at` in mergedCollection sync status
- `spec/graphql/import_collection_mutation_spec.rb` - Cooldown tests
- `spec/jobs/bgg/import_collection_job_spec.rb` - `last_synced_at` and error-class tests
- `spec/services/bgg/client_spec.rb` - Collection caching and stale-on-failure tests
- `spec/graphql/merged_collection_query_spec.rb` - Persisted `last_synced_at` in sync status test

## Decisions Made
- Cache the raw XML string in `Rails.cache` rather than the Nokogiri document, because `Nokogiri::XML::Document` is not `Marshal`-serializable and `Rails.cache` requires serializable values.
- Updated `QueryType#sync_status_for` in addition to `UserType#sync_status`, because the `mergedCollection` query builds its own sync status payload and the pre-written spec expected the persisted timestamp there too.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Nokogiri::XML::Document is not Marshal-serializable**
- **Found during:** Task 1 (Bgg::Client#collection caching implementation)
- **Issue:** The plan stated that `Rails.cache` should store the `Nokogiri::XML::Document` because it is serializable via Marshal, but the test failed with `TypeError: no _dump_data is defined for class Nokogiri::XML::Document` when writing the cached document.
- **Fix:** Changed the cache to store the raw XML string (`doc.to_xml`) and parse it back into a `Nokogiri::XML::Document` on read. Updated the stale-cache test to write the XML string instead of a document.
- **Files modified:** `app/services/bgg/client.rb`, `spec/services/bgg/client_spec.rb`
- **Verification:** `bundle exec rspec spec/services/bgg/client_spec.rb` passes
- **Committed in:** `cc202aa` (Task 1 commit)

**2. [Rule 1 - Bug] ImportCollectionJob last_synced_at test assumed user existed before job**
- **Found during:** Task 1 (ImportCollectionJob verification)
- **Issue:** The pre-written test `updates user.last_synced_at after a successful import` used `expect { job.perform(username) }.to change { User.find_by!(bgg_username: username).last_synced_at }`, which raised `ActiveRecord::RecordNotFound` because the user did not exist before the job ran.
- **Fix:** Created the user before the expectation in the spec so the `change` block can evaluate before and after the job.
- **Files modified:** `spec/jobs/bgg/import_collection_job_spec.rb`
- **Verification:** `bundle exec rspec spec/jobs/bgg/import_collection_job_spec.rb` passes
- **Committed in:** `782d250` (Task 1 test commit)

**3. [Rule 2 - Missing Critical] QueryType#sync_status_for still returned Time.current**
- **Found during:** Task 1 (full backend suite verification)
- **Issue:** The plan only specified updating `UserType#sync_status`, but the pre-written `mergedCollection` spec expected the persisted `last_synced_at` from `QueryType#sync_status_for`. The full backend suite failed because `QueryType#sync_status_for` returned `Time.current` for all READY users.
- **Fix:** Updated `QueryType#sync_status_for` to read `user.last_synced_at` instead of `Time.current`.
- **Files modified:** `app/graphql/types/query_type.rb`
- **Verification:** `bundle exec rspec spec/graphql/merged_collection_query_spec.rb` and full suite pass
- **Committed in:** `cc202aa` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 test bug, 1 missing critical)
**Impact on plan:** All auto-fixes were necessary for correctness and test passage. No scope creep.

## Issues Encountered
- The `Bgg::ImportCollectionJob` broadcast tests failed initially because the Solid Cable schema (`db/cable_schema.rb`) had been emptied and the `solid_cable_messages` table did not exist in the test database. Running `bin/rails solid_cable:install` regenerated the schema and restoring the original `config/cable.yml` allowed `bin/rails db:test:prepare` to set up the cable database, after which the job suite passed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend cooldown, caching, and CR-01 alignment are complete and tested.
- Plan 03-11 (frontend RefreshButton, useRefreshCollection, and Sidebar wiring) can proceed; it depends on this backend surface.

## Self-Check: PASSED
- [x] Migration file exists: `db/migrate/20260708000001_add_last_synced_at_to_users.rb`
- [x] Schema reflects `last_synced_at` column in `users` table
- [x] All 124 backend specs pass
- [x] `bin/rails graphql:schema:dump` produces no unexpected schema changes
- [x] Task commits exist: `782d250` (test), `cc202aa` (feat)

---
*Phase: 03-graphql-api-collection-surface-v1-parity*
*Completed: 2026-07-08*
