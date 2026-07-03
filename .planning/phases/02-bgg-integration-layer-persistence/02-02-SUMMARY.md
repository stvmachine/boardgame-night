---
phase: 02-bgg-integration-layer-persistence
plan: 02
type: execute
status: complete
subsystem: Persistence
tags: [migrations, models, activerecord, persistence, bgg-collections]
requires: [02-01]
provides: [User model, BggThing model, BggCollection model, Bgg::CollectionPersister, BggThing.merged_for_users scope]
affects: [db/migrate, app/models, app/services/bgg, db/schema.rb]
tech-stack:
  added:
    - library: shoulda-matchers
      version: "~> 6.4"
      purpose: One-liner model validation/association matchers for RSpec
  patterns:
    - Composite unique index on (user_id, bgg_thing_id) for collection idempotency
    - Upsert pattern via find_or_initialize_by + assign_attributes for BggThing deduplication
    - Transactional fetch → normalize → persist pipeline
    - Injectable Bgg::Client for test isolation (instance_double)
    - has_secure_password for User auth (active but passwords optional for provisional users)
key-files:
  created:
    - db/migrate/20260703000000_create_users.rb
    - db/migrate/20260703000001_create_bgg_things.rb
    - db/migrate/20260703000002_create_bgg_collections.rb
    - app/models/user.rb
    - app/models/bgg_thing.rb
    - app/models/bgg_collection.rb
    - app/services/bgg/collection_persister.rb
    - spec/models/user_spec.rb
    - spec/models/bgg_thing_spec.rb
    - spec/models/bgg_collection_spec.rb
    - spec/services/bgg/collection_persister_spec.rb
    - db/schema.rb
  modified:
    - Gemfile (added shoulda-matchers)
    - Gemfile.lock
    - spec/rails_helper.rb (added Shoulda::Matchers configuration)
decisions:
  - Migration 1 includes email, password_digest, bgg_username from the start (not deferred to Phase 4) — more practical than incrementally adding columns later
  - User model has has_secure_password from the start; specs provide password for create, CollectionPersister sets password_digest for provisional profiles
  - CollectionPersister uses Normalizer's :id key (not :objectid) — matches existing Normalizer output shape
  - No expansion filtering in CollectionPersister — D-10 filtering happens upstream at API level in CollectionFetcher (Plan 03)
  - BggThing.merged_for_users returns DISTINCT things via SQL — deduplication is database-level, not application-level
  - shoulda-matchers added for model spec conventions (validate_presence_of, validate_uniqueness_of, have_many, belong_to)
metrics:
  tasks-completed: 3
  total-tasks: 3
  tests-passed: 59 (all suite)
  new-tests: 22
  duration: ~12m
  completed-date: 2026-07-03
---

# Phase 02 Plan 02: Migrations, Models, and CollectionPersister Summary

Created the database persistence layer for BGG data: three migrations (users, bgg_things, bgg_collections), ActiveRecord models with validations and the merged_for_users scope, and the Bgg::CollectionPersister service that maps normalized hashes to database records via upsert.

## Tasks Completed

### Task 1: Create database migrations
- **Commit:** 82e762a
- **Files:** `db/migrate/20260703000000_create_users.rb`, `db/migrate/20260703000001_create_bgg_things.rb`, `db/migrate/20260703000002_create_bgg_collections.rb`, `db/schema.rb`
- Users table: username (unique), email (unique), password_digest, bgg_username
- BggThings table: objectid (unique index), name (indexed), player/playtime data, media fields
- BggCollections table: user_id FK, bgg_thing_id FK, quantity (default 1), composite unique index on (user_id, bgg_thing_id)
- All three migrations applied cleanly to development database
- Added shoulda-matchers gem for model test support

### Task 2: Create ActiveRecord models with scopes and specs
- **Commit:** b8358e7
- **Files:** `app/models/user.rb`, `app/models/bgg_thing.rb`, `app/models/bgg_collection.rb`, `spec/models/user_spec.rb`, `spec/models/bgg_thing_spec.rb`, `spec/models/bgg_collection_spec.rb`, `spec/rails_helper.rb`
- **User:** `has_secure_password`, `has_many :bgg_collections` / `has_many :bgg_things through`, validates username presence+uniqueness, email uniqueness (allow_nil)
- **BggThing:** validates objectid uniqueness + name presence, `merged_for_users(user_ids)` scope returns distinct things via INNER JOIN, `with_owner_names` scope for frontend display (GROUP_CONCAT)
- **BggCollection:** validates composite uniqueness (user_id scoped to bgg_thing_id) + quantity ≥ 1
- 17 model specs all passing

