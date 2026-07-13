# Phase 6: BGG Poll Data Layer - Research

**Researched:** 2026-07-14
**Domain:** Ruby on Rails 8 / BGG XML API2 / GraphQL Dataloader / Solid Queue & Solid Cache
**Confidence:** HIGH

## Summary

Phase 6 extends the existing BGG integration to parse, persist, and backfill BGG `suggested_numplayers` poll data. The work is a pure backend data-layer phase: it adds two normalized tables (`bgg_polls`, `bgg_poll_results`), extends the BGG XML normalizer, caches thing-detail XML with Solid Cache, and runs two Solid Queue jobs under the existing global `bgg_api` concurrency lock.

The key constraint discovered during research is that **the BGG `/thing` endpoint accepts a maximum of 20 comma-delimited IDs per request** [CITED: boardgamegeek.com/wiki/page/BGG_XML_API2]. This means the backfill batch size must be capped at 20, not the 20–50 range floated in the discussion context. The fixture `stevmachine_thing.xml` already contains the exact XML structure we need, so parser validation can be done entirely offline without live BGG calls.

**Primary recommendation:** Implement a per-thing-ID cache (`bgg:thing:{objectid}`), batch BGG fetches in chunks of 20, normalize polls with Nokogiri CSS selectors, persist via `Bgg::PollPersister`, and expose both raw poll data and a computed `bestPlayerCount` through a `GraphQL::Dataloader` source.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use a **separate enrichment job** (`Bgg::EnrichThingPollsJob`) rather than modifying `ImportCollectionJob`. The existing import job stays unchanged — it only fetches collection XML. The enrichment job fetches thing details for poll data.
- **D-02:** The enrichment job is **triggered after import completes** — `ImportCollectionJob` enqueues `EnrichThingPollsJob` as its last step before broadcasting READY. No user action needed; poll enrichment starts automatically after collection sync.
- **D-03:** The enrichment job **only fetches thing details for games missing poll data**. Games already enriched (where `poll_data_fetched_at` is set) are skipped.
- **D-04:** The enrichment job uses the **same `limits_concurrency to: 1, key: "bgg_api"`** as `ImportCollectionJob`. Only one BGG API job runs at a time across the entire system.
- **D-05:** The backfill job uses **batch fetching** — BGG thing API accepts comma-separated IDs. Fetch ~20–50 things per API call to minimize rate-limited API calls. *(Research overrides the upper bound: **20 is the BGG hard limit**.)*
- **D-06:** Track backfill progress via a **`poll_data_fetched_at` timestamp column** on `bgg_things`. Records with NULL need backfill.
- **D-07:** The backfill is a **one-time job**. Run once to backfill all existing `BggThing` records. After that, new imports get poll data via the enrichment job (D-02).
- **D-08:** Partial failures are handled with **skip and continue** — log failed IDs, mark them as fetched (with error), continue to next batch. A follow-up rake task can retry failed IDs.
- **D-09:** Expose **both raw poll data and computed fields**. Raw poll data (votes per player count per category) AND a computed `bestPlayerCount` field.
- **D-10:** Poll types go on **`ThingFields` (shared concern)** so both `ThingType` and `MergedThingType` expose `polls` and `bestPlayerCount`.
- **D-11:** Poll data is loaded via a **`PollsLoader` (GraphQL::Dataloader::Source)** following the existing `OwnersLoader` pattern.
- **D-12:** Add **Rails.cache (Solid Cache) with 1h TTL** to the `Bgg::Client#thing()` method.
- **D-13:** Use **per-thing-ID cache key** (`bgg:thing:{objectid}`) with 1h TTL.
- **D-14:** Cache stores **raw XML** (not parsed Nokogiri docs). The normalizer parses it fresh each time.

### Agent's Discretion
- Exact batch size for backfill job (20–50 things per API call) — **researcher determined: 20 (BGG hard limit).**
- Exact `bgg_polls` / `bgg_poll_results` table schema (column names, indexes) — researcher to design.
- Whether `bestPlayerCount` handles ties (multiple player counts with same "Best" votes) — **researcher recommends: lower player count (more inclusive).**
- Whether to store all BGG polls or only `suggested_numplayers` — **researcher recommends: schema stores generic poll name, but only `suggested_numplayers` is parsed for v1.**
- Error logging format for failed backfill IDs — researcher to determine.
- Whether the enrichment job broadcasts Solid Cable updates — **researcher recommends: no broadcast; poll data is consumed on-demand by the suggestion engine and collection views.**

