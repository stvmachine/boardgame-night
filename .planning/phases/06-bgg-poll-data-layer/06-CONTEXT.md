# Phase 6: BGG Poll Data Layer - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the parsing, persistence, and backfill of BGG player-count poll data (`suggested_numplayers`) so the Phase 7 suggestion engine can use community poll data instead of the v1 min/max range heuristic.

**Deliverables:**
- Database migration: `bgg_polls` and `bgg_poll_results` normalized tables + `poll_data_fetched_at` column on `bgg_things`
- `Bgg::Normalizer` extension: parse `<poll name="suggested_numplayers">` XML into structured data (Best/Recommended/Not Recommended votes per player count)
- `Bgg::EnrichThingPollsJob`: Solid Queue job that fetches thing details for newly imported games and persists poll data. Triggered after `ImportCollectionJob` completes.
- `Bgg::BackfillPollDataJob`: One-time job that batch-fetches thing details for all existing `BggThing` records lacking poll data.
- `Bgg::Client#thing` caching: Add Rails.cache (Solid Cache) with per-thing-ID key and 1h TTL, storing raw XML.
- `Bgg::PollPersister` (or equivalent service): Persists normalized poll data from parsed thing XML into `bgg_polls` / `bgg_poll_results` tables.
- GraphQL types: `PollType`, `PollResultType` + `polls` and `bestPlayerCount` fields on `ThingFields` (shared by `ThingType` and `MergedThingType`)
- `PollsLoader`: GraphQL Dataloader source for batch-loading poll data per thing IDs
- Tests: Normalizer poll parsing tests (using existing `stevmachine_thing.xml` fixture), model tests, job tests, GraphQL type tests

**Not in scope:**
- Suggestion engine scoring (Phase 7)
- Frontend poll data display (Phase 9/10)
- Recurring poll data refresh (deferred — one-time backfill + on-import enrichment is sufficient for v1)
- Other BGG poll types (language_dependence, player_age) — only `suggested_numplayers` is needed for the suggestion engine

</domain>

<decisions>
## Implementation Decisions

### Import Flow Integration
- **D-01:** Use a **separate enrichment job** (`Bgg::EnrichThingPollsJob`) rather than modifying `ImportCollectionJob`. The existing import job stays unchanged — it only fetches collection XML. The enrichment job fetches thing details for poll data. This keeps collection sync fast and poll enrichment independent.
- **D-02:** The enrichment job is **triggered after import completes** — `ImportCollectionJob` enqueues `EnrichThingPollsJob` as its last step before broadcasting READY. No user action needed; poll enrichment starts automatically after collection sync.
- **D-03:** The enrichment job **only fetches thing details for games missing poll data**. Games already enriched (where `poll_data_fetched_at` is set) are skipped. Efficient for re-imports and refreshes — only new games get thing detail fetches.
- **D-04:** The enrichment job uses the **same `limits_concurrency to: 1, key: "bgg_api"`** as `ImportCollectionJob`. Only one BGG API job runs at a time across the entire system, preventing rate limit violations.

### Backfill Job Design
- **D-05:** The backfill job uses **batch fetching** — BGG thing API accepts comma-separated IDs. Fetch ~20-50 things per API call to minimize rate-limited API calls. A 200-game collection backfills in 4-10 API calls (~20-50s) instead of 200 calls (~17 min).
- **D-06:** Track backfill progress via a **`poll_data_fetched_at` timestamp column** on `bgg_things`. Records with NULL need backfill. This also serves as a freshness indicator for future cache invalidation.
- **D-07:** The backfill is a **one-time job**. Run once to backfill all existing `BggThing` records. After that, new imports get poll data via the enrichment job (D-02). Triggered via a rake task or one-off Solid Queue job.
- **D-08:** Partial failures are handled with **skip and continue** — log failed IDs, mark them as fetched (with error), continue to next batch. A follow-up rake task can retry failed IDs. Matches the existing `ImportCollectionJob` pattern of `discard_on` for permanent failures.

### GraphQL Poll Exposure
- **D-09:** Expose **both raw poll data and computed fields**. Raw poll data (votes per player count per category: Best/Recommended/Not Recommended) AND a computed `bestPlayerCount` field (the player count with the most "Best" votes). Phase 7's suggestion engine needs `bestPlayerCount` for scoring; the frontend can display the vote breakdown.
- **D-10:** Poll types go on **`ThingFields` (shared concern)** so both `ThingType` and `MergedThingType` expose `polls` and `bestPlayerCount`. Consistent with existing fields (name, players, weight, etc. are all on `ThingFields`).
- **D-11:** Poll data is loaded via a **`PollsLoader` (GraphQL::Dataloader::Source)** following the existing `OwnersLoader` pattern. Batch-loads poll data per thing IDs to avoid N+1 queries when listing collections. Consistent with ADR-003.

