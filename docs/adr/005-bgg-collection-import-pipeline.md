# ADR-005: Async BGG Collection Import Pipeline

## Status

accepted

## Context

Fetching a BGG collection requires multiple XML API calls and can take several seconds due to BGG's rate limit and async collection preparation. A synchronous GraphQL resolver would block the request for too long and could time out. The frontend needs to show progress while data is being fetched and persisted.

## Decision

Collection imports are performed **asynchronously by `Bgg::ImportCollectionJob`**:

- `importCollection(username)` GraphQL mutation enqueues the job and returns immediately.
- The job runs inside a Solid Queue concurrency lock: `limits_concurrency to: 1, key: "bgg_api"`.
- The job validates the BGG user, fetches the collection (using the two-call expansion workaround), and persists the normalized data via `Bgg::CollectionPersister`.
- At each lifecycle stage the job broadcasts the current status via `BoardgameNightSchema.subscriptions.trigger(:collection_synced, ...)`:
  - `QUEUED` when the job is enqueued.
  - `SYNCING` when work begins.
  - `READY` on successful completion.
  - `ERROR` on permanent failure.
- The frontend subscribes to `collectionSynced(username)` and renders the collection as soon as the status becomes `READY`.

## Consequences

- The GraphQL mutation remains fast and never blocks on BGG.
- The UI can display per-user progress and partial results.
- Failed imports are isolated to one user and do not block other users.
- BGG rate limiting is enforced across the job queue, not per request.

## Alternatives Considered

- **Synchronous import in the resolver** — rejected: would block for tens of seconds, time out, and violate BGG rate limits under load.
- **Polling the backend for status** — rejected: GraphQL subscriptions provide real-time updates without repeated HTTP requests.

## References

- `app/jobs/bgg/import_collection_job.rb`
- `app/services/bgg/client.rb`
- `app/services/bgg/collection_fetcher.rb`
- `app/services/bgg/collection_persister.rb`
- `.planning/phases/03-graphql-api-collection-surface-v1-parity/03-RESEARCH.md`