### Deferred Ideas (OUT OF SCOPE)
- Suggestion engine scoring (Phase 7)
- Frontend poll data display (Phase 9/10)
- Recurring poll data refresh (deferred — one-time backfill + on-import enrichment is sufficient for v1)
- Other BGG poll types (`language_dependence`, `player_age`) — only `suggested_numplayers` is needed for the suggestion engine
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUGG-01 | Rails parses BGG `suggested_numplayers` poll data and persists it to the database. | BGG poll XML structure is known from `stevmachine_thing.xml` and official docs; schema design supports `Best/Recommended/Not Recommended` votes per player count. |
| SUGG-05 | BGG poll data is backfilled for existing `BggThing` records via a rate-limited background job. | Solid Queue `limits_concurrency` enforces one BGG job at a time; BGG `/thing` endpoint supports 20 IDs per call; `find_in_batches` and `Bgg::Client#thing` caching support efficient backfill. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Parse BGG poll XML | Backend / API | — | Nokogiri runs in the Rails process; BGG XML is server-side data. |
| Persist poll data | Backend / Database | — | `bgg_polls` / `bgg_poll_results` are app data owned by the DB tier. |
| Rate-limited BGG fetching | Backend / Background Jobs | — | Solid Queue + `Bgg::RateLimiter` enforce the 1 req/5s contract across workers. |
| Poll data caching | Backend / Solid Cache | — | `Rails.cache` (Solid Cache) stores raw XML; separate `cache` DB isolates churn. |
| GraphQL poll exposure | Backend / API | — | `ThingFields` + `PollsLoader` expose data via the single GraphQL endpoint. |
| Compute best player count | Backend / API | — | Calculated from persisted poll rows at GraphQL resolution time. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Ruby | 3.4.9 (env) / 3.4.10 (recommended) | Language runtime | Rails 8.1 requires Ruby ≥ 3.2; environment has 3.4.9, project pins 3.4.10. [VERIFIED: codebase `.ruby-version` / Gemfile] |
| Ruby on Rails | 8.1.3 | API-only framework, migrations, Active Job, cache | Project standard; `rails ~> 8.1.3` in Gemfile. [VERIFIED: codebase Gemfile] |
| Solid Queue | 1.4.0 | Background job backend | Rails 8 default; `limits_concurrency` used for BGG API throttling. [VERIFIED: codebase Gemfile] |
| Solid Cache | 1.0.10 | DB-backed `Rails.cache` | Rails 8 default; separate SQLite DB configured. [VERIFIED: codebase Gemfile / config/database.yml] |
| graphql-ruby | 2.6.3 | GraphQL server + Dataloader | Class-based schema + `GraphQL::Dataloader` are the project pattern. [VERIFIED: codebase Gemfile] |
| Nokogiri | 1.19.4 | XML parsing | The only sane choice for BGG's inconsistent XML; already used for collections and things. [VERIFIED: codebase Gemfile] |
| Faraday | 2.14.3 | HTTP client | Existing BGG client uses Faraday with retry middleware. [VERIFIED: codebase Gemfile] |
| RSpec Rails | 8.0.4 | Backend testing | Project test standard; existing `normalizer_spec.rb` and `client_spec.rb`. [VERIFIED: codebase Gemfile] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| webmock | 3.26.x | Stub BGG HTTP calls in tests | Use in `client_spec.rb` and job specs to avoid live BGG calls. [VERIFIED: codebase Gemfile] |
| shoulda-matchers | 6.4.x | Model association/validation matchers | Use in `bgg_poll_spec.rb` and `bgg_poll_result_spec.rb`. [VERIFIED: codebase Gemfile] |
| GlobalID | — | GraphQL ID encoding | `BoardgameNightSchema` uses `object.to_gid_param`; no change needed. [VERIFIED: codebase schema] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-thing cache (`bgg:thing:{id}`) | Cache entire batch response by ID list | Batch-list cache is invalid as soon as one ID is re-requested; per-thing cache survives partial overlap. |
| Store raw XML string | Store parsed Nokogiri doc / hash | Raw XML avoids serialization/versioning issues; Nokogiri parsing is fast enough. |
| Batch size 20 | Batch size 50 | 20 is the BGG hard limit; 50 would be truncated or rejected. |

**Installation:** No new gems are required for this phase. Existing gems are already installed and verified:

```bash
bundle list | grep -E "faraday|nokogiri|graphql|solid_queue|solid_cache|rspec-rails"
#   * faraday (2.14.3)
#   * nokogiri (1.19.4)
#   * graphql (2.6.3)
#   * solid_queue (1.4.0)
#   * solid_cache (1.0.10)
#   * rspec-rails (8.0.4)
```

## Package Legitimacy Audit