### Thing Detail Caching
- **D-12:** Add **Rails.cache (Solid Cache) with 1h TTL** to the `Bgg::Client#thing()` method. Prevents redundant fetches if multiple jobs request the same thing. The enrichment job already skips games with poll data (D-03), but caching protects against edge cases and future use cases.
- **D-13:** Use **per-thing-ID cache key** (`bgg:thing:{objectid}`) with 1h TTL. Individual things can be cached/fetched independently. Matches the collection cache pattern (`bgg:collection:{username}`). Batch fetches check cache per ID and only fetch uncached IDs from BGG.
- **D-14:** Cache stores **raw XML** (not parsed Nokogiri docs). The normalizer parses it fresh each time. Simpler cache layer, no serialization concerns. Matches the collection cache pattern. Nokogiri parsing is fast enough that re-parsing overhead is negligible.

### Agent's Discretion
- Exact batch size for backfill job (20-50 things per API call) — researcher to determine optimal size based on BGG response size limits.
- Exact `bgg_polls` / `bgg_poll_results` table schema (column names, indexes) — researcher to design based on query patterns from Phase 7.
- Whether `bestPlayerCount` handles ties (multiple player counts with same "Best" votes) — researcher to determine resolution strategy.
- Whether to store all BGG polls or only `suggested_numplayers` — only `suggested_numplayers` is needed for v1, but the schema could be generic.
- Error logging format for failed backfill IDs — researcher to determine based on existing logging patterns.
- Whether the enrichment job broadcasts Solid Cable updates (like ImportCollectionJob) — researcher to determine if poll enrichment needs real-time updates.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements & Planning
- `.planning/REQUIREMENTS.md` §SUGG-01, SUGG-05 — Phase 6 requirements: parse poll data, persist, backfill.
- `.planning/ROADMAP.md` §Phase 6 — Goal, mode, dependencies (Phase 2), success criteria (4 criteria).
- `.planning/STATE.md` — Current position (Phase 6 next), carried concerns (live BGG poll XML validation flag).

### Existing BGG Code (Integration Points)
- `app/services/bgg/client.rb` — BGG HTTP client. `thing(ids)` method fetches thing details by ID (currently no caching). This is where caching (D-12/13/14) will be added.
- `app/services/bgg/normalizer.rb` — XML normalizer. `normalize_thing(xml_doc)` parses thing XML but ignores `<poll>` elements. This is where poll parsing will be added.
- `app/services/bgg/rate_limiter.rb` — Rate limiter (1 req/5s via Solid Cache). Used by `client.thing()`.
- `app/services/bgg/collection_persister.rb` — Persists collection items to BggThing. Reference for upsert pattern. Poll persister will follow similar pattern.
- `app/services/bgg/collection_fetcher.rb` — Expansion workaround. Reference for batch XML handling and cache patterns.
- `app/services/bgg.rb` — Error class hierarchy. Reference for error handling in new jobs.
- `app/jobs/bgg/import_collection_job.rb` — Existing import job. Reference for `limits_concurrency`, `retry_on`/`discard_on` patterns, Solid Cable broadcasting. This job will enqueue the new enrichment job (D-02).
- `app/models/bgg_thing.rb` — BggThing model. Will get `poll_data_fetched_at` column (D-06) and `has_many :bgg_polls` association.
- `app/graphql/types/thing_fields.rb` — Shared concern for thing fields. `polls` and `bestPlayerCount` will be added here (D-10).
- `app/graphql/types/merged_thing_type.rb` — Includes ThingFields + owners field. Will inherit poll fields.
- `app/graphql/loaders/owners_loader.rb` — Dataloader pattern reference. PollsLoader will follow this pattern (D-11).
- `db/schema.rb` — Current schema. `bgg_things` table has no poll columns. New migration adds `bgg_polls`, `bgg_poll_results`, and `poll_data_fetched_at`.
- `db/migrate/20260703000001_create_bgg_things.rb` — Original BggThings migration. Reference for column types.
- `db/migrate/20260707000001_add_statistics_to_bgg_things.rb` — Statistics migration. Reference for adding columns to existing table.

### Test Fixtures
- `spec/fixtures/files/stevmachine_thing.xml` — **CRITICAL**: Contains real `suggested_numplayers` poll data with 4 player-count results (1-4 players, Best/Recommended/Not Recommended votes). Already used by `normalizer_spec.rb` but no test asserts poll parsing. This is the primary fixture for Phase 6 test development.
- `spec/services/bgg/normalizer_spec.rb` — Existing normalizer tests. Poll parsing tests will be added here.
- `spec/services/bgg/client_spec.rb` — Existing client tests. Caching tests will be added here.

### Architecture Decision Records
- `docs/adr/003-graphql-n-plus-one-dataloader.md` — Dataloader pattern for N+1 prevention. PollsLoader follows this.
- `docs/adr/004-solid-queue-cache-cable.md` — Solid Queue/Cache/Cable (no Redis). Backfill and enrichment jobs use Solid Queue; thing caching uses Solid Cache.
- `docs/adr/005-bgg-collection-import-pipeline.md` — BGG import job patterns. Enrichment job follows these patterns.

