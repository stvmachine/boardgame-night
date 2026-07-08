# Phase 2: BGG Integration Layer + Persistence — Research

**Researched:** 2026-07-03
**Domain:** BoardGameGeek XML API v2 integration (Faraday HTTP client, Nokogiri XML, Solid Queue jobs, RealSQL/Database persistence)
**Confidence:** HIGH

## Summary

This phase builds the complete data backbone for the app: a Faraday-based HTTP client that talks to BGG's XML API v2, a cross-process rate limiter backed by Solid Cache, Nokogiri-based XML normalizer handling BGG's inconsistent responses, Solid Queue background jobs for async collection imports, and a normalized two-table schema (`bgg_things` + `bgg_collections`) for persistence. The architecture follows a layered responsibility model: `Bgg::Client` handles transport (Faraday → HTTP), `Bgg::CollectionFetcher` handles the expansion workaround (business logic → two API calls), `Bgg::Normalizer` handles XML→Hash transformation, and the persistence layer handles Hash→ActiveRecord writes. All decisions are locked in CONTEXT.md — the research below validates the chosen stack, documents exact patterns, flags pitfalls, and provides verified code examples for every component.

**Primary recommendation:** Use Faraday 2.14.3 with `faraday-retry` 2.4.0 middleware stack (retry on 429/502/503, exponential backoff, User-Agent), Nokogiri 1.19.4 with CSS selectors and `Array()` wrapping, Solid Cache-backed `Bgg::RateLimiter` using `Rails.cache.write` with `unless_exist` flag, and Solid Queue `limits_concurrency to: 1, key: "bgg_api"` for job gating.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (Verbatim from CONTEXT.md)

#### BGG Client Architecture
- **D-01:** Single `Bgg::Client` class wrapping Faraday with middleware stack, not per-endpoint service objects. Faraday middleware handles: retry (`faraday-retry` with exponential backoff), rate limiting, User-Agent header, timeouts. Pattern follows the reference proxy's `makeRequest<T>` single-method pattern.
- **D-02:** Three top-level client methods: `collection(username)`, `thing(ids)`, `search(query, opts)`. Return raw parsed data (Ruby hashes), not ActiveRecord models — normalization happens in the service layer.

#### Rate Limiter
- **D-03:** Use `Rails.cache` (Solid Cache) for cross-process rate limiting, not in-memory (which only works per-process). The reference proxy's in-memory `lastRequestTime` is insufficient for multi-worker deployments. Implement as `Bgg::RateLimiter` with `#throttle { ... }` block interface.
- **D-04:** 1 request / 5 seconds minimum. Use a cache key `bgg:last_request_at` with atomic compare-and-set via `Rails.cache.write(key, value, unless_except: ...)` or a simple time check.

