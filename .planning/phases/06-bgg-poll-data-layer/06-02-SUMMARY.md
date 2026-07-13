---
phase: 06-bgg-poll-data-layer
plan: 02
subsystem: api
tags: [rails, bgg, solid-queue, caching, rspec]

requires:
  - phase: 06-bgg-poll-data-layer
    provides: BggPoll/BggPollResult models, Bgg::PollPersister, poll_data_fetched_at tracking
  - phase: 02-bgg-integration-layer-persistence
    provides: Bgg::Client, Bgg::RateLimiter, Bgg::CollectionPersister, ImportCollectionJob patterns

provides:
  - Bgg::Client#thing per-thing raw XML caching with 1h TTL and 20-ID batching
  - Bgg::Client#parse_xml XXE hardening via Nokogiri config.nonet
  - Bgg::EnrichThingPollsJob auto-triggers after ImportCollectionJob
  - Bgg::BackfillPollDataJob one-time backfill via find_in_batches(batch_size: 20)
  - bin/rails bgg:backfill_polls rake task

affects:
  - phase: 07-suggestion-engine-backend
  - phase: 06-bgg-poll-data-layer

tech-stack:
  added: []
  patterns:
    - "Per-thing raw XML cache (bgg:thing:{id}) with 1h TTL"
    - "BGG API batching capped at 20 IDs per request"
    - "Nokogiri nonet option for XXE-hardened XML parsing"
    - "Global limits_concurrency to: 1, key: bgg_api for all BGG jobs"

key-files:
  created:
    - app/jobs/bgg/enrich_thing_polls_job.rb
    - app/jobs/bgg/backfill_poll_data_job.rb
    - lib/tasks/bgg_poll_backfill.rake
    - spec/jobs/bgg/enrich_thing_polls_job_spec.rb
    - spec/jobs/bgg/backfill_poll_data_job_spec.rb
  modified:
    - app/services/bgg/client.rb
    - app/jobs/bgg/import_collection_job.rb
    - spec/services/bgg/client_spec.rb
    - spec/jobs/bgg/import_collection_job_spec.rb

key-decisions:
  - "Rescued Bgg::ResourceNotFound at the batch level in both jobs so a single missing batch does not discard the entire job."
  - "Backfill logs missing IDs but leaves poll_data_fetched_at nil, allowing retry on the next backfill run."

patterns-established:
  - "Bgg::Client#thing caches raw XML per thing ID and merges cached + fresh XML into one Nokogiri document."
  - "All BGG jobs use the same concurrency/retry/discard policy block."

requirements-completed:
  - SUGG-01
  - SUGG-05

coverage:
  - id: D1
    description: "Bgg::Client#thing caches raw XML per thing ID with 1h TTL and batches uncached IDs in groups of 20"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "spec/services/bgg/client_spec.rb describe #thing"
        status: pass
    human_judgment: false
  - id: D2
    description: "Bgg::Client#parse_xml uses Nokogiri config.nonet to block XXE/network parsing"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "spec/services/bgg/client_spec.rb describe #parse_xml"
        status: pass
    human_judgment: false
  - id: D3
    description: "Bgg::EnrichThingPollsJob fetches thing details for a user's games missing poll data and only for those with nil poll_data_fetched_at"
    requirement: SUGG-05
    verification:
      - kind: unit
        ref: "spec/jobs/bgg/enrich_thing_polls_job_spec.rb"
        status: pass
    human_judgment: false
  - id: D4
    description: "Bgg::BackfillPollDataJob batch-fetches all BggThing records missing poll data and logs missing IDs without marking them fetched"
    requirement: SUGG-05
    verification:
      - kind: unit
        ref: "spec/jobs/bgg/backfill_poll_data_job_spec.rb"
        status: pass
    human_judgment: false
  - id: D5
    description: "ImportCollectionJob enqueues Bgg::EnrichThingPollsJob before broadcasting READY"
    requirement: SUGG-05
    verification:
      - kind: unit
        ref: "spec/jobs/bgg/import_collection_job_spec.rb enqueues Bgg::EnrichThingPollsJob before broadcasting READY"
        status: pass
    human_judgment: false
  - id: D6
    description: "bin/rails bgg:backfill_polls rake task enqueues BackfillPollDataJob"
    requirement: SUGG-05
    verification:
      - kind: manual_procedural
        ref: "bin/rails -T | grep bgg:backfill_polls"
        status: pass
    human_judgment: false

# Metrics
duration: 8min
completed: 2026-07-13
status: complete
---

