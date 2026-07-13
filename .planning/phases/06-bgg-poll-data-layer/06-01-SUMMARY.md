---
phase: 06-bgg-poll-data-layer
plan: 01
subsystem: database
tags: [rails, bgg, nokogiri, activerecord, rspec]

requires:
  - phase: 02-bgg-integration-layer-persistence
    provides: BggThing model, Bgg::Normalizer, Bgg::CollectionPersister upsert patterns, existing stevmachine_thing.xml fixture

provides:
  - bgg_polls and bgg_poll_results database tables with unique indexes
  - BggPoll / BggPollResult ActiveRecord models with associations and validations
  - BggThing#bgg_polls association and poll_data_fetched_at / poll_data_error tracking columns
  - Bgg::Normalizer.normalize_polls(item_node) parser for suggested_numplayers poll XML
  - Bgg::PollPersister.persist_from_thing_xml service that upserts poll rows and stamps fetch time

affects:
  - phase: 06-bgg-poll-data-layer (plans 06-02 and 06-03 build on these models)
  - phase: 07-suggestion-engine-backend

tech-stack:
  added: []
  patterns:
    - "Nokogiri CSS selectors with nil-safe access for BGG XML parsing"
    - "ActiveRecord upsert via find_or_initialize_by / find_or_create_by!"
    - "Timestamp-based enrichment tracking to avoid infinite backfill loops"

key-files:
  created:
    - db/migrate/20260714000001_create_bgg_polls_and_results.rb
    - app/models/bgg_poll.rb
    - app/models/bgg_poll_result.rb
    - app/services/bgg/poll_persister.rb
    - spec/models/bgg_poll_spec.rb
    - spec/models/bgg_poll_result_spec.rb
    - spec/services/bgg/poll_persister_spec.rb
  modified:
    - app/models/bgg_thing.rb
    - app/services/bgg/normalizer.rb
    - spec/services/bgg/normalizer_spec.rb

key-decisions:
  - "Schema stores generic poll name so future poll types (e.g., language_dependence) can reuse the same tables; only suggested_numplayers is parsed for v1."
  - "Added nullable level column to bgg_poll_results now to avoid a future migration if other poll types are added."
  - "poll_data_fetched_at is stamped even when a thing has no suggested_numplayers poll, preventing infinite backfill loops."
  - "PollPersister is implemented as class methods (matching the plan's behavior) so callers can invoke Bgg::PollPersister.persist_from_thing_xml directly."
  - "On error, poll_data_fetched_at is still stamped and poll_data_error is set before re-raising, so the job's retry/discard logic handles the failure."

patterns-established:
  - "Bgg::Normalizer.normalize_polls(item_node) returns nil for missing polls rather than an empty hash, keeping the caller's no-poll branch explicit."
  - "Bgg::PollPersister marks a thing as fetched-without-poll when normalize_polls returns nil, satisfying the infinite-backfill avoidance constraint."
  - "upsert BggPollResult rows by (player_count, value) so re-runs do not duplicate votes."

requirements-completed:
  - SUGG-01

coverage:
  - id: D1
    description: "Database migration creates bgg_polls, bgg_poll_results, and poll tracking columns on bgg_things"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "bin/rails db:migrate exits 0 and db/schema.rb contains create_table bgg_polls / bgg_poll_results and t.datetime poll_data_fetched_at"
        status: pass
    human_judgment: false
  - id: D2
    description: "BggPoll, BggPollResult, and BggThing models have correct associations and validations"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "spec/models/bgg_poll_spec.rb, spec/models/bgg_poll_result_spec.rb"
        status: pass
    human_judgment: false
  - id: D3
    description: "Bgg::Normalizer extracts suggested_numplayers poll data from a Nokogiri item node using CSS selectors"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "spec/services/bgg/normalizer_spec.rb describe .normalize_polls"
        status: pass
    human_judgment: false
  - id: D4
    description: "Bgg::PollPersister upserts poll and result rows and stamps poll_data_fetched_at, including for poll-less things"
    requirement: SUGG-01
    verification:
      - kind: unit
        ref: "spec/services/bgg/poll_persister_spec.rb"
        status: pass
    human_judgment: false

# Metrics
duration: 7min
completed: 2026-07-13
status: complete
---

# Phase 06 Plan 01: BGG Poll Data Layer Summary

**Normalized database tables, ActiveRecord models, and a parser/persister pair for BGG `suggested_numplayers` poll data, enabling the Phase 7 suggestion engine to use community best-player-count votes.**

## Performance

- **Duration:** 7min
- **Started:** 2026-07-13T20:50:00Z
- **Completed:** 2026-07-13T20:57:11Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Created `bgg_polls` and `bgg_poll_results` tables with foreign keys, unique indexes, and a nullable `level` column for future poll types.
- Added `poll_data_fetched_at` and `poll_data_error` tracking columns to `bgg_things` with an index.
- Added `BggPoll` and `BggPollResult` models with associations and validations, and `BggThing#has_many :bgg_polls`.
- Extended `Bgg::Normalizer` with `normalize_polls(item_node)` and `parse_player_count` to parse BGG poll XML into structured hashes.
- Implemented `Bgg::PollPersister.persist_from_thing_xml` to upsert poll rows and stamp `poll_data_fetched_at`, even for things with no poll.
- Added model and service specs that are all green against the existing `stevmachine_thing.xml` fixture.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + BggPoll / BggPollResult models + BggThing association** - `c97b00f` (feat)
2. **Task 2: Normalizer.normalize_polls extension + Bgg::PollPersister service** - `8751717` (feat)

## Files Created/Modified

- `db/migrate/20260714000001_create_bgg_polls_and_results.rb` - Migration for poll tables and tracking columns
- `app/models/bgg_poll.rb` - Poll model with belongs_to/has_many and presence validation
- `app/models/bgg_poll_result.rb` - Poll result model with belongs_to and numericality validation
- `app/models/bgg_thing.rb` - Added `has_many :bgg_polls, dependent: :destroy`
- `app/services/bgg/normalizer.rb` - Added `normalize_polls` and `parse_player_count`
- `app/services/bgg/poll_persister.rb` - New service to upsert polls/results and stamp fetch time
- `spec/models/bgg_poll_spec.rb` - Model association/validation specs
- `spec/models/bgg_poll_result_spec.rb` - Model association/validation specs
- `spec/services/bgg/normalizer_spec.rb` - Poll parsing and player-count specs
- `spec/services/bgg/poll_persister_spec.rb` - Persister upsert and timestamp specs

## Decisions Made

- Followed the plan's schema design exactly, including the forward-compatible nullable `level` column on `bgg_poll_results`.
- Kept `Bgg::PollPersister` as class methods rather than instance methods to match the plan's `Bgg::PollPersister.persist_from_thing_xml` behavior.
- Used `find_or_initialize_by` + `save!` for poll results instead of `find_or_create_by!` with a block, so existing rows have their vote counts updated on re-runs.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 06 Plan 02 (BGG client thing caching + enrichment/backfill jobs) can now build on these models and services.
- Phase 07 (suggestion engine) can rely on persisted `bgg_polls` / `bgg_poll_results` rows for best-player-count scoring.

---
*Phase: 06-bgg-poll-data-layer*
*Completed: 2026-07-13*
