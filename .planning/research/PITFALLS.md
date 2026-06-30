# Pitfalls Research

**Domain:** Rails 8 API + Vue 3 SPA monorepo with GraphQL, dry-validation, and BoardGameGeek XML API v2 integration
**Researched:** 2026-06-30
**Confidence:** HIGH (BGG API pitfalls verified against existing proxy source code; Rails 8/graphql-ruby/dry-validation verified against official docs via Context7)

## Critical Pitfalls

### Pitfall 1: Losing the BGG Expansion Subtype Workaround

**What goes wrong:**
The BGG collection endpoint returns expansions with `subtype=boardgame` when you query with the default `subtype=boardgame` parameter. Expansions are included in the results but are incorrectly labeled as base games. The rewrite omits the workaround and expansions silently disappear or are miscategorized, breaking the core "shared collection" feature.

**Why it happens:**
This is a documented BGG API bug. The official BGG XML API2 wiki states: "the default (or using subtype=boardgame) returns both boardgame and boardgameexpansion's in your collection... but incorrectly gives subtype=boardgame for the expansions." Developers who don't read the BGG wiki closely assume `subtype=boardgame` returns only base games. The old proxy solved this with a two-call workaround (confirmed in `bggDataSource.ts` lines 251-295 and `bggDataSource.expansion.test.ts`).

**How to avoid:**
Replicate the exact workaround from the old proxy:
1. Call 1: `GET /collection?username=NAME&excludesubtype=boardgameexpansion&stats=1&own=1` (base games only)
2. Call 2: `GET /collection?username=NAME&subtype=boardgameexpansion&stats=1&own=1` (expansions only)
3. Merge the two result sets, summing `totalitems` and concatenating `item` arrays.
4. Have a fallback to the single-call method if the workaround fails (the old proxy does this at line 298-309).
5. Write a test with real fixture XML that verifies 62 boardgames + 13 expansions = 75 total items (the old test at `bggDataSource.expansion.test.ts` line 65 does exactly this).

**Warning signs:**
- User collections show fewer items than the BGG website displays.
- Expansions are missing from shared lists.
- All items have `subtype=boardgame` with no `boardgameexpansion` entries.
- `totalitems` from the API doesn't match the merged item count.

**Phase to address:**
BGG API integration phase (Phase 1 or 2 — the BGG client service layer). This must be a first-class concern, not an afterthought.

---

### Pitfall 2: BGG Rate Limiting — The 5-Second Rule Is Non-Negotiable

**What goes wrong:**
BGG throttles requests aggressively. Sending requests faster than 1 per 5 seconds results in HTTP 500 or 503 errors ("server too busy"). In a multi-user collection app, fetching collections for 5 users = 10 API calls (with the expansion workaround) = 50 seconds minimum. Without rate limiting, the app gets 429/503 storms and appears broken. With naive sequential fetching, the UI feels frozen for a full minute.

**Why it happens:**
BGG's rate limit is documented but easy to underestimate. The old proxy enforces a 5000ms delay between requests (`RATE_LIMIT_DELAY = 5000` at line 19 of `bggDataSource.ts`). The BGG wiki confirms: "Currently, a 5-second wait between requests seems to suffice." A Rails rewrite using Faraday or HTTParty without a rate-limiting middleware will blast BGG and get rate-limited immediately. The old app also fetches collections **sequentially** (see `useCollections.ts` lines 126-143), which is correct for rate limiting but creates a UX problem.

**How to avoid:**
1. Implement a token-bucket or fixed-window rate limiter in the BGG client service (Ruby equivalent of the old `enforceRateLimit()` method). Use `concurrent-ruby` or a mutex to enforce it across threads.
2. **Use Solid Queue (or Sidekiq) for background fetching.** Don't fetch BGG collections synchronously in the GraphQL resolver. Enqueue a job per user, fetch in the background, cache the result, and serve from cache. This transforms a 50-second blocking wait into an async operation.
3. Cache aggressively (see Pitfall 3). Collection data doesn't change minute-to-minute.
4. Implement retry with exponential backoff for 502/503/429 responses (the old proxy uses `[1000, 2000, 4000]` ms delays with `MAX_RETRIES = 3`).
5. Set a 10-second timeout per request (the old proxy uses `AbortController` with 10s timeout).

**Warning signs:**
- Intermittent 503/500 errors from BGG, especially when multiple users load collections simultaneously.
- GraphQL queries timing out.
- BGG returning 202 (queued) responses that never resolve.
- Works fine in development (single user) but breaks in production (concurrent users).

**Phase to address:**
BGG API integration phase + background jobs phase. The rate limiter must exist from day one; the background job pattern can come when the job infrastructure is set up.

---

### Pitfall 3: BGG HTTP 202 "Queued" Response — The Silent Hang

**What goes wrong:**
The BGG collection endpoint returns HTTP 202 (Accepted) instead of 200 when the data isn't cached on their end. This means "we've queued your request, try again later." If the client treats 202 as a normal response, it parses an empty or incomplete XML body and returns an empty collection. The user sees "no games found" even though they have hundreds.

**Why it happens:**
This is unique to the collection endpoint. The BGG wiki states: "if it's 202 (vs 200) then it indicates BGG has queued your request and you need to keep retrying." The old proxy's `makeRequest` method doesn't explicitly handle 202 — it parses whatever XML comes back. The `bgg-api-ts` library (a third-party TS wrapper) handles this by retrying up to 5 times on 202. This is a gap in the old proxy that the rewrite must fix.

**How to avoid:**
1. Check HTTP status code before parsing XML. If 202, wait (e.g., 2-5 seconds) and retry.
2. Implement a maximum retry count for 202 responses (5 retries is reasonable).
3. After max retries, return a "collection is being prepared" status to the frontend, not an empty collection.
4. In the GraphQL schema, add a `CollectionStatus` enum (`READY`, `QUEUED`, `ERROR`) so the frontend can show a loading state.

**Warning signs:**
- Collections appearing empty for users who definitely have games.
- Intermittent empty results that resolve on retry.
- 202 status codes in HTTP logs but no retry logic.
- First request for a new user always fails; second request succeeds.

**Phase to address:**
BGG API integration phase. This must be handled in the HTTP client layer before XML parsing.

---

