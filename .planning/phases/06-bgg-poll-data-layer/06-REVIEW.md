---
phase: 06-bgg-poll-data-layer
reviewed: 2026-07-14T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - db/migrate/20260714000001_create_bgg_polls_and_results.rb
  - app/models/bgg_poll.rb
  - app/models/bgg_poll_result.rb
  - app/models/bgg_thing.rb
  - app/services/bgg/poll_persister.rb
  - app/services/bgg/normalizer.rb
  - app/jobs/bgg/enrich_thing_polls_job.rb
  - app/jobs/bgg/backfill_poll_data_job.rb
  - app/jobs/bgg/import_collection_job.rb
  - lib/tasks/bgg_poll_backfill.rake
  - app/services/bgg/client.rb
  - app/graphql/types/poll_type.rb
  - app/graphql/types/poll_result_type.rb
  - app/graphql/loaders/polls_loader.rb
  - app/graphql/types/thing_fields.rb
  - app/graphql/boardgame_night_schema.rb
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-07-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the BGG poll data layer implementation across all three plans: database schema/models, client/jobs/persister pipeline, and GraphQL exposure. The code generally follows the established patterns and the plan's decisions, but two data-loss/correctness issues in `Bgg::PollPersister` need to be fixed before shipping. There are also three maintainability/robustness warnings and two minor test quality notes.

## Critical Issues

### CR-01: PollPersister permanently marks things as fetched on every error

**File:** `app/services/bgg/poll_persister.rb:39-45`
**Severity:** BLOCKER
**Issue:** The rescue block stamps `poll_data_fetched_at` and `poll_data_error` before re-raising. Because both enrichment and backfill jobs scope their work to `where(poll_data_fetched_at: nil)`, a transient failure (e.g., database connection timeout, lock timeout) marks the thing as already processed and it will never be retried, resulting in permanent missing poll data for that game.
**Fix:** Only record the error message in the rescue block; keep `poll_data_fetched_at` nil so the thing stays eligible for retry. Set the success timestamp only on the happy path (which the code already does).

```ruby
rescue StandardError => e
  Rails.logger.error("[Bgg::PollPersister] Failed to persist poll for thing #{thing&.objectid}: #{e.message}")
  thing&.update!(poll_data_error: e.message)
  raise
end
```

### CR-02: Missing `numvotes` in BGG XML causes a NOT NULL constraint violation

**File:** `app/services/bgg/poll_persister.rb:30` and `app/services/bgg/normalizer.rb:85`
**Severity:** BLOCKER
**Issue:** `Bgg::Normalizer.normalize_polls` parses `numvotes` as `vote_node["numvotes"]&.to_i`, which returns `nil` when the attribute is absent. `PollPersister` then assigns that nil to `poll_result.num_votes` and calls `save!`. The model's numericality validator allows `nil` by default, so validation passes, but the database column is `null: false` with a default of `0`, causing a `NOT NULL constraint violation` at insert/update time and leaving the thing marked with an error (compounded by CR-01).
**Fix:** Default to `0` in the normalizer so the parsed data structure is always valid:

```ruby
num_votes: vote_node["numvotes"]&.to_i || 0
```

## Warnings

### WR-01: BggPoll and BggPollResult lack model-level uniqueness validations

**File:** `app/models/bgg_poll.rb:7` and `app/models/bgg_poll_result.rb:6`
**Severity:** WARNING
**Issue:** The database has unique indexes on `bgg_polls(bgg_thing_id, name)` and `bgg_poll_results(bgg_poll_id, player_count, value)`, but the models do not enforce those constraints. Under concurrent imports or backfills, two jobs can race and one will raise `ActiveRecord::RecordNotUnique` instead of a clean validation error.
**Fix:** Add uniqueness validations scoped to the natural keys:

```ruby
# app/models/bgg_poll.rb
validates :name, presence: true, uniqueness: { scope: :bgg_thing_id }

# app/models/bgg_poll_result.rb
validates :value, presence: true, uniqueness: { scope: [:bgg_poll_id, :player_count] }
```

### WR-02: BggPollResult numericality validation allows nil, contradicting the schema

**File:** `app/models/bgg_poll_result.rb:7`
**Severity:** WARNING
**Issue:** `validates :num_votes, numericality: { greater_than_or_equal_to: 0 }` allows `nil` by default, while the migration declares `t.integer :num_votes, null: false, default: 0`. The model and database are inconsistent, which is the root cause of the silent validation pass in CR-02.
**Fix:** Add a presence guard or disallow nil:

```ruby
validates :num_votes, presence: true, numericality: { greater_than_or_equal_to: 0 }
```

### WR-03: Unique index on bgg_poll_results is not forward-compatible with level-based polls

**File:** `db/migrate/20260714000001_create_bgg_polls_and_results.rb:23`
**Severity:** WARNING
**Issue:** The unique index is on `(bgg_poll_id, player_count, value)`. The plan added a nullable `level` column for future poll types (e.g., `language_dependence`) that may use `level` instead of `player_count`. For those polls, `player_count` would be `nil`; SQLite treats `NULL` as distinct in unique indexes, so duplicate `(poll_id, NULL, value)` rows would be allowed, undermining the deduplication the index is meant to provide.
**Fix:** When `level`-based polls are introduced, change the index to a conditional or composite index that includes `level` (e.g., partial unique indexes per poll type, or `COALESCE` wrappers depending on the database target). For v1 this is latent, but it should be tracked because the schema is being advertised as forward-compatible.

## Info

### IN-01: Duplicate `describe "#user"` block in client spec

**File:** `spec/services/bgg/client_spec.rb:291-300`
**Severity:** INFO
**Issue:** The same `describe "#user"` example group is duplicated immediately after an identical block at lines 280-289. This is dead test code that adds noise and can be removed without changing coverage.
**Fix:** Delete the duplicate block at lines 291-300.

### IN-02: Misaligned indentation in import collection job spec

**File:** `spec/jobs/bgg/import_collection_job_spec.rb:143-172`
**Severity:** INFO
**Issue:** The `describe "retry/discard configuration"` block is nested under `describe "#perform"` but its contents are indented inconsistently. This hurts readability and makes the spec structure harder to verify at a glance.
**Fix:** Re-indent the block to match the surrounding `describe`/`context` levels and consider moving it out of `describe "#perform"` if it is meant to be a sibling.

---

_Reviewed: 2026-07-14T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
