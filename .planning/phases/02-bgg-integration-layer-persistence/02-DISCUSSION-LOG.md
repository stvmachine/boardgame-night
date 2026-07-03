# Phase 2: BGG Integration Layer + Persistence — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 02-BGG Integration Layer + Persistence
**Areas discussed:** Rate limiter, BGG client architecture, XML parsing, expansion workaround, background job design, persistence schema, collection merging, BGG endpoints

---

All decisions were auto-selected in `--auto` mode. Options were analyzed against the reference proxy patterns (bgg-graphql-proxy) and Rails 8 idioms.

## Rate Limiter

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory (per-process) | Simple `lastRequestTime` field on the client, like the reference proxy | |
| Solid Cache-backed (cross-process) | Use `Rails.cache` with atomic write for multi-worker coordination | ✓ |

**User's choice:** Auto-selected (--auto mode) — Solid Cache-backed
**Notes:** Reference proxy's in-memory approach is single-process only. Rails 8 defaults to Solid Cache with DB backing, making cross-process coordination viable.

## BGG Client Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Per-endpoint service objects | Separate `Bgg::CollectionService`, `Bgg::ThingService` etc. | |
| Single client with Faraday middleware | One `Bgg::Client` wrapping Faraday, middleware stack handles retry/rate-limiting/auth | ✓ |

**User's choice:** Auto-selected (--auto mode) — Single Faraday client
**Notes:** Matches the reference proxy's `makeRequest<T>` single-method pattern. Faraday middleware is idiomatic Ruby for this use case.

## XML Parsing

| Option | Description | Selected |
|--------|-------------|----------|
| REXML/stdlib | Built-in, no gem dependency, but limited CSS selector support | |
| Nokogiri | CSS selectors, nil-safe field access, handles inconsistent XML | ✓ |

**User's choice:** Auto-selected (--auto mode) — Nokogiri
**Notes:** Stack recommendation already locked Nokogiri. BGG XML has namespace issues and inconsistent array-vs-single-item patterns that Nokogiri handles well.

## Expansion Workaround Location

| Option | Description | Selected |
|--------|-------------|----------|
| Inside Bgg::Client | Merge logic lives in the HTTP client itself | |
| Dedicated Bgg::CollectionFetcher service | Separate service that calls Bgg::Client twice and merges | ✓ |

**User's choice:** Auto-selected (--auto mode) — Dedicated service
**Notes:** Keeps the HTTP client clean. The two-call pattern (`excludesubtype=boardgameexpansion` + `subtype=boardgameexpansion`) is a business concern, not transport.

## Background Job Design

| Option | Description | Selected |
|--------|-------------|----------|
| Per-user per-trigger job | One job instance per user + trigger combo | ✓ |
| Batch job per refresh | One job fetches all users at once | |

**User's choice:** Auto-selected (--auto mode) — Per-user per-trigger
**Notes:** Simpler error isolation (one failing user doesn't block others). Concurrency limited via `limits_concurrency to: 1, key: "bgg_api"`.

## Persistence Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Single table with JSONB | Store raw BGG response in one table, extract fields in app | |
| Normalized two-table (things + collections) | `bgg_things` for game data, `bgg_collections` for user ownership | ✓ |

**User's choice:** Auto-selected (--auto mode) — Normalized two-table
**Notes:** Enables SQL-based dedup merging. `bgg_things` has `raw_data` JSONB column as safety net for unparsed fields.

## Collection Merging Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Database view | Materialized or regular SQL view that unions collections | |
| ActiveRecord query | Scope/class method with `joins` + `distinct` + owner aggregation | ✓ |

**User's choice:** Auto-selected (--auto mode) — ActiveRecord query
**Notes:** Simpler to maintain than a view. Phase 3 may wrap this in a GraphQL type.

## BGG Endpoints to Implement

| Option | Description | Selected |
|--------|-------------|----------|
| All BGG XML API2 endpoints | thing, collection, search, user, plays, hot, geeklists | |
| Subset for Phase 2 | thing, collection, search, user (enough for collection merge + display) | ✓ |

**User's choice:** Auto-selected (--auto mode) — Subset (thing, collection, search, user)
**Notes:** `plays` and `hot` belong in Phase 3 (collection surface). `geeklists` is out of scope entirely.

## Testing Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| WebMock/stub all requests | Mock HTTP at the Faraday level, controlled responses | ✓ |
| VCR with real BGG recordings | Record once, replay for tests | |

**User's choice:** Auto-selected (--auto mode) — WebMock with XML fixtures
**Notes:** VCR adds complexity for edge-case testing (202 responses, expansion merge). XML fixtures from the reference proxy provide realistic, deterministic test data.

## the agent's Discretion

- Additional BGG XML fields to normalize beyond those needed immediately
- Exact Gemfile version pins
- Job queue name

## Deferred Ideas

None.