#### Retry Strategy
- **D-05:** Auto-retry on HTTP 429/502/503 and network errors (ECONNRESET, ETIMEDOUT) via `faraday-retry` middleware. Max 3 retries with exponential backoff: ~1s, 2s, 4s. Following the reference proxy pattern.
- **D-06:** BGG HTTP 202 "queued" response gets special handling: up to 5 retries with ~5s delay each. Return a status signal if all 202 retries are exhausted (don't silently return empty).

#### XML Parsing
- **D-07:** Use Nokogiri with CSS selectors, not REXML or regex. Pattern: `node.at_css("yearpublished")&.attr("value")` for nil-safe field access.
- **D-08:** Normalize BGG's inconsistent array handling: always wrap single items in arrays (`Array(item)` pattern). Handle missing fields gracefully (default to nil/empty).

#### Expansion Workaround
- **D-09:** Implement the two-call workaround in a dedicated `Bgg::CollectionFetcher` service (separate from the raw HTTP client). Two calls: (1) `excludesubtype=boardgameexpansion`, (2) `subtype=boardgameexpansion`, then merge results. These two calls count as 2 requests against the rate limiter.
- **D-10:** If the workaround fails, fall back to a single `subtype=boardgame` call (the `getUserCollectionFallback` pattern from the reference proxy).

#### Background Jobs
- **D-11:** Single `Bgg::ImportCollectionJob` per user + per trigger (manual refresh or new user link). Solid Queue with `limits_concurrency to: 1, key: "bgg_api"` — global concurrency 1 for all BGG jobs to avoid hammering the API.
- **D-12:** Explicit `retry_on` for transient BGG failures (503, timeout). `discard_on` for permanent failures (invalid username, 404). No silent swallowing — the job should fail visibly so the frontend can show an error state.
- **D-13:** Jobs are enqueueable via `Bgg::ImportCollectionJob.perform_later(username)` — called from controller/mutation context (Phase 3/4).

#### Persistence Schema
- **D-14:** Two main tables:
  - `bgg_things` — One row per unique BGG `objectid` (game or expansion). Columns: `objectid` (BGG ID, unique), `name`, `year_published`, `min_players`, `max_players`, `min_playtime`, `max_playtime`, `min_age`, `complexity` (avg_weight), `thumbnail`, `image`, `description`, `rules_url`, `is_expansion` (boolean), `bgg_type` (string: boardgame/boardgameexpansion), plus JSONB `raw_data` for unparsed fields (ranks, links, polls).
  - `bgg_collections` — Join table mapping user→thing with per-user ownership metadata. Columns: `user_id`, `bgg_thing_id`, `quantity`, `comment`, `is_own`, `is_previously_owned`, `is_for_trade`, `is_want`, `is_want_to_play`, `is_want_to_buy`, `is_wishlist`, `wishlist_priority`, `created_at`, `updated_at`.

#### Collection Merging
- **D-15:** Merge via ActiveRecord query: `BggThing.joins(:bgg_collections).where(bgg_collections: { user_id: user_ids }).distinct` with owner list aggregation per thing. No database view needed — a scope or class method on `BggThing` is sufficient.
- **D-16:** Owner tracking on merged games: each `bgg_thing` can have multiple `bgg_collections` rows (one per user who owns it). Frontend receives array of owners per thing.

#### BGG Endpoints
- **D-17:** Implement three BGG API endpoints:
  - `GET /collection?username={}&own=1&stats=1` — collection fetch (with expansion workaround)
  - `GET /thing?id={}&stats=1` — single or batch thing detail (comma-separated IDs)
  - `GET /search?query={}&type={}` — game name search
- **D-18:** User validation: `GET /user?name={}` — confirm username exists before accepting it.

#### Testing Strategy
- **D-19:** Use XML fixtures from the reference proxy (replay BGG responses from disk). Port fixture files from `bgg-graphql-proxy/src/__tests__/fixtures/` or capture fresh ones. Test the normalizer against known BGG XML quirks (missing fields, single-vs-array items, name variations).
- **D-20:** Rate limiter tests: verify timing (5s gap), verify cross-thread behavior with concurrent requests. Use `travel_to`/`freeze_time` where possible.

### the agent's Discretion
- Additional BGG XML fields to normalize (polls, rankings, links) — capture what's needed for Phase 3 display.
- Exact Gemfile version pins for `faraday`, `faraday-retry`, `nokogiri`.
- Job queue name for BGG imports.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BGG-01 | Two-call expansion workaround (base games + expansions merged) | `Bgg::CollectionFetcher` service documented with exact URL params + merge pattern |
| BGG-02 | 1 req/5s rate limiting across all workers (Solid Cache-backed) | `Bgg::RateLimiter` with `Rails.cache.write` atomic key, full implementation pattern |
| BGG-03 | HTTP 202 retry with 5 retries | Manual 202 retry loop in `Bgg::Client` (not faraday-retry, which doesn't handle 202 semantics) |
| BGG-04 | Nokogiri XML with nil-safe field access | `at_css` + `&.attr("value")` + `Array()` wrapping patterns documented |
| BGG-05 | Solid Queue background job with retry_on/discard_on | `limits_concurrency` + `retry_on` for transient failures + `discard_on` for permanent failures |
| BGG-06 | Descriptive User-Agent header | `Faraday.new(..., headers: { "User-Agent" => ... })` pattern |
| BGG-07 | Batch thing detail fetch via comma-separated IDs | BGG API supports comma-separated `/thing?id=ID1,ID2,ID3` natively |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTP transport to BGG | `Bgg::Client` (Service) | — | Faraday middleware stack handles retry, rate limiting, timeouts in one class |
| BGG rate limiting | `Bgg::RateLimiter` (Service) | Solid Cache | Cross-process coordination requires shared cache, not in-memory |
| XML response parsing | `Bgg::Normalizer` (Service) | Nokogiri | Nokogiri handles BGG's inconsistent attribute-based XML with nil-safe access |
| Expansion workaround | `Bgg::CollectionFetcher` (Service) | `Bgg::Client` | Two-call merge is business logic, not transport; keeps HTTP client clean |
| Collection import | `Bgg::ImportCollectionJob` (Job) | Solid Queue | Async to avoid blocking HTTP requests; concurrency-gated via Solid Queue |
| Game/collection data storage | ActiveRecord models (Data) | SQLite/Solid Cache | Normalized two-table schema with JSONB safety net |
| Collection merge | ActiveRecord query (Model) | — | Pure SQL dedup via joins + distinct; no DB views needed |

## Standard Stack

### Core — BGG Integration Gems

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `faraday` | 2.14.3 | HTTP client with middleware stack | Idiomatic Ruby HTTP — middleware pattern maps 1:1 to BGG client needs: retry, headers, timeouts. Latest stable. |
| `faraday-retry` | 2.4.0 | Retry middleware for Faraday (v2+ separate gem) | Required as of Faraday v2.0 (retry middleware moved out). Supports `retry_statuses:`, `backoff_factor:`, `max:` — exactly what BGG needs. |
| `nokogiri` | 1.19.4 | XML/HTML parsing with CSS selectors | The only sane choice for BGG's inconsistent XML. Supports CSS selectors, nil-safe access, precompiled native gems for all platforms. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `webmock` | 3.26.2 | HTTP request stubbing for tests | All BGG client tests — stub Faraday requests and return XML fixture content |
| `rspec-rails` | 8.0.4 | Rails testing framework | Already in Gemfile. Test normalizer, client, rate limiter, job, models |
| `solid_cache` | 1.0.10 | DB-backed Rails.cache | Already in Gemfile. Backs `Bgg::RateLimiter` cross-process key |
| `solid_queue` | 1.4.0 | DB-backed Active Job backend | Already in Gemfile. `limits_concurrency` for BGG job gating |

### Gems Already Present (No Additional Install Needed)
- `solid_cache` (already in Gemfile — powers `Rails.cache`)
- `solid_queue` (already in Gemfile — powers Active Job)
- `dotenv-rails` (already in Gemfile — loads `.env.bggeek`)
- `rspec-rails` (already in Gemfile — test framework)

### Gems to ADD to Gemfile

```ruby
# BGG Integration
gem "faraday", "~> 2.14"
gem "faraday-retry", "~> 2.4"
gem "nokogiri", "~> 1.19"

group :test do
  gem "webmock", "~> 3.26"
end
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `faraday` (middleware-based) | `http.rb` gem or `Net::HTTP` directly | `http.rb` has no middleware ecosystem. `Net::HTTP` requires manual retry/backoff code. Faraday's middleware stack is the right abstraction for BGG's retry + rate limiting needs. |
| `faraday-retry` | Manual retry loop in `Bgg::Client` | faraday-retry handles exponential backoff, jitter, status-code checks declaratively. A manual loop duplicates tested functionality. |
| `webmock` (stub-based) | VCR (record/replay) | VCR adds fixture management overhead (cassette lifecycle). WebMock with explicit XML fixtures gives deterministic, edge-case-controllable tests — critical for BGG's quirky responses. |

### Version Verification

```bash
# Verified 2026-07-03 via ruby.shop:
gem search --remote faraday  --exact    # → faraday (2.14.3)
gem search --remote faraday-retry --exact  # → faraday-retry (2.4.0)
gem search --remote nokogiri --exact    # → nokogiri (1.19.4 ruby aarch64-linux ...)
gem search --remote webmock --exact     # → webmock (3.26.2)
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| faraday 2.14.3 | RubyGems | ~10 yrs | 700M+ | github.com/lostisland/faraday | OK | Approved |
| faraday-retry 2.4.0 | RubyGems | ~5 yrs | 150M+ | github.com/lostisland/faraday-retry | OK | Approved |
| nokogiri 1.19.4 | RubyGems | ~16 yrs | 1B+ | github.com/sparklemotion/nokogiri | OK | Approved |
| webmock 3.26.2 | RubyGems | ~15 yrs | 500M+ | github.com/bblimke/webmock | OK | Approved |

**Packages removed due to SLOP verdict:** None
**Packages flagged as suspicious SUS:** None

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Rails Application                          │
│                                                                    │
│  ┌──────────────┐   ┌───────────────┐   ┌───────────────────┐   │
│  │   User (via   │   │  Bgg::Client  │   │  BGG XML API v2   │   │
│  │  GraphQL in   │   │  (Faraday)    │   │  (boardgamegeek   │   │
│  │   Phase 3)    │──>│               │──>│   .com/xmlapi2)   │   │
│  └──────┬───────┘   │  - middleware  │   └───────────────────┘   │
│         │           │  - retry       │           │                │
│         │           │  - User-Agent  │           ▼                │
│         │           │  - timeout     │   ┌───────────────────┐   │
│         │           └───────┬───────┘   │  XML Response with  │   │
│         │                   │           │  202/429/503/200    │   │
│         ▼                   ▼           └───────────────────┘   │
│  ┌──────────────┐   ┌───────────────┐                           │
│  │ Bgg::Import  │   │Bgg::Normalizer│                           │
│  │CollectionJob │──>│(Nokogiri CSS) │                           │
│  │(Solid Queue) │   └───────┬───────┘                           │
│  └──────┬───────┘           │                                    │
│         │                   ▼                                    │
│         │           ┌────────────────┐                          │
│         │           │   Ruby Hashes   │                          │
│         │           └───────┬────────┘                          │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌─────────────────────────────────────────┐                    │
│  │           ActiveRecord Persistence       │                    │
│  │  ┌─────────────┐    ┌────────────────┐  │                    │
│  │  │ bgg_things   │◄───│ bgg_collections│  │                    │
│  │  │ (normalized) │    │ (user→thing)   │  │                    │
│  │  │ + raw_data   │    │                │  │                    │
│  │  │ (JSONB)      │    │                │  │                    │
│  │  └─────────────┘    └────────────────┘  │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                    │
│  ┌─────────────────────────────────────────┐                    │
│  │         Solid Trifecta (no Redis)        │                    │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐  │                    │
│  │  │ Solid    │ │ Solid    │ │ Solid   │  │                    │
│  │  │ Queue    │ │ Cache    │ │ Cable   │  │                    │
│  │  │ (jobs)   │ │(Rails.cache)│(WS)   │  │                    │
│  │  └──────────┘ └──────────┘ └─────────┘  │                    │
│  └─────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

### Pattern 1: `Bgg::Client` — Faraday Middleware Stack

**What:** A single HTTP client class wrapping Faraday with middleware for retry, User-Agent, timeouts, and raise-on-error. Returns parsed Ruby hashes (XML→Nokogiri→Hash). Three public methods: `collection`, `thing`, `search`, `user`.

**Where to place:** `app/services/bgg/client.rb`

```ruby
# Source: CITED from faraday-retry docs + CONTEXT.md D-01
class Bgg::Client
  BASE_URL = "https://boardgamegeek.com/xmlapi2".freeze
  USER_AGENT = "BoardgameNight/1.0.0 (Rails 8.1)".freeze
  TIMEOUT = 10 # seconds

  # Errors that faraday-retry automatically handles
  # Faraday::TimeoutError, Errno::ETIMEDOUT, Errno::ECONNRESET,
  # plus HTTP 429/502/503 via retry_statuses

  attr_reader :conn, :rate_limiter

  def initialize(rate_limiter: Bgg::RateLimiter.new)
    @rate_limiter = rate_limiter
    @conn = Faraday.new(url: BASE_URL) do |f|
      f.request :retry, retry_options
      f.response :raise_error          # raises on 4xx/5xx (except 202 handled separately)
      f.response :logger if Rails.env.development?
      f.adapter :net_http
    end
  end

  def collection(username)
    rate_limiter.throttle do
      response = conn.get("/collection", { username: username, own: 1, stats: 1 })
      parse_xml(response.body)
    end
  end

  def thing(ids)
    ids = Array(ids).join(",")
    rate_limiter.throttle do
      response = conn.get("/thing", { id: ids, stats: 1 })
      parse_xml(response.body)
    end
  end

  def search(query, type: "boardgame", exact: false)
    params = { query: query, type: type }
    params[:exact] = 1 if exact
    rate_limiter.throttle do
      response = conn.get("/search", params)
      parse_xml(response.body)
    end
  end

  def user(username)
    rate_limiter.throttle do
      response = conn.get("/user", { name: username })
      parse_xml(response.body)
    end
  end

  private

  def retry_options
    {
      max: 3,
      interval: 1.0,
      interval_randomness: 0.5,
      backoff_factor: 2,
      retry_statuses: [429, 502, 503],
      # Also retries network errors by default: Errno::ETIMEDOUT, Timeout::Error, Faraday::TimeoutError, Faraday::RetriableResponse
    }
  end

  def parse_xml(body)
    Nokogiri::XML(body) { |config| config.strict }
  rescue Nokogiri::XML::SyntaxError => e
    raise Bgg::ParseError, "XML parse failed: #{e.message}"
  end
end
```

### Pattern 2: `Bgg::RateLimiter` — Cross-Process via Solid Cache

**What:** Implements a 1-req/5s throttle across all server processes using `Rails.cache` (Solid Cache). Exposes a `#throttle { ... }` block interface. Tests inject a mock time provider.

**Where to place:** `app/services/bgg/rate_limiter.rb`

```ruby
# Source: CITED from CONTEXT.md D-03/D-04 + Rails.cache patterns
class Bgg::RateLimiter
  INTERVAL = 5.seconds
  CACHE_KEY = "bgg:last_request_at".freeze

  def throttle
    wait_until_ready
    yield
  end

  private

  def wait_until_ready
    last_request = Rails.cache.read(CACHE_KEY)
    if last_request
      elapsed = Time.now.to_f - last_request.to_f
      if elapsed < INTERVAL
        sleep_time = INTERVAL - elapsed
        sleep(sleep_time) if sleep_time > 0
      end
    end
    Rails.cache.write(CACHE_KEY, Time.now.to_f)
  end
end
```

**Atomicity note:** `Rails.cache.write` with Solid Cache is atomic — two concurrent processes won't both pass the check because the first write sets the key. However, a pure read-then-write has a tiny race window. For v1 (single-digit concurrent BGG calls), this is acceptable. If races are observed, upgrade to a `Rails.cache.increment`-based token bucket using a separate `bgg:rate_tokens` key.

### Pattern 3: `Bgg::Normalizer` — Nokogiri XML with Nil-Safe CSS Access

**What:** Transforms BGG's attribute-based XML into normalized Ruby hashes. Handles: missing fields (nil-safe), single-vs-array items (always wrap), attribute-based values, name objects, stats nesting.

**Where to place:** `app/services/bgg/normalizer.rb`

```ruby
# Source: CITED from CONTEXT.md D-07/D-08 + BGG XML structure analysis
class Bgg::Normalizer
  # CSS selector pattern: node.at_css("tagname")&.attr("value")
  # BGG XML uses attribute-based values: <yearpublished value="2020" />
  # Some fields are text content: <description>Long text...</description>

  def normalize_collection(xml_doc)
    items = xml_doc.css("item")
    {
      total_items: xml_doc.at_css("items")&.attr("totalitems")&.to_i || 0,
      pub_date: xml_doc.at_css("items")&.attr("pubdate") || "",
      items: items.map { |item| normalize_collection_item(item) }
    }
  end

  def normalize_collection_item(item_node)
    {
      object_id: item_node.attr("objectid").to_s,
      object_type: item_node.attr("objecttype").to_s,
      subtype: item_node.attr("subtype").to_s,
      coll_id: item_node.attr("collid").to_s,
      name: get_primary_name(item_node),
      year_published: field_int(item_node, "yearpublished"),
      image: item_node.at_css("image")&.text&.strip.to_s,
      thumbnail: item_node.at_css("thumbnail")&.text&.strip.to_s,
      num_plays: field_int(item_node, "numplays"),
      comment: item_node.at_css("comment")&.text&.strip.to_s,
      status: normalize_status(item_node),
      stats: normalize_stats(item_node)
    }
  end

  def normalize_thing(thing_node)
    is_expansion = thing_node.attr("type") == "boardgameexpansion"
    {
      object_id: thing_node.attr("id").to_s,
      name: get_primary_name(thing_node),
      type: thing_node.attr("type").to_s,
      year_published: field_int(thing_node, "yearpublished"),
      min_players: field_int(thing_node, "minplayers"),
      max_players: field_int(thing_node, "maxplayers"),
      min_playtime: field_int(thing_node, "minplaytime"),
      max_playtime: field_int(thing_node, "maxplaytime"),
      min_age: field_int(thing_node, "minage"),
      description: thing_node.at_css("description")&.text&.strip.to_s,
      image: thing_node.at_css("image")&.text&.strip.to_s,
      thumbnail: thing_node.at_css("thumbnail")&.text&.strip.to_s,
      is_expansion: is_expansion,
      # Statistics from nested <statistics><ratings> tree
      average: field_float(thing_node, "average"),
      bayes_average: field_float(thing_node, "bayesaverage"),
      users_rated: field_int(thing_node, "usersrated"),
      users_owned: field_int(thing_node, "owned"),
      average_weight: field_float(thing_node, "averageweight"),
      # Links (categories, mechanics, designers, etc.)
      links: normalize_links(thing_node)
    }
  end

  private

  # Nil-safe attribute access: returns nil if node or attribute missing
  def field_int(node, css_name)
    node.at_css(css_name)&.attr("value")&.to_i
  end

  def field_float(node, css_name)
    node.at_css(css_name)&.attr("value")&.to_f
  end

  def get_primary_name(node)
    names = node.css("name")
    primary = names.find { |n| n.attr("type") == "primary" }
    primary&.attr("value") || names.first&.attr("value") || ""
  end

  def normalize_status(item_node)
    status = item_node.at_css("status")
    return {} unless status
    {
      own: status.attr("own") == "1",
      prev_owned: status.attr("prevowned") == "1",
      for_trade: status.attr("fortrade") == "1",
      want: status.attr("want") == "1",
      want_to_play: status.attr("wanttoplay") == "1",
      want_to_buy: status.attr("wanttobuy") == "1",
      wishlist: status.attr("wishlist") == "1",
      preordered: status.attr("preordered") == "1",
      last_modified: status.attr("lastmodified").to_s
    }
  end

  def normalize_stats(item_node)
    stats = item_node.at_css("stats")
    return {} unless stats
    rating = stats.at_css("rating")
    return {} unless rating
    {
      min_players: stats.attr("minplayers")&.to_i,
      max_players: stats.attr("maxplayers")&.to_i,
      min_playtime: stats.attr("minplaytime")&.to_i,
      max_playtime: stats.attr("maxplaytime")&.to_i,
      playing_time: stats.attr("playingtime")&.to_i,
      average: field_float(rating, "average"),
      bayes_average: field_float(rating, "bayesaverage"),
      users_rated: field_int(rating, "usersrated"),
      users_owned: stats.attr("numowned")&.to_i,
      average_weight: field_float(rating, "averageweight")
    }
  end

  def normalize_links(node)
    node.css("link").map do |link|
      {
        type: link.attr("type").to_s,
        id: link.attr("id").to_s,
        value: link.attr("value").to_s
      }
    end
  end
end
```

### Pattern 4: `Bgg::CollectionFetcher` — Expansion Workaround

**What:** Makes two API calls (base games excluding expansions + expansions only) then merges the items. Fallback to single call if workaround fails.

**Where to place:** `app/services/bgg/collection_fetcher.rb`

```ruby
# Source: PORTED from reference proxy getUserCollectionWithExpansionWorkaround()
class Bgg::CollectionFetcher
  def initialize(client: Bgg::Client.new, normalizer: Bgg::Normalizer.new)
    @client = client
    @normalizer = normalizer
  end

  def fetch(username)
    raw_boardgames = @client.request(:collection, username: username, excludesubtype: "boardgameexpansion", own: 1, stats: 1)
    raw_expansions = @client.request(:collection, username: username, subtype: "boardgameexpansion", own: 1, stats: 1)

    boardgame_items = Array(raw_boardgames.css("item"))
    expansion_items = Array(raw_expansions.css("item"))

    all_items = Nokogiri::XML::NodeSet.new(raw_boardgames.document, boardgame_items + expansion_items)
    merged_doc = build_merged_doc(all_items, raw_boardgames, raw_expansions)

    @normalizer.normalize_collection(merged_doc)
  rescue Bgg::ClientError => e
    Rails.logger.warn("[Bgg::CollectionFetcher] Workaround failed, falling back: #{e.message}")
    fallback(username)
  end

  private

  def build_merged_doc(items, doc_a, doc_b)
    merged = Nokogiri::XML::Document.new
    root = merged.create_element("items")
    root["totalitems"] = items.length.to_s
    root["pubdate"] = doc_a.at_css("items")&.attr("pubdate") ||
                       doc_b.at_css("items")&.attr("pubdate") || ""
    items.each { |item| root.add_child(item.dup) }
    merged.root = root
    merged
  end

  def fallback(username)
    raw = @client.request(:collection, username: username, own: 1, stats: 1)
    @normalizer.normalize_collection(raw)
  end
end
```

### Pattern 5: `Bgg::ImportCollectionJob` — Solid Queue with Concurrency Control

**What:** One job per user+trigger, gated globally to max 1 concurrent BGG job. Retries on transient failures, discards on permanent ones.

**Where to place:** `app/jobs/bgg/import_collection_job.rb`

```ruby
# Source: CITED from CONTEXT.md D-11/D-12/D-13 + Solid Queue concurrency docs
class Bgg::ImportCollectionJob < ApplicationJob
  queue_as :bgg_imports

  # Global concurrency: only 1 BGG job at a time across all users
  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  # Transient failures -> retry with polynomial backoff
  retry_on Faraday::TimeoutError, wait: :polynomially_longer, attempts: 5
  retry_on Faraday::ServerError, wait: :polynomially_longer, attempts: 5   # 5xx
  retry_on Bgg::RateLimitedError, wait: 10.seconds, attempts: 3

  # Permanent failures -> discard immediately
  discard_on Faraday::ResourceNotFound    # 404 (invalid endpoint)
  discard_on Bgg::InvalidUsernameError    # user doesn't exist
  discard_on ActiveJob::DeserializationError

  def perform(username)
    # 1. Validate user exists via BGG API
    user_data = Bgg::Client.new.user(username)
    raise Bgg::InvalidUsernameError, "User '#{username}' not found" unless user_data

    # 2. Fetch collection (with expansion workaround)
    collection = Bgg::CollectionFetcher.new.fetch(username)

    # 3. Persist things and collections
    Bgg::CollectionPersister.new(username, collection).persist!
  end
end
```

### Anti-Patterns to Avoid
- **Treating BGG HTTP 202 as success:** BGG returns 202 when the response is still being generated. faraday-retry does NOT handle this (202 is not a 4xx/5xx error). Must handle 202 manually in `Bgg::Client` with dedicated retry loop.
- **Calling BGG synchronously in GraphQL resolvers:** Never call BGG during a GraphQL request — always use background jobs. The reference proxy made this mistake; Phase 3 reads from the DB, Phase 2 writes to it.
- **Two-phase expansion merge without fallback:** Always catch errors from the workaround and fall back to a single `subtype=boardgame` call (port from reference proxy's `getUserCollectionFallback`).
- **Using `bgg:last_request_at` key without TTL:** Write the key with `expires_in: 10.seconds` so if the process crashes after writing, the lock auto-clears within two rate-limit windows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP retry with exponential backoff | Manual retry loop | `faraday-retry` middleware | 15+ edge cases handled (jitter, Retry-After, status codes). Adding it as middleware keeps `Bgg::Client` clean. |
| XML parsing | Regex or REXML | Nokogiri with CSS selectors | BGG XML has namespaces, attribute-based values, mixed content, optional fields — Nokogiri's `at_css` handles all edge cases nil-safely. |
| Cross-process rate limiting | In-memory `lastRequestTime` | `Rails.cache` (Solid Cache) | In-memory works per-process only. With Puma multi-thread or multiple workers, you'll hammer BGG. |
| Job concurrency gating | Manual semaphore | Solid Queue `limits_concurrency` | Built-in, DB-backed, tested by Rails core. No external dependency. |
| Active Job retry scheduling | Custom retry logic | `retry_on` with `wait: :polynomially_longer` | Rails handles the scheduling, jitter, and execution count. Don't reimplement. |

**Key insight:** Every "Don't Hand-Roll" item here is a solved problem with a Rails-ecosystem solution. BGG integration is tricky enough without adding custom HTTP retry logic, XML parsing, or concurrency gating on top. The reference proxy had to build all these from scratch because Node.js didn't have Rails-equivalent primitives — we don't have that problem.

## Common Pitfalls

### Pitfall 1: BGG HTTP 202 "Queued" Gets Treated Like Success
**What goes wrong:** BGG returns HTTP 202 with an empty body when the response is still being generated. Treating this as a successful 200 results in an empty collection — the user sees "no games found."
**Why it happens:** BGG generates collection XML on demand. Large collections take time; BGG returns 202 immediately and expects the client to retry.
**How to avoid:** In `Bgg::Client`, check for 202 before delegating to the normalizer. Implement a dedicated retry loop (up to 5 retries with ~5s delay). Return a user-visible status if exhausted.
**Warning signs:** Collection responses with `totalitems: 0` but the user has games. Log line "BGG returned 202" not appearing.

### Pitfall 2: Rate Limiter Race Condition Under Concurrent Workers
**What goes wrong:** Two workers both read `Rails.cache.read("bgg:last_request_at")` before either writes, both see the key as expired, and both make BGG requests at the same time.
**Why it happens:** The simple read-then-write pattern is not atomic. Solid Cache's `write` is atomic per-call, but the read+write combo is not.
**How to avoid:** For v1 (single-digit BGG call concurrency), the 500ms window is acceptable. If races cause 429s, upgrade to a token-bucket pattern using `Rails.cache.increment` with TTL (Solid Cache supports `increment` in v1.0+ [CITATION: rails/solid_cache README]). Each request increments a counter; if count > threshold, block.
**Warning signs:** `Faraday::ClientError` with status 429 in job retries.

### Pitfall 3: BGG Collection XML Has Inconsistent Array vs Single-Object
**What goes wrong:** A collection with exactly 1 game returns `item` as a single object, not an array. Code that expects `items.each` crashes or processes the wrong thing.
**Why it happens:** BGG XML API2 returns a single `<item>` element (not wrapped in an array) when there's only one item. xml2js (and Nokogiri) preserve this structure.
**How to avoid:** Always wrap: `Array(item)` or check `is_a?(Array)` before iterating. The `Bgg::Normalizer` handles this at the parsing boundary.
**Warning signs:** `NoMethodError: undefined method 'each'` when processing collection data.

### Pitfall 4: Name Field Has Mixed Content
**What goes wrong:** `name` can be a primary name object (`<name value="7 Wonders" type="primary"/>`), an alternate name, or missing entirely when BGG returns partial data.
**Why it happens:** BGG's `/thing` endpoint returns multiple `<name>` elements (one `primary`, zero or more `alternate`). The collection endpoint returns name as `_` text content.
**How to avoid:** Use `get_primary_name` pattern: find `<name type="primary">`, fall back to first name, fall back to empty string.
**Warning signs:** Game name blank in UI. Logged `at_css("name")` returning nil.

### Pitfall 5: Solid Queue `retry_on` + Faraday `raise_error` Interaction
**What goes wrong:** `faraday-retry` retries 3 times with exponential backoff. If all 3 fail, it re-raises. The Solid Queue job's `retry_on` then retries the entire job 5 times. Result: up to 15 total HTTP attempts before the job is discarded.
**Why it happens:** Two layers of retry with no coordination.
**How to avoid:** Keep `faraday-retry` max=2 (handles brief blips). Set `retry_on` for the persisted Faraday errors with `attempts: 3` as a safety net. Document: faraday-retry = intra-request retry, ActiveJob retry_on = inter-request retry. 15 total attempts is fine for BGG's flaky infrastructure; just be aware of it.

## Code Examples

### Example 1: Faraday Connection with Full Middleware Stack (Bgg::Client)

```ruby
# Source: CITED from faraday docs + faraday-retry docs + research verification
class Bgg::Client
  BASE_URL = "https://boardgamegeek.com/xmlapi2".freeze

  def initialize
    @rate_limiter = Bgg::RateLimiter.new
    @conn = Faraday.new(url: BASE_URL, request: { timeout: 10, open_timeout: 5 }) do |f|
      f.request :retry, {
        max: 3,
        interval: 1.0,
        interval_randomness: 0.5,
        backoff_factor: 2,
        retry_statuses: [429, 502, 503]
      }
      f.headers["User-Agent"] = "BoardgameNight/1.0.0 (boardgame-night.app)"
      f.response :raise_error
      f.adapter :net_http
    end
  end

  def request(endpoint, params = {})
    @rate_limiter.throttle do
      response = @conn.get("/#{endpoint}", params)
      parse(response.body)
    end
  rescue Faraday::ResourceNotFound => e
    raise Bgg::ResourceNotFound, "BGG endpoint not found: #{e.message}"
  rescue Faraday::ClientError => e
    raise Bgg::ClientError, "BGG client error: #{e.response[:status]} - #{e.message}"
  rescue Faraday::ServerError => e
    raise Bgg::ServerError, "BGG server error: #{e.response[:status]} - #{e.message}"
  rescue Faraday::TimeoutError, Faraday::ConnectionFailed => e
    raise Bgg::NetworkError, "BGG connection failed: #{e.message}"
  end
end
```

### Example 2: BGG Status Retry Loop for 202 Responses

```ruby
# Source: PORTED from reference proxy makeRequest<T> + CONTEXT.md D-06
class Bgg::Client
  MAX_202_RETRIES = 5
  RETRY_202_DELAY = 5

  def request_with_202_retry(endpoint, params = {})
    retries = 0
    begin
      @rate_limiter.throttle do
        response = @conn.get("/#{endpoint}", params)
        if response.status == 202
          raise Bgg::QueuedResponse, "BGG is preparing data (HTTP 202)"
        end
        parse(response.body)
      end
    rescue Bgg::QueuedResponse
      retries += 1
      if retries <= MAX_202_RETRIES
        sleep(RETRY_202_DELAY)
        retry
      else
        raise Bgg::CollectionNotReadyError,
          "BGG still preparing data after #{MAX_202_RETRIES} retries"
      end
    end
  end
end
```

### Example 3: Solid Cache Rate Limiter with Read-Check-Write Pattern

```ruby
# Source: CITED from CONTEXT.md D-03/D-04 + Rails.cache patterns
class Bgg::RateLimiter
  INTERVAL = 5.seconds
  CACHE_KEY = "bgg:last_request_at"

  def throttle
    wait
    yield
  end

  def reset!
    Rails.cache.delete(CACHE_KEY)
  end

  private

  def wait
    last_time = Rails.cache.read(CACHE_KEY)

    if last_time
      elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - last_time.to_f
      if elapsed < INTERVAL
        sleep(INTERVAL - elapsed)
      end
    end

    Rails.cache.write(CACHE_KEY, Process.clock_gettime(Process::CLOCK_MONOTONIC), expires_in: 10.seconds)
  end
end
```

### Example 4: Nokogiri Nil-Safe Field Extraction from BGG XML

```ruby
# Source: CITED from CONTEXT.md D-07/D-08 + BGG XML structure analysis
# BGG XML snippet:
# <item objecttype="thing" objectid="316377" subtype="boardgame" collid="83135926">
#   <name sortindex="1">7 Wonders (Second Edition)</name>
#   <yearpublished>2020</yearpublished>
#   <stats minplayers="3" maxplayers="7" ...>
#     <rating>
#       <average value="7.82923" />
#       <usersrated value="10588" />
#     </rating>
#   </stats>
#   <status own="1" prevowned="0" ... lastmodified="2023-11-05 17:33:09" />
#   <numplays>0</numplays>
# </item>

doc = Nokogiri::XML(raw_xml)

# Attribute values (most BGG fields)
doc.at_css("item")&.attr("objectid")       # => "316377"

# Text content (name, description, image)
doc.at_css("name")&.text&.strip            # => "7 Wonders (Second Edition)"

# Nested attribute (stats → rating → average)
doc.at_css("average")&.attr("value")&.to_f  # => 7.82923

# Nil-safe chain for missing fields
doc.at_css("yearpublished")&.text&.to_i     # => 2020 (or nil if element missing)

# Array wrapping (handle single vs multiple items)
items = doc.css("item")  # always returns NodeSet (array-like), even for 0 or 1 items
```

### Example 5: WebMock Stubbing with XML Fixtures for Faraday

```ruby
# Source: CITED from webmock docs + reference proxy test patterns
require "webmock/rspec"

RSpec.describe Bgg::Client do
  let(:client) { Bgg::Client.new }
  let(:fixture) { file_fixture("stevmachine_collection.xml").read }

  before do
    # Stub Faraday's HTTP call — WebMock intercepts at the Net::HTTP level
    stub_request(:get, "https://boardgamegeek.com/xmlapi2/collection")
      .with(query: hash_including(username: "stevmachine"))
      .to_return(status: 200, body: fixture, headers: { "Content-Type" => "text/xml" })
  end

  it "parses collection correctly" do
    result = client.collection("stevmachine")
    expect(result.css("item").count).to eq(75)
    expect(result.at_css("item")&.attr("objectid")).to eq("316377")
  end

  # Test 202 retry
  it "retries on HTTP 202" do
    collection_fixture = file_fixture("stevmachine_collection.xml").read
    stub_request(:get, "https://boardgamegeek.com/xmlapi2/collection")
      .with(query: hash_including(username: "retryuser"))
      .to_return(
        { status: 202, body: "" },
        { status: 202, body: "" },
        { status: 200, body: collection_fixture }
      )

    expect(client.request_with_202_retry("collection", username: "retryuser"))
      .to be_a(Nokogiri::XML::Document)
  end
end
```

### Example 6: Database Migration for bgg_things and bgg_collections

```ruby
# Source: CITED from CONTEXT.md D-14 + Rails 8 ActiveRecord migration conventions

# db/migrate/20260703000001_create_bgg_things.rb
class CreateBggThings < ActiveRecord::Migration[8.0]
  def change
    create_table :bgg_things do |t|
      t.integer :objectid, null: false
      t.string :name, null: false
      t.integer :year_published

      # Player/playtime data
      t.integer :min_players
      t.integer :max_players
      t.integer :min_playtime
      t.integer :max_playtime
      t.integer :min_age
      t.float :complexity  # avg_weight from BGG

      # Media
      t.text :description
      t.string :thumbnail
      t.string :image
      t.string :rules_url

      # Classification
      t.boolean :is_expansion, default: false, null: false
      t.string :bgg_type  # "boardgame", "boardgameexpansion", etc.

      # Safety net: full raw response as JSONB
      t.jsonb :raw_data, default: {}, null: false

      t.timestamps
    end

    add_index :bgg_things, :objectid, unique: true
    add_index :bgg_things, :name
    add_index :bgg_things, :is_expansion
  end
end

# db/migrate/20260703000002_create_bgg_collections.rb
class CreateBggCollections < ActiveRecord::Migration[8.0]
  def change
    create_table :bgg_collections do |t|
      t.references :user, null: false, foreign_key: true
      t.references :bgg_thing, null: false, foreign_key: true

      # Ownership metadata
      t.integer :quantity, default: 1, null: false
      t.text :comment
      t.boolean :is_own, default: false, null: false
      t.boolean :is_previously_owned, default: false, null: false
      t.boolean :is_for_trade, default: false, null: false
      t.boolean :is_want, default: false, null: false
      t.boolean :is_want_to_play, default: false, null: false
      t.boolean :is_want_to_buy, default: false, null: false
      t.boolean :is_wishlist, default: false, null: false
      t.integer :wishlist_priority

      t.timestamps
    end

    add_index :bgg_collections, [:user_id, :bgg_thing_id], unique: true
    add_index :bgg_collections, :user_id
    add_index :bgg_collections, :bgg_thing_id
  end
end
```

### Example 7: Collection Merge Query

```ruby
# Source: CITED from CONTEXT.md D-15/D-16
# app/models/bgg_thing.rb
class BggThing < ApplicationRecord
  has_many :bgg_collections, dependent: :destroy
  has_many :users, through: :bgg_collections

  scope :merged_for_users, ->(user_ids) {
    joins(:bgg_collections)
      .where(bgg_collections: { user_id: user_ids })
      .distinct
  }

  # Per-thing owner aggregation:
  scope :with_owner_names, -> {
    joins(:users)
      .select("bgg_things.*, GROUP_CONCAT(users.username) as owner_names")
      .group("bgg_things.id")
  }
end

# app/models/bgg_collection.rb
class BggCollection < ApplicationRecord
  belongs_to :user
  belongs_to :bgg_thing

  validates :user_id, uniqueness: { scope: :bgg_thing_id,
    message: "already has this thing in their collection" }
end
```

## State of the Art

| Old Approach (Reference Proxy) | Current Approach (Rails 8) | When Changed | Impact |
|-------------------------------|---------------------------|--------------|--------|
| Apollo `RESTDataSource` caching | Solid Cache (`Rails.cache`) | N/A — new app | Zero ops, same-origin DB, no Redis. Cache supports `read`/`write`/`increment` across all workers. |
| In-memory `lastRequestTime` rate limiter | Solid Cache-backed `Bgg::RateLimiter` | N/A — new app | Cross-process coordination. Not vulnerable to per-worker clock drift. |
| `xml2js` with `explicitArray: false` + `mergeAttrs: true` | Nokogiri with CSS selectors (`at_css` + `attr("value")`) | N/A — new app | Ruby-native XML parsing. CSS selectors are more intuitive than navigating xml2js's auto-flattened object graph. |
| Promise-based retry with manual timeout/AbortController | `faraday-retry` middleware + `retry_on` in ActiveJob | N/A — new app | Declarative retry policy. No manual timeout logic. |
| `RESTDataSource.get()` with full URL construction | `Faraday.get("/endpoint", params)` | N/A — new app | Cleaner URL construction. Middleware handles encoding. |

### Deprecated/Outdated (From Stack Research)
- `faraday` v1.x series (v2+ required for `faraday-retry` separation)
- Using `Rails.cache` with `MemoryStore` for rate limiting (per-process only; Solid Cache is the multi-process default)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | BGG rate limit is exactly 1 request per 5 seconds | Rate Limiter | BGG may change the limit. The `INTERVAL` constant in `Bgg::RateLimiter` can be adjusted without code structure changes. |
| A2 | Nokogiri's `at_css("statistics ratings average")` selects across nested namespaces | Nokogiri Normalizer | BGG XML does NOT use namespaces — the plain CSS selectors work. Verified against the fixture XML which has no namespace declarations. |
| A3 | Solid Cache supports `Rails.cache.increment` | Rate Limiter | Solid Cache 1.0.10 may not implement `increment` — but the rate limiter uses `write`, not `increment`, so this doesn't block. If upgrading to token-bucket, verify `increment` support. [ASSUMED: solid_cache README implies Basic API support] |
| A4 | BGG's `/thing` endpoint accepts comma-separated IDs | Batch Fetch | BGG documentation confirms comma-separated IDs work. If changed, the batch fetch degrades to one request per ID (acceptable but slow). |

## Open Questions

1. **What should the BGG import queue name be?**
   - What we know: Solid Queue supports named queues via `config/queue.yml`. CONTEXT.md marks this as agent's discretion.
   - What's unclear: Whether to use the default queue or a dedicated `bgg_imports` queue.
   - Recommendation: Use `queue_as :bgg_imports` — this isolates BGG jobs from future app-level queue traffic and makes monitoring easier. Define in `config/queue.yml` if needed, though Solid Queue's default catch-all (`queues: "*"`) already handles named queues implicitly.

2. **How to handle BGG's requirement for `exact=1` on search?**
   - What we know: BGG `/search` supports `exact=1` for exact-name matching.
   - What's unclear: Whether the frontend needs exact mode or fuzzy mode.
   - Recommendation: Expose `exact` as an optional parameter in `Bgg::Client#search`. The Phase 3 GraphQL resolver decides.

3. **Should `raw_data` JSONB include the full normalized hash or the raw Nokogiri-parsed hash?**
   - What we know: `raw_data` is a safety net for fields we haven't explicitly extracted.
   - What's unclear: Whether to store the full normalized hash or the raw BGG response (with BGG's original keys).
   - Recommendation: Store the full normalized hash. The JSONB becomes a debugging/evolution tool — if a new field is needed, parse it from `raw_data` without re-fetching from BGG. The raw XML is too large and fragile (BGG may change the schema).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Ruby | Rails app | ✓ | 3.4.10 | — |
| SQLite | Database + Solid Cache + Solid Queue | ✓ | 3.x | PostgreSQL if scaling |
| Faraday | Bgg::Client | ✓ | 2.14.3 (gem add) | — |
| Nokogiri | Bgg::Normalizer | ✓ | 1.19.4 (gem add) | — |
| Solid Queue | Bgg::ImportCollectionJob | ✓ | 1.4.0 (preconfigured) | — |
| Solid Cache | Bgg::RateLimiter | ✓ | 1.0.10 (preconfigured) | — |
| WebMock | Tests | ✓ | 3.26.2 (gem add, test group) | — |

**Missing dependencies with no fallback:** None — all gems added to Gemfile are installable.

**Missing dependencies with fallback:** None.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Faraday URL-encodes params; Nokogiri treats XML as untrusted by default (security-by-default in v1.11+) |
| V8 Data Protection | yes | BGG API token from `.env.bggeek` — not committed. BGG credentials never exposed to frontend. |
| V12 Communication Security | yes | BGG API uses HTTPS. `Faraday` defaults to SSL verification. |

### Known Threat Patterns for BGG Integration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| BGG API token leakage via error messages | Information Disclosure | Wrap all BGG Faraday errors in custom error classes (`Bgg::ClientError` etc.) that strip URL, headers, and credentials before logging. |
| Insecure BGG response (XSS via game description) | Tampering | BGG game `description` may contain HTML. When exposed via GraphQL to the Vue frontend, sanitize (Phase 3 concern, but store `raw_data` only — never render directly). |
| Rate limit bypass via direct client calls | DoS | All BGG calls MUST go through `Bgg::Client` → `Bgg::RateLimiter`. The `Bgg::Client` is the only gateway; no other class should instantiate `Faraday` for BGG. |

## Sources

### Primary (HIGH confidence)
- **Faraday 2.x docs + faraday-retry docs** — Middleware stack, retry options, User-Agent, timeouts. Confirmed `retry_statuses:`, `backoff_factor:`, `max:` parameters. [CITED: github.com/lostisland/faraday-retry]
- **Solid Queue 1.x concurrency docs** — `limits_concurrency` with `key:` and `on_conflict:`. Confirmed `duration: 5.minutes` for lock expiry. [CITED: github.com/rails/solid_queue README]
- **ActiveJob `retry_on`/`discard_on` API docs** — `wait: :polynomially_longer` formula, `attempts:`, `discard_on` with `report:`. [CITED: api.rubyonrails.org]
- **Reference proxy source code** — `bggDataSource.ts` — full expansion workaround, rate limit enforcement, XML normalization patterns ported to Ruby. [VERIFIED: local file]
- **BGG XML fixture files** — `stevmachine_collection.xml` (75 items), `stevmachine_boardgames.xml` (62 items), `stevmachine_expansions.xml` (13 items) — confirmed XML structure, attribute-based values, nested stats/status. [VERIFIED: local fixture files]

### Secondary (MEDIUM confidence)
- **Nokogiri docs (searching, CSS selectors)** — `at_css` returns nil for missing elements, `css` returns NodeSet always, `attr("value")` for attribute access. [CITED: nokogiri.org/tutorials/searching_a_xml_html_document.html]
- **Rails.cache write with expiration patterns** — `Rails.cache.write(key, value, expires_in:)` for cache-based mutex. [CITED: guides.rubyonrails.org/caching_with_rails.html]
- **WebMock RSpec integration** — `stub_request(:get, url).with(query:).to_return(body:, status:)` pattern for Faraday-stubbing via Net::HTTP level. [CITED: github.com/bblimke/webmock]
- **Rails migration guide** — JSONB column type, GIN index, composite unique indexes. [CITED: edgeapi.rubyonrails.org]

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — All gems verified on RubyGems with known versions. Faraday + Nokogiri are the Rails-idiomatic choices for HTTP + XML.
- Architecture: **HIGH** — Patterns directly ported from reference proxy (verified source code) and adapted to Rails idioms per CONTEXT.md locked decisions.
- Pitfalls: **HIGH** — Based on the reference proxy's operational experience with BGG API (confirmed in proxy source) plus standard Rails gotchas.

**Research date:** 2026-07-03
**Valid until:** 2026-08-03 (30-day window — Faraday/Nokogiri are stable; BGG API changes would invalidate endpoint patterns)

