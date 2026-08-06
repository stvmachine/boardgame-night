---
title: "Merged Collection Query Deep Dive: From BGG Import to GraphQL Read"
date: 2026-08-02
description: "How N friends' BGG collections are imported, persisted, deduplicated, and served by a single GraphQL field without ever calling BGG during the read path."
tags: [rails, graphql, bgg, collection, dataloader]
---

## The problem

A boardgame night is only as good as the shared pool of games. The app must merge the BGG collections of every group member, deduplicate by BGG object ID, and return the union with owner metadata — fast enough that browsing feels instant, even when the underlying BGG API is slow, rate-limited, and occasionally returns 202 "not ready yet" responses.

The constraint is clear: do not ask BGG to do this work on every read, and do not expose BGG credentials or rate-limit logic to the browser. That means all communication with BGG lives in Rails, and the merged collection is built from a persisted local copy rather than a live API call.

## The decision: import once, read many

Rails owns every BGG request (see [ADR-002](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/002-rails-owns-bgg-communication.md)). The import path is asynchronous, retried, and throttled; the read path is a SQL query over `bgg_things` and `bgg_collections`. The merge is computed dynamically from persisted rows so the view stays fresh after a member refreshes their collection, without snapshot tables or cache invalidation machinery (see [ADR-005](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/005-bgg-collection-import-pipeline.md)). Owner lookups are batched with `GraphQL::Dataloader` to avoid N+1 queries (see [ADR-003](https://github.com/stvmachine/boardgame-night-ror-vue/blob/main/docs/adr/003-graphql-n-plus-one-dataloader.md)).

## The import path

`Bgg::CollectionFetcher` is responsible for the two-call expansion workaround that BGG's collection endpoint forces on us. If we ask for `subtype=boardgame` alone, expansions are returned mislabeled as base games. The fix is two calls: one excluding expansions, one only expansions, then merge the results.

```ruby
def fetch_with_workaround(username)
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

  merge_docs(boardgames_doc, expansions_doc)
end
```

The client handles the 1-request-per-5-seconds rate limit and retries a 202 up to five times before giving up. If the workaround fails, a single-call fallback is used. The fetcher returns a normalized array of item hashes, not raw XML.

`Bgg::CollectionPersister` takes those hashes and writes each game once:

```ruby
def upsert_thing!(item)
  thing = BggThing.find_or_initialize_by(objectid: item[:id])
  thing.assign_attributes(
    name: item[:name],
    year_published: item[:year_published],
    min_players: item[:stats]&.[](:min_players),
    max_players: item[:stats]&.[](:max_players),
    playing_time: item[:stats]&.[](:playing_time),
    image: item[:image],
    thumbnail: item[:thumbnail],
    description: item[:description],
    average: item[:stats]&.[](:average),
    bayes_average: item[:stats]&.[](:bayes_average)
  )
  thing.save! if thing.changed?
  thing
end
```

Import jobs are run by `Bgg::ImportCollectionJob` under Solid Queue with a global concurrency lock of one BGG job at a time, and they broadcast `QUEUED → SYNCING → READY` status to the frontend through a GraphQL subscription. The frontend never waits on the import; it subscribes to progress and renders the merged collection once the status becomes `READY`.

## The read path

Once data is persisted, the merged collection query is pure SQL. `BggThing` provides a scope that takes a list of BGG usernames and returns the distinct set of games owned by those users:

```ruby
scope :merged_for_bgg_usernames, ->(bgg_usernames) {
  joins(:bgg_collections, :users)
    .where(users: { bgg_username: bgg_usernames })
    .distinct
}
```

The GraphQL entry point is `Types::QueryType#merged_collection`:

```ruby
def merged_collection(usernames:)
  users = User.where(bgg_username: usernames)
  scope = context[:current_user] ? ScopedMergedThing::Scope.new(:user, context[:current_user].id) : nil
  {
    items: BggThing.merged_for_bgg_usernames(usernames),
    sync_statuses: usernames.map { |username| sync_status_for(username, users) },
    scope: scope
  }
end
```

This resolver never calls BGG. It returns a `MergedCollection` object whose `items` are `BggThing` records, plus a `sync_statuses` array that tells the UI whether each requested username is still queued, syncing, or ready. The result is read from the database, cached by the query layer, and available in milliseconds.

## Batching owners

Each merged item exposes `owners: [Owner!]!`. Without batching, resolving owners for every item would issue one query per game. `Loaders::OwnersLoader` fixes that:

```ruby
module Loaders
  class OwnersLoader < GraphQL::Dataloader::Source
    def initialize(user_ids = nil)
      super()
      @user_ids = user_ids
    end

    def fetch(thing_ids)
      collections = BggCollection.where(bgg_thing_id: thing_ids)
      collections = collections.where(user_id: @user_ids) if @user_ids
      collections = collections.includes(:user).group_by(&:bgg_thing_id)

      thing_ids.map { |id| collections[id] || [] }
    end
  end
end
```

`BoardgameNightSchema` enables `GraphQL::Dataloader`, so the resolver only needs to call `dataloader.with(Loaders::OwnersLoader).load(thing.id)` and the framework collects all loads in the current tick, issues one query, and distributes the results. The same loader is reused for group collection views, suggestions, and any other place that asks "who owns this game?"

## Trade-offs

The big bet is that computing the merged collection at read time is cheaper than maintaining a snapshot. With SQLite, proper indexes, and small friend groups (5–20 members, ~200 games each), the query is fast enough that we do not need a materialized view or cache invalidation layer. The moment a member syncs, the group view reflects the new collection automatically.

The cost is that every read path must use the same scopes and loaders to stay efficient. We do not allow arbitrary GraphQL nesting to bypass the batch loader; resolvers that need owners must go through `OwnersLoader`. That discipline is enforced by code review and by N+1 tests in CI, not by a separate schema rule.

If a group ever grows large enough that the merge query becomes a bottleneck, the read path is already isolated behind `BggThing.merged_for_bgg_usernames` and `MergedCollectionType`, so swapping in a snapshot table or materialized view would be a contained change. At v1 scale, persistence plus Dataloader is the right balance.
