# Phase 2: BGG Integration Layer + Persistence — Context

**Gathered:** 2026-07-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The BGG XML API client, rate limiting, XML parsing/normalization, background collection imports, and persisted game/collection data models. This phase builds the data backbone that makes multi-user merge feasible on the read path — no live BGG calls during browsing.

**Deliverables:**
- `Bgg::Client` — Faraday-based HTTP client with rate limiting, retry, User-Agent
- `Bgg::RateLimiter` — Cross-process rate limiter backed by Solid Cache (1 req/5s)
- `Bgg::Normalizer` — Nokogiri-based XML normalizer with nil-safe field access
- `Bgg::CollectionFetcher` — Expansion workaround (two-call merge: `excludesubtype=boardgameexpansion` + `subtype=boardgameexpansion`)
- `Bgg::ImportCollectionJob` — Solid Queue background job with concurrency control
- Database schema: `bgg_things` (normalized games/expansions), `bgg_collections` (user→thing ownership)
- Collection merge query: pure SQL/ActiveRecord dedup by `object_id`

**Not in scope:**
- GraphQL queries for collections (Phase 3)
- Frontend collection display (Phase 3)
- Authentication (Phase 4)
- Game suggestion engine (v2)
</domain>

<decisions>
## Implementation Decisions (Auto-selected)

### BGG Client Architecture
- **D-01:** Single `Bgg::Client` class wrapping Faraday with middleware stack, not per-endpoint service objects. Faraday middleware handles: retry (`faraday-retry` with exponential backoff), rate limiting, User-Agent header, timeouts. Pattern follows the reference proxy's `makeRequest<T>` single-method pattern.
- **D-02:** Three top-level client methods: `collection(username)`, `thing(ids)`, `search(query, opts)`. Return raw parsed data (Ruby hashes), not ActiveRecord models — normalization happens in the service layer.

### Rate Limiter
- **D-03:** Use `Rails.cache` (Solid Cache) for cross-process rate limiting, not in-memory (which only works per-process). The reference proxy's in-memory `lastRequestTime` is insufficient for multi-worker deployments. Implement as `Bgg::RateLimiter` with `#throttle { ... }` block interface.
- **D-04:** 1 request / 5 seconds minimum. Use a cache key `bgg:last_request_at` with atomic compare-and-set via `Rails.cache.write(key, value, unless_except: ...)` or a simple time check.

