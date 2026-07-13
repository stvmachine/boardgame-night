---
phase: 06-bgg-poll-data-layer
verified: 2026-07-14T07:30:00Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
overrides_applied: 0
overrides: []
gaps: []
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 6: BGG Poll Data Layer Verification Report

**Phase Goal:** BGG player-count poll data is parsed, persisted, and backfilled so the suggestion engine can use it.

**Verified:** 2026-07-14T07:30:00Z

**Status:** `passed`

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Migration creates `bgg_polls`, `bgg_poll_results`, and tracking columns on `bgg_things` | ✓ VERIFIED | `db/migrate/20260714000001_create_bgg_polls_and_results.rb` exists; `db/schema.rb` contains `create_table "bgg_polls"`, `create_table "bgg_poll_results"`, `t.datetime "poll_data_fetched_at"`, `t.text "poll_data_error"` |
| 2 | `BggPoll`/`BggPollResult`/`BggThing` models have correct associations and validations | ✓ VERIFIED | `app/models/bgg_poll.rb`, `app/models/bgg_poll_result.rb`, `app/models/bgg_thing.rb` contain the associations/validations; `spec/models/bgg_poll_spec.rb`, `spec/models/bgg_poll_result_spec.rb` pass |
| 3 | `Bgg::Normalizer.normalize_polls` parses `suggested_numplayers` poll from Nokogiri XML | ✓ VERIFIED | `app/services/bgg/normalizer.rb` lines 71-97; `spec/services/bgg/normalizer_spec.rb` describe `.normalize_polls` passes |
| 4 | `Bgg::PollPersister` upserts poll/result rows and stamps `poll_data_fetched_at` for all things, including no-poll | ✓ VERIFIED | `app/services/bgg/poll_persister.rb` lines 5-53; `spec/services/bgg/poll_persister_spec.rb` passes all 4 examples (with-poll, no-poll, upsert, timestamp) |
| 5 | `Bgg::Client#thing` caches per-thing XML with 1h TTL and batches uncached IDs in groups of 20 | ✓ VERIFIED | `app/services/bgg/client.rb` lines 32-59; `spec/services/bgg/client_spec.rb` describe `#thing` passes (25 IDs → 2 BGG calls, 2nd call 0 BGG calls) |
| 6 | `Bgg::Client#parse_xml` uses Nokogiri `strict` + `nonet` options | ✓ VERIFIED | `app/services/bgg/client.rb` line 112; `spec/services/bgg/client_spec.rb` parse_xml tests pass |
| 7 | `Bgg::EnrichThingPollsJob` has `bgg_api` concurrency, retry/discard config, and only enriches nil records | ✓ VERIFIED | `app/jobs/bgg/enrich_thing_polls_job.rb` lines 5-14; `spec/jobs/bgg/enrich_thing_polls_job_spec.rb` passes |
| 8 | `Bgg::BackfillPollDataJob` has `bgg_api` concurrency, retry/discard config, batches records, and logs missing IDs | ✓ VERIFIED | `app/jobs/bgg/backfill_poll_data_job.rb` lines 5-39; `spec/jobs/bgg/backfill_poll_data_job_spec.rb` passes (missing ID remains nil) |
| 9 | `Bgg::ImportCollectionJob` enqueues `EnrichThingPollsJob` before the READY broadcast | ✓ VERIFIED | `app/jobs/bgg/import_collection_job.rb` line 63 before line 65; `spec/jobs/bgg/import_collection_job_spec.rb` passes |
| 10 | `bin/rails bgg:backfill_polls` rake task enqueues `BackfillPollDataJob` | ✓ VERIFIED | `lib/tasks/bgg_poll_backfill.rake` exists; `bin/rails -T | grep bgg:backfill_polls` lists it |
| 11 | GraphQL `PollType`/`PollResultType` and `PollsLoader` expose poll data with no N+1 | ✓ VERIFIED | `app/graphql/types/poll_type.rb`, `app/graphql/types/poll_result_type.rb`, `app/graphql/loaders/polls_loader.rb`; `spec/graphql/loaders/polls_loader_spec.rb` and `spec/graphql/types/poll_type_spec.rb` pass |
| 12 | `ThingFields` exposes `polls` and `bestPlayerCount` on `MergedThingType` and the schema is regenerated | ✓ VERIFIED | `app/graphql/types/thing_fields.rb` includes fields; `schema.graphql` contains `type Poll`, `type PollResult`, `bestPlayerCount: Int`, `polls: [Poll!]!` on `MergedThing`; `app/frontend/generated/types.ts` exports `Poll`/`PollResult`; `spec/graphql/thing_fields_poll_query_spec.rb` passes |