> This phase does **not** install any new external packages. It uses gems already present in the Gemfile and verified by `bundle list`. No new package legitimacy audit is required.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Rails 8 API-only backend                     │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │ ImportCollectionJob│   │ EnrichThingPollsJob│  │ BackfillPollDataJob│  │
│  │  (existing)        │   │  (new)            │   │  (new, one-time) │  │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬────────┘  │
│           │                        │                       │         │
│           │ perform_later          │ perform_later         │ rake    │
│           │ after READY            │                       │ task    │
│           ▼                        ▼                       ▼         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │   Global concurrency lock: limits_concurrency to: 1, key:    │    │
│  │   "bgg_api"  (Solid Queue)                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Bgg::Client#thing(ids)                                      │    │
│  │   ├─ per-thing cache check (Rails.cache / Solid Cache)       │    │
│  │   ├─ batch uncached IDs in groups of 20                      │    │
│  │   ├─ Bgg::RateLimiter.throttle (1 req / 5 s)                 │    │
│  │   ├─ Faraday GET /xmlapi2/thing?id=...                       │    │
│  │   └─ merge cached + fresh XML, return Nokogiri doc           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Bgg::Normalizer.normalize_polls(item_node)                   │    │
│  │   └─ extract <poll name="suggested_numplayers">              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Bgg::PollPersister.persist_from_thing_xml(xml_doc)           │    │
│  │   ├─ upsert bgg_polls per thing                              │    │
│  │   ├─ upsert bgg_poll_results per player count                │    │
│  │   └─ update bgg_things.poll_data_fetched_at                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  GraphQL query / mergedCollection / thing                    │    │
│  │   ├─ Loaders::PollsLoader (batch loads polls + results)      │    │
│  │   ├─ PollType / PollResultType                               │    │
│  │   └─ ThingFields.best_player_count                           │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
app/
├── graphql/
│   ├── loaders/
│   │   ├── owners_loader.rb          # existing
│   │   └── polls_loader.rb           # NEW - batch loads polls + results
│   ├── types/
│   │   ├── poll_type.rb              # NEW
│   │   ├── poll_result_type.rb       # NEW
│   │   ├── thing_fields.rb           # ADD polls + bestPlayerCount
│   │   ├── thing_type.rb             # unchanged (includes ThingFields)
│   │   └── merged_thing_type.rb      # unchanged (includes ThingFields)
│   └── boardgame_night_schema.rb     # ADD PollType/PollResultType to orphan_types
├── jobs/bgg/
│   ├── import_collection_job.rb      # ADD enqueue EnrichThingPollsJob
│   ├── enrich_thing_polls_job.rb     # NEW
│   └── backfill_poll_data_job.rb     # NEW
├── models/
│   ├── bgg_thing.rb                  # ADD has_many :bgg_polls
│   ├── bgg_poll.rb                   # NEW
│   └── bgg_poll_result.rb            # NEW
├── services/bgg/
│   ├── client.rb                     # ADD per-thing caching in #thing
│   ├── normalizer.rb                 # ADD normalize_polls(item_node)
│   └── poll_persister.rb             # NEW
└── lib/tasks/
    └── bgg_poll_backfill.rake        # NEW - bin/rails bgg:backfill_polls

db/
├── migrate/
│   └── 20260714000001_create_bgg_polls_and_results.rb   # NEW
└── cache_migrate/                   # Solid Cache migrations (existing)

spec/
├── services/bgg/
│   ├── normalizer_spec.rb            # ADD poll parsing tests
│   ├── client_spec.rb                # ADD thing caching tests
│   └── poll_persister_spec.rb        # NEW
├── jobs/bgg/
│   ├── enrich_thing_polls_job_spec.rb # NEW
│   └── backfill_poll_data_job_spec.rb # NEW
├── models/
│   ├── bgg_poll_spec.rb              # NEW
│   └── bgg_poll_result_spec.rb       # NEW
├── graphql/loaders/
│   └── polls_loader_spec.rb          # NEW
└── fixtures/files/
    └── stevmachine_thing.xml         # existing - contains poll data
```

### Pattern 1: BGG Poll XML Parsing

**What:** Extract `suggested_numplayers` poll data from a BGG thing XML item node into a structured hash.

**When to use:** Called by `Bgg::PollPersister` for each `<item>` returned from `Bgg::Client#thing`.

**Example:**

```ruby
# app/services/bgg/normalizer.rb
module Bgg
  module Normalizer
    module_function

    # Existing normalize_thing remains unchanged.
    # New helper for a single <item> node.
    def normalize_polls(item_node)
      poll = item_node.at_css('poll[name="suggested_numplayers"]')
      return nil unless poll

      {
        name: poll["name"],
        title: poll["title"],
        total_votes: poll["totalvotes"]&.to_i,
        results: poll.css("results").map do |result_node|
          {
            player_count: parse_player_count(result_node["numplayers"]),
            votes: result_node.css("result").map do |vote_node|
              {
                value: vote_node["value"],
                num_votes: vote_node["numvotes"]&.to_i
              }
            end
          }
        end
      }
    end

    def parse_player_count(numplayers)
      # BGG may use "4+" for the "best with more" entry.
      return nil if numplayers.nil?

      numplayers.to_i
    end
  end
end
```

