---
phase: 02-bgg-integration-layer-persistence
plan: 01
type: execute
status: complete
subsystem: BGG Integration
tags: [bgg, http-client, rate-limiting, xml-parsing, faraday, nokogiri]
requires: []
provides: [Bgg::Client, Bgg::RateLimiter, Bgg::Normalizer, Bgg error classes]
affects: [Gemfile, app/services/bgg]
tech-stack:
  added:
    - library: faraday
      version: "~> 2.14"
      purpose: HTTP client for BGG XML API v2
    - library: faraday-retry
      version: "~> 2.4"
      purpose: Exponential backoff retry middleware (429, 502, 503)
    - library: nokogiri
      version: "~> 1.19"
      purpose: XML parsing for BGG responses
    - library: webmock
      version: "~> 3.26"
      purpose: HTTP stubbing for BGG client tests
  patterns:
    - Rate-limited HTTP client via Rails.cache (Solid Cache)
    - 202 retry loop for async BGG collection generation
    - Custom error hierarchy wrapping Faraday exceptions
    - Nil-safe XML field access with Nokogiri CSS selectors
    - Module-based normalizer with module_function
key-files:
  created:
    - app/services/bgg.rb (module + error hierarchy)
    - app/services/bgg/rate_limiter.rb (throttle with cache-backed interval)
    - app/services/bgg/client.rb (Faraday-based BGG XML API v2 client)
    - app/services/bgg/normalizer.rb (XML-to-hash normalization)
    - spec/support/webmock.rb (WebMock config scoped to :bgg tag)
    - spec/services/bgg/rate_limiter_spec.rb
    - spec/services/bgg/client_spec.rb
    - spec/services/bgg/normalizer_spec.rb
    - spec/fixtures/files/stevmachine_collection.xml
    - spec/fixtures/files/stevmachine_thing.xml
  modified:
    - Gemfile (added faraday, faraday-retry, nokogiri, webmock)
    - Gemfile.lock
    - spec/rails_helper.rb (enabled spec/support autoloading)
decisions:
  - Consolidated error classes into app/services/bgg.rb instead of separate errors.rb to avoid Zeitwerk autoloading mismatch (errors.rb → Bgg::Errors, not Bgg::Error)
  - Rate limiter uses Rails.cache (Solid Cache) with "bgg:last_request_at" key — works across all workers, no Redis needed
  - 202 retry loop is public (request_with_202_retry) so CollectionFetcher can use it directly
  - Error mapping covers Faraday::ResourceNotFound → Bgg::ResourceNotFound, ClientError → Bgg::ClientError, ServerError → Bgg::ServerError, TimeoutError/ConnectionFailed → Bgg::NetworkError
  - Normalizer uses module_function for class-level call convention (Bgg::Normalizer.normalize_collection)
metrics:
  tasks-completed: 3
  total-tasks: 3
  tests-passed: 37 (all suite)
  new-tests: 32
  duration: ~18m
  completed-date: 2026-07-03
---

# Phase 02 Plan 01: BGG Integration Gems, HTTP Client, Rate Limiter, and Normalizer Summary

Created the foundational BGG integration layer — HTTP client with Faraday, rate limiter backed by Solid Cache, Nokogiri-based XML normalizer, and comprehensive test suite with WebMock stubs and realistic BGG XML fixtures.

## Tasks Completed

### Task 1: Install BGG dependency gems
- **Commit:** e357488
- Added `faraday ~> 2.14`, `faraday-retry ~> 2.4`, `nokogiri ~> 1.19`, `webmock ~> 3.26` to Gemfile
- Completed by previous executor

### Task 2: Create Bgg errors, rate limiter, and HTTP client
- **Commit:** 5a43373
- **Files:** `app/services/bgg.rb`, `app/services/bgg/rate_limiter.rb`, `app/services/bgg/client.rb`, `spec/support/webmock.rb`, `spec/services/bgg/rate_limiter_spec.rb`, `spec/services/bgg/client_spec.rb`, `spec/rails_helper.rb`
- Bgg error hierarchy with 9 error classes (Error → QueuedResponse, CollectionNotReadyError, ResourceNotFound, ClientError, ServerError, NetworkError, ParseError, RateLimitError)
- Bgg::RateLimiter with 5-second minimum interval via Rails.cache cache key "bgg:last_request_at"
- Bgg::Client with Faraday 2 connection, User-Agent header, retry middleware (3 attempts, exponential backoff on 429/502/503), error wrapping, 202 retry loop (5 attempts with 5s sleep)
- Public `request_with_202_retry` method for CollectionFetcher consumption
- WebMock support configured with `:bgg` metadata tag for scoped HTTP stubbing

### Task 3: Create Bgg::Normalizer and XML fixtures
- **Commit:** 4a9b2f2
- **Files:** `app/services/bgg/normalizer.rb`, `spec/fixtures/files/stevmachine_collection.xml`, `spec/fixtures/files/stevmachine_thing.xml`, `spec/services/bgg/normalizer_spec.rb`
- Bgg::Normalizer with nil-safe field access and collection/thing normalization
- Collection fixture: 3 items (2 boardgames + 1 expansion) with full stats
- Thing fixture: single item with statistics, ratings, and poll data
- Specs covering multi/single/empty collections, full/missing fields, expansion subtype handling

## Test Results

```
37 examples, 0 failures
```

All tests pass including 4 pre-existing GraphQL schema + request tests. 32 new tests across the three new spec files.

## Deviations from Plan

**1. [Rule 3 - Fix] Consolidated error classes into bgg.rb**
- **Found during:** Task 2 (during `bundle exec rspec` after creating `app/services/bgg/errors.rb`)
- **Issue:** Zeitwerk maps `app/services/bgg/errors.rb` to `Bgg::Errors` (plural), but our error classes are `Bgg::Error`, `Bgg::QueuedResponse`, etc. (singular, multiple constants in one file). Rails could not autoload them, causing `uninitialized constant` errors.
- **Fix:** Moved all error class definitions into `app/services/bgg.rb` (the module root file) and removed `app/services/bgg/errors.rb`. This is idiomatic — core module-level constants live alongside the module declaration.
- **Files modified:** `app/services/bgg.rb` (consolidated), `app/services/bgg/errors.rb` (deleted)

## Known Stubs

None. All normalizer fields are wired from actual XML parsing with nil-safe fallbacks.

## Threat Flags

None. The BGG client does not expose network endpoints, auth paths, or file access patterns. All HTTP calls are outbound to boardgamegeek.com and covered by rate limiting + error wrapping.

## Self-Check: PASSED

All created files verified on disk, all commits confirmed in git log.
