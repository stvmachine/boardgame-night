# Phase 7: Suggestion Engine Backend - Research

**Researched:** 2026-07-14
**Domain:** Ruby on Rails GraphQL backend — deterministic, poll-based game recommendation scoring
**Confidence:** MEDIUM (scoring intent and weights are locked; two low-level arithmetic details are interpreted as assumptions because the source spec leaves them implicit)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Implementation Decisions**

#### Scoring Formula (Locked by Research)

The scoring formula is fully specified in `.planning/research/FEATURES.md` §"Poll-Based Suggestion Engine". The weights are locked by requirements (SUGG-02): player-count fit 40%, time fit 20%, complexity fit 20%, rating 10%, ownership diversity 10%.

- **D-01:** **player_count_suitability** uses the **Schmaus adjusted-rating formula**: `100 * (best_pct * 1.0 + rec_pct * 0.6 + nrec_pct * 0.0)` with +1 smoothing on rec and nrec for small samples. If `attendee_count` is outside `[minPlayers, maxPlayers]` → suitability = 0 (hard filter). If no poll data at that count (total votes < 20) → fall back to range-midpoint heuristic scaled to 0–60, flag confidence as LOW.
- **D-02:** **time_fit**: `maxPlayTime <= time_budget → 100`, `minPlayTime <= time_budget < maxPlayTime → 60`, `minPlayTime > time_budget → 0`.
- **D-03:** **complexity_fit**: `target = {Light: 1.8, Medium: 2.7, Medium-Heavy: 3.6, Heavy: 4.4}[pref]`, `distance = |g.averageWeight - target|`, `complexity_fit = max(0, 100 - distance * 30)`. "Any" → 50 (neutral).
- **D-04:** **community_rating**: `100 * (bayes_average / 10)`. Use `bayes_average` (BGG Bayesian-adjusted rank) if available, fall back to `average`.
- **D-05:** **ownership_bonus**: `min(100, 100 * (number_of_attending_owners / attendee_count))`. Rewards games owned by multiple attending members.

#### Session Inputs

- **D-06:** Add **`time_budget_minutes:integer`** and **`complexity_preference:string`** columns to `night_sessions` via migration. Defaults: `time_budget_minutes = 120` (2 hours), `complexity_preference = "Any"`. Host sets them when creating/scheduling the session; editable before entering "picking" state.
- **D-07:** `complexity_preference` values: `"Light"`, `"Medium"`, `"Medium-Heavy"`, `"Heavy"`, `"Any"`. Stored as a plain string column (no enum type needed — validated by contract).

#### GraphQL API Shape

- **D-08:** `suggestions` is a **field on `NightSessionType`**, computed on demand (no persistence). Returns `[SuggestionType]` sorted by score descending. Uses session's `time_budget_minutes`, `complexity_preference`, and `attendee_count`. Follows the existing pattern of computed fields on NightSessionType (e.g., `attendee_count`).
- **D-09:** The `suggestions` field **only returns data when `session.state == "picking"`**. In other states, returns `nil` (not an empty array — distinguishes "not available" from "no matches"). This matches the UX flow: host enters picking mode → frontend fetches suggestions → host picks from shortlist.
- **D-10:** `SuggestionType` contains: `thing: MergedThing` (the game with owners), `score: Float` (0–100), `breakdown: SuggestionBreakdownType` (structured score components), `confidence: ConfidenceLevelEnum`, `reasons: [String]` (human-readable reason chips).
- **D-11:** `SuggestionBreakdownType` contains: `playerCountFit: Float`, `timeFit: Float`, `complexityFit: Float`, `communityRating: Float`, `ownershipBonus: Float` — all 0–100 numeric values.
- **D-12:** `ConfidenceLevelEnum` values: `HIGH` (≥50 total votes at attendee_count), `MEDIUM` (20–49 votes), `LOW` (<20 votes, fallback heuristic in use).

#### Candidate Pool

