---
slug: collection-empty-stevmachine
status: investigating
trigger: "the app is not really showing any game : http://localhost:5173/collection?usernames=stevmachine"
created: 2026-07-10
updated: 2026-07-10
status: resolved
---

# Debug Session: collection-empty-stevmachine

## Symptoms

- **Expected behavior:** Collection view at `/collection?usernames=stevmachine` should display the merged board game collection for the stevmachine BGG username.
- **Actual behavior:** The page loads but the collection view is empty — zero games shown.
- **Error messages:** Apollo Client error in browser console: `client.ts:34 An error occurred! For more details, see the full error text at https://go.apollo.dev/c/err#...` — indicates a GraphQL-level error (query failure or response error).
- **Timeline:** First time trying this URL — never confirmed working for this username.
- **Reproduction:** Visit `http://localhost:5173/collection?usernames=stevmachine` in the browser.

## Current Focus

- **hypothesis:** The Solid Queue BGG import worker is not running, so the `importCollection` job is enqueued but never processed, leaving `bgg_collections` empty and `mergedCollection` returning zero items.
- **test:** Check `SolidQueue::Job` records for `Bgg::ImportCollectionJob`, verify worker process status, and confirm whether running the worker with the BGG token populates the collection.
- **expecting:** If the worker is started and has `BGG_TOKEN`, the import job will finish and `mergedCollection` will return games for `stevmachine`.
- **next_action:** Apply the fix (add worker to Procfile.dev) and verify the collection view.
- **reasoning_checkpoint:** The GraphQL query itself is not failing — direct curl to `/graphql` returns a successful response with `items: []` and `syncStatus: { status: READY, gameCount: 0 }`. The empty collection is because no import has ever been completed. `User` exists, `last_synced_at` is nil, and `BggCollection` count is 0. Solid Queue has a failed job with `Bgg::ClientError 401` (worker was run without `BGG_TOKEN`) and a `ready` job waiting for a worker that is not running. Starting a worker with dotenvx (`BGG_TOKEN` injected) completed the import and returned 75 games.
- **tdd_checkpoint:** (not yet populated)

## Evidence

- timestamp: 2026-07-10T02:30:00Z
  source: direct curl POST http://localhost:3000/graphql
  observation: mergedCollection query succeeds with HTTP 200 and returns `{ data: { mergedCollection: { items: [], syncStatuses: [{ username: "stevmachine", status: "READY", lastSyncedAt: null, error: null, gameCount: 0 }] } } }`. No GraphQL errors in the response.
  interpretation: The query pipeline is healthy; the empty view is a data/import issue, not a GraphQL query failure.
- timestamp: 2026-07-10T02:32:00Z
  source: bin/rails runner
  observation: User.find_by(bgg_username: "stevmachine") exists with last_synced_at: nil. BggCollection.joins(:user).where(users: { bgg_username: "stevmachine" }).count == 0. BggThing.merged_for_bgg_usernames(["stevmachine"]).count == 0.
  interpretation: The local user record was created but the BGG collection import never completed, so no games are persisted.
- timestamp: 2026-07-10T02:32:00Z
  source: SolidQueue::Job inspection
  observation: Job 3 (Bgg::ImportCollectionJob, args: ["stevmachine"]) has status :ready. Jobs 1 and 2 have status :failed. FailedExecution for job 2 shows Bgg::ClientError: "the server responded with status 401 for GET https://boardgamegeek.com/xmlapi2/user?name=stevmachine".
  interpretation: A previous worker ran without the BGG_API token (401). The current job is enqueued but no worker is processing it.
- timestamp: 2026-07-10T02:33:00Z
  source: shell curl and dotenvx get
  observation: Direct curl to BGG user endpoint without token returns 401; with token returns 200. `dotenvx get BGG_TOKEN` returns a valid token.
  interpretation: The BGG API requires the token, and the token is present in the encrypted .env.bggeek file. The Rails server is started with dotenvx and can validate usernames successfully, but the Solid Queue worker is not started with dotenvx.
- timestamp: 2026-07-10T02:36:00Z
  source: manual worker run `dotenvx run -f .env.bggeek -fk .env.bggeek.keys -- bin/jobs start`
  observation: Job 3 finished successfully. User last_synced_at updated to 2026-07-10 02:36:38 UTC. BggCollection count == 75. BggThing.merged_for_bgg_usernames(["stevmachine"]).count == 75. Re-querying mergedCollection returns 75 items with correct sync status.
  interpretation: Running the worker with the BGG token proves the import pipeline works. The only missing piece in dev is the worker process.

## Eliminated Hypotheses

- GraphQL resolver error causing empty collection: ELIMINATED. Direct curl shows query succeeds and returns empty data, not an error.
- Frontend not sending correct usernames: ELIMINATED. The query uses `collectorsStore.usernames`, and the URL `?usernames=stevmachine` is parsed correctly into ["stevmachine"].
- BGG token missing or invalid: ELIMINATED. `dotenvx get BGG_TOKEN` returns a valid token, and the same token works with BGG API.
- Import pipeline logic bug (fetcher/persister/normalizer): ELIMINATED. The import completed successfully when the worker ran with the token, populating 75 games correctly.
- Frontend code not triggering import: PARTIALLY ELIMINATED. The current design requires a manual refresh, but the reported empty view is ultimately caused by the import job never completing, not by a frontend bug.

## Resolution

- **root_cause:** The `Procfile.dev` only defined `web` and `vite` processes; it did not start the Solid Queue worker (`bin/jobs`). As a result, `Bgg::ImportCollectionJob` was enqueued by the `importCollection` mutation but never executed, so the `bgg_collections` / `bgg_things` tables remained empty and the `mergedCollection` query returned zero items. In addition, `QueryType#sync_status_for` always returned `"READY"`, which hid the fact that the user had never been synced. The Apollo Client error noted by the reporter could not be reproduced once the backend query was exercised; the GraphQL response itself was never failing, so the error was likely a transient side effect of the empty/false-READY state or a previous failed mutation.
- **fix:** 
  1. Added `worker: dotenvx run -f .env.bggeek -fk .env.bggeek.keys -- bin/jobs start` to `Procfile.dev` so the Solid Queue worker runs with the same `BGG_TOKEN` environment as the Rails server.
  2. Updated `QueryType#sync_status_for` to return `"QUEUED"` when a user has never been synced (`last_synced_at` blank) and `"READY"` only after a successful sync.
  3. Added an RSpec example covering the new `"QUEUED"` behavior for unsynced users in `spec/graphql/merged_collection_query_spec.rb`.
- **verification:** 
  - Started the worker manually with `dotenvx run -f .env.bggeek -fk .env.bggeek.keys -- bin/jobs start`; the pending `Bgg::ImportCollectionJob` for `stevmachine` finished, producing 75 `BggCollection` records and 75 `BggThing` records.
  - Re-queried `mergedCollection(usernames: ["stevmachine"])` via both `http://localhost:3000/graphql` and `http://localhost:5173/graphql`; both returned 75 items with `status: READY`, `gameCount: 75`.
  - Verified `mergedCollection` for an unsynced username now returns `status: QUEUED` instead of `READY`.
  - Ran `bundle exec rspec spec/graphql/merged_collection_query_spec.rb spec/jobs/bgg/import_collection_job_spec.rb spec/graphql/import_collection_mutation_spec.rb` — 29 examples, 0 failures.
- **files_changed:** 
  - `Procfile.dev`
  - `app/graphql/types/query_type.rb`
  - `spec/graphql/merged_collection_query_spec.rb`