// Source: `spec/fixtures/files/stevmachine_thing.xml` + BGG XML API2 docs

### Pattern 2: Per-Thing-ID Cache with Batch Fetching

**What:** Cache each BGG thing's raw XML under `bgg:thing:{objectid}`, fetch only uncached IDs, and merge cached + fresh XML into a single Nokogiri document.

**When to use:** Inside `Bgg::Client#thing` when the caller requests one or more thing IDs.

**Example:**

```ruby
# app/services/bgg/client.rb
def thing(ids)
  ids = Array(ids).map(&:to_s).uniq

  cached_xmls = {}
  uncached_ids = []

  ids.each do |id|
    cached = Rails.cache.read(thing_cache_key(id))
    if cached
      cached_xmls[id] = cached
    else
      uncached_ids << id
    end
  end

  if uncached_ids.any?
    handle_faraday_errors do
      # BGG hard limit: 20 IDs per request
      uncached_ids.each_slice(20) do |batch|
        doc = perform_request("thing", id: batch.join(","), stats: 1)
        doc.css("items > item").each do |item|
          Rails.cache.write(thing_cache_key(item["id"]), item.to_xml, expires_in: 1.hour)
          cached_xmls[item["id"]] = item.to_xml
        end
      end
    end
  end

  merge_item_xmls(cached_xmls.values)
end

private

def thing_cache_key(id)
  "bgg:thing:#{id}"
end

def merge_item_xmls(xml_strings)
  merged = Nokogiri::XML::Document.new
  root = merged.create_element("items")
  xml_strings.each do |xml|
    item = Nokogiri::XML(xml).at_css("item")
    root.add_child(item.dup) if item
  end
  merged.root = root
  merged
end
```

// Source: existing `Bgg::Client#collection` cache pattern + `Bgg::CollectionFetcher#merge_docs`

### Pattern 3: Solid Queue Concurrency and Retry Policy

**What:** Run BGG jobs with a global concurrency limit of 1 and explicit retry/discard rules.

**When to use:** Both `Bgg::EnrichThingPollsJob` and `Bgg::BackfillPollDataJob`.

**Example:**

```ruby
class Bgg::EnrichThingPollsJob < ApplicationJob
  queue_as :bgg_imports
  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::ServerError,   wait: :polynomially_longer, attempts: 5

  discard_on Bgg::ResourceNotFound
  discard_on ActiveJob::DeserializationError

  def perform(username)
    # ...
  end
end
```

// Source: `app/jobs/bgg/import_collection_job.rb` + Solid Queue README

### Pattern 4: GraphQL Dataloader for Polls

**What:** Batch-load `bgg_polls` + `bgg_poll_results` for all requested `BggThing` IDs in one query, avoiding N+1 in collection lists.

**When to use:** `polls` and `bestPlayerCount` fields on `ThingFields`.

**Example:**

```ruby
# app/graphql/loaders/polls_loader.rb
module Loaders
  class PollsLoader < GraphQL::Dataloader::Source
    def fetch(thing_ids)
      polls = BggPoll
        .where(bgg_thing_id: thing_ids)
        .includes(:bgg_poll_results)
        .group_by(&:bgg_thing_id)

      thing_ids.map { |id| polls[id] || [] }
    end
  end
end
```

```ruby
# app/graphql/types/thing_fields.rb
included do
  # ... existing fields ...
  field :polls, [Types::PollType], null: false
  field :best_player_count, GraphQL::Types::Int, null: true
end

def polls
  dataloader.with(Loaders::PollsLoader).load(object.id)
end

def best_player_count
  dataloader.with(Loaders::PollsLoader).load(object.id).then do |polls|
    suggested = polls.find { |p| p.name == "suggested_numplayers" }
    next nil unless suggested

    best = suggested.bgg_poll_results.select { |r| r.value == "Best" }
    next nil if best.empty?

    # max votes, then lower player count on ties
    best.max_by { |r| [r.num_votes, -r.player_count.to_i] }&.player_count
  end
end
```

// Source: `app/graphql/loaders/owners_loader.rb` + graphql-ruby Dataloader docs