### Prior Phase Context
- `.planning/phases/02-bgg-integration-layer-persistence/02-CONTEXT.md` — BGG client architecture, rate limiter, normalizer, expansion workaround, import job, persistence schema. Phase 6 extends all of these.
- `.planning/phases/03-graphql-api-collection-surface-v1-parity/03-CONTEXT.md` — GraphQL types, Dataloader, ThingFields pattern.
- `.planning/phases/04-auth-friend-groups-session-lifecycle/04-CONTEXT.md` — Mutation pattern (contract → mutation → service), Solid Cable broadcasting.

### Reference Proxy
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/src/schema/schema.graphql` — Has `Poll` and `PollResult` GraphQL types (lines 96-108). Reference for type shape. Note: the proxy hardcodes `polls: []` — never actually parsed poll data. The Rails app will be the first implementation to actually parse BGG poll data.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Bgg::Client#thing(ids)`** — Already fetches thing details by ID (single or comma-separated). No caching currently. Phase 6 adds caching (D-12/13/14) and uses this method for poll data fetching.
- **`Bgg::Normalizer.normalize_thing(xml_doc)`** — Already parses thing XML with Nokogiri CSS selectors and nil-safe field access (`node.at_css(...)&.attr("value")`). Phase 6 extends this with `normalize_polls(xml_doc)` or inline poll parsing within `normalize_thing`.
- **`Bgg::RateLimiter`** — Cross-process rate limiter (1 req/5s via Solid Cache). Already used by `client.thing()`. No changes needed.
- **`ImportCollectionJob`** — Solid Queue job with `limits_concurrency to: 1, key: "bgg_api"`, `retry_on`/`discard_on` patterns, Solid Cable broadcasting. Reference for new job structure. Will enqueue `EnrichThingPollsJob` after completion (D-02).
- **`OwnersLoader`** — `GraphQL::Dataloader::Source` with `def fetch(thing_ids)` returning grouped results. `PollsLoader` will follow this exact pattern (D-11).
- **`ThingFields` concern** — Shared module included by `ThingType` and `MergedThingType`. Poll fields will be added here (D-10).
- **`stevmachine_thing.xml` fixture** — Contains real `suggested_numplayers` poll data with 4 player-count results. Ready for test development without needing live BGG API calls.

### Established Patterns
- **BGG service pattern:** `Bgg::Client` (HTTP) → `Bgg::Normalizer` (XML→Hash) → `Bgg::*Persister` (Hash→DB). Phase 6 follows this: `client.thing` → `normalizer.normalize_polls` → `PollPersister.persist`.
- **Solid Queue job pattern:** `limits_concurrency to: 1, key: "bgg_api"`, explicit `retry_on` for transient failures, `discard_on` for permanent failures, Solid Cable broadcasting for status updates.
- **GraphQL Dataloader pattern:** `GraphQL::Dataloader::Source` subclass with `def fetch(ids)` method. Batch-loads data per thing IDs to avoid N+1.
- **GraphQL type pattern:** Shared concerns (`ThingFields`) included by multiple types. Fields use camelCase via `method:` or `hash_key:`.
- **Cache pattern:** `Rails.cache.fetch(key, expires_in: TTL)` with stale-while-revalidate for collections. Thing caching will follow the same pattern.
- **Migration pattern:** Add columns to existing tables via separate migration files (e.g., `add_statistics_to_bgg_things.rb`). New tables via `create_table` migrations.

### Integration Points
- **`Bgg::Client#thing`** — Add caching layer (wrap existing `perform_request` with `Rails.cache.fetch`).
- **`Bgg::Normalizer.normalize_thing`** — Add poll parsing (extract `<poll name="suggested_numplayers">` elements).
- **`ImportCollectionJob`** — Add `EnrichThingPollsJob.perform_later` call as last step before READY broadcast.
- **`BggThing` model** — Add `poll_data_fetched_at` column + `has_many :bgg_polls` association.
- **`ThingFields` concern** — Add `polls` and `bestPlayerCount` fields.
- **`schema.graphql`** — Will be updated by `rails graphql:schema:dump` after new types are added. Codegen will regenerate frontend types.
- **`db/migrate/`** — New migration files for `bgg_polls`, `bgg_poll_results`, and `poll_data_fetched_at` column.

</code_context>

<specifics>
## Specific Ideas

- The `stevmachine_thing.xml` fixture already has perfect poll data for testing: 4 player counts (1-4), each with Best/Recommended/Not Recommended vote counts. No need to capture new fixtures from live BGG.
- The BGG `thing` endpoint returns XML with `<poll>` elements containing `<results numplayers="N">` → `<result value="Best/Recommended/Not Recommended" numvotes="N" />`. The normalizer should extract this into a structured hash.
- The `bestPlayerCount` computed field should return the player count (integer) with the highest "Best" vote count. If there's a tie, return the lower player count (more inclusive) — researcher to confirm this strategy.
- The backfill job should be triggerable via a rake task (e.g., `bin/rails bgg:backfill_polls`) for easy one-time execution.
- The enrichment job should be lightweight — it only fetches thing details for games without poll data, so for a typical 50-game collection where all games already have poll data, it's a no-op.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 6-BGG Poll Data Layer*
*Context gathered: 2026-07-14*