**Score:** 12/12 truths verified (0 behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `db/migrate/20260714000001_create_bgg_polls_and_results.rb` | Poll tables + tracking columns | ✓ VERIFIED | Exists, `db/schema.rb` reflects it, migration applied |
| `app/models/bgg_poll.rb` | AR model with associations/validations | ✓ VERIFIED | Exists, belongs_to/has_many, presence validation |
| `app/models/bgg_poll_result.rb` | AR model with associations/validations | ✓ VERIFIED | Exists, belongs_to, numericality validation |
| `app/services/bgg/poll_persister.rb` | Upsert poll/result rows + timestamp | ✓ VERIFIED | Exists, class methods, handles no-poll and errors |
| `app/services/bgg/client.rb` | Client#thing caching/batching + nonet parse | ✓ VERIFIED | Modified, each_slice(20), thing_cache_key, merge_item_xmls, parse_xml nonet |
| `app/jobs/bgg/enrich_thing_polls_job.rb` | Auto-enrichment job | ✓ VERIFIED | Exists, limits_concurrency, retry/discard, nil-filter |
| `app/jobs/bgg/backfill_poll_data_job.rb` | One-time backfill job | ✓ VERIFIED | Exists, find_in_batches(20), missing-ID logging |
| `lib/tasks/bgg_poll_backfill.rake` | Rake task to trigger backfill | ✓ VERIFIED | Exists, `bgg:backfill_polls` enqueues BackfillPollDataJob |
| `app/graphql/types/poll_type.rb` | GraphQL Poll type | ✓ VERIFIED | Exists, fields id/name/title/totalVotes/results |
| `app/graphql/types/poll_result_type.rb` | GraphQL PollResult type | ✓ VERIFIED | Exists, fields id/playerCount/value/numVotes |
| `app/graphql/loaders/polls_loader.rb` | Dataloader batch loader | ✓ VERIFIED | Exists, single where + includes(:bgg_poll_results) |
| `app/graphql/types/thing_fields.rb` | Shared concern with polls/bestPlayerCount | ✓ VERIFIED | Modified, includes PollsLoader + best-player-count logic |
| `schema.graphql` | Regenerated IDL with Poll/PollResult | ✓ VERIFIED | Dumped, contains types and fields on MergedThing |
| `app/frontend/generated/types.ts` | Regenerated TS types | ✓ VERIFIED | Contains `export type Poll` and `export type PollResult` |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `Bgg::Normalizer.normalize_polls` | `Bgg::PollPersister` | Poll hash passed to upsert | ✓ WIRED | `poll_persister.rb` calls `Bgg::Normalizer.normalize_polls(item)` |
| `Bgg::Client#thing` | `Bgg::PollPersister` | BGG XML → merged doc | ✓ WIRED | `EnrichThingPollsJob` and `BackfillPollDataJob` chain `client.thing` to `PollPersister.persist_from_thing_xml` |
| `Bgg::ImportCollectionJob` | `Bgg::EnrichThingPollsJob` | `perform_later(username)` | ✓ WIRED | Line 63 before READY broadcast in `import_collection_job.rb` |
| `Bgg::EnrichThingPollsJob` | `Bgg::Client#thing` | `client.thing(batch)` | ✓ WIRED | `enrich_thing_polls_job.rb` line 28 |
| `Bgg::BackfillPollDataJob` | `Bgg::Client#thing` | `client.thing(objectids)` | ✓ WIRED | `backfill_poll_data_job.rb` line 22 |
| `ThingFields#polls` | `Loaders::PollsLoader` | `dataloader.with(...).load(object.id)` | ✓ WIRED | `thing_fields.rb` line 29 |
| `ThingFields#best_player_count` | `Loaders::PollsLoader` | `.then` computes from loaded polls | ✓ WIRED | `thing_fields.rb` line 33 |
| `BoardgameNightSchema` | `PollType`/`PollResultType` | `orphan_types` registration | ✓ WIRED | `boardgame_night_schema.rb` lines 25-26 |
| `Bgg::Client` | `Rails.cache` | `bgg:thing:{id}` cache key | ✓ WIRED | `client.rb` lines 38, 51, 119-121 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `ThingFields#polls` | `polls` array | `Loaders::PollsLoader` → `BggPoll.where(...).includes(:bgg_poll_results)` | Yes — DB rows populated by `Bgg::PollPersister` from BGG XML | ✓ FLOWING |
| `ThingFields#best_player_count` | `polls` array | `Loaders::PollsLoader` | Yes — derives from `bgg_poll_results` where `value == "Best"` | ✓ FLOWING |
| `PollType#results` | `object.bgg_poll_results` | `BggPoll` has_many association | Yes — preloaded via `includes` in PollsLoader | ✓ FLOWING |
| `Bgg::Client#thing` | merged `<item>` XMLs | Cached XML + fresh BGG `/thing` responses | Yes — BGG API returns real thing XML | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Model, service, job, and GraphQL specs all pass | `bundle exec rspec spec/models/bgg_poll_spec.rb spec/models/bgg_poll_result_spec.rb spec/services/bgg/normalizer_spec.rb spec/services/bgg/poll_persister_spec.rb spec/services/bgg/client_spec.rb spec/jobs/bgg/enrich_thing_polls_job_spec.rb spec/jobs/bgg/backfill_poll_data_job_spec.rb spec/jobs/bgg/import_collection_job_spec.rb spec/graphql/loaders/polls_loader_spec.rb spec/graphql/types/poll_type_spec.rb spec/graphql/thing_fields_poll_query_spec.rb` | 93 examples, 0 failures | ✓ PASS |
| RuboCop clean on all modified files | `bundle exec rubocop app/services/bgg/normalizer.rb app/services/bgg/poll_persister.rb app/models/bgg_poll.rb app/models/bgg_poll_result.rb app/services/bgg/client.rb app/jobs/bgg/enrich_thing_polls_job.rb app/jobs/bgg/backfill_poll_data_job.rb app/jobs/bgg/import_collection_job.rb lib/tasks/bgg_poll_backfill.rake app/graphql/types/poll_type.rb app/graphql/types/poll_result_type.rb app/graphql/loaders/polls_loader.rb app/graphql/types/thing_fields.rb` | 13 files inspected, no offenses detected | ✓ PASS |
| Rake task is listed | `bin/rails -T \| grep bgg:backfill_polls` | `bgg:backfill_polls` listed | ✓ PASS |
| Schema dump contains new types/fields | `bin/rails graphql:schema:dump && grep -E 'type Poll\|type PollResult\|polls:\|bestPlayerCount' schema.graphql` | `bestPlayerCount: Int`, `polls: [Poll!]!`, `type Poll`, `type PollResult` present | ✓ PASS |
| Frontend codegen types contain Poll/PollResult | `grep -E 'export type Poll\|PollResult' app/frontend/generated/types.ts` | `export type Poll` and `export type PollResult` present | ✓ PASS |

### Probe Execution

No probes declared in the phase PLAN/SUMMARY files. Step skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| SUGG-01 | 06-01, 06-03 | Rails parses BGG `suggested_numplayers` poll data and persists it; GraphQL exposes it | ✓ SATISFIED | Migration, `Bgg::Normalizer.normalize_polls`, `Bgg::PollPersister`, `PollType`/`PollResultType`/`PollsLoader`, integration query spec |
| SUGG-05 | 06-02 | BGG poll data is backfilled for existing `BggThing` records via rate-limited background job | ✓ SATISFIED | `Bgg::BackfillPollDataJob`, `Bgg::EnrichThingPollsJob`, `Bgg::ImportCollectionJob` hook, `lib/tasks/bgg_poll_backfill.rake`, `Bgg::RateLimiter` (5s interval) |

### Anti-Patterns Found

No blocker, warning, or info anti-patterns found in files modified by this phase. No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers, empty implementations, or hardcoded empty data detected.

### Human Verification Required

None. All must-haves are behaviorally verified by passing RSpec tests and runtime checks.

### Gaps Summary

No gaps found. The phase goal is achieved: BGG player-count poll data is parsed, persisted, backfilled via rate-limited background jobs, and exposed through GraphQL so the suggestion engine can consume it.

---

_Verified: 2026-07-14T07:30:00Z_
_Verifier: the agent (gsd-verifier)_