### Anti-Patterns to Avoid
- **Fetching more than 20 thing IDs per request:** BGG will truncate or reject the request. Always cap at 20.
- **Caching parsed Nokogiri docs or AR objects:** Cache raw XML strings to avoid serialization/versioning issues.
- **Parsing BGG XML with regex:** Use Nokogiri CSS/XPath selectors with nil-safe access.
- **Storing all server data in Pinia:** Polls are server data; the Vue client should read them through Apollo's normalized cache, not Pinia.
- **Running BGG jobs without `limits_concurrency`:** Multiple simultaneous BGG jobs would violate the 1 req/5s contract and trigger 429/503.
- **Synchronous BGG fetches in GraphQL resolvers:** Resolvers must read from the DB; fetching BGG live in a resolver is a timeout/429 risk.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XML parsing | Regex or string splitting | Nokogiri with CSS selectors | BGG XML is inconsistent, namespaced, and has optional fields — regex breaks silently. |
| BGG rate limiting | Custom sleep loops | `Bgg::RateLimiter` + `limits_concurrency` | Cross-process lock via Solid Cache; global concurrency via Solid Queue. |
| GraphQL N+1 | Manual `includes` in every resolver | `GraphQL::Dataloader::Source` | Batches loads across all fields in a single query execution. |
| BGG response cache | In-memory hash or custom file store | `Rails.cache` with Solid Cache | Survives process restarts, supports multiple workers, project already configured. |
| Background job retries | `begin/rescue` loops inside `perform` | `retry_on` / `discard_on` | Active Job handles exponential backoff, failure tracking, and dead-letter semantics. |
| ActiveRecord batch iteration | `BggThing.all.each` | `find_in_batches` / `find_each` | Keeps memory constant and avoids loading all rows at once. |

**Key insight:** The BGG client stack is already built. Phase 6 is about extending it with parsing and persistence, not rebuilding it. Reusing `Bgg::Client`, `Bgg::RateLimiter`, `GraphQL::Dataloader`, and Solid Queue/Cache is the only safe path.

## Runtime State Inventory

> This phase is not a rename/refactor, but it is a **data migration**: existing `BggThing` records must receive poll data. This inventory answers what runtime state exists before the backfill.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `BggThing` records exist in `storage/production.sqlite3` (or `storage/test.sqlite3`). `poll_data_fetched_at` is NULL for all existing records. | One-time backfill via `Bgg::BackfillPollDataJob` or `bin/rails bgg:backfill_polls`. |
| Live service config | Solid Queue is configured in `config/queue.yml` with a single worker/process and 3 threads. | Ensure at least one Solid Queue worker is running in production before triggering the backfill. |
| OS-registered state | None — no OS-level schedules or services registered by the app. | None. |
| Secrets/env vars | `BGG_TOKEN` is loaded from `.env.bggeek` via `dotenv-rails`. | No change; token used by existing `Bgg::Client`. |
| Build artifacts / installed packages | Existing gems are installed and current. | Run `bundle install` if migrating to a new machine; no new gems. |

## Common Pitfalls

### Pitfall 1: BGG `/thing` 20-ID Limit
**What goes wrong:** The backfill job requests more than 20 IDs in a single call. BGG truncates or rejects the request, causing missing or failed poll data.
**Why it happens:** Discussion context suggested a 20–50 batch size, but the BGG API hard-codes 20.
**How to avoid:** Cap each `Bgg::Client#thing` request at 20 IDs; use `Array#each_slice(20)` in the client or the job.
**Warning signs:** Tests pass for single IDs but fail for large batches; backfill produces fewer poll rows than expected.

### Pitfall 2: Treating 202 as a Successful Thing Response
**What goes wrong:** BGG may return HTTP 202 for newly added or uncached things; parsing the empty body produces no `<item>` nodes, and the job silently marks things as fetched.
**Why it happens:** `Bgg::Client#thing` currently uses `perform_request`, which does not retry on 202 like `request_with_202_retry` does for collections.
**How to avoid:** Either wrap `Bgg::Client#thing` calls with the same 202-retry logic or handle missing `<item>` nodes by not updating `poll_data_fetched_at` and logging the retry.
**Warning signs:** Empty poll rows for things that exist on BGG; `Bgg::Client#thing` response has no `<item>` nodes.

### Pitfall 3: N+1 When Loading Poll Results
**What goes wrong:** A merged collection query requests `polls` for every game; without a Dataloader, each game triggers a separate `bgg_polls` query plus `bgg_poll_results` queries.
**Why it happens:** `ThingFields` is shared by `ThingType` and `MergedThingType`; the latter is used in collection lists.
**How to avoid:** Implement `PollsLoader` that `includes(:bgg_poll_results)` and use `dataloader.with` in `ThingFields`.
**Warning signs:** Bullet warnings in dev/test; query count grows linearly with collection size.

