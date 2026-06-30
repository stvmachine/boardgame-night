# Architecture Research

**Domain:** Rails 8 API-only + Vue 3 SPA monorepo, GraphQL API, BGG XML API v2 integration, friend groups + boardgame night sessions
**Researched:** 2026-06-30
**Confidence:** HIGH (architecture shape verified against official graphql-ruby/vite-ruby/dry-rails/Rails 8 docs via Context7, and cross-checked against 5 real-world Rails+Vite monorepo examples via Exa)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Vue 3 SPA)                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Router   │  │ Apollo Client│  │ Pinia Stores │  │ Feature Components │  │
│  │ (Vue     │  │ (normalized  │  │ (UI/session  │  │ (Collection, Group,│  │
│  │  Router) │  │  cache +     │  │  state only) │  │  Session, Suggest) │  │
│  │          │→ │  batch link) │→ │              │  │                    │  │
│  └──────────┘  └──────┬───────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────────────────┘
                          │ HTTPS POST /graphql  (single endpoint, batched)
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RAILS 8 API-ONLY APP (single deploy)                       │
│  ┌─────────────────┐  ┌──────────────────────────────────────────────────┐  │
│  │ GraphqlController│→ │              GraphQL Schema (graphql-ruby)        │  │
│  │ (Apollo batch +  │  │  use GraphQL::Dataloader  •  max_complexity 400  │  │
│  │  Schema.multiplex)│  │  Query / Mutation roots  •  class-based types   │  │
│  └─────────────────┘  │  ┌────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│                       │  │  Resolvers │  │  Mutations  │  │  Loaders  │  │  │
│                       │  │  (Query)   │  │ (class-based)│  │(Dataloader)│  │  │
│                       │  └─────┬──────┘  └──────┬──────┘  └─────┬─────┘  │  │
│                       └────────┼─────────────────┼───────────────┼────────┘  │
│                                │                 │               │           │
│  ┌─────────────────────────────▼─────────────────▼───────────────▼───────┐  │
│  │                       app/contracts (dry-validation)                  │  │
│  │  ApplicationContract → CreateGroupContract, CreateSessionContract,    │  │
│  │  ImportCollectionContract, ValidateBggUsernameContract …              │  │
│  └─────────────────────────────┬────────────────────────────────────────┘  │
│                                │ validates input → calls                   │
│  ┌─────────────────────────────▼────────────────────────────────────────┐  │
│  │                          app/services                                  │  │
│  │  Bgg::Client (HTTP+XML+rate-limit)  •  Groups::Create  •  Sessions::* │  │
│  │  Suggestions::Engine  •  Collections::Merge  •  Collections::Import   │  │
│  └─────────────┬───────────────────────────────────────┬────────────────┘  │
│                │ enqueues                                 │ reads/writes      │
│                ▼                                          ▼                   │
│  ┌──────────────────────────┐        ┌────────────────────────────────────┐ │
│  │ Solid Queue (DB-backed)  │        │      PostgreSQL / SQLite            │ │
│  │  Bgg::ImportCollectionJob│        │  bgg_things, bgg_collection_items,  │ │
│  │  Bgg::RefreshHotItemsJob │        │  bgg_users, groups, group_members,  │ │
│  │  (concurrency: 1 BGG)    │        │  sessions, session_attendees, …     │ │
│  └──────────┬───────────────┘        └────────────────────────────────────┘ │
│             │ throttle 1 req / 5s via                                      │
│             ▼ Solid Cache key `bgg:last_request_at`                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Solid Cache (DB-backed) — BGG response cache + rate-limit mutex      │  │
│  │  key: bgg:thing:{id}  •  bgg:collection:{user}  •  bgg:hot  •  …      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ Faraday GET, XML body, BGG XML API v2
                                  ▼
                  ┌───────────────────────────────────────┐
                  │  boardgamegeek.com/xmlapi2  (~1 req/5s)│
                  │  /thing  /search  /user  /collection   │
                  │  /hot  /plays  (read-only, public)     │
                  └───────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Vue Router** | SPA route table, permalink → state hydration (`/u/:usernames`, `/g/:token`, `/s/:id`) | `vue-router` with lazy-loaded routes |
| **Apollo Client** | Single data layer to Rails GraphQL; normalized entity cache; query batching | `@apollo/client` + `@vue/apollo-composable`, `HttpLink` → `/graphql`, `InMemoryCache` |
| **Pinia stores** | UI-only / cross-component session state (selected filters, current group, draft session) — NOT a duplicate of server data | Setup stores via `defineStore('name', () => …)` |
| **GraphqlController** | Single `/graphql` endpoint; handles Apollo query batching + non-batched | `params[:_json] ? Schema.multiplex(…) : Schema.execute(…)` |
| **GraphQL Schema** | Contract between Vue and Rails; class-based types, resolvers, mutations; complexity + dataloader | `class BggNightSchema < GraphQL::Schema` |
| **Resolvers (app/graphql/resolvers)** | Per-field resolution; delegate to services; use Dataloader for batched BGG/DB reads | `class ThingsResolver < GraphQL::Schema::Resolver` |
| **Loaders (app/graphql/loaders)** | Batch N+1: `BggThingLoader` (fetch many thing ids in one BGG call), `CollectionItemLoader` | `class BggThingLoader < GraphQL::Dataloader::Source` |
| **Contracts (app/contracts)** | Validate all external input entering mutations/services (BGG usernames, group names, session params) | `class CreateGroupContract < ApplicationContract` (dry-validation via dry-rails) |
| **Services (app/services)** | Business logic; one class per use case; called by resolvers/mutations/jobs; never call GraphQL | `Groups::Create`, `Sessions::Suggest`, `Bgg::Client`, `Collections::Merge` |
| **Bgg::Client** | HTTP + XML parse + rate limit + response cache for BGG API v2; the only thing that talks to BGG | Faraday + Nokogiri + Solid Cache |
| **Solid Queue jobs** | Background BGG imports (collection refresh, hot items refresh); throttled to 1 concurrent BGG call | `Bgg::ImportCollectionJob` |
| **Solid Cache** | BGG response cache (TTL by endpoint: thing=1h, collection=30m, hot=24h, search=30m, user=1h) + rate-limit timestamp | DB-backed; no Redis |
| **Database** | Source of truth for app state (groups, sessions) + cached BGG data (things, collection items, users) | Postgres in prod (SQLite acceptable for v1) |

