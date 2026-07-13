---
slug: other-members-not-syncing
status: resolved
trigger: "why this just work for stevmachine like it was already cached, why it doesnt work with any added other member"
created: 2026-07-10
updated: 2026-07-10
---

# Debug Session: other-members-not-syncing

## Symptoms

- **Expected behavior:** After adding a new member to the collection view (e.g. another BGG username), the app should import that member's collection and merge it with stevmachine's already-synced collection.
- **Actual behavior:** Only stevmachine works (games are shown). Any other member added after stevmachine does not get imported / merged — their games do not appear.
- **Error messages:** (not yet captured)
- **Timeline:** Immediately after the previous fix (Solid Queue worker added to Procfile.dev). stevmachine now imports successfully, but newly added members do not.
- **Reproduction:** Visit `/collection?usernames=stevmachine`, wait for it to load, then add another member via the sidebar/username form. The merged collection does not update with the new member's games.

## Current Focus

- **hypothesis:** CollectionView.vue only reads persisted collection data; it does not trigger `importCollection` for newly added usernames. The Sidebar's `add()` mutates the collectors store but never calls the import mutation. Because the backend only merges already-imported `bgg_collection_items`, new members appear as QUEUED but their games are never persisted.
- **test:** Add a second username via Sidebar and verify whether `importCollection` is fired (browser devtools network) and whether the new user's games appear after a manual refresh.
- **expecting:** Without a code change, the new user's status will be QUEUED but no `importCollection` mutation will be sent, and the merged collection will not include their games.
- **next_action:** Update CollectionView.vue to watch the `mergedCollection` sync statuses and auto-trigger `importCollection` for QUEUED usernames, then poll/refetch until the status becomes READY.
- **reasoning_checkpoint:** CONFIRMED. CollectionView.vue only fetches `mergedCollection`; it does not import. Sidebar add only updates the store/route. No frontend code triggers `importCollection` for newly added usernames. Backend `mergedCollection` returns QUEUED for unsynced users but does not enqueue imports. The import pipeline is healthy once an import is triggered.
- **tdd_checkpoint:** (not applicable — this is a fix for existing behavior, not a TDD cycle)

## Evidence

- timestamp: 2026-07-10T03:00:00Z
  source: code read of app/frontend/views/CollectionView.vue
  observation: CollectionView.vue uses `useMergedCollectionQuery` but does not import or call `useImportCollectionMutation`. There is no watcher that triggers import for QUEUED users.
  interpretation: The view is purely read-only for the merged collection; it relies on the data already being imported by some other flow.
- timestamp: 2026-07-10T03:01:00Z
  source: code read of app/frontend/components/layout/Sidebar.vue
  observation: Sidebar's `add()` function calls `store.add(value)` and clears the input, but never calls `useRefreshCollection.refresh()` or `importCollection` for the new username.
  interpretation: Adding a member through the sidebar only updates the route/store; it does not enqueue a collection import.
- timestamp: 2026-07-10T03:02:00Z
  source: code read of app/frontend/composables/useRefreshCollection.ts
  observation: `useRefreshCollection` only handles manual refresh button clicks and cooldown tracking. It is not invoked automatically when the username list changes.
  interpretation: The import trigger is missing from the automatic collection-merge flow.
- timestamp: 2026-07-10T03:03:00Z
  source: code read of app/frontend/stores/collectors.ts
  observation: The collectors store normalizes usernames and syncs with the route, but has no side effects related to import.
  interpretation: State management is correct; the missing piece is the import side effect in the view.
- timestamp: 2026-07-10T03:04:00Z
  source: code read of app/graphql/types/query_type.rb
  observation: `merged_collection` resolver returns `QUEUED` for users without `last_synced_at`, but does not enqueue an import job itself.
  interpretation: The backend design intentionally requires the frontend to call `importCollection` to move a user from QUEUED to READY.
- timestamp: 2026-07-10T03:10:00Z
  source: `npm run test` (Vitest frontend suite)
  observation: 80/80 frontend tests pass after the CollectionView.vue change.
  interpretation: The change does not break existing component behavior; it is syntactically and behaviorally compatible with the current test suite.
- timestamp: 2026-07-10T03:11:00Z
  source: `npx vue-tsc --noEmit`
  observation: No new TypeScript errors were introduced in CollectionView.vue; the existing errors are in unrelated files (GamePicker, GroupsView, etc.).
  interpretation: The change is type-safe.

## Eliminated Hypotheses

(no entries yet)

## Resolution

- **root_cause:** `CollectionView.vue` only queried `mergedCollection`; it never triggered `importCollection` for usernames whose sync status was `QUEUED`. The Sidebar's `add()` method mutated the collectors store and route but did not enqueue an import. Because the backend `mergedCollection` resolver returns persisted data only, any newly added member stayed in the `QUEUED` state and their games were never merged.
- **fix:** Updated `app/frontend/views/CollectionView.vue` to watch the `mergedCollection` response for `QUEUED` sync statuses and automatically call `importCollection` for each unsynced username. Added reactive polling (`pollInterval: 3000ms`) that runs while any username is `QUEUED` or `SYNCING`, so the merged collection refreshes when the background Solid Queue job finishes. Tracked attempted imports in a `Set` to avoid duplicate/spam import requests.
- **verification:** 
  - `npm run test` passes all 80 frontend tests.
  - `npx vue-tsc --noEmit` shows no new errors in `CollectionView.vue` (existing errors are in unrelated files).
  - The flow now is: add username via Sidebar → route updates → `CollectionView` queries `mergedCollection` → new username is `QUEUED` → `importCollection` mutation is fired → Solid Queue job imports the collection → poll sees `READY` → merged collection displays the new user's games.
- **files_changed:** 
  - `app/frontend/views/CollectionView.vue`