### Pitfall 4: Race Condition on Cache Stampede
**What goes wrong:** Multiple simultaneous `Bgg::EnrichThingPollsJob` or `Bgg::BackfillPollDataJob` instances see the same uncached thing and each fetches it.
**Why it happens:** Cache check + write is not atomic, and the global `bgg_api` concurrency lock serializes jobs but not cache reads.
**How to avoid:** The concurrency lock already prevents parallel BGG jobs; combined with per-thing caching, stampede risk is low. For extra safety, use `Rails.cache.fetch` with the block so the cache write happens immediately after the fetch inside the same lock.
**Warning signs:** Repeated BGG calls for the same thing within the cache TTL window.

### Pitfall 5: Missing Poll Data for Games with No Polls
**What goes wrong:** Some games on BGG have no `suggested_numplayers` poll. The backfill job loops forever or leaves `poll_data_fetched_at` NULL.
**Why it happens:** The job checks `poll_data_fetched_at` to decide what to fetch; a game with no poll has no rows to persist.
**How to avoid:** Still update `poll_data_fetched_at` after a successful fetch, even if no poll rows were extracted. A game with no poll is "enriched"; it simply has no data.
**Warning signs:** Backfill never finishes; same things are re-fetched repeatedly.

### Pitfall 6: Bad XML External Entity (XXE) Risk
**What goes wrong:** Parsing untrusted XML with external entity resolution enabled can leak local files or trigger SSRF.
**Why it happens:** `Nokogiri::XML(body) { |config| config.strict }` uses default parse options that may allow external entity resolution.
**How to avoid:** Add `config.nonet` to the Nokogiri parse options so the parser cannot make network requests while parsing BGG responses. BGG responses are not expected to contain DOCTYPE/entity declarations, so this is safe hardening.
**Warning signs:** Security scanner flags; unexpected outbound network requests during XML parsing.

## Code Examples

### BGG `suggested_numplayers` XML Fixture

```xml
<!-- spec/fixtures/files/stevmachine_thing.xml -->
<poll name="suggested_numplayers" title="User Suggested Number of Players" totalvotes="2000">
  <results numplayers="1">
    <result value="Best" numvotes="100" />
    <result value="Recommended" numvotes="200" />
    <result value="Not Recommended" numvotes="50" />
  </results>
  <results numplayers="2">
    <result value="Best" numvotes="500" />
    <result value="Recommended" numvotes="300" />
    <result value="Not Recommended" numvotes="20" />
  </results>
  <!-- ... -->
</poll>
```

// Source: `spec/fixtures/files/stevmachine_thing.xml` [VERIFIED: project fixture]

### Database Migration for Poll Tables

```ruby
# db/migrate/20260714000001_create_bgg_polls_and_results.rb
class CreateBggPollsAndResults < ActiveRecord::Migration[8.1]
  def change
    create_table :bgg_polls do |t|
      t.references :bgg_thing, null: false, foreign_key: true
      t.string :name, null: false
      t.string :title
      t.integer :total_votes
      t.timestamps

      t.index [:bgg_thing_id, :name], unique: true
    end

    create_table :bgg_poll_results do |t|
      t.references :bgg_poll, null: false, foreign_key: true
      t.string :value, null: false
      t.integer :num_votes, null: false, default: 0
      t.integer :player_count
      t.timestamps

      t.index [:bgg_poll_id, :player_count, :value], unique: true
    end

    add_column :bgg_things, :poll_data_fetched_at, :datetime
    add_column :bgg_things, :poll_data_error, :text
    add_index :bgg_things, :poll_data_fetched_at
  end
end
```

// Source: researcher-designed schema based on query patterns from Phase 7

### PollPersister Service

```ruby
# app/services/bgg/poll_persister.rb
module Bgg
  class PollPersister
    def persist_from_thing_xml(xml_doc)
      xml_doc.css("items > item").each do |item|
        persist_item(item)
      end
    end

    private

    def persist_item(item)
      thing = BggThing.find_by(objectid: item["id"].to_i)
      return unless thing

      poll_data = Bgg::Normalizer.normalize_polls(item)
      return Rails.logger.info("No suggested_numplayers poll for thing #{thing.objectid}") unless poll_data

      poll = thing.bgg_polls.find_or_initialize_by(name: poll_data[:name])
      poll.update!(
        title: poll_data[:title],
        total_votes: poll_data[:total_votes]
      )

      poll_data[:results].each do |result|
        result[:votes].each do |vote|
          poll.bgg_poll_results.find_or_create_by!(
            player_count: result[:player_count],
            value: vote[:value]
          ) do |pr|
            pr.num_votes = vote[:num_votes]
          end
        end
      end

      thing.update!(
        poll_data_fetched_at: Time.current,
        poll_data_error: nil
      )
    rescue => e
      Rails.logger.error("[Bgg::PollPersister] Failed to persist poll for thing #{thing&.objectid}: #{e.message}")
      thing&.update!(poll_data_fetched_at: Time.current, poll_data_error: e.message)
      raise
    end
  end
end
```