### Pitfall 4: BGG XML Inconsistencies — Arrays vs Single Objects vs Missing Fields

**What goes wrong:**
The BGG XML API returns wildly inconsistent structures depending on data availability:
- `item` can be a single object (1 item) or an array (multiple items) — the parser must handle both.
- `name` can be a string, an array of objects with `{type, value}`, or an object with `{_, sortindex}` (XML mixed content).
- Fields like `description`, `image`, `thumbnail` can be entirely missing.
- `statistics.ratings.average` can be nested as `.value` attribute or as a direct property.
- `yearpublished` can be `{value: "2020"}` or just `"2020"`.

The old proxy handles all of these with defensive normalization (see `normalizeThing`, `getPrimaryName`, `parseNumber`, `parseFloat` in `bggDataSource.ts`). A rewrite using Nokogiri must replicate this defensive parsing or it will crash on real-world BGG data.

**Why it happens:**
BGG's XML API is old and inconsistent. xml2js (the old proxy's parser) with `explicitArray: false, mergeAttrs: true, explicitRoot: false` flattens the XML in a specific way that creates these shape variations. Nokogiri in Ruby works differently — it gives you a DOM tree you traverse explicitly. The parsing logic must be completely rewritten, not ported line-by-line.

**How to avoid:**
1. Use Nokogiri's CSS selector or XPath API to traverse XML explicitly — don't try to flatten it into a hash like xml2js does.
2. Write a `BGG::ThingNormalizer` (or similar) service that handles every field with nil-safety: `node.at_css("yearpublished")&.attribute("value")&.value || 0`.
3. Port the **test fixtures** from the old proxy (`stevmachine_collection.xml`, `stevmachine_boardgames.xml`, `stevmachine_expansions.xml`) and write Ruby tests that parse them with the same expected outputs.
4. Handle the `name` field explicitly: check for `type="primary"` attribute, fall back to first name, handle text content vs attribute.
5. Always default numeric fields to 0, string fields to `""`.

**Warning signs:**
- `NoMethodError: undefined method 'value' for nil` when parsing certain games.
- Games with missing images crashing the serializer.
- Single-item collections returning `NoMethodError` because `item` is an element, not an array.
- Test fixtures pass but production data crashes.

**Phase to address:**
BGG API integration phase. The normalizer must be test-driven with real fixture XML from the start.

---

### Pitfall 5: BGG Caching Traps — Stale Data and BGG's Own Cache Lag

**What goes wrong:**
BGG caches collection data on their end with a significant lag (hours, not minutes). A user adds a game on BGG.com, then checks the app, and the game isn't there. The app's own cache layer compounds this: if the app caches for 24 hours, the user might wait 25+ hours to see their new game. Conversely, caching too aggressively means the app serves stale data; caching too lightly means hitting BGG's rate limit.

**Why it happens:**
Two layers of caching are in play:
1. **BGG's server-side cache**: BGG caches collection responses and doesn't invalidate immediately. The BGG forum thread (2025-11-04) documents users waiting hours for collection changes to appear via the API.
2. **App-side cache**: The old proxy uses Redis with a 3600-second (1 hour) `defaultMaxAge` for Apollo response cache (see `index.ts` line 33). The old app has no client-side cache beyond Apollo's in-memory cache.

The rewrite needs a deliberate caching strategy that accounts for BGG's own lag.

**How to avoid:**
1. **Two-tier caching**: Cache raw BGG XML responses (24h TTL for collections, 7d for thing details — game data rarely changes). Cache normalized/parsed results separately (shorter TTL, invalidated when raw cache changes).
2. **Stale-while-revalidate pattern**: Serve cached data immediately, trigger a background refresh job, update cache when fresh data arrives. This gives instant responses while staying current.
3. **User-triggered refresh**: Add a "refresh my collection" button that bypasses the cache and enqueues a high-priority background job. Set a minimum interval (e.g., 15 minutes) to prevent abuse.
4. **Cache key by username + subtype + timestamp**: Include the `pubdate` from BGG's response in the cache — if BGG's `pubdate` changes, the data is fresh.
5. **Don't cache 202 responses**: Only cache successful 200 responses with actual data.

