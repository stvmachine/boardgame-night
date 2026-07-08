---
phase: 03-graphql-api-collection-surface-v1-parity
reviewed: 2026-07-08T12:00:00Z
depth: standard
files_reviewed: 91
files_reviewed_list:
  - app/models/bgg_thing.rb
  - app/services/bgg/normalizer.rb
  - app/services/bgg/collection_persister.rb
  - app/services/bgg/client.rb
  - app/services/bgg.rb
  - app/services/bgg/search.rb
  - app/jobs/bgg/import_collection_job.rb
  - app/graphql/boardgame_night_schema.rb
  - app/graphql/types/query_type.rb
  - app/graphql/types/mutation_type.rb
  - app/graphql/types/thing_fields.rb
  - app/graphql/types/thing_type.rb
  - app/graphql/types/merged_thing_type.rb
  - app/graphql/types/merged_collection_type.rb
  - app/graphql/types/owner_type.rb
  - app/graphql/types/user_type.rb
  - app/graphql/types/user_sync_status_type.rb
  - app/graphql/types/sync_status_enum.rb
  - app/graphql/types/hot_item_type.rb
  - app/graphql/types/search_result_type.rb
  - app/graphql/types/validation_result_type.rb
  - app/graphql/types/subscription_type.rb
  - app/graphql/subscriptions/collection_synced.rb
  - app/graphql/subscriptions/base_subscription.rb
  - app/graphql/loaders/owners_loader.rb
  - app/graphql/loaders/users_loader.rb
  - app/graphql/mutations/import_collection.rb
  - app/graphql/mutations/validate_bgg_username.rb
  - app/graphql/mutations/base_mutation.rb
  - app/contracts/application_contract.rb
  - app/contracts/import_collection_contract.rb
  - app/contracts/validate_bgg_username_contract.rb
  - db/migrate/20260707000001_add_statistics_to_bgg_things.rb
  - db/migrate/20260707000002_add_bgg_avatar_url_to_users.rb
  - config/cable.yml
  - config/database.yml
  - config/initializers/solid_cable.rb
  - lib/tasks/graphql.rake
  - lib/tasks/e2e.rake
  - bin/e2e-seed
  - app/frontend/apollo/client.ts
  - app/frontend/composables/useSyncStatus.ts
  - app/frontend/composables/useCollectionFilters.ts
  - app/frontend/composables/usePermalink.ts
  - app/frontend/composables/useMemberColor.ts
  - app/frontend/stores/collectors.ts
  - app/frontend/stores/filters.ts
  - app/frontend/stores/ui.ts
  - app/frontend/utils/filters.ts
  - app/frontend/utils/fuseSearch.ts
  - app/frontend/utils/sorting.ts
  - app/frontend/utils/grouping.ts
  - app/frontend/router/index.ts
  - app/frontend/App.vue
  - app/frontend/views/CollectionView.vue
  - app/frontend/views/HomeView.vue
  - app/frontend/views/HotView.vue
  - app/frontend/components/collection/GameCard.vue
  - app/frontend/components/collection/GameGrid.vue
  - app/frontend/components/collection/CollectionFilters.vue
  - app/frontend/components/collection/SortControl.vue
  - app/frontend/components/collection/GroupByToggle.vue
  - app/frontend/components/collection/EmptyState.vue
  - app/frontend/components/collection/ResultsSkeleton.vue
  - app/frontend/components/layout/AppShell.vue
  - app/frontend/components/layout/AppHeader.vue
  - app/frontend/components/layout/MobileDrawer.vue
  - app/frontend/components/layout/Sidebar.vue
  - app/frontend/components/layout/CollectorsSection.vue
  - app/frontend/components/common/MemberAvatar.vue
  - app/frontend/components/landing/UsernameForm.vue
  - app/frontend/components/landing/HotList.vue
  - app/frontend/types/actioncable.d.ts
  - app/frontend/apollo/queries/merged_collection.graphql
  - app/frontend/apollo/queries/user.graphql
  - app/frontend/apollo/queries/hot_items.graphql
  - app/frontend/apollo/queries/search.graphql
  - app/frontend/apollo/mutations/import_collection.graphql
  - app/frontend/apollo/mutations/validate_bgg_username.graphql
  - app/frontend/apollo/subscriptions/collection_synced.graphql
  - spec/graphql/merged_collection_query_spec.rb
  - spec/graphql/import_collection_mutation_spec.rb
  - spec/graphql/discovery_query_spec.rb
  - spec/graphql/validate_bgg_username_mutation_spec.rb
  - spec/jobs/bgg/import_collection_job_spec.rb
  - spec/services/bgg/client_spec.rb
  - spec/frontend/filters.spec.ts
  - tests/e2e/collection.spec.ts
  - tests/e2e/global-setup.ts
  - tests/e2e/playwright.config.ts
  - tests/e2e/health.spec.ts
