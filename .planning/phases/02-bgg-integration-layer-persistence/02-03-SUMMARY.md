---
phase: 02-bgg-integration-layer-persistence
plan: 03
type: execute
status: complete
subsystem: Collection Import Pipeline
tags: [collection-fetcher, import-job, solid-queue, expansion-workaround, fallback]
requires:
  - 02-01 (Bgg::Client, Bgg::RateLimiter, Bgg::Normalizer)
  - 02-02 (User, BggThing, BggCollection models, Bgg::CollectionPersister)
provides:
  - Bgg::CollectionFetcher (two-call expansion workaround + fallback)
  - Bgg::ImportCollectionJob (Solid Queue job with concurrency gate + retry/discard policy)
affects:
  - app/services/bgg/collection_fetcher.rb
  - app/jobs/bgg/import_collection_job.rb
  - spec/services/bgg/collection_fetcher_spec.rb
  - spec/jobs/bgg/import_collection_job_spec.rb
tech-stack:
  added: []
  patterns:
    - Two-call expansion workaround: excludesubtype + subtype calls merged at XML level
    - Fallback on ClientError/ServerError/NetworkError with warning log
    - Solid Queue limits_concurrency with global "bgg_api" key for API safety
    - retry_on polynomially_longer for transient errors (timeout, 5xx, 202 exhaustion)
    - discard_on for permanent errors (404, invalid username, deserialization failure)
    - Username-string job parameter pattern (not User object — user lookup inside job)
key-files:
  created:
    - app/jobs/bgg/import_collection_job.rb
    - spec/jobs/bgg/import_collection_job_spec.rb
  modified:
    - app/services/bgg/collection_fetcher.rb (created in prior session)
    - spec/services/bgg/collection_fetcher_spec.rb
decisions:
  - ImportCollectionJob takes username (String) not User object — job validates existence on BGG and looks up local User by bgg_username before persisting
  - CollectionFetcher merges at XML level (Nokogiri), not hash level — keeps Normalizer as sole hash-creation path
  - Fallback catches ClientError (which includes CollectionNotReadyError), ServerError, and NetworkError — covers both BGG errors and transport failures
  - config/queue.yml NOT modified — the `queues: "*"` catch-all already includes :bgg_imports
  - User validation via client.user() is a separate rate-limited BGG call before collection fetch — adds ~5s latency but prevents wasted API calls on invalid usernames
  - Old ImportCollectionJob class at app/jobs/import_collection_job.rb preserved for backward compatibility (4 tests still pass)
metrics:
  tasks-completed: 2
  total-tasks: 2
  tests-passed: 81 (full suite)
  new-tests: 18 (8 CollectionFetcher + 10 ImportCollectionJob)
  duration: ~45m (across two sessions)
  completed-date: 2026-07-04
---

# Phase 02 Plan 03: BGG CollectionFetcher + ImportCollectionJob Summary

Built the BGG collection import pipeline: the two-call expansion workaround service (Bgg::CollectionFetcher) that merges base games + expansions with a fallback path, and the Solid Queue background job (Bgg::ImportCollectionJob) that orchestrates fetch → persist with concurrency gating and explicit retry/discard policies. This ties together the transport layer (Client), parsing layer (Normalizer), and persistence layer (CollectionPersister) into a production-ready background import flow.

## Tasks Completed

### Task 1: Create Bgg::CollectionFetcher with two-call expansion workaround and fallback
- **Commit:** 6dfc13c
- **Files:** `app/services/bgg/collection_fetcher.rb`, `spec/services/bgg/collection_fetcher_spec.rb`
- **Bgg::CollectionFetcher#fetch(username)** makes two API calls:
  1. `excludesubtype=boardgameexpansion` → base games (62 items in fixture)
  2. `subtype=boardgameexpansion` → expansions (13 items in fixture)
- Merges both results at the XML level into a single document (75 total items)
- Falls back to single `subtype=boardgame` call on ClientError, ServerError, or NetworkError
- Both workaround and fallback failures re-raise the original error
- Warning logged on fallback path
- Uses `request_with_202_retry` (from Plan 01) — each call independently throttled and retried
- Injectable `client:` and `normalizer:` for test isolation via `instance_double`
- 8 test examples exercising success path, fallback paths (client error + network error), double-failure, and warning logging

### Task 2: Create Bgg::ImportCollectionJob with Solid Queue concurrency control and explicit retry/discard policy
- **Commit:** 8f0ebe1
- **Files:** `app/jobs/bgg/import_collection_job.rb`, `spec/jobs/bgg/import_collection_job_spec.rb`
- **Bgg::ImportCollectionJob** enqueues via `perform_later(username)` on `:bgg_imports` queue
- **Concurrency:** `limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes` — global single-job gate for all BGG imports (lock auto-expires after 5 min if worker crashes)
- **Retry policy (transient):**
  - `Faraday::TimeoutError` — polynomially_longer, 5 attempts
  - `Faraday::ServerError` (5xx) — polynomially_longer, 5 attempts
  - `Bgg::CollectionNotReadyError` (202 exhaustion) — 30s wait, 3 attempts
- **Discard policy (permanent):**
  - `Faraday::ResourceNotFound` (404) — BGG endpoint not found
  - `Bgg::InvalidUsernameError` — BGG confirmed user doesn't exist
  - `ActiveJob::DeserializationError` — corrupted job payload
