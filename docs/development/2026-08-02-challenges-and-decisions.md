---
title: "Challenges and Decisions in the Rails Backend"
date: 2026-08-02
description: "A tour of the hard-won trade-offs in the backend: BGG rate limits, persisted collections, no-Redis Solid services, dry-validation contracts, database sessions, and deterministic poll-based scoring."
tags: [rails, bgg, solid-queue, dry-validation, architecture]
---

## The problem

Building a Rails backend for a BGG-backed boardgame night app means living at the intersection of three unreliable things: an external XML API with strict rate limits and idiosyncratic responses, a small deployment footprint that cannot afford Redis, and a frontend that expects fast, consistent GraphQL responses even when the upstream data is slow. This post collects the decisions that make those constraints work together.

## BGG rate limits, retries, and the expansion workaround

BoardGameGeek's XML API v2 allows roughly one request every five seconds. Exceeding that returns 429 or 503. Worse, the collection endpoint has a long-standing bug: requesting `subtype=boardgame` returns expansions tagged as base games. The only reliable fix is two calls: one excluding expansions, one only expansions, then merge.

The rate limiter is intentionally small:

```ruby
module Bgg
  class RateLimiter
    MINIMUM_INTERVAL = 5
    CACHE_KEY = "bgg:last_request_at"

    def throttle
      last_request_at = Rails.cache.read(CACHE_KEY)

      if last_request_at
        elapsed = Time.now.to_f - last_request_at.to_f
        if elapsed < MINIMUM_INTERVAL
          sleep(MINIMUM_INTERVAL - elapsed)
        end
      end

      Rails.cache.write(CACHE_KEY, Time.now.to_f)
      yield
    end
  end
end
```

A single cached timestamp enforces the interval across all workers, backed by Solid Cache. The `Bgg::Client` wraps Faraday with retries on 429, 502, and 503, and a custom `request_with_202_retry` method that polls BGG's "queued" 202 responses up to five times before giving up.

The collection fetcher puts the two-call workaround and fallback into one place:

```ruby
boardgames_doc = @client.request_with_202_retry(:collection,
  username: username,
  excludesubtype: "boardgameexpansion",
  own: 1,
  stats: 1
)

expansions_doc = @client.request_with_202_retry(:collection,
  username: username,
  subtype: "boardgameexpansion",
  own: 1,
  stats: 1
)
```

If the workaround fails, the fetcher falls back to a single unfiltered call. This is the only module that knows BGG's quirks; the rest of the app deals with normalized game hashes. See [ADR-005](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/005-bgg-collection-import-pipeline.md) for the full import pipeline decision.

## Persisted collections, not live API calls

The most important architectural decision is that BGG is only touched during import. Every query, suggestion, and pick reads from `bgg_things` and `bgg_collections`. The import is asynchronous:

```ruby
class Bgg::ImportCollectionJob < ApplicationJob
  queue_as :bgg_imports

  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::CollectionNotReadyError, wait: 30.seconds, attempts: 3

  discard_on Bgg::ResourceNotFound
  discard_on Bgg::InvalidUsernameError
  discard_on ActiveJob::DeserializationError
```

The global concurrency lock guarantees that no two BGG jobs run at the same time, no matter how many workers exist. Retries are explicit and bounded; permanent failures are discarded so the queue does not retry a bad username forever. While the job runs, it broadcasts status over GraphQL subscriptions so the UI can show progress.

Persisting collections also makes the merged collection query a SQL join instead of a blocking API call. That is what lets the suggestion engine return ranked results in tens of milliseconds.

## No-Redis Solid services

Rails 8 ships with Solid Queue, Solid Cache, and Solid Cable, all backed by the database. We use them instead of Redis for the same reasons we use SQLite: fewer moving parts, fewer things to back up, and a single Docker image. Solid Queue runs the BGG import jobs. Solid Cache stores the rate-limit timestamp and cached BGG responses. Solid Cable handles the GraphQL subscription channel for collection sync status. See [ADR-004](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/004-solid-queue-cache-cable.md) for the full rationale.

The trade-off is that Solid Queue is polled on SQLite, which is fine for a friend-group app with occasional imports but would become the first thing to swap if the project grew. The boundary is clean: the job code is just an ActiveJob, so replacing the backend later is a configuration change, not a rewrite.

## dry-validation as the single input boundary

Every GraphQL mutation passes its arguments through a dry-validation contract before touching the database. The contract layer gives us coercion, structured errors, and a clear place to add rules. For example, the sign-in mutation runs a contract before hashing:

```ruby
def resolve(email:, password:)
  contract = SignInContract.new.call(email: email, password: password)
  raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

  user = User.find_by(email: contract[:email])
  if user.nil? || !user.authenticate(contract[:password])
    raise GraphQL::ExecutionError, "Invalid credentials"
  end

  session = user.sessions.create!(expires_at: 30.days.from_now)
  { token: session.token, user: user }
end
```

We do not use Rails Strong Parameters for GraphQL input. Contracts own the boundary, so there is no ambiguity about which layer validates what. The same pattern is repeated for import, RSVP, schedule, pick-game, and state-transition mutations. [ADR-007](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/007-dry-rails-validation-contracts.md) documents why this boundary is a single layer.

## Database sessions and Bearer tokens

Instead of JWT or cookie sessions, we use the Rails 8 authentication generator adapted for Bearer tokens. Sessions are rows in the database, so revocation is a single `destroy` call. The `Authentication` concern reads the `Authorization` header and sets `Current.user` before any resolver runs. [ADR-008](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/008-authentication-session-strategy.md) records the provenance of that decision.

The main cost is one indexed `Session` lookup per authenticated request. At the scale of a few friend groups, that is negligible compared to the simplicity of instant revocation, per-device sessions, and a future "sign out everywhere" feature.

## Deterministic poll-based scoring

The suggestion engine ranks games by player count fit, time fit, complexity preference, community rating, and ownership. Each component is bounded between 0 and 100 and then weighted:

```ruby
WEIGHTS = {
  player_count: 0.40,
  time: 0.20,
  complexity: 0.20,
  rating: 0.10,
  ownership: 0.10
}.freeze
```

Player-count fit is the most important and the most complex. When enough BGG poll data exists, the engine uses the "suggested_numplayers" poll for the target number of players:

```ruby
results = poll.results_for_player_count(attendee_count)
total = results.sum(&:num_votes)

best = results.select(&:best?).sum(&:num_votes)
rec = results.select(&:recommended?).sum(&:num_votes)

100.0 * (best.to_f / total + 0.6 * rec.to_f / total)
```

When data is sparse, the engine falls back to a smooth function of the published `min_players` and `max_players`. The final score is deterministic and reproducible: the same session, attendees, and collections always produce the same ranked list, which makes debugging and testing straightforward. The engine also returns a breakdown per game so the UI can explain *why* a game was suggested.

## Trade-offs

The common thread through these decisions is "do the simple, self-contained thing until observability says otherwise." SQLite plus Solid services is simple. Database sessions are simple. A single rate-limit timestamp is simple. A persisted collection plus SQL merge is simple. Each has a known upgrade path: PostgreSQL, Redis for the rate limiter, a materialized collection snapshot, or a dedicated job backend. None of those upgrades are needed today, and each can be made without touching the public GraphQL schema or the React UI.

The hardest part is not any single choice; it is keeping the boundaries clean so that one external quirk (BGG 202s, expansion mislabeling, rate limits) does not leak into the rest of the system. The `Bgg` namespace, the contract layer, and the persisted-read model are the boundaries that make that possible.