findings:
  critical: 1
  warning: 7
  info: 6
  total: 14
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-07-08T12:00:00Z
**Depth:** standard
**Files Reviewed:** 91
**Status:** issues_found

## Summary

Phase 03 delivered the GraphQL collection surface, import/subscription pipeline, discovery queries, and Vue collection UI. The code is generally well-structured and the test suites pass, but the review found a critical job error-handling mismatch that breaks the designed BGG retry/discard strategy, several warnings around contract validation, data accuracy, and frontend correctness, plus info-level duplication and acknowledged stubs.

## Structural Findings (fallow)

No structural findings were provided for this phase.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `Bgg::ImportCollectionJob` uses raw Faraday exception classes while `Bgg::Client` wraps them

**File:** `app/jobs/bgg/import_collection_job.rb:24-26,32,62`
**Issue:** `Bgg::Client` wraps all Faraday transport errors into `Bgg::ResourceNotFound`, `Bgg::ServerError`, and `Bgg::NetworkError` (see `app/services/bgg/client.rb:63-70`). However, `Bgg::ImportCollectionJob` declares `retry_on Faraday::TimeoutError`, `retry_on Faraday::ServerError`, `discard_on Faraday::ResourceNotFound`, and rescues `Faraday::ResourceNotFound`. Because those raw Faraday classes are never raised out of the client, the job's retry/discard declarations are effectively dead code. BGG 404s, 5xx, and timeouts will fall through to default Active Job behavior instead of being discarded/retried as designed, which can lead to lost jobs, incorrect retries, and silent import failures.
**Fix:**
```ruby
# app/jobs/bgg/import_collection_job.rb
retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5
retry_on Bgg::CollectionNotReadyError, wait: 30.seconds, attempts: 3

discard_on Bgg::ResourceNotFound
discard_on Bgg::InvalidUsernameError
discard_on ActiveJob::DeserializationError

# In perform:
rescue Bgg::InvalidUsernameError, Bgg::ResourceNotFound => e
  broadcast(username, "ERROR", error: e.message)
  raise e
```

## Warnings

### WR-01: BGG username contracts do not enforce the documented format rules

**File:** `app/contracts/import_collection_contract.rb:4-8`, `app/contracts/validate_bgg_username_contract.rb:4-8`
**Issue:** Both contracts use `BGG_USERNAME_FORMAT = /\A[a-zA-Z0-9_\-]+\z/` with only `max_size?: 50`. The plan/SUMMARY documents format rules as "3-20 chars, letters/digits/underscores, starts with letter, no `__`". The actual regex allows hyphens, single-character names, names starting with digits, and consecutive underscores. This weakens input validation and may allow invalid usernames to reach the BGG API or be stored as local user records.
**Fix:**
```ruby
BGG_USERNAME_FORMAT = /\A[a-zA-Z][a-zA-Z0-9_]{2,19}\z/.freeze

params do
  required(:username).filled(:string, format?: BGG_USERNAME_FORMAT)
end
```

### WR-02: `CollectionPersister` reports zero updates and ignores `quantity`

**File:** `app/services/bgg/collection_persister.rb:25-41`, `app/services/bgg/normalizer.rb:43-69`
**Issue:** `persist_collection!` initializes `updated: 0` and never increments it, so the return contract `{ added:, updated:, errors: }` is misleading. Additionally, `BggCollection` is created with `quantity: item[:quantity] || 1`, but `normalize_collection_item` does not extract a `quantity` key, so quantity is always 1.
**Fix:** Track `updated` in `upsert_thing!` or change the return contract. Add `quantity` to the normalized collection item hash if BGG exposes it.

### WR-03: Sync status reports the current request time instead of the actual last sync time

**File:** `app/graphql/types/user_type.rb:14-30`, `app/graphql/types/query_type.rb:66-75`
**Issue:** Both `UserType#sync_status` and `QueryType#sync_status_for` set `last_synced_at: Time.current` whenever the status is `READY`. This is not the actual last import time; it is the current request time. Consumers will see a fresh timestamp on every read, which is inaccurate for cache/refresh decisions.
**Fix:** Store the real `last_synced_at` on the user record (or a per-import log) and read it from there. Initialize it to `nil` when the status is not `READY`.

### WR-04: `useSyncStatus` creates subscriptions inside a watcher and never unsubscribes

**File:** `app/frontend/composables/useSyncStatus.ts:12-25`
**Issue:** `useCollectionSyncedSubscription` is called inside a `watch` callback and the results are stored in a plain `Map`. When a username is removed from the list, the subscription is never stopped/unsubscribed, leading to memory and reactive leaks. Calling Vue Apollo composables inside watchers also breaks the Composition API's top-level call convention.
**Fix:** Create subscriptions at setup top level and stop them when the username is removed:
```typescript
const statuses = reactive(new Map<string, ReturnType<typeof useCollectionSyncedSubscription>>())

watch(usernames, (names) => {
  for (const username of names) {
    if (!statuses.has(username)) {
      statuses.set(username, useCollectionSyncedSubscription(() => ({ username })))
    }
  }
  for (const [username, sub] of statuses) {
    if (!names.includes(username)) {
      sub.stop?.()
      statuses.delete(username)
    }
  }
}, { immediate: true })
```