## Recommended Project Structure

Single Rails 8 app with the Vue SPA co-located via **vite-ruby** (default `sourceCodeDir: app/frontend`). One repo, one Gemfile, one `package.json`, one deploy. Rails serves the compiled SPA from `public/` in production and proxies to the Vite dev server in development.

```
boardgame-night-rails-vue/
├── Gemfile                          # Rails 8 + graphql-ruby + dry-rails + faraday + nokogiri + solid_queue + solid_cache
├── config/
│   ├── environments/
│   │   └── production.rb            # config.active_job.queue_adapter = :solid_queue
│   ├── initializers/
│   │   ├── graphql.rb               # GraphQL schema config, complexity, dataloader
│   │   ├── dry_rails.rb             # Dry::Rails.container { component_dirs.add "app/services" … }
│   │   ├── vite.rb                  # vite_rails config
│   │   └── faraday.rb               # BGG HTTP client defaults (retry, timeout, UA)
│   ├── routes.rb                    # root → GraphqlController#execute; catch-all → SPA shell
│   └── database.yml                 # primary + queue + cache DBs (Solid Queue / Solid Cache)
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── graphql_controller.rb    # POST /graphql — Apollo batch + multiplex
│   │   └── spa_controller.rb        # GET * → serves public/index.html (SPA shell)
│   ├── models/
│   │   ├── bgg_thing.rb             # cached game (id, name, players, playtime, image, stats)
│   │   ├── bgg_user.rb              # cached BGG user profile (bgg_username, bgg_id, avatar)
│   │   ├── bgg_collection_item.rb   # (bgg_username, bgg_thing_id, status_own, num_plays, cached_at)
│   │   ├── group.rb
│   │   ├── group_member.rb          # (group_id, bgg_username, display_name, role)
│   │   ├── session.rb               # (group_id, scheduled_at, host_bgg_username, status)
│   │   └── session_attendee.rb      # (session_id, bgg_username, rsvp_status)
│   ├── graphql/
│   │   ├── bgg_night_schema.rb      # class BggNightSchema < GraphQL::Schema; use GraphQL::Dataloader; max_complexity 400
│   │   ├── types/
│   │   │   ├── query_type.rb        # thing, things, search, user, userCollection, hotItems, group, session, suggestions
│   │   │   ├── mutation_type.rb     # createGroup, addGroupMember, createSession, rsvpSession, importCollection, validateBggUsername
│   │   │   ├── base_*.rb            # BaseObject, BaseInputObject, BaseEnum, BaseField, BaseConnection
│   │   │   ├── thing_type.rb        # mirrors reference proxy's Thing
│   │   │   ├── collection_type.rb
│   │   │   ├── group_type.rb
│   │   │   ├── session_type.rb
│   │   │   ├── game_suggestion_type.rb
│   │   │   └── …
│   │   ├── resolvers/               # class-based resolvers for Query fields needing args
│   │   │   ├── things_resolver.rb
│   │   │   ├── search_resolver.rb
│   │   │   ├── user_collection_resolver.rb
│   │   │   └── suggestions_resolver.rb
│   │   ├── mutations/               # class-based mutations (one class per mutation)
│   │   │   ├── base_mutation.rb
│   │   │   ├── create_group.rb
│   │   │   ├── add_group_member.rb
│   │   │   ├── create_session.rb
│   │   │   ├── rsvp_session.rb
│   │   │   ├── import_collection.rb
│   │   │   └── validate_bgg_username.rb
│   │   └── loaders/                 # GraphQL::Dataloader::Source subclasses (N+1 prevention)
│   │       ├── bgg_thing_loader.rb  # batch: many thing ids → 1 BGG /thing?id=1,2,3 call
│   │       ├── collection_item_loader.rb
│   │       └── bgg_user_loader.rb
│   ├── contracts/                   # dry-validation contracts (auto-registered by dry-rails)
│   │   ├── application_contract.rb  # base, preconfigured for I18n
│   │   ├── create_group_contract.rb
│   │   ├── add_group_member_contract.rb
│   │   ├── create_session_contract.rb
│   │   ├── rsvp_session_contract.rb
│   │   ├── import_collection_contract.rb
│   │   └── validate_bgg_username_contract.rb
│   ├── services/                    # business logic (auto-registered by dry-rails container)
│   │   ├── bgg/
│   │   │   ├── client.rb            # Faraday + Nokogiri + rate limiter + response cache (ONLY BGG caller)
│   │   │   ├── rate_limiter.rb      # Solid Cache key bgg:last_request_at — 1 req / 5s across workers
│   │   │   ├── xml_parser.rb        # Nokogiri → normalized Ruby hashes (replaces xml2js normalization)
│   │   │   └── endpoints/           # one class per BGG endpoint: thing, search, user, collection, hot
│   │   │       ├── thing.rb
│   │   │       ├── search.rb
│   │   │       ├── user.rb
│   │   │       ├── collection.rb    # incl. expansion-merge workaround (2 calls merged)
│   │   │       └── hot.rb
│   │   ├── collections/
│   │   │   ├── import.rb            # enqueue Bgg::ImportCollectionJob + return job_id
│   │   │   ├── merge.rb             # dedupe N users' cached collections → shared view
│   │   │   └── refresh.rb
│   │   ├── groups/
│   │   │   ├── create.rb
│   │   │   └── add_member.rb
│   │   ├── sessions/
│   │   │   ├── create.rb
│   │   │   ├── rsvp.rb
│   │   │   └── suggest.rb           # merged collection × attendees × player-count filter + ranking
│   │   └── suggestions/
│   │       └── engine.rb            # pure: takes [bgg_things] + attendee_count → ranked suggestions
│   ├── jobs/
│   │   ├── application_job.rb
│   │   └── bgg/
│   │       ├── import_collection_job.rb   # concurrency controls: max 1 BGG job at a time
│   │       └── refresh_hot_items_job.rb   # scheduled (cron-style) every 24h
│   └── frontend/                    # ← vite-ruby sourceCodeDir (the Vue 3 SPA lives here)
│       ├── entrypoints/             # ONLY Vite entry files (vite_ruby convention)
│       │   ├── application.js       # mounts App.vue, registers Apollo + Router + Pinia
│       │   └── styles.css           # global styles / Tailwind entry
│       ├── App.vue                  # root layout (responsive: mobile drawer / desktop sidebar)
│       ├── router/
│       │   └── index.js             # routes: /, /u/:usernames, /g/:token, /s/:id, /collection
│       ├── apollo/
│       │   ├── client.js            # ApolloClient + HttpLink(/graphql) + InMemoryCache + batch link
│       │   ├── queries/             # co-located .graphql files OR gql tags
│       │   └── mutations/
│       ├── stores/                  # Pinia setup stores (UI/session state only — NOT server data)
│       │   ├── filters.js           # search query, player filter, sort, group-by
│       │   ├── session-draft.js     # current session being planned
│       │   └── ui.js                # sidebar open, theme
│       ├── composables/             # stateful logic reuse (Vue Composition API)
│       │   ├── useUserCollection.js # Apollo query wrapper + loading/error state
│       │   ├── useMultiUserCollections.js
│       │   ├── useHotGames.js
│       │   ├── useFuzzySearch.js    # fuse.js over cached collection
│       │   ├── useDebounce.js
│       │   └── useGroupSession.js
│       ├── components/
│       │   ├── layout/              # AppShell, Sidebar, MobileDrawer, Navbar
│       │   ├── collection/          # GameCard, Results, SortBar, FilterPanel, CollapsibleGroup, ResultsSkeleton
│       │   ├── group/               # GroupForm, GroupMemberList, MemberAvatar
│       │   ├── session/             # SessionForm, AttendeePicker, SuggestionList, SuggestionCard
│       │   └── common/              # UsernameInput, CTA, Toaster, Container
│       ├── views/                   # route-level pages
│       │   ├── HomeView.vue         # hot games + username input + permalink CTA
│       │   ├── CollectionView.vue   # merged collection (parity with bggeek-shared-list)
│       │   ├── GroupView.vue
│       │   └── SessionView.vue
│       ├── lib/
│       │   ├── permalink.js         # /u/user1,user2,user3 encoding (parity with reference)
│       │   ├── sorting.js           # sort comparators (parity)
│       │   ├── grouping.js          # group-by logic (parity)
│       │   └── memberColors.js      # deterministic color per username (parity)
│       └── generated/               # graphql-codegen output (types + Vue Apollo composables)
├── public/
│   └── (Vite build output — index.html + fingerprinted assets, served by Rails in prod)
├── db/
│   ├── migrate/                     # schema_migrations
│   ├── queue_migrate/               # Solid Queue migrations
│   └── cache_migrate/               # Solid Cache migrations
├── storage/                         # SQLite files in prod (production.sqlite3, _queue, _cache) if SQLite
├── config/deploy.yml                # Kamal 2 deploy config (single container)
├── vite.config.ts                   # Vite config (@vitejs/plugin-vue, alias @ → app/frontend)
├── package.json                     # Vue + Vite + Apollo + Pinia + fuse.js + tailwind + codegen
├── .env.bggeek                      # BGG token (gitignored) — loaded via dotenv-rails
└── .planning/                       # GSD planning artifacts
```