# Phase 06 Plan 02: BGG Poll Data Pipeline Summary

**Wired live BGG `/thing` XML fetching to the poll persister with per-thing caching, 20-ID batching, XXE hardening, and two Solid Queue jobs under the global `bgg_api` concurrency lock.**

## Performance

- **Duration:** 8min
- **Started:** 2026-07-13T21:02:12Z
- **Completed:** 2026-07-13T21:10:19Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Rewrote `Bgg::Client#thing` to cache raw XML per thing ID (`bgg:thing:{id}`) with 1h TTL and batch uncached IDs in groups of 20.
- Hardened `Bgg::Client#parse_xml` with `config.nonet` to block external entity network access during parsing.
- Created `Bgg::EnrichThingPollsJob` to auto-fetch poll data for a user's newly imported games.
- Created `Bgg::BackfillPollDataJob` to one-time backfill all `BggThing` records missing poll data.
- Hooked `ImportCollectionJob` to enqueue `EnrichThingPollsJob` immediately before the READY broadcast.
- Added `bin/rails bgg:backfill_polls` rake task to trigger the backfill job.
- Added RSpec coverage for client caching, job behavior, and the enqueue hook.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Bgg::Client#thing tests** - `c219b6a` (test)
2. **Task 1 GREEN: Bgg::Client#thing implementation** - `ba26391` (feat)
3. **Task 2 RED: Enrich/backfill job tests** - `796de5d` (test)
4. **Task 2 GREEN: Enrich/backfill job implementation** - `45a60d6` (feat)
5. **Style fix for rubocop** - `e38c0b3` (style)

## Files Created/Modified

- `app/services/bgg/client.rb` - Per-thing caching, 20-ID batching, XXE-hardened parse_xml
- `app/jobs/bgg/enrich_thing_polls_job.rb` - New Solid Queue job for user-scoped poll enrichment
- `app/jobs/bgg/backfill_poll_data_job.rb` - New Solid Queue job for global backfill
- `app/jobs/bgg/import_collection_job.rb` - Enqueues EnrichThingPollsJob before READY broadcast
- `lib/tasks/bgg_poll_backfill.rake` - Rake task to trigger backfill
- `spec/services/bgg/client_spec.rb` - Tests for #thing caching/batching
- `spec/jobs/bgg/enrich_thing_polls_job_spec.rb` - Tests for enrichment job
- `spec/jobs/bgg/backfill_poll_data_job_spec.rb` - Tests for backfill job
- `spec/jobs/bgg/import_collection_job_spec.rb` - Test for enqueue hook

## Decisions Made

- Kept `Bgg::Client#thing` using `perform_request` (no 202-retry wrapping) per research; revisit only if live backfill shows 202 responses.
- Rescued `Bgg::ResourceNotFound` at the batch level in both jobs so a single missing batch does not discard the entire job.
- Backfill logs missing IDs and leaves `poll_data_fetched_at` nil, allowing retry on the next run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed rubocop whitespace in `Bgg::Client#build_connection`**
- **Found during:** Task 1 verification
- **Issue:** `bundle exec rubocop app/services/bgg/client.rb` failed with `Layout/SpaceInsideArrayLiteralBrackets` on the existing retry_statuses array.
- **Fix:** Added spaces inside brackets (`[ 429, 502, 503 ]`).
- **Files modified:** `app/services/bgg/client.rb`
- **Verification:** `bundle exec rubocop ...` now exits 0
- **Committed in:** `e38c0b3` (style commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** No behavior change; only whitespace required to satisfy the plan's rubocop verification.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 06 Plan 03 (GraphQL poll exposure / PollsLoader) can now read persisted poll data via the models and jobs.
- Phase 07 (suggestion engine) can rely on `bgg_polls` / `bgg_poll_results` being populated by the enrichment and backfill jobs.

---
*Phase: 06-bgg-poll-data-layer*
*Completed: 2026-07-13*

## Self-Check: PASSED

- [x] Created files exist on disk
- [x] All task commits present in git log
- [x] `bundle exec rspec spec/services/bgg/client_spec.rb spec/jobs/bgg/enrich_thing_polls_job_spec.rb spec/jobs/bgg/backfill_poll_data_job_spec.rb spec/jobs/bgg/import_collection_job_spec.rb` exits 0 (51 examples, 0 failures)
- [x] `bin/rails -T | grep "bgg:backfill_polls"` lists the task
- [x] `bundle exec rubocop` for modified files exits 0
- [x] STATE.md and ROADMAP.md updated via gsd-tools state handlers