### WR-05: Group-by-rating sort is a no-op

**File:** `app/frontend/utils/grouping.ts:91-95`
**Issue:** `ratingSort` computes `indexA` and `indexB` from the same `name` parameter, so the returned difference is always 0. Rating-bucket groups are therefore not sorted by their bucket order.
**Fix:**
```typescript
function ratingSort(a: string, b: string): number {
  const order = ['9.0+', '8.0–8.9', '7.0–7.9', '6.0–6.9', 'Below 6.0', 'Unrated']
  const indexA = order.indexOf(a)
  const indexB = order.indexOf(b)
  return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
}
```

### WR-06: GraphQL mutations and subscriptions are exposed without authorization

**File:** `app/graphql/mutations/import_collection.rb:9-24`, `app/graphql/mutations/validate_bgg_username.rb:9-27`, `app/graphql/subscriptions/collection_synced.rb:1-13`
**Issue:** There is no authentication or authorization check in `importCollection`, `validateBggUsername`, or `collectionSynced`. Anonymous callers can create user records, enqueue BGG imports, and subscribe to any username's import status. The SUMMARY claims T-03-03-04 rejects anonymous mutation calls, but the implementation does not.
**Fix:** Add a `current_user` context check or a signed-token gate before executing these fields. Until auth is implemented, document the exposure as an accepted temporary risk.

### WR-07: Strict XML parsing may reject real-world BGG responses

**File:** `app/services/bgg/client.rb:75-79`
**Issue:** `parse_xml` uses `Nokogiri::XML(body) { |config| config.strict }`. BGG's XML is not always strictly valid, so strict mode may raise `Bgg::ParseError` on otherwise usable responses.
**Fix:** Use `Nokogiri::XML(body)` without `strict` (or with `recover`) and add a test with a real BGG fixture to ensure parsing is tolerant.

## Info

### IN-01: Duplicate username color hashing

**File:** `app/frontend/components/collection/GameCard.vue:52-59`, `app/frontend/composables/useMemberColor.ts:19-26`
**Issue:** The same hash-and-modulo color algorithm is duplicated in `GameCard` and `useMemberColor`.
**Fix:** Import `useMemberColor` (or a shared `hashUsername`) into `GameCard`.

### IN-02: `SORT_OPTIONS` omits complexity options

**File:** `app/frontend/utils/sorting.ts:15-24`
**Issue:** `SortOption` includes `complexity_asc` and `complexity_desc`, but `SORT_OPTIONS` only lists `weight_asc`/`weight_desc`. The UI will not show a "Complexity" sort label even though the logic supports it.
**Fix:** Add complexity options to `SORT_OPTIONS`.

### IN-03: `usePermalink` does not validate URL parameters

**File:** `app/frontend/composables/usePermalink.ts:24-51`
**Issue:** Values from `URLSearchParams` are converted with `Number(...)` without validation. A malformed `players=abc` results in `NaN` in the filter store, which can cause confusing empty results.
**Fix:** Validate numeric params with `Number.isFinite` before assigning them to the filter store.

### IN-04: Redundant `createConsumer` overload in actioncable type declaration

**File:** `app/frontend/types/actioncable.d.ts:1-4`
**Issue:** The first declaration already has an optional `url?: string`, making the second parameterless overload redundant.
**Fix:** Remove the second declaration.

### IN-05: `is_expansion` is hardcoded to `false`

**File:** `app/models/bgg_thing.rb:25-27`
**Issue:** `BggThing#is_expansion` always returns `false` because BGG does not expose a dedicated expansion flag in the XML endpoints used. The GraphQL schema requires a non-null boolean, so this is an acknowledged stub.
**Fix:** Document the limitation and implement expansion detection when the importer distinguishes expansions (e.g., by object type or subtype).

### IN-06: Two `ImportCollectionJob` classes exist

**File:** `app/jobs/import_collection_job.rb`, `app/jobs/bgg/import_collection_job.rb`
**Issue:** There are two job classes with overlapping responsibilities. `app/jobs/import_collection_job.rb` uses the correct `Bgg::*` error classes but does not broadcast status; `app/jobs/bgg/import_collection_job.rb` broadcasts status but uses the wrong exception classes. The mutation enqueues the namespaced one, so the old top-level job is likely dead code.
**Fix:** Remove the unused `ImportCollectionJob` class and consolidate all behavior into `Bgg::ImportCollectionJob`.

---

_Reviewed: 2026-07-08T12:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