### Structure Rationale

- **`app/frontend/` (vite-ruby default):** Keeps the SPA inside the Rails app tree, lets `vite_asset_path` / `vite_stylesheet_tag` helpers integrate with the SPA shell view, and produces a single deployable artifact. One `package.json` at the repo root keeps `npm install` simple. **Alternative if the team wants a harder boundary:** configure `sourceCodeDir: frontend` and move the SPA to a top-level `frontend/` dir — vite-ruby supports it, but you lose the "it's all one Rails app" mental model. **Not recommended:** the fully-decoupled `apps/api` + `apps/web` layout with two Dockerfiles — it violates the PROJECT.md constraint of a single deploy from Rails and adds CORS + two-deploy operational overhead for no benefit at this scale.
- **`app/graphql/{types,resolvers,mutations,loaders}`:** This is the exact layout produced by `rails g graphql:install` plus a `loaders/` dir for `GraphQL::Dataloader::Source` subclasses. Class-based types/mutations are the modern graphql-ruby convention (the old `.define` style is deprecated). Resolvers live separately from types so Query fields with complex args get their own testable class.
- **`app/contracts/`:** dry-rails auto-registers `ApplicationContract` subclasses here into the container; mutations instantiate the relevant contract, call it with input args, and return validation errors as GraphQL errors if it fails. This is the input-validation boundary — every mutation MUST go through a contract before touching a service.
- **`app/services/`:** Business logic lives here, namespaced by domain (`Bgg::`, `Collections::`, `Groups::`, `Sessions::`, `Suggestions::`). dry-rails auto-registers these into the container so resolvers/mutations/jobs can resolve them via `Container[:groups_create]` or `Deps["groups.create"]`. Services never call GraphQL; they're called by GraphQL.
- **`Bgg::Client` under `app/services/bgg/`:** The BGG integration is a service namespace, not a model concern. The client is the **only** code allowed to make BGG HTTP calls. Endpoints are split one class per BGG URL (`Bgg::Endpoints::Thing`, `Bgg::Endpoints::Collection`, …) so each is independently testable with XML fixtures (mirroring the reference proxy's `bggDataSource.ts` method-per-endpoint structure).
- **`app/jobs/bgg/`:** Solid Queue jobs for background imports. Solid Queue's concurrency controls enforce "max 1 BGG job running at a time" — the rate limiter is the second line of defense for in-request (synchronous) BGG calls.
- **`db/queue_migrate/` + `db/cache_migrate/`:** Rails 8 separates Solid Queue and Solid Cache into their own databases with their own migration paths. Postgres in production (one DB, three schemas) or SQLite (three files in `storage/`).

## Architectural Patterns

### Pattern 1: Single GraphQL Schema with Class-Based Types + Dataloader

**What:** One `BggNightSchema < GraphQL::Schema` with `use GraphQL::Dataloader` and `max_complexity 400`. Class-based types in `app/graphql/types/`, class-based mutations in `app/graphql/mutations/`. N+1 prevention via `GraphQL::Dataloader::Source` loaders in `app/graphql/loaders/`.

**When to use:** Always for this app. The schema is small enough that a single modular schema is correct — no need for multiple schemas or federation.

**Trade-offs:** Dataloader is Fiber-based (modern, built into graphql-ruby, recommended over the older `graphql-batch` gem which is promise-based). Tradeoff: Dataloader cannot be used outside of GraphQL execution, but we don't need to. `graphql-batch` is more mature but Dataloader is the path forward per the official graphql-ruby docs.

**Example:**
```ruby
# app/graphql/bgg_night_schema.rb
class BggNightSchema < GraphQL::Schema
  query    Types::QueryType
  mutation Types::MutationType
  use GraphQL::Dataloader
  max_complexity 400
  default_max_page_size 50
end

# app/graphql/loaders/bgg_thing_loader.rb — batch N+1 for Thing relationships
class BggThingLoader < GraphQL::Dataloader::Source
  def fetch(ids)            # called once per batch with all requested ids
    things = BggThing.where(bgg_id: ids).index_by(&:bgg_id)
    missing = ids - things.keys
    fetched = missing.empty? ? {} : Bgg::Endpoints::Thing.new.fetch_many(missing)
    ids.map { |id| things[id] || fetched[id] }
  end
end

# app/graphql/types/thing_type.rb
module Types
  class ThingType < BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :base_game, ThingType, null: true
    def base_game
      dataloader.with(BggThingLoader).load(object.base_game_bgg_id)  # batched
    end
  end
end
```

### Pattern 2: Contract-First Mutation → Service → Job

**What:** Every GraphQL mutation follows a strict 3-layer pipeline: (1) dry-validation contract validates input, (2) service object executes business logic synchronously, (3) if a side effect is slow (BGG fetch), the service enqueues a Solid Queue job and returns a job handle. The mutation returns either validation errors or a success payload with the job id for polling.

**When to use:** Every mutation. No exceptions — this is the input-validation boundary and the sync/async split.

**Trade-offs:** More files per use case (contract + service + mutation + job), but each is independently testable and the validation boundary is explicit. Worth it.

**Example:**
```ruby
# app/contracts/import_collection_contract.rb
class ImportCollectionContract < ApplicationContract
  params do
    required(:bgg_username).filled(:string)
    optional(:force).value(:bool)  # skip cache
  end
  rule(:bgg_username) do
    key.failure("must be 1-50 chars") unless values[:bgg_username].to_s.length.between?(1, 50)
  end
end

# app/graphql/mutations/import_collection.rb
module Mutations
  class ImportCollection < BaseMutation
    argument :bgg_username, String, required: true
    argument :force, Boolean, required: false, default_value: false
    field :job_id, String, null: true
    field :collection, Types::CollectionType, null: true

    def resolve(args)
      contract = ImportCollectionContract.new.call(args.to_h)
      if contract.failure?
        raise GraphQL::ExecutionError.new("invalid", extensions: { errors: contract.errors.to_h })
      end
      result = Collections::Import.new.call(**contract.values)  # enqueues Bgg::ImportCollectionJob
      { job_id: result.job_id, collection: result.cached_snapshot }
    end
  end
end
```

### Pattern 3: BGG Client as the Single Egress Point with DB-Backed Rate Limiting

**What:** `Bgg::Client` is the only class that issues BGG HTTP requests. It composes Faraday (HTTP + retry on 502/503/429 with exponential backoff), Nokogiri (XML → Ruby), a Solid Cache response cache (per-endpoint TTL), and a Solid Cache-backed rate limiter enforcing 1 req / 5s **across all workers** via a `bgg:last_request_at` timestamp key. Solid Queue concurrency controls cap BGG jobs to 1 concurrent.

**When to use:** Every BGG call, whether synchronous (in a resolver — username validation, hot items) or asynchronous (in a job — collection import).

**Trade-offs:** Solid Cache (DB-backed) for rate limiting is slightly slower than Redis but eliminates the Redis dependency entirely, matching Rails 8's "no Redis by default" philosophy. For v1 single-VPS deployment this is correct. If BGG traffic grows, swap the rate limiter backend to Redis without changing the `Bgg::RateLimiter` interface.

**Example:**
```ruby
# app/services/bgg/rate_limiter.rb
class Bgg::RateLimiter
  MIN_INTERVAL = 5.seconds
  KEY = "bgg:last_request_at"

  def acquire
    loop do
      last = Rails.cache.read(KEY).to_f
      wait = [0, MIN_INTERVAL - (Time.current.to_f - last)].max
      sleep(wait) if wait.positive?
      # compare-and-set: only proceed if we're the winner
      break if Rails.cache.write(KEY, Time.current.to_f, exists: false) || refresh_if_stale(last)
    end
  end
end

# app/services/bgg/client.rb
class Bgg::Client
  def initialize(rate_limiter: Bgg::RateLimiter.new, cache: Rails.cache)
    @rate_limiter = rate_limiter
    @cache = cache
    @http = Faraday.new(BGG_BASE_URL) do |f|
      f.request  :retry, max: 3, interval: 1, backoff_factor: 2,
                 exceptions: [Faraday::TimeoutError, Faraday::ConnectionFailed]
      f.response :raise_error   # 502/503/429 → retried
      f.options.timeout = 15
    end
  end

  def thing(id)      = cached("bgg:thing:#{id}", ttl: 1.hour)   { fetch_xml("/thing?id=#{id}&stats=1") }
  def collection(u)  = cached("bgg:collection:#{u}", ttl: 30.minutes) { Bgg::Endpoints::Collection.new.fetch(u) }
  def hot(type=nil)  = cached("bgg:hot:#{type}", ttl: 24.hours)  { fetch_xml("/hot#{"?type=#{type}" if type}") }

  private
  def cached(key, ttl:)
    @cache.fetch(key, expires_in: ttl) { @rate_limiter.acquire; yield }
  end
end
```

### Pattern 4: Cache-Aside Persistence for BGG Data (Persist vs Fetch Live)

**What:** BGG data falls into two tiers:
- **Persisted in our DB (cache-aside):** `bgg_things`, `bgg_collection_items`, `bgg_users` — written by background import jobs, read by resolvers/suggestions from the DB. The DB is the source of truth for the app's working set; BGG is the origin but is too slow (1 req/5s) to query synchronously for multi-user merges.
- **Fetched live (with HTTP cache, not persisted):** hot items, search results, user-validation lookups, single-thing detail — these are cache-through `Bgg::Client` with TTLs and never touch our DB.

**When to use:** Persist collections (multi-user merge needs all users' items in one query — impossible to fetch 5 users × 2 BGG calls = 50s synchronously). Don't persist hot/search (volatile, cheap to cache-through).

**Trade-offs:** Persistence means collections can be stale. Mitigation: `cached_at` timestamp on `bgg_collection_items`, a `force: true` arg on `importCollection` mutation to trigger re-import, and a "last synced X minutes ago" UI affordance. Background re-sync job for groups with active sessions.

**Example:**
```ruby
# app/services/collections/merge.rb — pure DB query, no BGG calls
class Collections::Merge
  def call(bgg_usernames:)
    BggCollectionItem
      .where(bgg_username: bgg_usernames, status_own: true)
      .includes(:bgg_thing)
      .group_by(&:bgg_thing_id)        # dedupe across users
      .map { |thing_id, items| MergedGame.new(thing: items.first.bgg_thing, owners: items.map(&:bgg_username)) }
  end
end

# app/services/sessions/suggest.rb — computed from cached data only
class Sessions::Suggest
  def call(session)
    attendees = session.attendees.accepted.map(&:bgg_username)
    merged    = Collections::Merge.new.call(bgg_usernames: attendees)
    Suggestions::Engine.new.rank(merged, player_count: attendees.size)
  end
end
```

## Data Flow

### Request Flow: On-Demand Collection Import (end-to-end)

```
[User enters "alice,bob" in Vue username input]
    ↓
Vue Router → /u/alice,bob  →  CollectionView mounts
    ↓
useMultiUserCollections composable → Apollo useQuery(USER_COLLECTIONS, {usernames:["alice","bob"]})
    ↓
Apollo batched POST /graphql  →  GraphqlController#execute (or Schema.multiplex if batched)
    ↓
Types::QueryType.userCollection resolver → Collections::Merge service
    ↓
Collections::Merge queries BggCollectionItem WHERE bgg_username IN ("alice","bob")
    ↓
CASE A: cached rows exist & fresh (< 30 min)
    → returns merged collection immediately → GraphQL response → Apollo cache → Vue renders
CASE B: no rows OR stale OR force=true
    → returns partial/null + enqueues Bgg::ImportCollectionJob per missing user (via importCollection mutation, OR the resolver triggers import and returns a "syncing" state)
    ↓
Bgg::ImportCollectionJob (Solid Queue, concurrency: 1 BGG)
    ↓
Bgg::Client.collection("alice")  →  rate_limiter.acquire (1 req/5s across workers)
    ↓
Faraday GET /collection?username=alice&stats=1&excludesubtype=boardgameexpansion&own=1
    + Faraday GET /collection?username=alice&subtype=boardgameexpansion&stats=1&own=1   # expansion workaround
    ↓
Nokogiri::XML parse → Bgg::XmlParser.normalize_collection → array of item hashes
    ↓
upsert BggThing (id, name, players, playtime, image, stats…) + BggCollectionItem (user, thing, own, num_plays, cached_at)
    ↓
ActionCable/Solid Cable broadcasts "collection_synced" → Vue Apollo cache refetches
    (OR: Vue polls a syncStatus query; OR: mutation returns job_id and Vue polls)
    ↓
Collections::Merge now returns full merged set → Vue re-renders
```

### Request Flow: Game Suggestions for a Session

```
[User opens session /s/42 → picks attendees → clicks "Suggest games"]
    ↓
Apollo useQuery(SUGGESTIONS, {sessionId: 42})  →  POST /graphql
    ↓
Types::QueryType.suggestions resolver → Sessions::Suggest service
    ↓
Sessions::Suggest:
  1. attendees = session.accepted_attendees.map(&:bgg_username)   # from DB
  2. merged    = Collections::Merge.call(attendees)                # pure DB query
  3. ranked    = Suggestions::Engine.new.rank(merged, player_count: attendees.size)
    ↓
Suggestions::Engine filters/ranks:
  - keep things where max_players >= attendees.size AND min_players <= attendees.size
  - keep things where playing_time within session's chosen time bucket
  - rank by: # owners who own it (more owners = more likely everyone can play) → bayes_average → -average_weight (lighter first for casual nights)
    ↓
Returns [GameSuggestion] with thing + owner_bgg_usernames + score + reason
    ↓
GraphQL response → Apollo cache → SuggestionList.vue renders
```

### State Management (Vue side)

```
┌─────────────────────────────────────────────────────────────────┐
│  Apollo InMemoryCache (normalized by __typename + id)           │
│  — the ONLY source of server data. Entities (Thing, Group,       │
│    Session, CollectionItem) sync across views automatically.     │
│    A createSession mutation updates Group.sessions everywhere.    │
└───────────────────────┬─────────────────────────────────────────┘
                        │ composables wrap useQuery/useMutation
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Pinia stores (UI / session-draft state ONLY — NOT server data)  │
│  filtersStore: { query, playerCount, sortBy, groupBy }           │
│  sessionDraftStore: { selectedGroup, attendees[], timeBucket }   │
│  uiStore: { sidebarOpen, theme }                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Read path (hot/search/thing/user validation):** Vue → Apollo → `/graphql` → resolver → `Bgg::Client` (HTTP cache hit? return : miss → rate-limit → BGG → cache-write) → Nokogiri normalize → GraphQL type → response. No DB write.
2. **Read path (collection merge / suggestions):** Vue → Apollo → `/graphql` → resolver → `Collections::Merge` / `Sessions::Suggest` → pure DB query on `bgg_collection_items` + `bgg_things` → GraphQL response. No BGG call (works only if collections are cached).
3. **Write path (import collection):** Vue → `importCollection` mutation → contract → `Collections::Import` service → enqueues `Bgg::ImportCollectionJob` → returns job_id → Vue polls `syncStatus(username)` query → job completes → DB rows upserted → next `userCollection` query returns fresh data.
4. **Write path (group/session CRUD):** Vue → mutation → contract → service → DB write → GraphQL response → Apollo cache auto-updates (normalized cache). No BGG.
5. **Hot items refresh:** Scheduled `Bgg::RefreshHotItemsJob` (Solid Queue cron) every 24h → `Bgg::Client.hot` → upsert `bgg_things` (or cache-only) → landing page reads from cache.

## What to Persist vs Fetch Live

| Data | Persist in DB? | Fetch Live (cache-through)? | Rationale |
|------|:---:|:---:|-----------|
| `bgg_things` (game metadata: name, players, playtime, image, stats) | ✅ | ✅ (backfill on miss) | Multi-user merge + suggestions need set queries over many games — impossible over BGG's 1 req/5s. Cache-aside: job fetches & upserts; resolvers read DB. |
| `bgg_collection_items` (per-username owned items) | ✅ | ❌ (only via import job) | Merging 5 users' collections = 10 BGG calls = 50s synchronously. Must persist. `cached_at` per row + `force` re-import. |
| `bgg_users` (BGG profile for username validation) | ✅ (light) | ✅ (validate via live `Bgg::Client.user`, cache 1h, persist id+avatar) | Validation needs a live BGG `/user` call to confirm existence; persist the result so group members show avatars without re-fetching. |
| Hot items (trending) | ❌ (or light cache) | ✅ (24h TTL via `Bgg::Client`) | Volatile, single BGG call, cheap to cache-through. |
| Search results | ❌ | ✅ (30min TTL) | Volatile, user-specific query, not worth persisting. |
| `groups`, `group_members` | ✅ | ❌ | Pure app state — no BGG. |
| `sessions`, `session_attendees` | ✅ | ❌ | Pure app state. |
| Game suggestions | ❌ (compute live) | ❌ | Pure function over cached collections + attendees. Recompute per request; cheap (DB query + Ruby sort). Optionally cache result per session for 5 min. |
| Single-thing detail (deep view) | ✅ (if in working set) | ✅ (1h TTL fallback) | If the thing is in `bgg_things`, serve from DB; else `Bgg::Client.thing(id)` cache-through + lazy persist. |

## Build Order (drives phase sequencing)

Phases are ordered by dependency — each builds on the previous. Earlier phases unblock more later work.

| # | Build | Unblocks | Why this order |
|---|-------|----------|----------------|
| 1 | **Rails 8 API scaffold + Vue 3 + Vite (vite-ruby) monorepo shell** — `rails new --api`, vite-ruby install, Vue 3 mount, Apollo Client wired to `/graphql`, Vue Router, Pinia, Tailwind, Kamal 2 config, `.env.bggeek` loading | everything | Foundation. Nothing compiles or deploys without it. |
| 2 | **BGG client** — `Bgg::Client` + `Bgg::RateLimiter` (Solid Cache) + `Bgg::XmlParser` (Nokogiri) + endpoint classes (`Thing`, `Search`, `User`, `Collection` with expansion workaround, `Hot`). No GraphQL yet. Tested with XML fixtures from reference proxy. | 3, 4 | The data source. Every later feature needs it. Validates the rate-limit + cache strategy early. |
| 3 | **BGG persistence layer** — migrations for `bgg_things`, `bgg_collection_items`, `bgg_users`; `Bgg::ImportCollectionJob` (Solid Queue, concurrency: 1); `Collections::Import` service; upsert logic. | 4, 9 | Decouples BGG's slowness from the read path. Once collections persist, merges/suggestions become pure DB queries. |
| 4 | **GraphQL schema (Query root) — BGG read queries** — `BggNightSchema` + `GraphQL::Dataloader` + `max_complexity 400`; `Types::QueryType` with `thing`, `things`, `search`, `user`, `userCollection`, `hotItems`; `BggThingLoader` for N+1; `GraphqlController` with Apollo batch support. | 5, 6 | Exposes BGG data to Vue. This is the contract the frontend consumes. |
| 5 | **Vue shell + collection view (parity with bggeek-shared-list)** — `HomeView` (hot games + username input), `CollectionView` (merged collection display), `useMultiUserCollections`, `useHotGames`, `GameCard`, `Results`, `ResultsSkeleton`, responsive layout (mobile drawer + desktop sidebar). | 6, 7 | First user-visible feature. Validates the whole stack end-to-end (Vue → Apollo → GraphQL → BGG). |
| 6 | **Filtering / sorting / grouping / fuzzy search + permalinks (parity)** — `lib/sorting`, `lib/grouping`, `lib/permalink`, `useFuzzySearch` (fuse.js), `SortBar`, `FilterPanel`, `CollapsibleGroup`, `/u/:usernames` permalink route. | 7 | Completes collection-view parity. These are pure-client over Apollo cache — no new backend. |
| 7 | **Groups + memberships** — migrations for `groups`, `group_members`; `CreateGroup`/`AddGroupMember` contracts + services + mutations; `Types::GroupType`; Vue `GroupView` + `GroupForm` + `GroupMemberList`; `importCollection` mutation wired to import job for group members' collections. | 8 | Sessions belong to groups. Groups also drive "pool multiple users' collections" cleanly. |
| 8 | **Sessions + invitations/RSVP** — migrations for `sessions`, `session_attendees`; `CreateSession`/`RsvpSession` contracts + services + mutations; `Types::SessionType`; Vue `SessionView` + `SessionForm` + `AttendeePicker`. | 9 | Suggestions need session attendees. |
| 9 | **Game suggestions engine** — `Suggestions::Engine` (pure: merged collection × attendees × player-count filter + ranking); `Sessions::Suggest` service; `suggestions` Query resolver; `GameSuggestionType`; Vue `SuggestionList` + `SuggestionCard`. | (v1 complete) | The headline feature. Depends on cached collections (3), groups (7), sessions (8). |
| 10 | **Polish: scheduled hot-items refresh, sync-status UX, re-import button, permalink sharing for groups/sessions** — `Bgg::RefreshHotItemsJob` (cron), sync-status polling, share buttons. | (v1 ship) | Non-blocking polish after the spine works. |

### Dependency graph (condensed)

```
1 ──→ 2 ──→ 3 ──→ 4 ──→ 5 ──→ 6
              │        │      │
              │        ├─────→ 7 ──→ 8 ──→ 9
              └──→ 9 (needs cached collections)
                                          └──→ 10
```

**Critical path:** 1 → 2 → 3 → 4 → 5 → 7 → 8 → 9. Phase 6 (filters/sort/permalinks) can run in parallel with 7–8 since it's pure-client. Phase 10 is post-spine polish.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users (v1 target) | Single Rails process + Solid Queue worker on one VPS (Kamal 2). SQLite or Postgres. Solid Cache (DB-backed) for BGG rate-limit + response cache. In-memory rate limiter fallback. This is plenty. |
| 1k–100k users | Add a 2nd Rails worker + 2nd Solid Queue worker. Move Solid Cache to a dedicated DB. Switch `Bgg::RateLimiter` to Redis (MX mutex) if cache-write race causes BGG 429s. Add a CDN in front of `public/` for static assets. Consider read replica for `bgg_collection_items`. |
| 100k+ users | Unlikely for a friend-group app, but: split BGG import into its own service with a dedicated queue + Redis rate limiter. Pre-warm hot items into a separate cache tier. Paginate `Collections::Merge` with keyset pagination. Move suggestions computation to a materialized view refreshed by the import job. |

### Scaling Priorities

1. **First bottleneck — BGG rate limit (1 req/5s):** Hits long before DB or CPU. Mitigation: aggressive response caching (TTLs by endpoint), persist collections so merges don't hit BGG, Solid Queue concurrency: 1 for BGG jobs, `force: false` default on imports. The rate limiter is the single most important scaling decision — get it right in Phase 2.
2. **Second bottleneck — synchronous GraphQL resolution of large collections:** A group of 10 users × 200 games = 2000 collection items. `Collections::Merge` + `Suggestions::Engine` must use DB indexes (`bgg_collection_items(bgg_username, bgg_thing_id)`, `bgg_things(bgg_id)`) and avoid N+1 via `includes(:bgg_thing)`. GraphQL `max_complexity 400` + `default_max_page_size 50` prevent runaway queries.

## Anti-Patterns

### Anti-Pattern 1: Synchronous multi-user BGG fetch in a GraphQL resolver

**What people do:** `userCollection(usernames: [String!]!)` resolver calls `Bgg::Client.collection(u)` for each username inside the request. For 5 users that's 50s of blocked request.
**Why it's wrong:** BGG's 1 req/5s limit makes this unusable; the request times out; one slow user blocks everyone (Solid Queue concurrency: 1).
**Do this instead:** Persist collections (`bgg_collection_items`). Resolvers read from DB (instant). Imports happen async via `importCollection` mutation → Solid Queue job. The resolver returns cached data + a `syncStatus` field indicating staleness.

### Anti-Pattern 2: Redis for rate limiting / caching / jobs in a Rails 8 app

**What people do:** Reach for Sidekiq + Redis + redis-rack-cache because "that's what Rails apps do."
**Why it's wrong:** Rails 8 ships Solid Queue + Solid Cache specifically to eliminate the Redis dependency for the default deployment. Adding Redis reintroduces an external service to operate, monitor, and back up — for an app where DB-backed equivalents are fast enough.
**Do this instead:** Solid Queue (jobs) + Solid Cache (BGG response cache + rate-limit timestamp). Only introduce Redis if/when the rate-limit write contention becomes measurable (100k+ users tier) — and even then, only the rate limiter, not jobs/cache.

### Anti-Pattern 3: GraphQL resolvers doing business logic / calling BGG directly

**What people do:** Stuff all logic into `Types::QueryType` field blocks: `field :suggestions, [SuggestionType] do; def suggestions; Bgg::Client.collection(...); compute_suggestions(...); end; end`
**Why it's wrong:** Untestable, mixes layers, hides side effects, can't be reused by jobs or other services.
**Do this instead:** Resolvers are thin — they pull args, call a service object, return the result. `def suggestions = Sessions::Suggest.new.call(object)`. Services own logic. Contracts own validation. Jobs own async. Resolvers own GraphQL shaping only.

### Anti-Pattern 4: Duplicating server data in Pinia

**What people do:** "I'll keep the merged collection in a Pinia store so components can read it." Then Apollo cache and Pinia drift, mutations update one but not the other, debugging becomes hell.
**Why it's wrong:** Two sources of truth for server data → cache invalidation bugs.
**Do this instead:** Apollo `InMemoryCache` (normalized) is the ONLY source of server data. Pinia stores hold UI-only state (filter selections, sidebar open, draft session selections before mutation). Composables (`useMultiUserCollections`) wrap Apollo queries and expose `loading`/`error`/`data` refs — components consume those, never a Pinia copy of server data.

### Anti-Pattern 5: Two separate deploys (frontend Nginx + backend Rails) for a single-user friend app

**What people do:** Copy a SaaS template with `apps/web` (Nginx) + `apps/api` (Rails) as two Docker containers with two Kamal configs.
**Why it's wrong:** Doubles operational surface (two deploys, two health checks, CORS config, two TLS certs) for zero benefit at this scale. The app has one user persona looking at one SPA hitting one GraphQL endpoint.
**Do this instead:** vite-ruby compiles Vue into `public/`; Rails serves the SPA shell + assets + `/graphql` from one process; one Kamal 2 deploy to one VPS. If the frontend ever needs to scale independently (it won't, for this app), split then.

### Anti-Pattern 6: Skipping dry-validation contracts because "GraphQL already validates types"

**What people do:** Rely on graphql-ruby's type checking for mutation args and skip dry-validation.
**Why it's wrong:** GraphQL types check shape (String vs Int) but not domain rules (username length 1–50, no banned names, group name uniqueness, RSVP status transitions). Putting those rules in the mutation class makes it fat and untestable.
**Do this instead:** Every mutation instantiates a `*Contract` and calls it first; failed contracts raise `GraphQL::ExecutionError` with `extensions: { errors: contract.errors.to_h }`. Contracts are pure, testable, reusable by jobs/controllers.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **BGG XML API v2** (`boardgamegeek.com/xmlapi2`) | `Bgg::Client` (Faraday + Nokogiri) — the only egress. Rate-limited 1 req/5s via Solid Cache key. Cached by endpoint (thing=1h, collection=30m, hot=24h, search=30m, user=1h). Expansion-merge workaround: 2 calls for `subtype=boardgame` (boardgames + expansions merged), ported from reference proxy. Retries on 502/503/429 with exp backoff (1s/2s/4s). `User-Agent: BggNightRails/1.0`. BGG token from `.env.bggeek` sent as cookie/header for headroom on private collections. | Read-only endpoints only in v1. No writes. |
| **Solid Queue** (DB-backed jobs) | ActiveJob adapter. `Bgg::ImportCollectionJob` (concurrency: 1 BGG), `Bgg::RefreshHotItemsJob` (scheduled). | No Redis. |
| **Solid Cache** (DB-backed cache) | `Rails.cache` for BGG response cache + rate-limit timestamp. | No Redis. |
| **Apollo Client (Vue)** | `@apollo/client` + `@vue/apollo-composable`. `HttpLink` to `/graphql`. Batch link for query batching (handled by `Schema.multiplex`). `InMemoryCache` normalized by `__typename + id`. | Single GraphQL endpoint, same origin → no CORS. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Vue ↔ Rails | GraphQL over HTTP (`POST /graphql`) | Single endpoint. Apollo batch link → `Schema.multiplex`. No REST. |
| GraphqlController ↔ Schema | `BggNightSchema.execute` / `.multiplex` | Context carries `current_user` (none in v1) + dataloader. |
| Schema (resolvers/mutations) ↔ Contracts | Mutation instantiates contract, calls it, raises `GraphQL::ExecutionError` on failure | Contracts are the validation gate. |
| Contracts ↔ Services | Service called with `contract.values` (validated, coerced) only after success | Services trust their input. |
| Services ↔ Models | Direct Active Record calls | Services own transaction boundaries. |
| Services ↔ Bgg::Client | Only `Collections::Import` (via job) and read-through resolvers call `Bgg::Client` | BGG egress is centralized. |
| Services ↔ Jobs | Services enqueue jobs (`Collections::Import` → `Bgg::ImportCollectionJob`); jobs call services back (`Job` → `Collections::Refresh`) | Async side effects only. |
| Jobs ↔ Models | Jobs upsert `BggThing` / `BggCollectionItem` via services | Never call GraphQL. |

## Sources

- **graphql-ruby official guides** (Context7 `/rmosolgo/graphql-ruby`) — class-based schema, `use GraphQL::Dataloader`, `max_complexity`, Apollo batch handling via `Schema.multiplex`, `rails g graphql:install` layout. Confidence: MEDIUM (official docs). https://github.com/rmosolgo/graphql-ruby/blob/master/guides/
- **graphql-batch vs GraphQL::Dataloader** (Context7 `/shopify/graphql-batch` + graphql-ruby dataloader/adopting.md) — Dataloader is the modern Fiber-based built-in; graphql-batch is older promise-based. Confidence: MEDIUM (official docs).
- **vite-ruby** (Context7 `/elmassimo/vite_ruby`) — `app/frontend` default `sourceCodeDir`, `entrypoints/` subdir, production extends `assets:precompile` to build into `public/` with manifest. Confidence: MEDIUM (official docs). https://github.com/elmassimo/vite_ruby
- **Rails 8 guides** (Context7 `/websites/guides_rubyonrails_v8_0`) — Solid Queue as default ActiveJob adapter, `config.active_job.queue_adapter = :solid_queue`, separate queue DB via `db/queue_migrate`, SQLite-in-production default, Kamal 2. Confidence: MEDIUM (official docs). https://guides.rubyonrails.org/v8.0/
- **dry-rails** (Context7 `/dry-rb/dry-rails`) — `ApplicationContract` base class, `app/contracts/` auto-registration, `safe_params` feature on `ActionController::API`, container auto-registers `app/services` + `app/operations`. Confidence: MEDIUM (official docs). https://dry-rb.org/gems/dry-rails/
- **Pinia** (Context7 `/vuejs/pinia`) — setup stores via `defineStore('name', () => …)` Composition API, flat architecture (no nested modules). Confidence: MEDIUM (official docs).
- **Apollo vs urql vs Villus for Vue** (Exa web search, verified against Context7 ecosystem knowledge) — Apollo ~33KB gz + normalized cache + `@vue/apollo-composable`; urql ~8KB gz + document cache + `@urql/vue`; Villus Vue-native but smaller community. For apps with mutations + shared entities, Apollo's normalized cache wins. Confidence: MEDIUM (cross-checked).
- **Rails + Vite monorepo patterns** (Exa web search, verified) — 5 real-world examples: `hoshinotsuyoshi/rails-api-vite-easy-stack` (backend/+frontend/ with rsync build:move into Rails public/), `espoo-dev/rails_boilerplate` (backend/+frontend/ with docker-compose include), `jcflorville/rails-tanstack-starter` (apps/api + apps/web fully decoupled, Kamal 2 dual deploy), `JadeCathleen/microposts_api` (Rails root + client/ subdir, separate Netlify deploy). The decoupled `apps/api + apps/web` pattern is common for SaaS but violates this project's single-deploy constraint; the `app/frontend` (vite-ruby) pattern is the tightest fit. Confidence: MEDIUM (verified).
- **Reference repos** (read directly) — `bgg-graphql-proxy/src/datasources/bggDataSource.ts` (BGG rate-limit + retry + expansion-merge workaround + XML normalization patterns to port), `bgg-graphql-proxy/src/schema/schema.graphql` (the GraphQL schema shape the Rails backend must reproduce), `bggeek-shared-list/src/lib/graphql/client.ts` (Apollo Client config to mirror in Vue), `bggeek-shared-list/src/utils/{search,sorting,grouping,permalink}.ts` (frontend logic to port). Confidence: HIGH (primary source — this is the app being rewritten).

---
*Architecture research for: Rails 8 API + Vue 3 SPA monorepo with GraphQL + dry-validation + BGG integration*
*Researched: 2026-06-30*