- **Perform flow:**
  1. Validate user on BGG via `client.user(username)` (raises InvalidUsernameError if not found)
  2. Fetch collection via `Bgg::CollectionFetcher.new.fetch(username)`
  3. Persist to DB via `Bgg::CollectionPersister.new(user: user).persist_collection!(collection)`
  4. Log success with item count
- When no local User record exists for a validated BGG username, logs warning and skips persistence
- 10 test examples: validate, fetch, persist, invalid username (empty id + no node), missing local user (no-persist + warning), retry/discard declarations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test stub matching in CollectionFetcher fallback specs**
- **Found during:** Task 1 (running tests after writing CollectionFetcher spec)
- **Issue:** The fallback stubs used `hash_including(username: username)` which matched BOTH the workaround calls (which also have `username:`) and the fallback call. Since the workaround stubs were defined first and raised errors, the test setup was actually correct for success-path tests. But the warning-log test was unreachable — the fallback stub had the same matcher as the first workaround call, so the workaround "error" stub would override it. Fixed by using `hash_excluding(:excludesubtype, :subtype)` for fallback stubs to ensure they only match the fallback call params.
- **Fix:** Changed all fallback stubs from `hash_including(username: username)` to `hash_excluding(:excludesubtype, :subtype)`.
- **Files modified:** `spec/services/bgg/collection_fetcher_spec.rb`
- **Commit:** 6dfc13c

**2. [Rule 1 - Bug] Fixed `expect_any_instance_of` not working with stubbed `new`**
- **Found during:** Task 2 (running ImportCollectionJob spec)
- **Issue:** The plan's pseudocode used `expect_any_instance_of(Bgg::Client).to receive(:user)` but the spec stubs `Bgg::Client.new` to return a double. `expect_any_instance_of` installs expectations on the real class's `new` method, but the `allow(Bgg::Client).to receive(:new)` stub intercepts `new` first, so `expect_any_instance_of` expectations are never triggered.
- **Fix:** Replaced all `expect_any_instance_of` with expectations on the double variables directly (e.g., `expect(client).to receive(:user)`).
- **Files modified:** `spec/jobs/bgg/import_collection_job_spec.rb`
- **Commit:** 8f0ebe1

**3. [Rule 1 - Bug] Fixed CollectionPersister interface mismatch in job**
- **Found during:** Task 2 (code analysis before writing ImportCollectionJob)
- **Issue:** The plan's pseudocode showed `Bgg::CollectionPersister.new(username, collection).persist!` but the actual existing interface (from Plan 02) is `Bgg::CollectionPersister.new(user: user).persist_collection!(collection)`. The job needs to look up the local User record by `bgg_username`, not pass the username string directly.
- **Fix:** ImportCollectionJob looks up `User.find_by(bgg_username: username)` and passes `user:` keyword to CollectionPersister. Logs warning and skips persistence if no local user found.
- **Files modified:** `app/jobs/bgg/import_collection_job.rb`
- **Commit:** 8f0ebe1

## Threat Surface Scan

Plan's threat model (T-02-P3-01 through T-02-P3-04) covers all introduced surface:
- **T-02-P3-01 (DoS):** `limits_concurrency to: 1, key: "bgg_api"` — mitigated
- **T-02-P3-02 (EoP):** Username validated via BGG /user endpoint before collection fetch — mitigated
- **T-02-P3-03 (Tampering):** XML-level merge creates new document from validated BGG responses, Nokogiri strict parsing — mitigated
- **T-02-P3-04 (Info Disclosure):** BGG usernames logged are public info — accepted

No new security-relevant surface introduced beyond what the threat model covers.

## Test Results

```
81 examples, 0 failures
```

- **Bgg::CollectionFetcher:** 8 examples, 0 failures
- **Bgg::ImportCollectionJob:** 10 examples, 0 failures
- **Full suite (all prior plans):** 81 examples, 0 failures (including 4 pre-existing GraphQL/request tests, 37 Plan 01 tests, 21 Plan 02 model/service tests)

## Success Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| CollectionFetcher makes 2 calls (75 total items) | ✅ | 62 boardgames + 13 expansions merged in workaround path |
| Falls back on ClientError/ServerError/NetworkError | ✅ | 3 fallback test contexts passing |
| Warns on fallback | ✅ | `expect(Rails.logger).to receive(:warn)` test added |
| ImportCollectionJob validates → fetches → persists | ✅ | Full pipeline tested: 4 tests for happy path |
| Invalid username rejected | ✅ | 2 tests: empty id + no `<user>` node → InvalidUsernameError |
| retry_on declarations exist | ✅ | TimeoutError (polynomially_longer, 5x), ServerError (polynomially_longer, 5x), CollectionNotReadyError (30s, 3x) |
| discard_on declarations exist | ✅ | ResourceNotFound, InvalidUsernameError, DeserializationError |
| limits_concurrency declared | ✅ | `limit=1, key=bgg_api, duration=300` confirmed via `rails runner` |
| Job enqueueable via perform_later | ✅ | `Bgg::ImportCollectionJob.perform_later("stevmachine")` succeeds |
| Full pipeline testable | ✅ | Client → RateLimiter → CollectionFetcher → Normalizer → CollectionPersister → DB |

## Known Stubs

None. CollectionFetcher is fully wired with injectable dependencies, real Nokogiri merge logic, and complete fallback handling. ImportCollectionJob has full Solid Queue concurrency control, retry/discard policy, and user validation flow.

## Self-Check: PASSED

All created files verified on disk, both commits confirmed in git log, all 81 tests passing.