**Warning signs:**
- Users reporting "I added a game but it's not showing up."
- Cache hit rate too high (data never refreshes).
- Cache hit rate too low (hitting BGG rate limits).
- Same `pubdate` timestamp across multiple days of API calls (BGG's cache is stale).

**Phase to address:**
Caching phase (after BGG integration but before multi-user features). The cache strategy must be designed before the multi-user collection feature is built.

---

### Pitfall 6: GraphQL N+1 Queries on BGG Expansion/Base Game Resolution

**What goes wrong:**
The old proxy's resolver for `Thing.expansionFor` (lines 113-147 of `resolvers/index.ts`) fetches expansions in batches of 3, with a limit of 10 expansions per game. Each batch is a separate BGG API call, rate-limited at 5 seconds. Resolving expansions for a single game = 10/3 = 4 batches × 5 seconds = 20 seconds. For a collection of 75 games, if the frontend requests expansions for each, that's 75 × 20 = 25 minutes. The GraphQL query appears to hang.

**Why it happens:**
GraphQL resolves fields per-object. When a query asks for `things { expansions { name } }`, graphql-ruby calls the `expansions` resolver once per thing. Without batching, each call hits BGG separately. The old proxy mitigates this by batching in groups of 3 and limiting to 10, but it's still O(n) API calls per collection item.

**How to avoid:**
1. **Use GraphQL::Batch** (Shopify's gem, confirmed via Context7) to batch expansion lookups across all things in a single query. Implement a `BGGThingLoader < GraphQL::Batch::Loader` that collects all expansion IDs across all things in the query, deduplicates them, and fetches them in a single BGG `/thing?id=1,2,3,...` call (BGG supports comma-separated IDs).
2. **BGG's thing endpoint accepts multiple IDs**: `GET /thing?id=1,2,3,4,5&stats=1` returns all of them in one response. Use this to batch-fetch. However, there may be a URL length limit — test with 50+ IDs.
3. **Cache thing details aggressively** (7-day TTL). Game metadata rarely changes. Once a game's expansions are fetched, cache the expansion list.
4. **Set GraphQL `max_depth` and `max_complexity`** to prevent deeply nested queries that would cascade into hundreds of BGG calls. graphql-ruby supports `max_depth 15` and `max_complexity 100` at the schema level (confirmed via Context7).
5. **Don't resolve expansions in the collection query.** Return expansion IDs only; let the frontend fetch details on demand (e.g., when expanding a game card).

**Warning signs:**
- GraphQL queries taking 30+ seconds when requesting nested expansion data.
- BGG rate limit errors (503/429) during complex queries.
- Server memory growing during query execution (accumulating promises).
- Works for 1-2 games but times out for full collections.

**Phase to address:**
GraphQL schema design phase. The batching strategy must be designed before writing resolvers. `max_depth` and `max_complexity` must be set from day one.

---

### Pitfall 7: Solid Queue Has No Automatic Retries — Jobs Die Silently

**What goes wrong:**
BGG API jobs (collection fetches, thing lookups) fail due to rate limiting (503) or network errors. Under Sidekiq, these would automatically retry up to 25 times with exponential backoff. Under Solid Queue (Rails 8 default), failed jobs die silently after the first failure unless `retry_on` is explicitly declared. The BGG integration appears broken because transient failures are never retried.

**Why it happens:**
This is the single most documented Solid Queue migration pitfall (confirmed across 4 independent web sources: nsinenko.com, ttb.software, caio.ca, dev.to). Sidekiq retries automatically (25 retries, exponential backoff). Solid Queue relies on Active Job's `retry_on` / `discard_on` macros. If you don't declare them, the job fails once and is done. The old proxy's retry logic (`MAX_RETRIES = 3`, `RETRY_DELAYS = [1000, 2000, 4000]`) was in the HTTP client itself, but the Rails rewrite may push this to the job layer.

**How to avoid:**
1. Declare `retry_on` explicitly on every BGG job class:
   ```ruby
   class FetchBggCollectionJob < ApplicationJob
     retry_on Bgg::RateLimitError, wait: :polynomially_longer, attempts: 5
     retry_on Faraday::TimeoutError, wait: 10.seconds, attempts: 3
     discard_on Bgg::NotFoundError # don't retry 404s
   end
   ```
2. Keep the retry logic in the HTTP client too (defense in depth) — the old proxy's exponential backoff in `makeRequest` is still valuable.
3. Use Solid Queue's `concurrency_controls` to limit BGG jobs to 1 at a time (respecting the 5-second rate limit):
   ```ruby
   class FetchBggCollectionJob < ApplicationJob
     limits_concurrency to: 1, key: "bgg_api"
   end
   ```
4. Monitor via Mission Control - Jobs (Solid Queue's dashboard) — set up alerts for failed jobs.

**Warning signs:**
- Jobs showing as "failed" in Mission Control with no retry attempts.
- Users reporting that their collection "sometimes doesn't load" (transient failures not retried).
- BGG 503 errors in logs but no corresponding retry log entries.
- The app works when BGG is responsive but breaks during BGG's peak load hours.

**Phase to address:**
Background jobs phase. Every job class must have explicit retry declarations before it's considered done.

---

### Pitfall 8: dry-validation and Rails Strong Parameters Conflict

**What goes wrong:**
The team uses dry-validation contracts for input validation but Rails controllers still have `strong_params` filtering. Two validation layers fight each other: strong_params strips keys that the dry-validation contract expects, causing cryptic "key missing" errors. Or worse, both pass but with different coercion results (strong_params leaves strings, dry-validation expects integers).

**Why it happens:**
dry-rails provides a `safe_params` macro that replaces strong_params with `Dry::Schema::Params` validation (confirmed via Context7 — `dry-rails` docs show `schema(:show) do ... end` in controllers). But if developers mix `params.require(:user).permit(:name, :email)` with `schema(:create) do ... end`, the two systems conflict. The `Dry::Schema::Params` type is specifically designed for form input (stringified keys, string values) and handles coercion, while strong_params does no coercion.

**How to avoid:**
1. **Pick one validation strategy per controller and stick to it.** Use `dry-rails` `safe_params` for all input validation. Don't use `strong_params` in controllers that have `schema` declarations.
2. Use `ApplicationContract` (dry-rails provides this base class) for complex validation with business rules. Use `schema` macros for simple parameter coercion.
3. Use `Dry::Schema::Params` (not `Dry::Schema::JSON`) for form/HTTP params — it handles stringified keys and string-to-type coercion.
4. For GraphQL inputs, graphql-ruby handles its own argument validation — don't double-validate with dry-validation at the resolver level. Use dry-validation for service objects and form objects, not for GraphQL arguments.
5. Test the full pipeline: HTTP params → controller → service object → dry-validation contract. Don't test contracts in isolation only.

**Warning signs:**
- `Key :age is missing` errors from dry-validation even though the param is present in the request.
- Type mismatches: contract expects `Integer`, gets `"25"` string.
- Inconsistent error messages: some from Rails, some from dry-validation.
- Developers bypassing contracts and using raw `params` because "it's easier."

**Phase to address:**
Foundation phase (when setting up the Rails app structure). The validation strategy must be decided before writing controllers.

---

### Pitfall 9: Vue 3 + Vite + Rails Dev Server Proxy Chaos

**What goes wrong:**
In development, the Vue 3 SPA runs on Vite's dev server (e.g., `localhost:5173`) and the Rails API runs on Puma (e.g., `localhost:3000`). Without proper proxy configuration:
- CORS errors block GraphQL requests from Vue to Rails.
- Vite HMR (Hot Module Replacement) is slow because it's proxied through Rails.
- Asset paths break: Vue assets reference `/assets/...` but Vite serves from `/vite-dev/...`.
- WebSocket connections for HMR fail through the proxy.

In production, the Vue build output must be served by Rails (from `public/`) or by a separate static file server, and the asset paths must match.

**Why it happens:**
Running two servers in development is inherently tricky. Vite Ruby's default proxies Vite dev server requests through Rails (confirmed via Context7 — `skipProxy` defaults to `false`). This works but is slow because Rails processes every asset request. The CSP (Content Security Policy) may also block Vite's inline styles and scripts.

**How to avoid:**
1. **Use `vite_rails` gem** with `vite-plugin-rails` in the Vue config. This is the canonical integration (confirmed via Context7 docs).
2. **Set `skipProxy: true`** in `vite.json` for faster development — requests go directly to Vite dev server, bypassing Rails. Use Caddy or a similar reverse proxy if needed.
3. **Configure CORS in Rails** for development: use `rack-cors` gem, allow `localhost:5173` origin for GraphQL endpoint. In production, serve Vue from the same origin as Rails (from `public/`) to avoid CORS entirely.
4. **Configure CSP** to allow Vite's dev server origin and inline styles (needed for Vue SFCs with `<style>` blocks).
5. **In production**, build Vue with `vite build` and output to `public/` (or `public/vite/`). Rails serves the `index.html` and Vite handles asset fingerprinting.
6. **For the monorepo**: Keep Vue in `frontend/` and Rails in `backend/` (or `api/`). The Vite config references Rails for API calls via a proxy in `vite.config.ts`:
   ```typescript
   server: {
     proxy: {
       '/graphql': 'http://localhost:3000',
       '/api': 'http://localhost:3000',
     }
   }
   ```

**Warning signs:**
- CORS errors in browser console during development.
- Vite HMR taking 2+ seconds for each change.
- 404s for Vue assets in production.
- "Mixed content" warnings (HTTP assets on HTTPS page).
- WebSocket connection failures for HMR.

**Phase to address:**
Project setup phase (Phase 1). The dev server configuration must work before any features are built.

---

### Pitfall 10: Monorepo Deployment Coupling — Vue and Rails Must Deploy Together

**What goes wrong:**
The Vue frontend and Rails backend are in the same repo but have different build processes. Deployment becomes a coordination nightmare:
- Vue build changes the asset hashes, but Rails hasn't been redeployed with the new `index.html` reference.
- Rails deploys a new GraphQL schema, but the Vue app still has the old generated types.
- One deploys but the other doesn't, causing API mismatches.
- CI/CD pipeline runs tests for both but deploys only one.

**Why it happens:**
A monorepo with two distinct build targets (Vite for Vue, Rails asset pipeline for backend) requires a unified deployment strategy. If deployment is manual or semi-automated, it's easy to deploy one half and forget the other.

**How to avoid:**
1. **Single deploy command**: `bin/deploy` that builds Vue (`cd frontend && npm run build`), copies output to Rails `public/`, then deploys Rails (Kamal 2, Docker, etc.).
2. **Version-lock the API contract**: Generate GraphQL types from the Rails schema (`rails graphql:schema:dump`) and commit the `schema.graphql` to the repo. The Vue codegen step uses this file. If the schema changes, the CI pipeline fails if the Vue types aren't regenerated.
3. **Atomic deployment**: Deploy Vue and Rails in a single Docker image. Rails serves the Vue SPA from `public/` and the GraphQL API from `/graphql`. One container, one deploy.
4. **CI pipeline checks both**: Run Rails tests AND Vue tests AND a contract test that verifies the Vue GraphQL queries match the Rails schema.
5. **Use Kamal 2** (Rails 8 default deployment tool) for atomic deploys with zero-downtime rolling updates.

**Warning signs:**
- "Schema mismatch" errors in the Vue app after a Rails deploy.
- 404s for JavaScript assets after a Vue build change.
- GraphQL queries failing because the frontend expects fields the backend hasn't deployed yet.
- Deployment runbooks that have separate steps for "deploy frontend" and "deploy backend."

**Phase to address:**
Project setup phase + deployment phase. The monorepo structure and deploy script must be established early.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fetching BGG collections synchronously in GraphQL resolvers | Simpler code, no job infrastructure needed | 50-second query times, rate limit storms, terrible UX | Never for production. Acceptable for spike/prototype only. |
| Skipping BGG expansion workaround (just use `subtype=boardgame`) | One API call instead of two, faster | Expansions miscategorized as base games, broken core feature | Never. This is a documented BGG bug with a known workaround. |
| Using strong_params alongside dry-validation contracts | Familiar to Rails devs, no new learning | Two validation systems, conflicting errors, maintenance confusion | Never. Pick one (dry-validation) and use it consistently. |
| Not setting GraphQL `max_depth` / `max_complexity` | No configuration needed, all queries work | Malicious or accidental deep queries causing cascading BGG API calls | Never. Set from day one, even if limits are generous initially. |
| Caching BGG responses in memory only (no Redis/Solid Cache) | No external dependency, simpler setup | Cache lost on restart, no cross-process sharing, rate limit hits on every boot | MVP only. Must move to Solid Cache or Redis before multi-user. |
| Hardcoding user count (like old app's 2-user limit in `useMultiUserCollections`) | Quick to implement, no dynamic logic needed | Can't scale beyond 2 users, requires rewrite for group features | MVP with explicit "2-user limit" documentation. Must refactor for groups. |
| Serving Vue SPA and Rails API from different origins in production | Simpler deployment (static hosting + API server) | CORS configuration complexity, cookie/auth issues, CSP headaches | Acceptable if using separate CDNs, but same-origin is strongly preferred. |
| Not generating GraphQL types from Rails schema | No codegen step in CI | Frontend/backend schema drift, runtime errors on mismatched queries | Never for a monorepo. Codegen is the whole point of the monorepo. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| BGG XML API | Treating 202 as a normal response and parsing the (empty) body | Check HTTP status first. On 202, retry with delay (up to 5 times). Return a "preparing" status to the frontend. |
| BGG XML API | Using `subtype=boardgame` and assuming expansions are excluded | Use the two-call workaround: `excludesubtype=boardgameexpansion` + `subtype=boardgameexpansion`, then merge. |
| BGG XML API | Fetching thing details one ID at a time | Use comma-separated IDs: `GET /thing?id=1,2,3,4,5&stats=1`. Batch up to ~20-50 IDs per call (test URL length limits). |
| BGG XML API | Assuming XML fields are always present | Normalize every field with nil-safety. Port test fixtures from the old proxy. `yearpublished` can be missing, `image` can be empty, `name` can be string/object/array. |
| BGG XML API | Not sending a User-Agent header | BGG may reject requests without a User-Agent. The old proxy sends `User-Agent: BGG-GraphQL-Proxy/1.0.0`. Include a descriptive UA. |
| graphql-ruby | Authorizing at the controller level | Controller-level auth is impossible with GraphQL (the query string determines permissions, not the endpoint). Authorize in resolvers via `context[:current_user]` or use Pundit/CanCan integration. |
| graphql-ruby | Not handling Apollo batched queries | Apollo sends batched queries as `params[:_json]` (an array). Check for this in the GraphqlController and use `Schema.multiplex` instead of `Schema.execute`. |
| graphql-ruby | Resolving N+1 without batching | Use `GraphQL::Batch` (Shopify gem) with custom `Loader` classes. Register `use GraphQL::Batch` on the schema. The loader cache is auto-cleared between mutations. |
| Solid Queue | Assuming jobs auto-retry like Sidekiq | Declare `retry_on` explicitly on every job class. Without it, jobs fail once and stop. |
| Solid Queue | Using a single database for app + queue | For any real load, use a separate database for Solid Queue (Rails multi-DB support). Queue tables have high churn (INSERT/DELETE) that triggers autovacuum storms on shared tables. |
| dry-validation | Using `Dry::Schema::JSON` for HTTP form params | Use `Dry::Schema::Params` — it handles stringified keys and string-to-type coercion. `JSON` schema expects native types. |
| dry-validation | Confusing `Schema` with `Contract` | `Schema` = validation only (type checking + predicates). `Contract` = schema + custom rules + business logic. Use `Contract` when you need cross-field rules. |
| Vite Ruby | Leaving `skipProxy: false` and suffering slow HMR | Set `skipProxy: true` in development for faster HMR. Or use Caddy/nginx to proxy `/vite-dev/*` directly to Vite. |
| Nokogiri | Parsing BGG XML with regex or string splitting | Use Nokogiri's CSS selectors or XPath. BGG XML has namespaces, attributes, and mixed content that regex can't handle reliably. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous BGG collection fetching in GraphQL resolver | Query takes 30-60 seconds for multi-user collections | Move to background jobs (Solid Queue) with caching. Serve from cache, refresh in background. | 2+ users with 50+ games each |
| GraphQL expansion resolution without batching | 75 games × 4 batches × 5s = 25 minutes for expansion data | Use `GraphQL::Batch` with a `BGGThingLoader` that batches all expansion IDs into one BGG `/thing?id=` call. | Any query requesting nested expansions for a full collection |
| Solid Queue polling on shared Postgres database | Postgres CPU spikes, connection pool exhaustion, autovacuum falling behind | Use a separate database for Solid Queue. Tune autovacuum for queue tables. Use PgBouncer in transaction mode. | 1000+ jobs/hour sustained |
| In-memory BGG caching only | Every server restart hits BGG for all cached data, causing rate limit storms | Use Solid Cache (Rails 8 default, DB-backed) or Redis for cross-process caching. | Any multi-process deployment (Puma workers > 1) |
| Client-side fuzzy search on full collection (Fuse.js) | UI freezes when searching 500+ games | The old app uses Fuse.js client-side. For large collections, index in the backend (Postgres full-text search or pg_trgm) and search via GraphQL. | 300+ games in a shared collection |
| Vue re-rendering entire game list on filter change | Sluggish UI, 100ms+ render times | Use `v-memo` or `computed` with shallow refs. Virtualize the list (`vue-virtual-scroller`) for 100+ items. | 100+ visible game cards |
| Apollo Client cache growing unbounded | Browser memory climbing over time, especially with multiple collection loads | Use `fetchPolicy: 'cache-and-network'` with `nextFetchPolicy: 'cache-first'`. Evict collection queries on unmount. Set `ApolloClient` `connectToDevTools: false` in production. | Multiple user sessions without page reload |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing BGG API credentials in the Vue frontend | BGG requires authentication for some endpoints (bearer token). If the token is in frontend code, anyone can extract it. | Keep BGG credentials server-side only. The Vue app talks to your Rails GraphQL API; Rails talks to BGG. Never expose BGG tokens to the browser. |
| No GraphQL query depth/complexity limits | Malicious clients can send deeply nested queries that cascade into hundreds of BGG API calls, effectively DDoSing BGG through your server. | Set `max_depth 10` and `max_complexity 200` on the schema. Test with GraphiQL to ensure legitimate queries still work. |
| No rate limiting on the GraphQL endpoint | A single user can trigger hundreds of BGG API calls by rapidly querying different usernames. BGG rate-limits your server IP, affecting all users. | Implement Rack::Attack or Rails rate limiting on the GraphQL endpoint. Limit per-IP and per-user query frequency. |
| Trusting BGG XML data as safe HTML | BGG `description` fields contain user-generated HTML. If rendered with `v-html`, this is an XSS vector. | Sanitize BGG descriptions server-side (sanitize gem) before returning via GraphQL. Or render as text in Vue (use `{{ }}` not `v-html`). |
| GraphQL introspection enabled in production | Exposes the entire API schema to attackers, revealing internal types and fields. | Disable introspection in production: `GraphQL::Schema.disable_introspection_entry_points` or check `Rails.env.production?`. The old proxy has `introspection: true` — don't copy this. |
| No authentication on the GraphQL endpoint | Anyone can query any BGG username's collection. While BGG data is public, your server becomes an open proxy for BGG scraping. | Add authentication (even simple API key or session-based). Rate-limit per authenticated user. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing a blank screen during 50-second BGG collection fetch | Users think the app is broken and leave | Show a loading state with progress ("Fetching 3 of 5 collections..."). Fetch collections in parallel via background jobs and show partial results as they arrive. |
| No feedback when BGG returns 202 (queued) | User sees "no games found" when their collection is being prepared | Show a "BGG is preparing your collection, this may take a moment" message. Auto-retry in the background and update the UI when data arrives. |
| Failing silently when one user's collection fails | Multi-user shared list shows incomplete data without explanation | Show per-user status indicators: "✓ Loaded (75 games)", "⚠ Failed to load (retry)", "⏳ Loading..." |
| No "refresh collection" button | Users can't force a re-fetch when BGG data is stale | Add a refresh button with a cooldown (15 min minimum). Enqueue a high-priority background job that bypasses cache. |
| Hard 2-user limit (like the old app) | Groups of 3+ friends can't use the app together | Design for N users from the start. The old app hardcodes `user1` and `user2` in `useMultiUserCollections.ts` — this is a known limitation to fix in the rewrite. |
| Best-player-count heuristic is wrong | The old app uses `minPlayers + ceil(range * 0.67)` as a "best players" heuristic (see `grouping.ts` lines 120-134). This is arbitrary and often wrong — many games are best at lower player counts. | Use BGG's "Suggested Number of Players" poll data if available. Fall back to the heuristic only when poll data is missing. This is a feature gap, not a bug to replicate. |
| Fuzzy search only on loaded games | If a collection hasn't been loaded, search returns nothing. Users don't know they need to load collections first. | Search across all cached/cached collections. Show a hint: "Load more collections to expand search results." |

## "Looks Done But Isn't" Checklist

- [ ] **BGG Collection Fetch:** Often missing the expansion workaround — verify that `subtype=boardgameexpansion` items appear in results with correct subtype labels. Test with a user who owns both games and expansions.
- [ ] **BGG Collection Fetch:** Often missing 202 retry handling — verify that a 202 response triggers a retry, not an empty collection return. Test by checking HTTP logs for 202 → retry → 200 sequence.
- [ ] **BGG Rate Limiting:** Often missing cross-thread rate limiting — verify that concurrent requests (e.g., from multiple Solid Queue workers) don't exceed 1 request per 5 seconds. Test with 5 simultaneous collection fetches.
- [ ] **BGG XML Parsing:** Often missing nil-safety on optional fields — verify that games with missing `image`, `thumbnail`, `description`, or `yearpublished` don't crash the normalizer. Test with fixture XML that has missing fields.
- [ ] **GraphQL Schema:** Often missing `max_depth` and `max_complexity` — verify these are set. Test with a deeply nested query (5+ levels of thing → expansion → baseGame → expansion → ...) and confirm it's rejected.
- [ ] **GraphQL N+1:** Often missing batching on expansion resolution — verify that resolving expansions for 10 games doesn't make 10 separate BGG API calls. Test with `GraphQL::Batch` and check BGG request count in logs.
- [ ] **Solid Queue Jobs:** Often missing `retry_on` declarations — verify that every BGG job class has explicit retry logic. Check Mission Control dashboard for jobs that failed without retry.
- [ ] **dry-validation Contracts:** Often missing the `:params` schema type — verify that contracts use `params do ... end` (not `json do ... end`) for HTTP input. Test with string input `"25"` and verify it coerces to integer `25`.
- [ ] **Vue + Rails Dev Server:** Often missing CORS configuration — verify that GraphQL requests from `localhost:5173` (Vite) to `localhost:3000` (Rails) don't get CORS errors. Check browser console.
- [ ] **Vue + Rails Production:** Often missing the Vue build output in Rails `public/` — verify that `vite build` output is copied/served correctly. Test production build locally with `RAILS_ENV=production rails server`.
- [ ] **Multi-user Collections:** Often missing per-user error handling — verify that if user A's collection fails, user B's collection still displays. Test by simulating a BGG error for one user.
- [ ] **Cache Invalidation:** Often missing user-triggered refresh — verify that a "refresh" button bypasses cache and re-fetches from BGG. Test by adding a game on BGG, clicking refresh, and confirming it appears.
- [ ] **GraphQL Introspection:** Often left enabled in production — verify `GraphQL::Schema` has introspection disabled in production. The old proxy has `introspection: true` — don't copy this blindly.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Lost the expansion workaround | MEDIUM | Re-implement the two-call pattern. Port test fixtures from old proxy. Verify with a real BGG user who owns expansions. ~2-4 hours. |
| No rate limiting on BGG client | HIGH | BGG may have IP-banned your server. Implement rate limiting, wait for ban to lift (unknown duration, could be hours). Implement background job queue with concurrency control. ~1 day. |
| No 202 retry handling | LOW | Add status code check before XML parsing. Add retry loop for 202. ~2-3 hours. |
| GraphQL N+1 on expansions | MEDIUM | Implement `GraphQL::Batch` with a `BGGThingLoader`. Refactor resolvers to use `Loader.for.load(id)` pattern. Test with batched queries. ~4-8 hours. |
| Solid Queue jobs not retrying | LOW | Add `retry_on` declarations to each job class. Redeploy. Existing failed jobs won't auto-retry — manually re-enqueue or accept data loss. ~1-2 hours. |
| dry-validation / strong_params conflict | MEDIUM | Audit all controllers for mixed validation. Standardize on dry-validation `safe_params`. Remove `strong_params` usage. Test all endpoints. ~4-8 hours. |
| Vue + Rails deployment mismatch | HIGH | Redesign deployment to be atomic (single Docker image). Rebuild CI/CD pipeline. May require infrastructure changes. ~1-2 days. |
| No caching layer | HIGH | Add Solid Cache or Redis. Implement cache keys and TTLs. Backfill cache for existing users. ~1-2 days. |
| GraphQL introspection exposed in production | LOW | Add `disable_introspection_entry_points` in production config. Redeploy. ~30 minutes. |
| BGG IP ban from rate limit violations | HIGH | Implement rate limiting. Contact BGG (no formal process — may need to wait it out). Use a different IP temporarily. Duration unknown. Prevention is the only reliable strategy. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| BGG expansion subtype workaround | BGG API Integration Phase | Test with fixture XML: verify 62 base games + 13 expansions = 75 items with correct subtypes |
| BGG rate limiting (5s rule) | BGG API Integration Phase | Test concurrent requests: verify no more than 1 BGG call per 5 seconds across all threads/workers |
| BGG 202 queued response handling | BGG API Integration Phase | Test: mock 202 response, verify retry logic triggers and eventually returns data or "preparing" status |
| BGG XML parsing inconsistencies | BGG API Integration Phase | Test with real fixture XML from old proxy: verify all fields parse without errors, nils handled |
| BGG caching strategy | Caching Phase | Test: fetch collection, modify cache TTL, verify stale-while-revalidate pattern works |
| GraphQL N+1 on expansions | GraphQL Schema Phase | Test: query 10 things with expansions, verify BGG API call count ≤ 2 (one batched call for all expansion IDs) |
| GraphQL depth/complexity limits | GraphQL Schema Phase | Test: submit a depth-20 query, verify it's rejected with a clear error |
| GraphQL authorization in resolvers | GraphQL Schema Phase | Test: query without authentication, verify sensitive fields return errors |
| Solid Queue no auto-retry | Background Jobs Phase | Test: trigger a BGG 503 error in a job, verify it retries per `retry_on` config |
| Solid Queue concurrency control | Background Jobs Phase | Test: enqueue 5 BGG jobs simultaneously, verify only 1 runs at a time (rate limit respect) |
| dry-validation / strong_params conflict | Foundation Phase | Test: submit form data, verify dry-validation contract processes it correctly without strong_params interference |
| Vue + Rails dev server proxy | Project Setup Phase | Test: start both servers, make GraphQL request from Vue, verify no CORS errors and HMR works |
| Monorepo deployment coupling | Deployment Phase | Test: `bin/deploy` builds Vue, copies to Rails public/, deploys single container, verify both serve correctly |
| Rewrite scope creep | Planning Phase (pre-roadmap) | Review roadmap: verify each phase maps to a specific old-app feature, no "while we're at it" additions |
| Game suggestion algorithm cold start | Game Suggestion Phase (if built) | Test: new user with no collection/play history, verify algorithm falls back to BGG "hot items" or general recommendations |
| Multi-user collection (N users, not hardcoded 2) | Multi-user Collection Phase | Test: load 5+ users, verify all collections merge correctly with per-user owner tracking |

## Rewrite-Specific Pitfalls

### Pitfall R1: Over-Engineering Based on the Old App

**What goes wrong:**
The old app is a Next.js + Apollo + Chakra UI app with a separate Apollo Server proxy. The rewrite team sees the architecture and replicates every component, even parts that were workarounds for Node.js/Apollo limitations. The result is a Rails app that fights the framework — using Apollo-style data sources when Rails service objects would be simpler, or replicating the Redis keepalive cron job when Solid Cache doesn't need it.

**Why it happens:**
The old proxy has a Redis keepalive cron job (`/api/keepalive` endpoint in `index.ts` lines 114-201) because Vercel serverless functions spin down and Redis connections drop. Rails with Puma doesn't have this problem. The old app uses Apollo `RESTDataSource` with its own caching — Rails has built-in caching and Faraday with middleware. Each workaround in the old codebase solved a Node.js/serverless-specific problem that doesn't exist in Rails.

**How to avoid:**
1. Catalog every workaround in the old codebase. For each, ask: "Is this solving a Rails problem or a Node.js problem?"
2. Don't replicate the Redis keepalive cron — Solid Cache uses the database, no keepalive needed.
3. Don't replicate Apollo `RESTDataSource` caching — use Rails caching (`Rails.cache.fetch`) with Solid Cache.
4. Don't replicate the Apollo response cache plugin — use graphql-ruby's built-in caching or HTTP-level caching.
5. **Do replicate**: the BGG rate limiter, the expansion workaround, the XML normalizer, the retry logic. These solve BGG-specific problems that exist regardless of backend.

**Warning signs:**
- Rails code that looks like JavaScript (callback-heavy, promise-like patterns).
- Infrastructure for problems Rails doesn't have (Redis keepalive, serverless cold start mitigation).
- Service objects that wrap single method calls (over-abstraction).
- "We need Redis because the old app had Redis" — Solid Cache + Solid Queue may eliminate the Redis dependency entirely.

**Phase to address:**
Planning phase (before roadmap). The architecture decision of what to port vs. what to redesign must happen before implementation.

---

### Pitfall R2: Not Learning from the Old App's Mistakes

**What goes wrong:**
The old app has a hardcoded 2-user limit in `useMultiUserCollections.ts` (lines 13-29 — explicitly `user1Validation` and `user2Validation`). The old app fetches collections sequentially in `useCollections.ts` (lines 126-143) with no parallelism. The old app has no error recovery for individual user failures — if one user's collection fails, the entire merge fails. The rewrite replicates these limitations because nobody analyzed the old code for weaknesses.

**Why it happens:**
The rewrite is framed as "port to Rails + Vue" not "improve the architecture." Developers focus on translating code, not critiquing it. The old code works (mostly), so there's a bias toward preserving behavior rather than fixing design flaws.

**How to avoid:**
1. **Document the old app's known limitations before writing the roadmap:**
   - Hardcoded 2-user limit → Design for N users from the start.
   - Sequential collection fetching → Use background jobs with parallel fetching (respecting BGG rate limits).
   - No per-user error isolation → Each user's collection fetch should succeed or fail independently.
   - `bestPlayers` heuristic is arbitrary (line 120-134 of `grouping.ts`) → Use BGG poll data when available.
   - Fuzzy search is client-side only (Fuse.js) → Move to backend for scalability.
   - No "refresh collection" capability → Add user-triggered refresh.
   - No persistent state (URL doesn't preserve user list) → Use URL params or localStorage.
2. **Create a "limitations to fix" list** and incorporate each into the roadmap as a phase deliverable.
3. **Don't replicate the old GraphQL schema blindly.** The old schema has fields like `baseGame: null` and `expansionFor: []` initialized in the normalizer (lines 420-421 of `bggDataSource.ts`) with "Will be resolved by resolvers" comments. This is a code smell — these should be lazy-loaded via GraphQL field resolvers, not pre-initialized.

**Warning signs:**
- The rewrite has the same hardcoded limits as the old app.
- The roadmap says "port feature X" without mentioning "and improve Y."
- No one has read the old app's test files for clues about what was hard to test.
- The old app's e2e tests (there are 11 `.spec.ts` files in `tests/e2e/`) are not reviewed for what they test — they reveal what was fragile.

**Phase to address:**
Planning phase. The "limitations to fix" analysis must happen before the roadmap is written.

---

### Pitfall R3: Scope Creep from "While We're At It"

**What goes wrong:**
The rewrite starts as "port the shared collection viewer to Rails + Vue" but expands to include: game suggestion algorithm, play tracking analytics, wishlist management, trade matching, collection comparison charts, social features. Each addition seems small in isolation but together they turn a 4-week project into a 4-month project that never ships.

**Why it happens:**
A rewrite is the natural time to add features — "we're already touching all the code, might as well add X." The new stack (Rails 8, GraphQL, Vue 3) feels powerful, and developers want to leverage it. The old app's limitations (Pitfall R2) create a backlog of "should-haves" that all feel urgent during a rewrite.

**How to avoid:**
1. **Define the MVP scope explicitly**: "Port the existing shared collection viewer with these specific improvements: N-user support, per-user error handling, background fetching, URL state persistence. Nothing else."
2. **Create a "not in scope" list** and put it in the PROJECT.md. Items: game suggestions, play analytics, wishlist management, trade matching, social features.
3. **Each phase must map to an existing old-app feature.** If a phase doesn't correspond to something the old app did, it's scope creep. Put it in the backlog.
4. **The game suggestion algorithm is explicitly a post-MVP feature.** It's mentioned in the milestone context but should be a separate milestone, not a phase in the rewrite.

**Warning signs:**
- Roadmap phases that don't correspond to any old-app feature.
- "It would be easy to also add..." conversations during planning.
- The rewrite timeline exceeds 2× the original app's development time.
- Features being designed that the old app's users never asked for.

**Phase to address:**
Planning phase (before roadmap). Scope boundaries must be set before phases are defined.

---

### Pitfall R4: Game Suggestion Algorithm Pitfalls (If Built)

**What goes wrong:**
The game suggestion feature (if included) produces bad recommendations: suggesting 4-player heavy games to a solo player, recommending games nobody in the group owns, suggesting expansions without the base game, or showing the same 5 popular games to every user regardless of their collection.

**Why it happens:**
Game recommendation is a hard problem. Common mistakes:
- **Cold start**: New users with no collection or play history get random or empty suggestions.
- **Ignoring player count**: Recommending a 2-player game for a 6-person game night.
- **Ignoring complexity**: The old app has `averageWeight` data (BGG's complexity rating, 1-5). Suggesting a weight-4.5 game to someone whose collection averages weight-2 is a mismatch.
- **Ignoring ownership**: Suggesting a game that nobody in the group owns (unless it's a "games to try" feature).
- **Expansion without base**: Suggesting an expansion when the base game isn't in anyone's collection.
- **Popularity bias**: Sorting by BGG average rating always suggests the same top-100 games.

**How to avoid:**
1. **Start simple**: Filter the shared collection by player count, playing time, and complexity range. Let the user pick constraints, then filter. This is 80% of the value with 10% of the complexity.
2. **Use BGG's "Suggested Number of Players" poll data** (available in the thing endpoint) instead of the arbitrary `minPlayers + ceil(range * 0.67)` heuristic from the old app.
3. **Handle cold start**: For users with no collection, fall back to BGG "Hot Items" filtered by the group's player count. For users with a small collection, use category/mechanic overlap with their existing games.
4. **Exclude expansions** unless the base game is in the collection.
5. **Respect weight preferences**: Calculate the group's average `averageWeight` from their collections. Suggest games within ±1.0 of that average.
6. **Don't build a ML-based recommender for MVP.** Rule-based filtering is sufficient and debuggable.

**Warning signs:**
- Every user gets the same top-10 BGG games as suggestions.
- Suggestions include games the group already owns (they want new game ideas, not games they have).
- Suggestions include expansions without base games.
- Solo users get multiplayer-only game suggestions.
- The algorithm requires training data or ML infrastructure (scope creep).

**Phase to address:**
Only if the game suggestion feature is in scope. It should be a separate milestone after the core collection viewer is stable.

---

## Sources

- **BGG XML API2 Official Wiki**: https://boardgamegeek.com/wiki/page/BGG_XML_API2 — Rate limit (5s), 202 queued responses, expansion subtype bug, collection parameters. (HIGH confidence — official BGG documentation)
- **bgg-graphql-proxy source code** (`/Users/estvmachine/Projects/personal/bgg-graphql-proxy`): `bggDataSource.ts` (rate limiting, retry logic, expansion workaround, XML normalization), `resolvers/index.ts` (expansion resolution batching, base game resolution), `index.ts` (Redis keepalive, Apollo response cache), test files (fixture-based testing patterns). (HIGH confidence — first-hand code analysis)
- **bggeek-shared-list source code** (`/Users/estvmachine/Projects/personal/bggeek-shared-list`): `useCollections.ts` (sequential fetching, merge logic), `useMultiUserCollections.ts` (hardcoded 2-user limit), `grouping.ts` (best-player heuristic), `useFuzzySearch.ts` (client-side search), `sorting.ts`, `queries.ts` (GraphQL query patterns). (HIGH confidence — first-hand code analysis)
- **Rails 8 Guides** (Context7 `/websites/guides_rubyonrails_v8_0`): Solid Queue, Solid Cache, Propshaft, API-only mode. (HIGH confidence — official Rails docs)
- **graphql-ruby docs** (Context7 `/rmosolgo/graphql-ruby`): Authorization in resolvers, max_depth/max_complexity, Apollo batched query handling, Pundit/CanCan integration. (HIGH confidence — official gem docs)
- **GraphQL::Batch docs** (Context7 `/shopify/graphql-batch`): Loader pattern, `perform(keys)`, `fulfill(key, value)`, schema setup with `use GraphQL::Batch`. (HIGH confidence — official gem docs)
- **dry-validation + dry-rails docs** (Context7 `/dry-rb/dry-validation`, `/dry-rb/dry-rails`): ApplicationContract, safe_params macro, Schema::Form vs Schema::JSON, type coercion with form types. (HIGH confidence — official gem docs)
- **Vite Ruby docs** (Context7 `/elmassimo/vite_ruby`): vite-plugin-ruby, vite-plugin-rails, skipProxy configuration, dev server proxy troubleshooting. (HIGH confidence — official gem docs)
- **Solid Queue migration guides** (web search, MEDIUM confidence — practitioner blog posts, cross-referenced across 4 sources): nsinenko.com (2025-10-25), ttb.software (2026-05-11), caio.ca, dev.to (2026-06-03). All confirm: no auto-retry, recurring.yml migration, autovacuum tuning, connection pool pressure, separate database recommended.
- **bgg-api-ts** (GitHub, MEDIUM confidence): Third-party TS wrapper documenting 202 retry handling, 5s rate limiting, BggTimeoutError for 202-queued responses.
- **BGG forum thread** (2025-11-04, MEDIUM confidence): Documents BGG's server-side cache lag for collection updates — users waiting hours for changes to appear via API.

---
*Pitfalls research for: Rails 8 + Vue 3 + GraphQL + dry-validation monorepo with BGG API integration*
*Researched: 2026-06-30*
