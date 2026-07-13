# Phase 6: BGG Poll Data Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 6-BGG Poll Data Layer
**Areas discussed:** Import flow integration, Backfill job design, GraphQL poll exposure, Thing detail caching

---

## Import Flow Integration

### Q1: Should poll data extraction happen inside the existing ImportCollectionJob, or as a separate enrichment step?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate enrichment job (Recommended) | Keep ImportCollectionJob unchanged. After collection import completes, enqueue a separate Bgg::EnrichThingPollsJob. | ✓ |
| Inside ImportCollectionJob | After persisting collection items, the same job fetches thing details for each game. | |
| You decide | Let the researcher/planner determine the best integration point. | |

**User's choice:** Separate enrichment job (Recommended)
**Notes:** Keeps import fast, poll enrichment independent, failures don't block collection sync.

### Q2: When should the enrichment job be triggered?

| Option | Description | Selected |
|--------|-------------|----------|
| After import completes (Recommended) | ImportCollectionJob enqueues EnrichThingPollsJob as the last step before broadcasting READY. | ✓ |
| On-demand only | Enrichment runs only when explicitly triggered. | |
| You decide | Let the planner determine the trigger mechanism. | |

**User's choice:** After import completes (Recommended)

### Q3: Should the enrichment job fetch thing details for ALL games in the collection, or only games that don't already have poll data?

| Option | Description | Selected |
|--------|-------------|----------|
| Only missing poll data (Recommended) | Enrichment job checks which BggThing records lack poll data and only fetches those. | ✓ |
| All games every time | Every import triggers a full thing detail fetch for all games. | |
| You decide | Let the planner determine the fetch scope. | |

**User's choice:** Only missing poll data (Recommended)

### Q4: Should the enrichment job use the same `limits_concurrency` key as ImportCollectionJob, or a separate concurrency key?

| Option | Description | Selected |
|--------|-------------|----------|
| Same key "bgg_api" (Recommended) | Share the existing concurrency key so only one BGG API job runs at a time. | ✓ |
| Separate key | Use a different concurrency key so enrichment can run in parallel with imports. | |
| You decide | Let the planner determine concurrency strategy. | |

**User's choice:** Same key "bgg_api" (Recommended)

---

## Backfill Job Design

### Q1: Should the backfill job batch-fetch thing details or fetch one-at-a-time?

| Option | Description | Selected |
|--------|-------------|----------|
| Batch fetch (Recommended) | BGG thing API accepts comma-separated IDs. Fetch ~20-50 things per API call. | ✓ |
| One-at-a-time | Fetch each thing individually. Simpler but ~17 min for 200 games. | |
| You decide | Let the researcher determine optimal batch size. | |

**User's choice:** Batch fetch (Recommended)

### Q2: How should the backfill job track which BggThing records already have poll data?

| Option | Description | Selected |
|--------|-------------|----------|
| DB column flag (Recommended) | Add a `poll_data_fetched_at` timestamp column to `bgg_things`. | ✓ |
| Join table check | Check for existence of rows in `bgg_polls` table. | |
| You decide | Let the planner determine the tracking mechanism. | |

**User's choice:** DB column flag (Recommended)

### Q3: Should the backfill be a one-time job or a recurring job?

| Option | Description | Selected |
|--------|-------------|----------|
| One-time job (Recommended) | Run once to backfill all existing BggThing records. | ✓ |
| Recurring job | Run periodically to refresh poll data for all games. | |
| You decide | Let the planner determine the frequency strategy. | |

**User's choice:** One-time job (Recommended)

### Q4: How should the backfill job handle partial failures?

| Option | Description | Selected |
|--------|-------------|----------|
| Skip and continue (Recommended) | Log failed IDs, mark them as fetched (with error), continue to next batch. | ✓ |
| Retry individual failures | Failed IDs go into a retry queue with exponential backoff. | |
| You decide | Let the planner determine the failure handling strategy. | |

**User's choice:** Skip and continue (Recommended)

---

## GraphQL Poll Exposure

### Q1: Should GraphQL expose just raw poll data, or also computed fields like `bestPlayerCount`?

| Option | Description | Selected |
|--------|-------------|----------|
| Raw + computed (Recommended) | Expose raw poll data AND a computed `bestPlayerCount` field. | ✓ |
| Raw poll data only | Just expose the poll results. Phase 7 computes bestPlayerCount. | |
| You decide | Let the planner determine the GraphQL exposure shape. | |

**User's choice:** Raw + computed (Recommended)

### Q2: Should poll types be on `ThingFields` (shared) or only on `MergedThingType`?

| Option | Description | Selected |
|--------|-------------|----------|
| ThingFields (shared) (Recommended) | Add `polls` and `bestPlayerCount` to ThingFields concern. | ✓ |
| MergedThingType only | Only expose polls on MergedThingType. | |
| You decide | Let the planner determine where to add poll types. | |

**User's choice:** ThingFields (shared) (Recommended)

### Q3: Should poll data be loaded via a Dataloader or directly via ActiveRecord associations?

| Option | Description | Selected |
|--------|-------------|----------|
| Dataloader (Recommended) | Use a PollsLoader following the existing OwnersLoader pattern. | ✓ |
| ActiveRecord associations | Use `has_many :bgg_polls` and call `thing.bgg_polls` directly. | |
| You decide | Let the planner determine the loading strategy. | |

**User's choice:** Dataloader (Recommended)

---

## Thing Detail Caching

### Q1: Should we add caching to the `Bgg::Client#thing()` method?

| Option | Description | Selected |
|--------|-------------|----------|
| No caching for now (Recommended) | The enrichment job already skips games with poll data. | |
| Add Rails.cache with 1h TTL | Cache thing detail XML in Rails.cache with 1h TTL. | ✓ |
| You decide | Let the planner determine whether caching is needed. | |

**User's choice:** Add Rails.cache with 1h TTL
**Notes:** User chose to add caching despite the recommendation against it, for robustness against edge cases and future use cases.

### Q2: What cache key strategy should the thing() method use?

| Option | Description | Selected |
|--------|-------------|----------|
| Per-thing-ID key (Recommended) | Cache key like `bgg:thing:{objectid}` with 1h TTL. | ✓ |
| Per-batch key | Cache key like `bgg:things:{sorted_id_list}` with 1h TTL. | |
| You decide | Let the planner determine the cache key strategy. | |

**User's choice:** Per-thing-ID key (Recommended)

### Q3: Should the cache store raw XML or parsed/normalized data?

| Option | Description | Selected |
|--------|-------------|----------|
| Raw XML (Recommended) | Cache the raw XML response from BGG. | ✓ |
| Parsed Nokogiri doc | Cache the parsed Nokogiri document. | |
| You decide | Let the planner determine the cache value format. | |

**User's choice:** Raw XML (Recommended)

---

## Agent's Discretion

- Exact batch size for backfill job (20-50 things per API call)
- Exact `bgg_polls` / `bgg_poll_results` table schema (column names, indexes)
- Whether `bestPlayerCount` handles ties (multiple player counts with same "Best" votes)
- Whether to store all BGG polls or only `suggested_numplayers`
- Error logging format for failed backfill IDs
- Whether the enrichment job broadcasts Solid Cable updates

## Deferred Ideas

None — discussion stayed within phase scope.