### Task 3: Create Bgg::CollectionPersister with fetch-and-persist pipeline
- **Commit:** 8e4d356
- **Files:** `app/services/bgg/collection_persister.rb`, `spec/services/bgg/collection_persister_spec.rb`
- Injectable `Bgg::Client` (via constructor) for test isolation — `instance_double` replaces live HTTP calls
- `fetch_and_persist!`: full pipeline — BGG client → Normalizer → persistence, raises ArgumentError if user has no bgg_username
- `persist_collection!`: upserts BggThing by `:id` key (matching Normalizer output) via `find_or_initialize_by` + `assign_attributes`, creates BggCollection entries via `find_or_create_by!`
- Returns `{ added:, updated:, errors: }` result hash for caller introspection
- Persists all items (boardgames + expansions) — expansion filtering is handled by CollectionFetcher in Plan 03
- 5 service specs all passing

## Test Results

```
59 examples, 0 failures
```

All 59 tests pass including 37 pre-existing tests from Plan 01 (BGG client, rate limiter, normalizer), 4 pre-existing GraphQL schema/request tests, and 22 new tests (17 model + 5 service).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed key mismatch between Normalizer and CollectionPersister**
- **Found during:** Task 3 (code analysis before writing CollectionPersister)
- **Issue:** The user-provided CollectionPersister code used `item[:objectid]` for upsert lookups, but Bgg::Normalizer outputs collection items with key `:id` (from `item["objectid"].to_i`). Using `item[:objectid]` would be nil, causing `find_or_initialize_by(objectid: nil)` — a logic error.
- **Fix:** Changed `item[:objectid]` → `item[:id]` in both `upsert_thing!` and the error hash in `persist_collection!`, matching the Normalizer's actual output key.
- **Files modified:** `app/services/bgg/collection_persister.rb`

**2. [Rule 1 - Bug] Updated model spec test expectations to match fixture data**
- **Found during:** Task 3 (running tests after creating specs)
- **Issue:** The user-provided spec expected game names ("Azul", "Terraforming Mars") that don't exist in the `stevmachine_collection.xml` fixture. The fixture contains Gloomhaven, Ticket to Ride, and Gloomhaven: Forgotten Circles.
- **Fix:** Changed test expectations to match actual fixture data. Changed the "persists only boardgames" test to "persists all collection items" since expansion filtering is handled by CollectionFetcher (Plan 03). Used fixture objectid (174430) for the upsert test instead of fictional objectid 1.
- **Files modified:** `spec/services/bgg/collection_persister_spec.rb`

**3. [Rule 1 - Bug] Fixed `has_secure_password` requiring password on create in specs**
- **Found during:** Task 2 (running model specs)
- **Issue:** `has_secure_password` validates password presence when `password_digest` is nil (new record). User model specs called `User.create!(username: "alice")` without a password, causing `Password can't be blank` validation errors.
- **Fix:** Added `password: "password"` to all `User.create!` calls in model specs and collection_persister_spec.rb.
- **Files modified:** `spec/models/bgg_thing_spec.rb`, `spec/services/bgg/collection_persister_spec.rb`

**4. [Rule 1 - Bug] Fixed BggCollection uniqueness matcher lacking required associated records**
- **Found during:** Task 2 (running model specs)
- **Issue:** `subject { BggCollection.new }` for the uniqueness matcher couldn't create a valid existing record because `bgg_thing_id` is NOT NULL. The matcher raised `SQLite3::ConstraintException`.
- **Fix:** Added `let(:user)` and `let(:thing)` with valid records, changed subject to `BggCollection.new(user: user, bgg_thing: thing)`.
- **Files modified:** `spec/models/bgg_collection_spec.rb`

## Known Stubs

None. All models have full validation, association, and scope definitions. CollectionPersister is fully wired with injectable dependencies and real data flow.

## Threat Flags

None. The CollectionPersister writes to database tables created in this plan, all protected by ActiveRecord validations and database-level constraints (unique indexes, NOT NULL, foreign keys).

## Self-Check: PASSED

All created files verified on disk, all commits confirmed in git log.