// Source: researcher-designed based on `Bgg::CollectionPersister` upsert pattern

### Backfill Rake Task

```ruby
# lib/tasks/bgg_poll_backfill.rake
namespace :bgg do
  desc "Backfill BGG poll data for all BggThing records missing it"
  task backfill_polls: :environment do
    Bgg::BackfillPollDataJob.perform_later
  end
end
```

// Source: researcher-designed based on D-07

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v1 proxy hardcoded `polls: []` | Rails parses and persists real `suggested_numplayers` poll data | Phase 6 | The suggestion engine can use community votes instead of the min/max player-count heuristic. |
| Single thing fetch per API call | Batch up to 20 IDs per `/thing` request | Phase 6 | Backfill time drops from ~17 min per 200 games to ~50 s. |
| In-memory or no thing cache | Per-thing Solid Cache with 1h TTL | Phase 6 | Survives worker restarts, avoids redundant BGG calls across import and backfill. |

**Deprecated/outdated:**
- `bgg-graphql-proxy` poll stub: The proxy defined `Poll`/`PollResult` types but never populated them. The Rails implementation is the first real parser.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `bestPlayerCount` returns the lower player count when two or more player counts tie for the most "Best" votes. | Architecture Patterns | Phase 7 suggestion engine may prefer a different tie-break; easy to change the resolver. |
| A2 | Only the `suggested_numplayers` poll is parsed for v1; the `bgg_polls` schema still stores a generic `name` so future polls can be added. | Standard Stack / Architecture | If Phase 7 needs other polls, the schema supports it but parser must be extended. |
| A3 | BGG `/thing` hard limit of 20 IDs per request is correct and stable. | Common Pitfalls | If BGG raises the limit, backfill is still correct but slower than necessary. If BGG lowers it, batch logic must be adjusted. |
| A4 | A 1-hour TTL for per-thing cache is appropriate for rarely changing poll data. | Architecture Patterns | TTL too short = more BGG calls; too long = stale data. Polls change slowly, so 1h is reasonable. |
| A5 | Poll enrichment does not need a Solid Cable broadcast; consumers read poll data on demand. | User Constraints | If real-time poll status is needed later, a broadcast can be added without breaking existing flow. |
| A6 | The existing `Bgg::Client#thing` endpoint is sufficient for batch fetching; the 202-retry path from collections is not required for things. | Code Examples | If BGG starts returning 202 for things, the backfill/enrichment may fail; can be mitigated by reusing `request_with_202_retry`. |

## Open Questions (RESOLVED)

1. **Should `Bgg::Client#thing` reuse the existing 202-retry logic?**
   - What we know: `request_with_202_retry` handles BGG's async collection generation; `Bgg::Client#thing` currently uses `perform_request` without 202 handling.
   - What's unclear: Whether the `/thing` endpoint ever returns 202 for newly added games.
   - Recommendation: Start with the existing `perform_request` behavior to keep the change minimal; add a 202-retry wrapper if backfill tests against live BGG show it is needed.
   - RESOLVED: Keep existing `perform_request` for things; revisit 202-retry only if live backfill shows it is needed. Plan 06-02 Task 1 implements caching on top of `perform_request` without 202 handling.

2. **Should the backfill mark missing `<item>` responses as fetched or leave them for retry?**
   - What we know: `Bgg::PollPersister` should guard against missing things.
   - What's unclear: Whether BGG can return a successful 200 response that omits a requested ID.
   - Recommendation: If an ID is missing from the response, do not update `poll_data_fetched_at`; let the next backfill run retry it. Log the missing ID.
   - RESOLVED: Do not update `poll_data_fetched_at` for missing IDs; log and let next backfill retry. Plan 06-02 Task 2 implements this skip-and-continue pattern.

3. **Should the schema support `level` on poll results (for future `language_dependence` polls)?**
   - What we know: The proxy's `PollResult` type includes `level` and `players`; the `suggested_numplayers` XML has only `value` and `numvotes`.
   - What's unclear: Whether v1 will ever need other polls.
   - Recommendation: Add `level` as a nullable column now to avoid a future migration; keep it unpopulated for `suggested_numplayers`.
   - RESOLVED: Add nullable `level` column to `bgg_poll_results` for forward compatibility. Plan 06-01 Task 1 includes this column in the migration.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Ruby | Rails runtime | ✓ | 3.4.9 (project recommends 3.4.10) | Use rbenv to install 3.4.10 if strict parity required |