- **D-13:** Only score games **owned by ≥1 attending member** (RSVP'd "going"). Uses `BggThing.merged_for_users(attendee_user_ids)` to get the candidate pool. Games nobody brings can't be played. `ownership_bonus` naturally rewards multi-owner games.

#### Shortlist Sizing

- **D-14:** Return **top 8** suggestions, sorted by score descending. Games with score = 0 are excluded from the shortlist. Fixed number (no configurable limit argument) — matches FEATURES.md spec.

#### Explanation Format

- **D-15:** Each suggestion includes **structured numeric fields** (for tooltips/sorting) AND a **`reasons: [String]` array** of human-readable chips. Reason chip examples from FEATURES.md: "Best at 5 players (72% Best votes)", "75 min fits your 2h budget", "Medium complexity (2.8)", "Owned by Alex & Sam". The backend generates these strings; the frontend renders them directly.

### the agent's Discretion

- Exact service class structure (`Suggestions::Engine` vs `Suggestions::Scorer` vs module pattern) — researcher/planner to determine based on existing service patterns.
- Whether to add helper methods on `BggPoll`/`BggPollResult` models or compute in the service — researcher to decide.
- Dataloader usage for batch-loading poll data and ownership in the suggestion resolver — planner to design based on existing `PollsLoader`/`OwnersLoader` patterns.
- Whether `complexity_preference` needs a GraphQL enum type or can be a plain string — planner to decide.
- Edge case handling for games with no `poll_data_fetched_at` (never backfilled) vs games with poll data but 0 votes at the target count — researcher to specify.
- Whether the `time_budget_minutes` and `complexity_preference` columns should be set via existing mutations (`createSession`, `scheduleSession`) or a new `updateSessionPreferences` mutation — planner to decide.
- Exact reason chip text format — researcher to refine based on FEATURES.md examples.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUGG-02 | Suggestion engine produces a ranked shortlist using weighted scoring (player-count fit 40%, time fit 20%, complexity fit 20%, rating 10%, ownership diversity 10%) | Implement `Suggestions::Engine` as a pure Ruby service applying the locked D-01..D-05 formulas; expose `score` and `breakdown` via `SuggestionType` [CITED: `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`]. |
| SUGG-03 | Each suggestion includes explainable reason chips (player-count fit, time fit, complexity, ownership) and a confidence indicator for thin poll data | Add `reasons: [String]` and `confidence: ConfidenceLevelEnum` to `SuggestionType`; derive confidence from total votes at the target player count per D-12 [CITED: `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`]. |
| SUGG-04 | Suggestion engine uses BGG community poll "best player count" data instead of the v1 range heuristic for grouping/filtering | Use persisted `BggPoll`/`BggPollResult` data loaded via `Loaders::PollsLoader`; only fall back to the range-midpoint heuristic when poll data is missing or too thin (<20 votes) [CITED: `.planning/research/FEATURES.md`]. |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- **Tech stack:** Ruby on Rails (API-only mode) + Vue.js 3, in a single git repository (monorepo) — Rails serves the Vue build and exposes GraphQL; no separate proxy service [CITED: `./AGENTS.md`].
- **Ruby version management:** rbenv (Ruby 3.4.9 pinned in `.ruby-version`) [VERIFIED: `.ruby-version`].
- **API style:** GraphQL between Vue and Rails (Rails is the single GraphQL source of truth for the frontend) [CITED: `./AGENTS.md`].
- **BGG credentials:** API token loaded from `.env.bggeek` (not committed to git) [CITED: `./AGENTS.md`].
- **BGG rate limits:** Must throttle to ~1 req/5s with retries and caching — this phase must never make synchronous BGG calls in resolvers; all suggestion data comes from persisted DB state [CITED: `./AGENTS.md`].
- **Modern Rails:** Use current Rails conventions (Rails 8.1.3); Hotwire is not needed (API-only + Vue) [VERIFIED: `Gemfile.lock`].
- **Frontend build:** Vue 3 with Vite, integrated into the Rails asset pipeline or served as a built SPA from `public/` [CITED: `./AGENTS.md`].

## Summary

Phase 7 delivers a deterministic, poll-based scoring engine that ranks the games a group can actually play at a boardgame night. The engine takes the session context (attendee count, time budget, complexity preference) and scores every candidate game from the merged collection of attending members. Candidate games are filtered and scored entirely from data already persisted in Phase 6 (`BggPoll`/`BggPollResult`) and earlier phases (`BggCollection`, `NightSession`, `Attendance`) — no synchronous BGG calls are allowed [CITED: `./AGENTS.md`, `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`].

The primary recommendation is to implement a single, stateless service object — `Suggestions::Engine` — invoked by a new `suggestions` field on `NightSessionType`. The resolver should batch-load poll and ownership data with the existing `Loaders::PollsLoader` and `Loaders::OwnersLoader` to avoid N+1 queries, then hand the pre-loaded data to the engine for scoring and reason generation. The engine returns a small value object (or struct) that `SuggestionType` and `SuggestionBreakdownType` render directly.

Two formula details from the locked spec began as assumptions: the exact Laplace smoothing denominator for the Schmaus player-count formula, and the exact shape of the range-midpoint fallback. The Phase 7 plans formally adopt the interpretations recorded in A1/A2 and lock them with public-output tests; changing either curve now requires an explicit product decision rather than executor discretion.

**Primary recommendation:** Implement `Suggestions::Engine` as a pure Ruby service, call it from a Dataloader-backed `suggestions` field on `NightSessionType`, and surface results through `SuggestionType`/`SuggestionBreakdownType`/`ConfidenceLevelEnum` with reason chips generated by the backend.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Weighted scoring & ranking | API / Backend (Rails) | — | The scoring formula is a deterministic function over persisted data; no client-side logic is trusted with ranking. |
| Poll/ownership data access | Database / Storage | API / Backend | `bgg_polls`, `bgg_poll_results`, `bgg_collections`, and `attendances` are the source of truth. The backend queries them. |
| GraphQL type assembly | API / Backend | — | `NightSessionType`, `SuggestionType`, `SuggestionBreakdownType`, and `ConfidenceLevelEnum` live in the Rails GraphQL schema. |
| Reason chip text generation | API / Backend | Frontend (Vue) | The backend produces human-readable strings; the frontend renders them as Material 3 chips in Phase 10. |
| Session preference inputs | API / Backend | — | `time_budget_minutes` and `complexity_preference` are set via GraphQL mutations and validated by dry-validation contracts. |

## Standard Stack

No new external gems or packages are required for this phase. The implementation relies on the existing stack already present in the repo.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Ruby | 3.4.9 | Language runtime | Pinned by `.ruby-version`; rbenv-managed per project constraints [VERIFIED: `.ruby-version`]. |
| Ruby on Rails | 8.1.3 | API-only framework, migrations, GraphQL host | Already installed and used for all backend phases [VERIFIED: `Gemfile.lock`]. |
| graphql-ruby | 2.6.3 | GraphQL schema, types, Dataloader | Already the GraphQL layer; `GraphQL::Dataloader::Source` is used by `PollsLoader` and `OwnersLoader` [VERIFIED: `Gemfile.lock`, `app/graphql/loaders`]. |
| dry-validation / dry-rails | 1.11.1 / 0.7.0 | Input validation for mutations | Existing pattern for every mutation; used to validate session preference updates [VERIFIED: `Gemfile.lock`, `app/contracts`]. |
| RSpec / rspec-rails | 8.0.4 | Backend test framework | Existing test suite; used for service and GraphQL specs [VERIFIED: `Gemfile.lock`, `spec/`]. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Nokogiri | 1.19.x | XML parsing | Already used for BGG XML; not needed in this phase because scoring uses persisted DB data. |
| Solid Queue / Solid Cache | via Rails 8 | DB-backed jobs and cache | Already used for BGG jobs; this phase is computed on demand and does not add jobs. |

### Installation

No bundle install required. Version verification:

```bash
ruby -v              # should print 3.4.x
bundle exec ruby -e "require 'graphql'; puts GraphQL::VERSION"  # 2.6.3
bundle exec ruby -e "require 'rails'; puts Rails::VERSION::STRING"  # 8.1.3
```

## Package Legitimacy Audit

This phase does not install any new external packages, so the Package Legitimacy Gate is not required.

## Architecture Patterns

### System Architecture Diagram

```mermaid
flowchart LR
    A[Vue Frontend<br/>Phase 10] -->|GraphQL query<br/>nightSession.suggestions| B(NightSessionType#suggestions)
    B --> C{state == "picking"?}
    C -->|no| D[return nil]
    C -->|yes| E[Load attending user IDs<br/>from Attendance]
    E --> F[Fetch candidate pool<br/>BggThing.merged_for_users]
    F --> G[Batch load polls<br/>Loaders::PollsLoader]
    F --> H[Batch load owners<br/>Loaders::OwnersLoader]
    G --> I[Suggestions::Engine]
    H --> I
    I --> J[Sort top 8, drop score=0]
    J --> K[SuggestionType<br/>breakdown + confidence + reasons]
    K --> A
```

### Recommended Project Structure

```
app/
├── models/
│   ├── bgg_poll.rb                    # add results_for_player_count helper
│   ├── bgg_poll_result.rb             # add best? / recommended? / not_recommended? helpers
│   └── night_session.rb               # add complexity preference validation
├── services/
│   └── suggestions/
│       └── engine.rb                  # deterministic scoring service
├── graphql/
│   ├── types/
│   │   ├── suggestion_type.rb
│   │   ├── suggestion_breakdown_type.rb
│   │   ├── confidence_level_enum.rb
│   │   └── night_session_type.rb      # add suggestions field
│   └── loaders/
│       ├── polls_loader.rb            # existing; reuse
│       └── owners_loader.rb           # existing; reuse
├── contracts/
│   ├── create_night_session_contract.rb   # add time_budget_minutes, complexity_preference
│   ├── schedule_session_contract.rb       # add time_budget_minutes, complexity_preference
│   └── update_session_preferences_contract.rb  # new, optional
└── db/migrate/
    └── 20260714xxxxxx_add_suggestion_preferences_to_night_sessions.rb
```

### Pattern 1: Suggestions::Engine as a stateless service

**What:** A plain Ruby class in `app/services/suggestions/engine.rb` that receives a session, candidate things, attendee IDs, and pre-loaded polls/owners. It returns a ranked list of simple value objects.

**When to use:** Use this pattern for any computed, deterministic ranking that needs to stay isolated from GraphQL/HTTP concerns and remain testable with plain unit tests.

**Example:**

```ruby
# app/services/suggestions/engine.rb
# Source: existing service pattern (Bgg::PollPersister, Bgg::CollectionFetcher)
#          + locked scoring formula from .planning/research/FEATURES.md
module Suggestions
  class Engine
    Result = Struct.new(:thing, :score, :breakdown, :confidence, :reasons, keyword_init: true)
    Breakdown = Struct.new(:player_count_fit, :time_fit, :complexity_fit,
                           :community_rating, :ownership_bonus, keyword_init: true)

    COMPLEXITY_TARGETS = {
      "Light" => 1.8,
      "Medium" => 2.7,
      "Medium-Heavy" => 3.6,
      "Heavy" => 4.4
    }.freeze

    WEIGHTS = {
      player_count: 0.40,
      time: 0.20,
      complexity: 0.20,
      rating: 0.10,
      ownership: 0.10
    }.freeze

    def self.call(session:, things:, attendee_user_ids:, attendee_count:,
                  polls_by_thing:, owners_by_thing:)
      new(
        session: session,
        things: things,
        attendee_user_ids: attendee_user_ids,
        attendee_count: attendee_count,
        polls_by_thing: polls_by_thing,
        owners_by_thing: owners_by_thing
      ).call
    end

    attr_reader :session, :things, :attendee_user_ids, :attendee_count,
                :polls_by_thing, :owners_by_thing

    def initialize(session:, things:, attendee_user_ids:, attendee_count:,
                   polls_by_thing:, owners_by_thing:)
      @session = session
      @things = things
      @attendee_user_ids = attendee_user_ids
      @attendee_count = attendee_count
      @polls_by_thing = polls_by_thing
      @owners_by_thing = owners_by_thing
    end

    def call
      things.map { |thing| score_thing(thing) }
            .compact
            .sort_by { |r| -r.score }
            .first(8)
    end

    private

    def score_thing(thing)
      player_fit = player_count_suitability(thing)
      return nil if player_fit == 0

      time_fit = time_fit_for(thing)
      return nil if time_fit == 0

      complexity_fit = complexity_fit_for(thing)
      rating = community_rating_for(thing)
      ownership_bonus = ownership_bonus_for(thing)

      score = (
        player_fit * WEIGHTS[:player_count] +
        time_fit * WEIGHTS[:time] +
        complexity_fit * WEIGHTS[:complexity] +
        rating * WEIGHTS[:rating] +
        ownership_bonus * WEIGHTS[:ownership]
      ).round(2)

      Result.new(
        thing: thing,
        score: score,
        breakdown: Breakdown.new(
          player_count_fit: player_fit.round(2),
          time_fit: time_fit.round(2),
          complexity_fit: complexity_fit.round(2),
          community_rating: rating.round(2),
          ownership_bonus: ownership_bonus.round(2)
        ),
        confidence: confidence_level(thing, player_fit),
        reasons: reason_chips(thing, player_fit, time_fit, complexity_fit, ownership_bonus)
      )
    end

    # ... scoring helpers below
  end
end
```

### Pattern 2: Dataloader-backed `suggestions` resolver

**What:** The resolver returns `nil` unless the session is in `"picking"` state, then loads attending users, the candidate pool, polls, and owners in two batched calls, and passes them to `Suggestions::Engine`.

**When to use:** Use this pattern whenever a GraphQL field needs to rank or enrich a list that depends on multiple associated records (polls + owners here).

**Example:**

```ruby
# app/graphql/types/night_session_type.rb
module Types
  class NightSessionType < Types::BaseObject
    # ... existing fields ...

    field :suggestions, [Types::SuggestionType], null: true

    def suggestions
      return nil unless object.state == "picking"
      return nil unless context[:current_user] && group_member?(context[:current_user])

      attendances = object.attendances.where(response: "going").includes(:user)
      attendee_ids = attendances.pluck(:user_id)
      attendee_count = attendee_ids.size

      return [] if attendee_count.zero?

      things = BggThing.merged_for_users(attendee_ids).to_a
      thing_ids = things.map(&:id)

      polls = dataloader.with(Loaders::PollsLoader).load_all(thing_ids)
      owners = dataloader.with(Loaders::OwnersLoader).load_all(thing_ids)

      Suggestions::Engine.call(
        session: object,
        things: things,
        attendee_user_ids: attendee_ids,
        attendee_count: attendee_count,
        polls_by_thing: thing_ids.zip(polls).to_h,
        owners_by_thing: thing_ids.zip(owners).to_h
      )
    end

    private

    def group_member?(user)
      object.group.member_ids.include?(user.id) || object.host_id == user.id
    end
  end
end
```

`GraphQL::Dataloader::Source#load_all` is the built-in method for batched loads in graphql-ruby 2.6.3 [VERIFIED: installed `lib/graphql/dataloader/source.rb`].

### Pattern 3: GraphQL score-breakdown types

**What:** Two small types expose the computed score and its components so the frontend can render chips and tooltips without reverse-engineering math.

**Example:**

```ruby
# app/graphql/types/suggestion_type.rb
module Types
  class SuggestionType < Types::BaseObject
    field :thing, Types::MergedThingType, null: false
    field :score, Float, null: false
    field :breakdown, Types::SuggestionBreakdownType, null: false
    field :confidence, Types::ConfidenceLevelEnum, null: false
    field :reasons, [String], null: false
  end
end

# app/graphql/types/suggestion_breakdown_type.rb
module Types
  class SuggestionBreakdownType < Types::BaseObject
    field :player_count_fit, Float, null: false
    field :time_fit, Float, null: false
    field :complexity_fit, Float, null: false
    field :community_rating, Float, null: false
    field :ownership_bonus, Float, null: false
  end
end

# app/graphql/types/confidence_level_enum.rb
module Types
  class ConfidenceLevelEnum < Types::BaseEnum
    value "HIGH", "50 or more votes at the target player count"
    value "MEDIUM", "20–49 votes at the target player count"
    value "LOW", "Fewer than 20 votes, or the range-midpoint fallback is in use"
  end
end
```

### Anti-Patterns to Avoid

- **Returning `[]` when the session is not in `"picking"` state:** The frontend must distinguish "not ready yet" from "no games match." Return `nil` for non-picking states per D-09 [CITED: `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`].
- **Synchronous BGG calls in the resolver:** The resolver must never call `Bgg::Client#thing`. All data must be already persisted from Phase 6 [CITED: `./AGENTS.md`, `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`].
- **N+1 poll/owner queries:** Do not iterate candidates and query polls or owners one at a time. Use `Loaders::PollsLoader` and `Loaders::OwnersLoader` with `load_all` [VERIFIED: codebase].
- **Opaque single score:** Always return `breakdown` and `reasons`; the frontend should not have to reverse-engineer the score.
- **Storing suggestions:** Suggestions are computed on demand; do not add a `suggestions` table or cache them for long periods [CITED: `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Batch-loading polls and owners for a list of games | Custom `IN (...)` SQL in the resolver | `Loaders::PollsLoader` / `Loaders::OwnersLoader` with `load_all` | Already built, tested, and integrated with `GraphQL::Dataloader` [VERIFIED: codebase]. |
| Merging collections for a set of users | Custom join SQL | `BggThing.merged_for_users(user_ids)` | Already an existing scope used by the collection query [VERIFIED: `app/models/bgg_thing.rb`]. |
| Parsing BGG poll XML inside the engine | Inline XML parsing / Nokogiri calls | Persisted `BggPoll`/`BggPollResult` from Phase 6 | Keeps the engine deterministic, fast, and free of external API calls [CITED: `.planning/phases/06-bgg-poll-data-layer/06-CONTEXT.md`]. |
| GraphQL enum for session states | Re-implement a custom enum | `Types::SessionStateEnum` | Existing pattern; add `ConfidenceLevelEnum` and optionally a complexity-preference enum the same way [VERIFIED: codebase]. |

## Common Pitfalls

### Pitfall 1: Integer division collapses percentage scores to 0
**What goes wrong:** `best_votes / total_votes` in Ruby integer math returns 0 for many real values, making the score useless.
**Why it happens:** Vote counts are integers; the engine must compute floats.
**How to avoid:** Coerce early: `best_votes.to_f / total_votes`. Round only at the final output step.
**Warning signs:** Unit tests where the score is always a multiple of 100 or always 0.

### Pitfall 2: Loading polls or owners inside the per-thing loop
**What goes wrong:** `thing.bgg_polls` or `thing.bgg_collections` inside `score_thing` issues one or two queries per candidate, causing N+1 queries.
**Why it happens:** Active Record lazy loading is convenient but defeats batching in a resolver.
**How to avoid:** Pre-load all polls and owners with `dataloader.with(...).load_all` in the resolver and pass maps into the engine.
**Warning signs:** `bullet` or request logs show repeated `SELECT ... WHERE bgg_polls.bgg_thing_id = ?` queries.

### Pitfall 3: Treating `poll_data_fetched_at = nil` as "no data" instead of "low confidence"
**What goes wrong:** Games that were never backfilled (nil `poll_data_fetched_at`) are scored as if they had a usable poll, producing misleading confidence.
**Why it happens:** The Phase 6 backfill stamps `poll_data_fetched_at` when it runs; records that were created after the backfill or skipped are still `nil`.
**How to avoid:** If `poll_data_fetched_at` is nil, treat the player-count fit as LOW confidence and use the range-midpoint fallback [CITED: `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`].

### Pitfall 4: Division by zero when nobody is attending
**What goes wrong:** `ownership_bonus = 100 * (attending_owners / attendee_count)` crashes with `ZeroDivisionError`.
**Why it happens:** A session can enter picking with zero `"going"` RSVPs (or all not going), and `merged_for_users([])` returns nothing.
**How to avoid:** Guard `attendee_count.zero?` in the resolver and return an empty array; inside the engine, treat `ownership_bonus` as 0 when the count is 0.

### Pitfall 5: Returning score breakdown without guarding nil BGG fields
**What goes wrong:** `average_weight`, `bayes_average`, `min_playtime`, or `max_playtime` can be nil for malformed records, causing nil math errors.
**Why it happens:** BGG data quality varies; some records lack statistics or playtime ranges.
**How to avoid:** Use nil-safe fallbacks (e.g., `thing.bayes_average || thing.average || 0.0`, `thing.max_playtime || thing.playing_time || Float::INFINITY`). Treat missing values conservatively in the relevant sub-score.

## Code Examples

### Player-count suitability with poll data

```ruby
# Inside Suggestions::Engine

def player_count_suitability(thing)
  return 0 if attendee_count_out_of_range?(thing)

  poll = polls_by_thing[thing.id]&.find { |p| p.name == "suggested_numplayers" }
  return low_confidence_fallback(thing) if poll.nil?

  results = poll.bgg_poll_results.select { |r| r.player_count == attendee_count }
  total = results.sum(&:num_votes)

  if total < 20
    low_confidence_fallback(thing)
  elsif total < 50
    smoothed_suitability(results, total)
  else
    raw_suitability(results, total)
  end
end

def raw_suitability(results, total)
  best = results.find { |r| r.value == "Best" }&.num_votes || 0
  rec  = results.find { |r| r.value == "Recommended" }&.num_votes || 0

  100.0 * (best.to_f / total + 0.6 * rec.to_f / total)
end

def smoothed_suitability(results, total)
  # Laplace +1 smoothing on Recommended and Not Recommended to dampen
  # small-sample extremes. Denominator becomes total + 2 so percentages sum to 1.
  best = results.find { |r| r.value == "Best" }&.num_votes || 0
  rec  = results.find { |r| r.value == "Recommended" }&.num_votes || 0
  nrec = results.find { |r| r.value == "Not Recommended" }&.num_votes || 0

  denominator = total + 2.0
  best_pct = best / denominator
  rec_pct  = (rec + 1) / denominator

  100.0 * (best_pct + 0.6 * rec_pct)
end

def low_confidence_fallback(thing)
  min = thing.min_players || 1
  max = thing.max_players || min
  return 0 unless attendee_count.between?(min, max)
  return 60 if min == max

  midpoint = (min + max) / 2.0
  half_range = (max - min) / 2.0
  distance = (attendee_count - midpoint).abs

  60.0 * (1 - [distance / half_range, 1.0].min)
end
```

### Time, complexity, rating, and ownership helpers

```ruby
def time_fit_for(thing)
  budget = session.time_budget_minutes || 120
  max = thing.max_playtime || thing.playing_time || Float::INFINITY
  min = thing.min_playtime || thing.playing_time || 0

  return 100.0 if max <= budget
  return 60.0 if min <= budget

  0.0
end

def complexity_fit_for(thing)
  return 50.0 if session.complexity_preference == "Any"

  target = COMPLEXITY_TARGETS.fetch(session.complexity_preference)
  weight = thing.average_weight || 0.0
  distance = (weight - target).abs

  [0.0, 100.0 - (distance * 30)].max
end

def community_rating_for(thing)
  rating = thing.bayes_average || thing.average || 0.0
  100.0 * (rating / 10.0)
end

def ownership_bonus_for(thing)
  owners = owners_by_thing[thing.id] || []
  attending_owners = owners.count { |owner| attendee_user_ids.include?(owner.user_id) }
  return 0.0 if attendee_count.zero?

  [100.0, (100.0 * attending_owners / attendee_count)].min
end
```

### Confidence level and reason chips

```ruby
def confidence_level(thing, player_fit)
  poll = polls_by_thing[thing.id]&.find { |p| p.name == "suggested_numplayers" }
  return "LOW" if poll.nil? || thing.poll_data_fetched_at.nil?

  total = poll.bgg_poll_results
               .select { |r| r.player_count == attendee_count }
               .sum(&:num_votes)

  case total
  when 50.. then "HIGH"
  when 20..49 then "MEDIUM"
  else "LOW"
  end
end

def reason_chips(thing, player_fit, time_fit, complexity_fit, ownership_bonus)
  chips = []
  chips << player_count_reason(thing, player_fit)
  chips << time_reason(thing)
  chips << complexity_reason(thing)
  chips << ownership_reason(thing) if ownership_bonus.positive?
  chips.compact
end
```

### Migration and model validation

```ruby
# db/migrate/20260714000001_add_suggestion_preferences_to_night_sessions.rb
class AddSuggestionPreferencesToNightSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :night_sessions, :time_budget_minutes, :integer,
               default: 120, null: false
    add_column :night_sessions, :complexity_preference, :string,
               default: "Any", null: false
  end
end
```

```ruby
# app/models/night_session.rb
VALID_COMPLEXITY_PREFS = %w[Light Medium Medium-Heavy Heavy Any].freeze

validates :complexity_preference, inclusion: { in: VALID_COMPLEXITY_PREFS }
validates :time_budget_minutes, numericality: { greater_than: 0 }, allow_nil: true
```

### Contract for session preference updates

```ruby
# app/contracts/update_session_preferences_contract.rb
class UpdateSessionPreferencesContract < ApplicationContract
  COMPLEXITY_PREFS = %w[Light Medium Medium-Heavy Heavy Any].freeze

  params do
    required(:session_id).filled(:string)
    optional(:time_budget_minutes).maybe(:integer, gt?: 0)
    optional(:complexity_preference).maybe(:string, included_in?: COMPLEXITY_PREFS)
  end
end
```

## State of the Art

This phase is not replacing a library; it is adding deterministic business logic on top of data already persisted in Phase 6. The only "current vs. new" shift is moving from the v1 min/max range check to the poll-based Schmaus formula.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v1 `minPlayers ≤ attendee_count ≤ maxPlayers` boolean | Weighted, poll-based suitability with confidence bands | Phase 7 | Better ranking, explainable scores, and data-driven confidence. |
| Custom range heuristic | Schmaus adjusted-rating formula + range-midpoint fallback | Phase 7 | Community data dominates; fallback only when data is thin. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Schmaus +1 smoothing is interpreted as Laplace smoothing with `+1` added to Recommended and Not Recommended counts and a denominator of `total_votes + 2`, applied only to MEDIUM-confidence counts (20–49 votes). | Pattern 1 / Code Examples | If the intended smoothing is different, the score curve for 20–49-vote games will shift slightly; the architecture is unchanged. |
| A2 | The range-midpoint fallback is a linear function that returns `60` at the midpoint of `[minPlayers, maxPlayers]`, `0` at the extremes, and `0` outside the range. | Pattern 1 / Code Examples | A different fallback shape (e.g., step function) would change which games surface when poll data is thin, but would still satisfy the locked "scaled to 0–60" requirement. |
| A3 | Confidence levels map exactly to the vote-count thresholds in D-12: HIGH ≥ 50, MEDIUM 20–49, LOW otherwise. | Code Examples | Thresholds are already locked by D-12; this is a restatement. |
| A4 | Reason chips are generated by the backend in the format shown in FEATURES.md examples (e.g., "Best at 5 players (72% Best votes)"). | Architecture Patterns | Text format can be adjusted later without changing the GraphQL schema. |
| A5 | The `suggestions` field should be restricted to members of the session's group (or the host). This is not explicitly locked in CONTEXT.md but follows the project's existing access-control pattern. | Pattern 2 | If this restriction is too strict, the planner can relax it; if too loose, it would expose private session data. |
| A6 | `complexity_preference` is exposed as a GraphQL enum (`ComplexityPreferenceEnum`) for type safety while stored as a plain string in the DB, matching D-07. | Pattern 3 | If the planner prefers a plain string, the schema can be simplified without backend behavior changes. |

## Open Questions (RESOLVED)

1. **RESOLVED — Exact smoothing threshold, denominator, and fallback curve**
   - Resolution: For 20–49 target-count votes, add +1 to Recommended and Not Recommended and divide all category percentages by `total_votes + 2`; for 50+ votes, use unsmoothed percentages. Missing polls, a missing target-count row, `poll_data_fetched_at = nil`, or fewer than 20 target-count votes use the A2 linear fallback: 60 at the `[minPlayers, maxPlayers]` midpoint and 0 at either range edge or outside the range.
   - Plan adoption: 07-01 Task 2 implements this arithmetic, and 07-03 Task 2 locks the 19/20/49/50 boundaries and fallback curve through public engine outputs. Executors must not select a different interpretation.

2. **RESOLVED — Access control for the `suggestions` field**
   - Resolution: Require an authenticated caller who is the session host or belongs to the session's group (including the group owner). Anonymous and outside-group callers receive a GraphQL error before candidate, poll, or ownership data is assembled.
   - Plan adoption: 07-01 Task 3 implements the field guard, and 07-03 Task 3 verifies host/member access plus anonymous/outsider denial through authenticated HTTP GraphQL requests.

3. **RESOLVED — Session preference input surface**
   - Resolution: Add optional `timeBudgetMinutes` and `complexityPreference` arguments to both `createNightSession` and `scheduleSession`, and add host-only `updateSessionPreferences` for edits while the session is `draft` or `invited`. Once picking starts, preference edits are rejected.
   - Plan adoption: 07-02 Tasks 1–3 implement and test all three input paths, preserve defaults/current values when optional arguments are omitted, and enforce the pre-picking lifecycle guard.

## Environment Availability

This phase has no new external dependencies beyond the existing Ruby on Rails runtime. No blocking items.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Ruby | Rails runtime | ✓ | 3.4.9 | — |
| Ruby on Rails | Backend framework | ✓ | 8.1.3 | — |
| graphql-ruby | GraphQL + Dataloader | ✓ | 2.6.3 | — |
| dry-validation / dry-rails | Input contracts | ✓ | 1.11.1 / 0.7.0 | — |
| RSpec | Tests | ✓ | 8.0.4 | — |
| SQLite / PostgreSQL | Data persistence | ✓ | SQLite default (Rails 8) | Postgres upgrade path documented in STACK.md |

## Security Domain

`security_enforcement` is enabled in `.planning/config.json` (`true`) and the ASVS level is 1 [VERIFIED: `.planning/config.json`].

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Reuse the existing `context[:current_user]` check; the `suggestions` resolver should not return data to anonymous callers. |
| V3 Session Management | no | Session lifecycle is unchanged; no new session mechanism is introduced. |
| V4 Access Control | yes | Restrict `suggestions` to members of the session's group or the host; do not expose suggestions to users outside the group. |
| V5 Input Validation | yes | Validate `time_budget_minutes` and `complexity_preference` with dry-validation contracts; reject out-of-range values and mass-assignment risks. |
| V6 Cryptography | no | No new cryptography is introduced. |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Insecure direct object reference (IDOR) on `nightSession(id).suggestions` | Information Disclosure | Check that `context[:current_user]` is a member of `session.group` before returning suggestions. |
| Invalid/malformed preference values stored in `night_sessions` | Tampering | Use `UpdateSessionPreferencesContract` (or extended `Create/Schedule` contracts) to whitelist allowed values and ranges. |
| Excessive query cost / DoS on large merged collections | Denial of Service | Cap the candidate pool with `BggThing.merged_for_users` and limit output to top 8; keep Dataloader batch loads O(1) in DB round trips. |
| Missing authorization on computed fields | Elevation of Privilege | Add membership guard in the `suggestions` resolver; do not rely solely on the generic `nightSession` query for access control. |

## Sources

### Primary (HIGH confidence)
- `app/models/night_session.rb`, `app/models/attendance.rb`, `app/models/bgg_thing.rb`, `app/models/bgg_poll.rb`, `app/models/bgg_poll_result.rb`, `app/models/bgg_collection.rb`, `app/models/group.rb` — schema, associations, and existing scopes [VERIFIED: codebase].
- `app/graphql/types/night_session_type.rb`, `app/graphql/types/thing_fields.rb`, `app/graphql/types/merged_thing_type.rb`, `app/graphql/types/poll_type.rb`, `app/graphql/types/poll_result_type.rb`, `app/graphql/types/session_state_enum.rb` — GraphQL type patterns and existing fields [VERIFIED: codebase].
- `app/graphql/loaders/polls_loader.rb`, `app/graphql/loaders/owners_loader.rb` — Dataloader pattern and `load_all` API [VERIFIED: codebase + installed `graphql-ruby` 2.6.3 source].
- `app/services/bgg/poll_persister.rb`, `app/services/bgg/normalizer.rb` — BGG poll data persistence and parsing from Phase 6 [VERIFIED: codebase].
- `Gemfile.lock` — exact gem versions for Rails, graphql-ruby, dry-validation, rspec-rails [VERIFIED: `Gemfile.lock`].
- `spec/fixtures/files/stevmachine_thing.xml` — real BGG poll data usable for service unit tests [VERIFIED: codebase].

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` §"Poll-Based Suggestion Engine" — the canonical scoring formula and explainability requirements [CITED: `.planning/research/FEATURES.md`].
- `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md` — locked decisions, integration points, and agent discretion [CITED: `.planning/phases/07-suggestion-engine-backend/07-CONTEXT.md`].
- `.planning/phases/06-bgg-poll-data-layer/06-CONTEXT.md` — Phase 6 schema and Dataloader decisions that Phase 7 builds on [CITED: `.planning/phases/06-bgg-poll-data-layer/06-CONTEXT.md`].
- `./AGENTS.md` — project constraints, tech stack, and BGG call rules [CITED: `./AGENTS.md`].

### Tertiary (LOW confidence)
- Interpretation of the Schmaus smoothing denominator and the exact shape of the range-midpoint fallback — these are not explicitly specified in the locked formula and are therefore recorded as `[ASSUMED]` in the Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions are pinned and verified in `Gemfile.lock`; no new packages are needed.
- Architecture: HIGH — the existing Dataloader + service + contract patterns are well established in the codebase.
- Pitfalls: MEDIUM — the main risks are N+1, integer division, and nil-field handling; all are preventable with the patterns documented above.
- Formula details: MEDIUM — the locked weights and thresholds are clear; the smoothing and fallback arithmetic began as assumptions but are formally resolved for Phase 7 above and locked by the 07-03 public-output test matrix.

**Research date:** 2026-07-14
**Valid until:** 2026-08-14 for stable Rails/graphql-ruby; sooner if the Schmaus smoothing interpretation is revised.