### Retry Strategy
- **D-05:** Auto-retry on HTTP 429/502/503 and network errors (ECONNRESET, ETIMEDOUT) via `faraday-retry` middleware. Max 3 retries with exponential backoff: ~1s, 2s, 4s. Following the reference proxy pattern.
- **D-06:** BGG HTTP 202 "queued" response gets special handling: up to 5 retries with ~5s delay each. Return a status signal if all 202 retries are exhausted (don't silently return empty).

### XML Parsing
- **D-07:** Use Nokogiri with CSS selectors, not REXML or regex. Pattern: `node.at_css("yearpublished")&.attr("value")` for nil-safe field access.
- **D-08:** Normalize BGG's inconsistent array handling: always wrap single items in arrays (`Array(item)` pattern). Handle missing fields gracefully (default to nil/empty).

### Expansion Workaround
- **D-09:** Implement the two-call workaround in a dedicated `Bgg::CollectionFetcher` service (separate from the raw HTTP client). Two calls: (1) `excludesubtype=boardgameexpansion`, (2) `subtype=boardgameexpansion`, then merge results. These two calls count as 2 requests against the rate limiter.
- **D-10:** If the workaround fails, fall back to a single `subtype=boardgame` call (the `getUserCollectionFallback` pattern from the reference proxy).

### Background Jobs
- **D-11:** Single `Bgg::ImportCollectionJob` per user + per trigger (manual refresh or new user link). Solid Queue with `limits_concurrency to: 1, key: "bgg_api"` — global concurrency 1 for all BGG jobs to avoid hammering the API.
- **D-12:** Explicit `retry_on` for transient BGG failures (503, timeout). `discard_on` for permanent failures (invalid username, 404). No silent swallowing — the job should fail visibly so the frontend can show an error state.
- **D-13:** Jobs are enqueueable via `Bgg::ImportCollectionJob.perform_later(username)` — called from controller/mutation context (Phase 3/4).

### Persistence Schema
- **D-14:** Two main tables:
  - `bgg_things` — One row per unique BGG `objectid` (game or expansion). Columns: `objectid` (BGG ID, unique), `name`, `year_published`, `min_players`, `max_players`, `min_playtime`, `max_playtime`, `min_age`, `complexity` (avg_weight), `thumbnail`, `image`, `description`, `rules_url`, `is_expansion` (boolean), `bgg_type` (string: boardgame/boardgameexpansion), plus JSONB `raw_data` for unparsed fields (ranks, links, polls).
  - `bgg_collections` — Join table mapping user→thing with per-user ownership metadata. Columns: `user_id`, `bgg_thing_id`, `quantity`, `comment`, `is_own`, `is_previously_owned`, `is_for_trade`, `is_want`, `is_want_to_play`, `is_want_to_buy`, `is_wishlist`, `wishlist_priority`, `created_at`, `updated_at`.

### Collection Merging
- **D-15:** Merge via ActiveRecord query: `BggThing.joins(:bgg_collections).where(bgg_collections: { user_id: user_ids }).distinct` with owner list aggregation per thing. No database view needed — a scope or class method on `BggThing` is sufficient.
- **D-16:** Owner tracking on merged games: each `bgg_thing` can have multiple `bgg_collections` rows (one per user who owns it). Frontend receives array of owners per thing.

### BGG Endpoints
- **D-17:** Implement three BGG API endpoints:
  - `GET /collection?username={}&own=1&stats=1` — collection fetch (with expansion workaround)
  - `GET /thing?id={}&stats=1` — single or batch thing detail (comma-separated IDs)
  - `GET /search?query={}&type={}` — game name search
- **D-18:** User validation: `GET /user?name={}` — confirm username exists before accepting it.

### Testing Strategy
- **D-19:** Use XML fixtures from the reference proxy (replay BGG responses from disk). Port fixture files from `bgg-graphql-proxy/src/__tests__/fixtures/` or capture fresh ones. Test the normalizer against known BGG XML quirks (missing fields, single-vs-array items, name variations).
- **D-20:** Rate limiter tests: verify timing (5s gap), verify cross-thread behavior with concurrent requests. Use `travel_to`/`freeze_time` where possible.

### the agent's Discretion
- Additional BGG XML fields to normalize (polls, rankings, links) — capture what's needed for Phase 3 display.
- Exact Gemfile version pins for `faraday`, `faraday-retry`, `nokogiri`.
- Job queue name for BGG imports.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference Proxy (BGG Patterns to Port)
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/src/datasources/bggDataSource.ts` — Full BGG client with rate limiting, retry, expansion workaround, XML normalization
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/src/datasources/bggDataSource.ts` §`makeRequest` — Single-method HTTP pattern with retry loop
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/src/datasources/bggDataSource.ts` §`getUserCollectionWithExpansionWorkaround` — Two-call expansion merge
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/src/datasources/bggDataSource.ts` §`normalizeThing` — Field mapping pattern for BGG→internal model
- `/Users/estvmachine/Projects/personal/bgg-graphql-proxy/src/datasources/bggDataSource.ts` §`enforceRateLimit` — In-memory rate limiter (port to Solid Cache)

### Reference UI (Collection Data Shape)
- `/Users/estvmachine/Projects/personal/bggeek-shared-list/src/components/CollectionsList.tsx` — How the frontend consumes collection data (user-facing field requirements)

### Project Requirements & Architecture
- `.planning/REQUIREMENTS.md` §BGG-01 through BGG-07 — BGG integration requirements
- `.planning/ROADMAP.md` §Phase 2 — Phase goal and success criteria
- `.planning/STATE.md` — Current project state and decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Integration Points
- `config/initializers/dotenv_bggeek.rb` — `BGG_TOKEN` is already loaded server-side; the BGG client will use it for authentication
- `Gemfile` — Faraday + Nokogiri + solid_queue + solid_cache gems will be added
- No existing models or migrations yet — Phase 2 creates the first database schema beyond the Rails defaults

### Established Patterns (from Phase 1)
- Security constants in class bodies (like `max_depth 15` in the GraphQL schema)
- Procfile.dev as the dev orchestration point (BGG jobs don't need a dev worker yet — synchronous testing in dev is fine)
- RSpec + factory pattern for testing

</code_context>

<specifics>
## Specific Ideas

- Port XML fixture files from `bgg-graphql-proxy/src/__tests__/` for realistic test data
- Use the `stevmachine_collection.xml` fixture name pattern from the reference proxy for test fixtures
- The rate limiter should be testable without waiting real seconds: inject a time provider or use `Timecop.freeze`
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 2-BGG Integration Layer + Persistence*
*Context gathered: 2026-07-03*