| Rails | API, migrations, jobs | ✓ | 8.1.3 | — |
| Bundler | Gem management | ✓ | 2.6.9 | — |
| SQLite | App + Solid Queue/Cache DBs | ✓ | 3.x (via sqlite3 gem ≥ 2.1) | — |
| Solid Queue | BGG job concurrency | ✓ | 1.4.0 | — |
| Solid Cache | Thing XML cache | ✓ | 1.0.10 | — |
| Nokogiri | XML parsing | ✓ | 1.19.4 | — |
| Faraday | HTTP client | ✓ | 2.14.3 | — |
| RSpec | Backend tests | ✓ | 8.0.4 | — |
| Vite / Vue | Frontend (not needed for this phase) | ✓ | present | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Security Domain

> `security_enforcement` is enabled in `.planning/config.json`; ASVS Level 1 applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Nokogiri strict + nonet XML parsing; validate cache keys are derived from trusted IDs, not user input. |
| V6 Cryptography | no | — |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XML External Entity (XXE) attack via malicious BGG payload | Tampering/Information Disclosure | Add `config.nonet` to `Bgg::Client#parse_xml`; never parse user-supplied XML. |
| Cache key injection via unsanitized user input | Tampering | Cache keys derived from BGG `objectid` integers; never interpolate user strings. |
| Information disclosure via verbose GraphQL errors | Information Disclosure | GraphQL schema `type_error` handler should log full errors but return generic messages to clients. |
| Resource exhaustion via unbounded BGG backfill | Denial of Service | Batch size cap of 20, global concurrency lock of 1, and `find_in_batches` keep memory and API load bounded. |
| Missing `poll_data_fetched_at` update causing infinite backfill | Denial of Service | Always update `poll_data_fetched_at` after a fetch, even when no poll rows are extracted. |

## Sources

### Primary (HIGH confidence)
- `spec/fixtures/files/stevmachine_thing.xml` — real BGG `suggested_numplayers` poll XML used for parser validation.
- `app/services/bgg/client.rb` — existing cache and fetch patterns.
- `app/services/bgg/normalizer.rb` — existing Nokogiri parsing style.
- `app/jobs/bgg/import_collection_job.rb` — `limits_concurrency`, `retry_on`, `discard_on`, and Solid Cable broadcast patterns.
- `app/graphql/loaders/owners_loader.rb` — `GraphQL::Dataloader::Source` pattern.
- `app/graphql/types/thing_fields.rb` — shared field concern pattern.
- `app/services/bgg/collection_persister.rb` — upsert persistence pattern.
- `app/services/bgg/collection_fetcher.rb` — XML document merge pattern.
- `config/database.yml` / `config/cache.yml` — Solid Cache multi-DB configuration.

### Secondary (MEDIUM confidence)
- `boardgamegeek.com/wiki/page/BGG_XML_API2` (via web.archive.org) — BGG `/thing` endpoint accepts max 20 IDs. [CITED: boardgamegeek.com/wiki/page/BGG_XML_API2]
- `graphql-ruby.org/dataloader/sources.html` — `fetch` contract and `dataloader.with` usage. [CITED: graphql-ruby.org/dataloader]
- `github.com/rails/solid_queue` — `limits_concurrency` semantics and retry behavior. [CITED: github.com/rails/solid_queue]
- `api.rubyonrails.org` — `retry_on` and `discard_on` signatures. [CITED: api.rubyonrails.org]
- `guides.rubyonrails.org/caching_with_rails.html` — `Rails.cache.fetch` and Solid Cache best practices. [CITED: guides.rubyonrails.org/caching_with_rails]
- `guides.rubyonrails.org/active_record_querying.html` — `find_in_batches` / `find_each` patterns. [CITED: guides.rubyonrails.org/active_record_querying]

### Tertiary (LOW confidence)
- `bgg-graphql-proxy/src/resolvers/index.ts` — mentions a 20-item BGG limit and small expansion batches; used as a cross-check, not authoritative. [CITED: project reference proxy]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all gems are already in the Gemfile and verified by `bundle list`.
- Architecture: HIGH — patterns extend existing, well-tested code (`OwnersLoader`, `CollectionPersister`, `ImportCollectionJob`).
- Pitfalls: MEDIUM-HIGH — BGG 20-ID limit is verified from official docs; some failure modes (202 on thing) are inferred from patterns rather than direct observation.

**Research date:** 2026-07-14
**Valid until:** 2026-08-14 (BGG XML API2 is stable; Solid Queue/Cache patterns are stable)
