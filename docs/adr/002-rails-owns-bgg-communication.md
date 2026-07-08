# ADR-002: Rails Owns All BoardGameGeek Communication

## Status

accepted

## Context

BoardGameGeek (BGG) exposes a read-only XML API v2 that requires a strict rate limit (~1 request / 5 seconds), retries on 502/503/429, and a server-side API token loaded from `.env.bggeek`. Exposing BGG credentials or rate-limiting logic to the browser would leak secrets and make throttling impossible to enforce.

## Decision

The **Rails backend is the only tier that communicates with BGG**. All BGG calls (collection, thing, search, user, hot items, plays) go through the `Bgg::Client` service in Rails. The Vue frontend talks to Rails via GraphQL and never calls BGG directly.

`Bgg::Client` is responsible for:

- Loading the BGG token from `.env.bggeek` server-side.
- Enforcing the 1-request-per-5-seconds rate limit via `Bgg::RateLimiter`.
- Retrying transient failures and handling BGG's 202 "queued" responses.
- Caching responses in `Rails.cache` backed by Solid Cache.
- Normalizing XML responses into domain hashes via `Bgg::Normalizer`.

## Consequences

- BGG credentials remain server-side and are never sent to the browser.
- Rate limiting is centralized and cannot be bypassed by multiple clients.
- The GraphQL schema becomes the single source of truth for frontend data needs.
- BGG-specific quirks (202 responses, expansion workaround, XML parsing) are isolated in the `Bgg` namespace.

## Alternatives Considered

- **Vue calls BGG directly** — rejected: would expose credentials and make rate limiting impossible.
- **Keep the existing Node/Apollo Server proxy** — rejected: the project explicitly requires Rails to replace the proxy.

## References

- `PROJECT.md` § Constraints
- `app/services/bgg/client.rb`
- `app/services/bgg/rate_limiter.rb`
