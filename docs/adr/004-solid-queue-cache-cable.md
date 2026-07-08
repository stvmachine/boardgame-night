# ADR-004: Solid Queue, Solid Cache, and Solid Cable Instead of Redis

## Status

accepted

## Context

A typical Rails app historically reached for Redis for background jobs (Sidekiq), caching, and ActionCable pub/sub. At the scale of a friend-group app with no paid operations team, running Redis adds deployment, monitoring, and backup overhead that is not justified. Rails 8 ships with DB-backed replacements for all three concerns.

## Decision

We will use the **Rails 8 "Solid" trifecta** as the default for jobs, cache, and subscriptions:

- **Solid Queue** for background jobs (`Bgg::ImportCollectionJob`).
- **Solid Cache** for `Rails.cache` (BGG response cache, rate-limit timestamps).
- **Solid Cable** for ActionCable subscriptions (`collectionSynced` GraphQL subscription).

All three are backed by the primary database (or dedicated DB files in SQLite) and require no Redis service.

BGG jobs additionally use `limits_concurrency to: 1, key: "bgg_api"` so that only one BGG API job runs at a time across the entire app, regardless of worker count.

## Consequences

- Zero external services beyond the Rails database.
- Operational surface is reduced to a single deployable unit.
- DB-backed adapters are sufficient for the expected v1 load (small friend groups, occasional BGG imports).
- A future scaling tier may reintroduce Redis or PostgreSQL only when observability shows it is needed.

## Alternatives Considered

- **Sidekiq + Redis** — rejected: adds an operational dependency the app does not need at v1.
- **Redis for cache and ActionCable** — rejected: Solid Cache/Cable satisfy the same needs with the existing database.

## References

- `app/jobs/bgg/import_collection_job.rb`
- `config/cable.yml`
- `config/cache.yml` (Solid Cache configuration)
- <https://github.com/rails/solid_queue>
- <https://github.com/rails/solid_cache>
- <https://github.com/rails/solid_cable>
