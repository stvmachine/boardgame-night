# Phase 3: GraphQL API + Collection Surface (v1 Parity) — Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 48
**Analogs found:** 46 / 48

## File Classification

### Backend (Rails)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/graphql/types/thing_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/merged_thing_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/merged_collection_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/owner_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/user_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/hot_item_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/search_result_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/user_sync_status_type.rb` | type | request-response | `app/graphql/types/base_object.rb` | exact |
| `app/graphql/types/sync_status_enum.rb` | type (enum) | request-response | `app/graphql/types/base_enum.rb` | exact |
| `app/graphql/types/query_type.rb` | resolver | request-response | `app/graphql/types/query_type.rb` | exact |
| `app/graphql/types/mutation_type.rb` | resolver | request-response | `app/graphql/types/mutation_type.rb` | exact |
| `app/graphql/types/subscription_type.rb` | resolver | pub-sub | `app/graphql/types/query_type.rb` | role-match |
| `app/graphql/loaders/owners_loader.rb` | loader | batch | RESEARCH.md Pattern 1 | research |
| `app/graphql/loaders/users_loader.rb` | loader | batch | RESEARCH.md Pattern 1 | research |
| `app/graphql/loaders/things_loader.rb` | loader | batch | RESEARCH.md Pattern 1 | research |
| `app/contracts/import_collection_contract.rb` | contract | validation | RESEARCH.md Pattern 2 | research |
| `app/contracts/validate_bgg_username_contract.rb` | contract | validation | RESEARCH.md Pattern 2 | research |
| `app/models/bgg_thing.rb` | model | CRUD | `app/models/bgg_thing.rb` | exact |
| `app/models/user.rb` | model | CRUD | `app/models/user.rb` | exact |
| `app/jobs/bgg/import_collection_job.rb` | job | event-driven | `app/jobs/bgg/import_collection_job.rb` | exact |
| `app/services/bgg/collection_persister.rb` | service | CRUD | `app/services/bgg/collection_persister.rb` | exact |
| `db/migrate/*_add_statistics_to_bgg_things.rb` | migration | schema | `db/migrate/20260703000001_create_bgg_things.rb` | role-match |
| `db/cable_schema.rb` | config/schema | event-driven | `db/cable_schema.rb` | exact |

### Frontend (Vue 3)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/frontend/router/index.ts` | config | request-response | `app/frontend/router/index.ts` | exact |
| `app/frontend/apollo/client.ts` | config | request-response / pub-sub | `app/frontend/apollo/client.ts` | exact |
| `app/frontend/components/AppShell.vue` | component | request-response | `app/frontend/App.vue` | role-match |
| `app/frontend/components/GameCard.vue` | component | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/components/GameGrid.vue` | component | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/components/FilterBar.vue` | component | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/components/Sidebar.vue` | component | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/components/MobileDrawer.vue` | component | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/components/SkeletonCard.vue` | component | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/components/SyncStatusBadge.vue` | component | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/views/HomeView.vue` | view | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/views/CollectionView.vue` | view | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/views/HotView.vue` | view | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/stores/filters.ts` | store | UI state | `app/frontend/entrypoints/application.ts` (Pinia setup) | role-match |
| `app/frontend/stores/sidebar.ts` | store | UI state | `app/frontend/entrypoints/application.ts` (Pinia setup) | role-match |
| `app/frontend/composables/useMergedCollection.ts` | composable | request-response | `app/frontend/views/HealthView.vue` | role-match |
| `app/frontend/composables/useSyncStatus.ts` | composable | pub-sub | `app/frontend/apollo/client.ts` | role-match |
| `app/frontend/composables/usePermalink.ts` | composable | transform | `bggeek-shared-list/src/utils/permalink.ts` | exact |
| `app/frontend/utils/sorting.ts` | utility | transform | `bggeek-shared-list/src/utils/sorting.ts` | exact |
| `app/frontend/utils/grouping.ts` | utility | transform | `bggeek-shared-list/src/utils/grouping.ts` | exact |
| `app/frontend/utils/memberColors.ts` | utility | transform | `bggeek-shared-list/src/utils/memberColors.ts` | exact |
| `app/frontend/utils/search.ts` | utility | transform | `bggeek-shared-list/src/utils/search.ts` | exact |
| `app/frontend/entrypoints/styles.css` | config | UI state | `app/frontend/entrypoints/styles.css` | exact |
| `config/vite.json` | config | build | `config/vite.json` | exact |
| `codegen.ts` | config | build | `codegen.ts` | exact |

## Pattern Assignments

### GraphQL Types

All new types follow the existing `Types::BaseObject` pattern.

**Analog:** `app/graphql/types/base_object.rb` (lines 1–9)

```ruby
# frozen_string_literal: true

module Types
  class BaseObject < GraphQL::Schema::Object
    edge_type_class(Types::BaseEdge)
    connection_type_class(Types::BaseConnection)
    field_class Types::BaseField
  end
end
```

**Pattern to follow:**
- Add `# frozen_string_literal: true` to every file.
- Nest under `module Types`.
- Inherit from `Types::BaseObject`.
- Use `field :name, Type, null: false` with explicit nullability and `description:`.
- For types backed by Active Record, expose AR columns; for computed fields, use a resolver method.

**Example — `ThingType`:**

```ruby
# app/graphql/types/thing_type.rb
# frozen_string_literal: true

module Types
  class ThingType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :year_published, Integer, null: true
    field :min_players, Integer, null: true
    field :max_players, Integer, null: true
    field :min_playtime, Integer, null: true
    field :max_playtime, Integer, null: true
    field :min_age, Integer, null: true
    field :image, String, null: true
    field :thumbnail, String, null: true
    field :description, String, null: true
    field :average, Float, null: true
    field :bayes_average, Float, null: true
    field :users_rated, Integer, null: true
    field :average_weight, Float, null: true
    field :is_expansion, Boolean, null: false
  end
end
```

**Enum analog:** `app/graphql/types/base_enum.rb` (lines 1–6)

```ruby
# frozen_string_literal: true

module Types
  class BaseEnum < GraphQL::Schema::Enum
  end
end
```

**Pattern to follow for `SyncStatusEnum`:**

```ruby
# app/graphql/types/sync_status_enum.rb
# frozen_string_literal: true

module Types
  class SyncStatusEnum < Types::BaseEnum
    value "QUEUED", "Import is queued"
    value "SYNCING", "Import is in progress"
    value "READY", "Import completed successfully"
    value "ERROR", "Import failed"
  end
end
```

---

### `app/graphql/types/query_type.rb` (resolver, request-response)

**Analog:** `app/graphql/types/query_type.rb` (lines 1–14)

```ruby
# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    field :health, String, null: false, description: "Health check — proves the GraphQL endpoint is alive."

    def health
      "ok"
    end
  end
end
```

**Pattern to follow:**
- Add root fields to `QueryType` directly (project uses simple resolvers, not separate resolver classes for basic fields).
- Use `argument :name, Type, required: true` for field arguments.
- For complex resolution, call service objects or model scopes.

**Example additions:**

```ruby
field :merged_collection, Types::MergedCollectionType, null: false do
  argument :usernames, [String], required: true
end

def merged_collection(usernames:)
  users = User.where(bgg_username: usernames)
  {
    items: BggThing.merged_for_bgg_usernames(usernames),
    sync_statuses: users.map { |u| sync_status_for(u) }
  }
end

field :hot_items, [Types::HotItemType], null: false

def hot_items
  # cached BGG hot list
  Bgg::Client.new.hot.map { |item| { ... } }
end

field :search, [Types::SearchResultType], null: false do
  argument :query, String, required: true
end

def search(query:)
  Bgg::Client.new.search(query).css("item").map { |item| { ... } }
end

field :user, Types::UserType, null: true do
  argument :username, String, required: true
end

def user(username:)
  User.find_by(bgg_username: username)
end
```

---

### `app/graphql/types/mutation_type.rb` (resolver, request-response)

**Analog:** `app/graphql/types/mutation_type.rb` (lines 1–12)

```ruby
# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # TODO: remove me
    field :test_field, String, null: false,
      description: "An example field added by the generator"
    def test_field
      "Hello World"
    end
  end
end
```

**Pattern to follow:**
- Remove the `test_field` stub.
- Use `Mutations::BaseMutation` subclasses or inline `field` + `argument` + `resolve`.
- Phase 3 uses contract-first mutations per D-06.

**Example — inline mutation pattern:**

```ruby
# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :import_collection, Types::ImportResultType, null: false do
      argument :username, String, required: true
    end

    def import_collection(username:)
      contract = ImportCollectionContract.new.call(username: username)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      job = Bgg::ImportCollectionJob.perform_later(username)
      { success: true, job_id: job.job_id }
    end

    field :validate_bgg_username, Types::ValidationResultType, null: false do
      argument :username, String, required: true
    end

    def validate_bgg_username(username:)
      contract = ValidateBggUsernameContract.new.call(username: username)
      return { valid: false, errors: contract.errors.to_h } if contract.failure?

      valid = Bgg::Client.new.user(username).at_css("user")&.attr("id").present?
      { valid: valid, errors: valid ? {} : { username: ["not found"] } }
    end
  end
end
```

---

### `app/graphql/types/subscription_type.rb` (resolver, pub-sub)

**Analog:** `app/graphql/types/query_type.rb` for structure; `BoardgameNightSchema` for `subscription(...)` wiring.

**Pattern to follow:**
- Create `Types::SubscriptionType < Types::BaseObject`.
- Use `field :collection_synced, Types::UserSyncStatusType, null: false` with argument `username`.
- Wire in `BoardgameNightSchema` via `subscription(Types::SubscriptionType)`.

**Example:**

```ruby
# app/graphql/types/subscription_type.rb
# frozen_string_literal: true

module Types
  class SubscriptionType < Types::BaseObject
    field :collection_synced, Types::UserSyncStatusType, null: false do
      argument :username, String, required: true
    end
  end
end
```

**Wire to schema in `app/graphql/boardgame_night_schema.rb`:**

```ruby
class BoardgameNightSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)
  subscription(Types::SubscriptionType)
  use GraphQL::Dataloader
  # ...
end
```

---

### `app/graphql/loaders/owners_loader.rb` (loader, batch)

**Analog:** RESEARCH.md Pattern 1 (lines 311–331)

```ruby
class Loaders::OwnersLoader < GraphQL::Dataloader::Source
  def fetch(thing_ids)
    # Returns an array of owners arrays in the same order as thing_ids
    owners_by_thing_id = BggCollection
      .where(bgg_thing_id: thing_ids)
      .includes(:user)
      .group_by(&:bgg_thing_id)

    thing_ids.map { |id| owners_by_thing_id[id] || [] }
  end
end
```

**Pattern to follow:**
- Inherit from `GraphQL::Dataloader::Source`.
- Implement `fetch(keys)` returning results in the same order as `keys`.
- Use `includes(:user)` to avoid N+1.
- Load in `MergedThingType` resolver: `dataloader.with(Loaders::OwnersLoader).load(object.id)`.

**Example:**

```ruby
# app/graphql/loaders/owners_loader.rb
# frozen_string_literal: true

module Loaders
  class OwnersLoader < GraphQL::Dataloader::Source
    def fetch(thing_ids)
      collections = BggCollection
        .where(bgg_thing_id: thing_ids)
        .includes(:user)
        .group_by(&:bgg_thing_id)

      thing_ids.map { |id| collections[id] || [] }
    end
  end
end
```

---

### `app/graphql/loaders/users_loader.rb` (loader, batch)

**Analog:** `app/graphql/loaders/owners_loader.rb` pattern (same Dataloader Source shape).

**Pattern to follow:**
- Batch `User` lookups by `bgg_username`.

**Example:**

```ruby
# app/graphql/loaders/users_loader.rb
# frozen_string_literal: true

module Loaders
  class UsersLoader < GraphQL::Dataloader::Source
    def fetch(usernames)
      users_by_username = User.where(bgg_username: usernames).index_by(&:bgg_username)
      usernames.map { |username| users_by_username[username] }
    end
  end
end
```

---

### `app/graphql/loaders/things_loader.rb` (loader, batch)

**Analog:** `app/graphql/loaders/owners_loader.rb` pattern.

**Pattern to follow:**
- Batch `BggThing` lookups by `objectid` or ID.

**Example:**

```ruby
# app/graphql/loaders/things_loader.rb
# frozen_string_literal: true

module Loaders
  class ThingsLoader < GraphQL::Dataloader::Source
    def fetch(objectids)
      things_by_objectid = BggThing.where(objectid: objectids).index_by(&:objectid)
      objectids.map { |id| things_by_objectid[id] }
    end
  end
end
```

---

### `app/contracts/import_collection_contract.rb` (contract, validation)

**Analog:** RESEARCH.md Pattern 2 (lines 341–373)

```ruby
class ApplicationContract < Dry::Rails::Contract
  config.messages.backend = :i18n
end

class ImportCollectionContract < ApplicationContract
  params do
    required(:username).filled(:string, max_size?: 50)
    optional(:force).value(:bool)
  end
end
```

**Pattern to follow:**
- Create `ApplicationContract < Dry::Rails::Contract` once in `app/contracts/application_contract.rb`.
- Use `params` block with `required(...).filled(...)` and `optional(...).value(...)`.
- Keep domain rules minimal (max length, format, etc.).

**Example:**

```ruby
# app/contracts/application_contract.rb
# frozen_string_literal: true

class ApplicationContract < Dry::Rails::Contract
  config.messages.backend = :i18n
end
```

```ruby
# app/contracts/import_collection_contract.rb
# frozen_string_literal: true

class ImportCollectionContract < ApplicationContract
  BGG_USERNAME_FORMAT = /\A[a-zA-Z0-9_\-]+\z/.freeze

  params do
    required(:username).filled(:string, max_size?: 50, format?: BGG_USERNAME_FORMAT)
  end
end
```

---

### `app/contracts/validate_bgg_username_contract.rb` (contract, validation)

**Analog:** `app/contracts/import_collection_contract.rb` pattern.

**Example:**

```ruby
# app/contracts/validate_bgg_username_contract.rb
# frozen_string_literal: true

class ValidateBggUsernameContract < ApplicationContract
  BGG_USERNAME_FORMAT = /\A[a-zA-Z0-9_\-]+\z/.freeze

  params do
    required(:username).filled(:string, max_size?: 50, format?: BGG_USERNAME_FORMAT)
  end
end
```

---

### `app/models/bgg_thing.rb` (model, CRUD)

**Analog:** `app/models/bgg_thing.rb` (lines 1–15)

```ruby
# frozen_string_literal: true

class BggThing < ApplicationRecord
  has_many :bgg_collections, dependent: :destroy
  has_many :users, through: :bgg_collections

  validates :objectid, presence: true, uniqueness: true
  validates :name, presence: true

  scope :merged_for_users, ->(user_ids) {
    joins(:bgg_collections)
      .where(bgg_collections: { user_id: user_ids })
      .distinct
  }
end
```

**Pattern to follow:**
- Add statistics columns via migration first.
- Add a new scope `merged_for_bgg_usernames` that joins through `bgg_collections` → `users` and filters by `users.bgg_username`.

**Example modifications:**

```ruby
class BggThing < ApplicationRecord
  has_many :bgg_collections, dependent: :destroy
  has_many :users, through: :bgg_collections

  validates :objectid, presence: true, uniqueness: true
  validates :name, presence: true

  scope :merged_for_users, ->(user_ids) {
    joins(:bgg_collections)
      .where(bgg_collections: { user_id: user_ids })
      .distinct
  }

  scope :merged_for_bgg_usernames, ->(bgg_usernames) {
    joins(:bgg_collections, :users)
      .where(users: { bgg_username: bgg_usernames })
      .distinct
  }
end
```

---

### `app/models/user.rb` (model, CRUD)

**Analog:** `app/models/user.rb` (lines 1–10)

```ruby
# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
end
```

**Pattern to follow:**
- Add `bgg_avatar_url` column via migration (per RESEARCH.md Open Question 1 recommendation).
- Keep existing validations; add uniqueness on `bgg_username` if desired.

**Example modifications:**

```ruby
class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
  validates :bgg_username, uniqueness: true, allow_nil: true
end
```

---

### `app/jobs/bgg/import_collection_job.rb` (job, event-driven)

**Analog:** `app/jobs/bgg/import_collection_job.rb` (lines 1–78)

```ruby
# frozen_string_literal: true

class Bgg::ImportCollectionJob < ApplicationJob
  queue_as :bgg_imports

  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  retry_on Faraday::TimeoutError, wait: :polynomially_longer, attempts: 5
  retry_on Faraday::ServerError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::CollectionNotReadyError, wait: 30.seconds, attempts: 3

  discard_on Faraday::ResourceNotFound
  discard_on Bgg::InvalidUsernameError
  discard_on ActiveJob::DeserializationError

  def perform(username)
    validate_user!(username)
    collection = Bgg::CollectionFetcher.new.fetch(username)
    user = User.find_by(bgg_username: username)
    if user
      result = Bgg::CollectionPersister.new(user: user).persist_collection!(collection)
      Rails.logger.info("[Bgg::ImportCollectionJob] Successfully imported #{result[:added]} games, " \
                        "#{result[:updated]} updated for '#{username}'")
    else
      Rails.logger.warn("[Bgg::ImportCollectionJob] Collection fetched for '#{username}' " \
                        "but no local user record found — skipping persist")
    end
  end

  private

  def validate_user!(username)
    client = Bgg::Client.new
    user_doc = client.user(username)
    user_node = user_doc.at_css("user")
    if user_node.nil? || user_node.attr("id").to_s.empty?
      raise Bgg::InvalidUsernameError,
        "BGG user '#{username}' not found or invalid"
    end
  end
end
```

**Pattern to follow:**
- Add broadcast calls at each lifecycle stage.
- Use `BoardgameNightSchema.subscriptions.trigger(:collection_synced, { username: username }, payload)`.
- Delete duplicate `app/jobs/import_collection_job.rb`.

**Example modifications:**

```ruby
def perform(username)
  broadcast(username, :SYNCING)
  validate_user!(username)

  collection = Bgg::CollectionFetcher.new.fetch(username)
  user = User.find_or_initialize_by(bgg_username: username)
  user.username ||= username
  user.save!

  result = Bgg::CollectionPersister.new(user: user).persist_collection!(collection)
  broadcast(username, :READY, game_count: result[:added] + result[:updated])
rescue Bgg::InvalidUsernameError, Faraday::ResourceNotFound => e
  broadcast(username, :ERROR, error: e.message)
  raise e # let discard_on handle it
rescue => e
  broadcast(username, :ERROR, error: e.message)
  raise e # retry logic applies
end

private

def broadcast(username, status, error: nil, game_count: nil)
  BoardgameNightSchema.subscriptions.trigger(
    :collection_synced,
    { username: username },
    {
      username: username,
      status: status,
      last_synced_at: status == :READY ? Time.current : nil,
      error: error,
      game_count: game_count
    }
  )
end
```

---

### `app/services/bgg/collection_persister.rb` (service, CRUD)

**Analog:** `app/services/bgg/collection_persister.rb` (lines 1–63)

```ruby
# frozen_string_literal: true

module Bgg
  class CollectionPersister
    attr_reader :client, :user

    def initialize(client: Bgg::Client.new, user:)
      @client = client
      @user = user
    end

    def fetch_and_persist!(bgg_username: user.bgg_username)
      raise ArgumentError, "User has no bgg_username" unless bgg_username

      collection_xml = client.collection(bgg_username)
      collection = Bgg::Normalizer.normalize_collection(collection_xml)

      persist_collection!(collection)
    end

    def persist_collection!(normalized_items)
      result = { added: 0, updated: 0, errors: [] }

      normalized_items.each do |item|
        begin
          thing = upsert_thing!(item)
          BggCollection.find_or_create_by!(user: user, bgg_thing: thing) do |col|
            col.quantity = item[:quantity] || 1
            result[:added] += 1
          end
        rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique => e
          result[:errors] << { objectid: item[:id], error: e.message }
        end
      end

      result
    end

    private

    def upsert_thing!(item)
      thing = BggThing.find_or_initialize_by(objectid: item[:id])
      thing.assign_attributes(
        name: item[:name],
        year_published: item[:year_published],
        min_players: item[:stats]&.[](:min_players),
        max_players: item[:stats]&.[](:max_players),
        playing_time: item[:stats]&.[](:playing_time),
        min_playtime: item[:stats]&.[](:min_playtime),
        max_playtime: item[:stats]&.[](:max_playtime),
        image: item[:image],
        thumbnail: item[:thumbnail],
        description: item[:description]
      )
      thing.save! if thing.changed?
      thing
    end
  end
end
```

**Pattern to follow:**
- Add statistics columns to `upsert_thing!` assignment from `item[:stats]`.
- Update `added`/`updated` counts: `find_or_create_by!` currently increments `added` on create; consider updating `updated` when the thing already exists.

**Example modifications to `upsert_thing!`:**

```ruby
def upsert_thing!(item)
  thing = BggThing.find_or_initialize_by(objectid: item[:id])
  thing.assign_attributes(
    name: item[:name],
    year_published: item[:year_published],
    min_players: item[:stats]&.[](:min_players),
    max_players: item[:stats]&.[](:max_players),
    playing_time: item[:stats]&.[](:playing_time),
    min_playtime: item[:stats]&.[](:min_playtime),
    max_playtime: item[:stats]&.[](:max_playtime),
    image: item[:image],
    thumbnail: item[:thumbnail],
    description: item[:description],
    average: item[:stats]&.[](:rating)&.to_f,
    bayes_average: item[:stats]&.[](:bayes_average)&.to_f,
    users_rated: item[:stats]&.[](:users_rated),
    average_weight: item[:stats]&.[](:average_weight)&.to_f,
    num_comments: item[:stats]&.[](:num_comments)
  )
  thing.save! if thing.changed?
  thing
end
```

---

### Migration: `db/migrate/*_add_statistics_to_bgg_things.rb` (migration, schema)

**Analog:** `db/migrate/20260703000001_create_bgg_things.rb` (lines 1–23)

```ruby
# frozen_string_literal: true

class CreateBggThings < ActiveRecord::Migration[8.0]
  def change
    create_table :bgg_things do |t|
      t.integer :objectid, null: false
      t.string :name, null: false
      t.integer :year_published
      t.integer :min_players
      t.integer :max_players
      t.integer :playing_time
      t.integer :min_playtime
      t.integer :max_playtime
      t.integer :min_age
      t.string :image
      t.string :thumbnail
      t.text :description
      t.timestamps
    end
    add_index :bgg_things, :objectid, unique: true
    add_index :bgg_things, :name
  end
end
```

**Pattern to follow:**
- Use `ActiveRecord::Migration[8.0]`.
- Add `change_table` or `add_column` calls.
- Add `bgg_avatar_url` to `users` in the same or separate migration.

**Example:**

```ruby
# frozen_string_literal: true

class AddStatisticsToBggThings < ActiveRecord::Migration[8.0]
  def change
    change_table :bgg_things do |t|
      t.decimal :average, precision: 10, scale: 6
      t.decimal :bayes_average, precision: 10, scale: 6
      t.integer :users_rated
      t.decimal :average_weight, precision: 10, scale: 6
      t.integer :num_comments
    end

    add_column :users, :bgg_avatar_url, :string
    add_index :users, :bgg_username
  end
end
```

---

### `db/cable_schema.rb` (config/schema, event-driven)

**Analog:** `db/cable_schema.rb` (lines 1–14)

```ruby
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.

ActiveRecord::Schema[8.1].define(version: 0) do
end
```

**Pattern to follow:**
- Run `bin/rails solid_cable:install` to generate the schema.
- Do not hand-edit; commit the generated file.

**Expected result after install:**

```ruby
ActiveRecord::Schema[8.1].define(version: 2026_07_07_000000) do
  create_table "solid_cable_messages", force: :cascade do |t|
    t.binary "channel", limit: 1024, null: false
    t.binary "payload", limit: 536870912, null: false
    t.datetime "created_at", null: false
    t.integer "channel_hash", limit: 8, null: false
    t.index ["channel_hash"], name: "index_solid_cable_messages_on_channel_hash"
    t.index ["created_at"], name: "index_solid_cable_messages_on_created_at"
  end
end
```

---

### `app/frontend/router/index.ts` (config, request-response)

**Analog:** `app/frontend/router/index.ts` (lines 1–14)

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'health',
      component: () => import('../views/HealthView.vue')
    }
  ]
})

export default router
```

**Pattern to follow:**
- Use `createWebHistory()`.
- Lazy-load views with `() => import('../views/ViewName.vue')`.
- Preserve the root `/` route (replace `HealthView` with `HomeView`).

**Example modifications:**

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('../views/CollectionView.vue')
    },
    {
      path: '/hot',
      name: 'hot',
      component: () => import('../views/HotView.vue')
    }
  ]
})

export default router
```

---

### `app/frontend/apollo/client.ts` (config, request-response / pub-sub)

**Analog:** `app/frontend/apollo/client.ts` (lines 1–14)

```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { BatchHttpLink } from '@apollo/client/link/batch-http'

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 50,
  batchMax: 25,
})

export const apolloClient = new ApolloClient({
  link: batchLink,
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
```

**Pattern to follow:**
- Keep the existing `BatchHttpLink` for queries/mutations.
- Add `ActionCableLink` for subscriptions and route via `split`.

**Example modifications:**

```typescript
import { ApolloClient, InMemoryCache, split } from '@apollo/client/core'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { createConsumer } from '@rails/actioncable'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 50,
  batchMax: 25,
})

const cable = createConsumer('/cable')
const actionCableLink = new ActionCableLink({ cable })

const isSubscription = ({ query }: any) =>
  query.definitions.some(
    (def: any) => def.kind === 'OperationDefinition' && def.operation === 'subscription'
  )

const link = split(isSubscription, actionCableLink, batchLink)

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
```

---

### `app/frontend/components/AppShell.vue` (component, request-response)

**Analog:** `app/frontend/App.vue` (lines 1–11)

```vue
<script setup lang="ts">
// Shell component — minimal centered layout with RouterView
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center p-8">
    <main class="w-full max-w-xl">
      <RouterView />
    </main>
  </div>
</template>
```

**Pattern to follow:**
- Replace `App.vue` centered layout with sidebar + topbar shell.
- Use Tailwind v4 CSS-first utilities.
- Provide mobile drawer state via Pinia `uiStore`.

**Example structure:**

```vue
<script setup lang="ts">
import AppTopbar from './AppTopbar.vue'
import AppSidebar from './AppSidebar.vue'
import MobileDrawer from './MobileDrawer.vue'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex flex-col">
    <AppTopbar />
    <div class="flex flex-1 pt-14">
      <AppSidebar class="hidden md:block" />
      <MobileDrawer v-model="ui.sidebarOpen" class="md:hidden" />
      <main class="flex-1 p-4 md:p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
```

---

### `app/frontend/components/GameCard.vue` (component, request-response)

**Analog:** `app/frontend/views/HealthView.vue` for Vue SFC structure (lines 1–32).

**Pattern to follow:**
- Use `<script setup lang="ts">`.
- Props interface with typed fields.
- Tailwind for layout; no `v-html` for BGG descriptions.

**Example props interface and usage:**

```vue
<script setup lang="ts">
import MemberAvatar from './MemberAvatar.vue'

interface Owner { username: string }

interface Props {
  id: string
  name: string
  thumbnail?: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  minPlaytime?: number
  maxPlaytime?: number
  averageRating?: number
  averageWeight?: number
  owners: Owner[]
}

const props = defineProps<Props>()

function openBgg() {
  window.open(`https://boardgamegeek.com/boardgame/${props.id}`, '_blank')
}
</script>

<template>
  <article
    class="bg-white rounded-lg border border-neutral-200 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-200 cursor-pointer"
    @click="openBgg"
  >
    <img
      v-if="thumbnail"
      :src="thumbnail"
      :alt="name"
      class="w-full aspect-[4/3] object-cover bg-neutral-100"
    />
    <div v-else class="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center text-neutral-400 text-sm">
      No image
    </div>
    <div class="p-3">
      <h3 class="text-sm font-semibold line-clamp-2 leading-tight" :title="name">{{ name }}</h3>
      <p class="text-xs text-neutral-500 mt-1">{{ yearPublished }} · {{ minPlayers }}–{{ maxPlayers }} players · {{ minPlaytime }}–{{ maxPlaytime }} min</p>
      <div class="flex items-center gap-2 mt-2">
        <span v-if="averageRating" class="text-xs font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{{ averageRating.toFixed(1) }}</span>
        <span v-if="averageWeight" class="text-xs font-medium bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">{{ averageWeight.toFixed(1) }}</span>
      </div>
      <div class="flex -space-x-1 mt-2">
        <MemberAvatar v-for="owner in owners" :key="owner.username" :username="owner.username" size="xs" />
      </div>
    </div>
  </article>
</template>
```

---

### `app/frontend/components/GameGrid.vue` (component, request-response)

**Analog:** `app/frontend/views/HealthView.vue` for conditional rendering pattern.

**Pattern to follow:**
- Accept `games` array and `loading` boolean.
- Render skeleton cards when loading.

**Example:**

```vue
<script setup lang="ts">
import GameCard from './GameCard.vue'
import SkeletonCard from './SkeletonCard.vue'
import type { MergedThing } from '../generated/operations'

interface Props {
  games: MergedThing[]
  loading?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
    <template v-if="!loading">
      <GameCard v-for="game in games" :key="game.id" v-bind="game" />
    </template>
    <SkeletonCard v-for="i in 12" v-else :key="i" />
  </div>
</template>
```

---

### `app/frontend/components/SkeletonCard.vue` (component, request-response)

**Analog:** HealthView loading spinner (lines 10–15) for `animate-pulse` usage.

**Pattern to follow:**
- Match `GameCard` dimensions (180px min, 4:3 image area, text rows).

**Example:**

```vue
<template>
  <div class="bg-white rounded-lg border border-neutral-200 overflow-hidden animate-pulse">
    <div class="w-full aspect-[4/3] bg-neutral-200" />
    <div class="p-3 space-y-2">
      <div class="h-4 bg-neutral-200 rounded w-3/4" />
      <div class="h-3 bg-neutral-200 rounded w-1/2" />
      <div class="flex gap-2">
        <div class="h-5 w-8 bg-neutral-200 rounded" />
        <div class="h-5 w-8 bg-neutral-200 rounded" />
      </div>
    </div>
  </div>
</template>
```

---

### `app/frontend/components/SyncStatusBadge.vue` (component, request-response)

**Pattern to follow:**
- Map enum values to Tailwind color classes from UI-SPEC §4.

**Example:**

```vue
<script setup lang="ts">
import type { SyncStatus } from '../generated/operations'

const props = defineProps<{ status: SyncStatus }>()

const config: Record<SyncStatus, { label: string; classes: string }> = {
  QUEUED: { label: 'Queued', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  SYNCING: { label: 'Syncing…', classes: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse' },
  READY: { label: 'Ready', classes: 'bg-green-100 text-green-800 border-green-200' },
  ERROR: { label: 'Failed', classes: 'bg-red-100 text-red-800 border-red-200' }
}
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border" :class="config[props.status].classes">
    {{ config[props.status].label }}
  </span>
</template>
```

---

### `app/frontend/views/HomeView.vue` (view, request-response)

**Analog:** `app/frontend/views/HealthView.vue` (lines 1–32).

**Pattern to follow:**
- Use generated `useHotItemsQuery`.
- Provide username input and navigate to `/collection?usernames=...`.

**Example structure:**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHotItemsQuery } from '../generated/operations'

const router = useRouter()
const input = ref('')
const { result, loading } = useHotItemsQuery()

function submit() {
  const usernames = input.value.split(',').map(s => s.trim()).filter(Boolean)
  if (!usernames.length) return
  router.push({ path: '/collection', query: { usernames: usernames.join(',') } })
}
</script>

<template>
  <div class="max-w-2xl mx-auto text-center py-16">
    <h1 class="text-3xl font-bold mb-4">Find the perfect game for your next board game night</h1>
    <p class="text-base text-neutral-600 mb-8">Merge your BoardGameGeek collections, filter by players and time, and pick what to play.</p>
    <form @submit.prevent="submit" class="flex gap-2 justify-center">
      <input v-model="input" placeholder="Enter BGG usernames, comma separated" class="..." />
      <button type="submit" class="bg-accent text-white px-4 py-2 rounded">Merge Collections</button>
    </form>
    <HotGamesGrid :games="result?.hotItems ?? []" :loading="loading" />
  </div>
</template>
```

---

### `app/frontend/views/CollectionView.vue` (view, request-response / pub-sub)

**Analog:** `app/frontend/views/HealthView.vue` for query usage.

**Pattern to follow:**
- Read `usernames` from route query.
- Call `useMergedCollection` composable.
- Subscribe to `collectionSynced` per username via `useSyncStatus`.
- Bind filter state to Pinia `filterStore`.

**Example structure:**

```vue
<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFilterStore } from '../stores/filters'
import { useMergedCollection } from '../composables/useMergedCollection'
import { useSyncStatus } from '../composables/useSyncStatus'
import GameGrid from '../components/GameGrid.vue'
import FilterBar from '../components/FilterBar.vue'

const route = useRoute()
const filters = useFilterStore()

const usernames = computed(() =>
  String(route.query.usernames ?? '').split(',').map(s => s.trim()).filter(Boolean)
)

const { result, loading, error } = useMergedCollection(usernames)
useSyncStatus(usernames)

watch(() => route.query, () => filters.hydrateFromUrl(route.query), { immediate: true })
</script>

<template>
  <div>
    <FilterBar />
    <GameGrid :games="result?.mergedCollection.items ?? []" :loading="loading" />
  </div>
</template>
```

---

### `app/frontend/views/HotView.vue` (view, request-response)

**Analog:** `HealthView.vue` for `useQuery` pattern.

**Pattern to follow:**
- Use `useHotItemsQuery` generated composable.
- Render a thumbnail grid.

---

### `app/frontend/stores/filters.ts` (store, UI state)

**Analog:** `app/frontend/entrypoints/application.ts` for Pinia setup (lines 1–13).

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// ...
const app = createApp(App)
app.use(createPinia())
```

**Pattern to follow:**
- Use setup-store style: `defineStore('filters', () => { ... })`.
- Use `@vueuse/core` `useStorage` for persistence.
- Never store server data.

**Example:**

```typescript
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export type SortOption = 'name_asc' | 'name_desc' | 'rating_asc' | 'rating_desc' | 'year_asc' | 'year_desc' | 'complexity_asc' | 'complexity_desc'
export type GroupOption = 'none' | 'players' | 'rating' | 'bestPlayers'

export const useFilterStore = defineStore('filters', () => {
  const usernames = ref<string[]>([])
  const selectedOwners = ref<Set<string>>(new Set())
  const query = ref('')
  const players = ref<number | null>(null)
  const timeBucket = ref<number | null>(null)
  const complexityBucket = ref<number | null>(null)
  const sort = useStorage<SortOption>('bg-filter-sort', 'name_asc')
  const group = useStorage<GroupOption>('bg-filter-group', 'none')

  function hydrateFromUrl(params: Record<string, unknown>) {
    // ... decode from URLSearchParams
  }

  function encodeToUrl(): URLSearchParams {
    // ... encode omitting defaults
  }

  return {
    usernames, selectedOwners, query, players, timeBucket, complexityBucket, sort, group,
    hydrateFromUrl, encodeToUrl
  }
})
```

---

### `app/frontend/stores/sidebar.ts` (store, UI state)

**Analog:** Same Pinia setup-store pattern as `filters.ts`.

**Example:**

```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const collapsedSections = ref<Record<string, boolean>>({})
  const collapsedGroups = ref<Set<string>>(new Set())

  function toggleSection(name: string) {
    collapsedSections.value[name] = !collapsedSections.value[name]
  }

  return { sidebarOpen, collapsedSections, collapsedGroups, toggleSection }
})
```

---

### `app/frontend/composables/useMergedCollection.ts` (composable, request-response)

**Analog:** `app/frontend/views/HealthView.vue` for `useHealthQuery` usage (lines 1–5).

```typescript
import { useHealthQuery } from '../generated/operations'

const { result, loading, error } = useHealthQuery()
```

**Pattern to follow:**
- Use generated `useMergedCollectionQuery`.
- Pass reactive variables.
- Use `cache-and-network` or `cache-first` fetch policy.

**Example:**

```typescript
import { computed, type Ref } from 'vue'
import { useMergedCollectionQuery } from '../generated/operations'

export function useMergedCollection(usernames: Ref<string[]>) {
  const variables = computed(() => ({
    usernames: usernames.value
  }))

  return useMergedCollectionQuery(variables, () => ({
    fetchPolicy: 'cache-and-network'
  }))
}
```

---

### `app/frontend/composables/useSyncStatus.ts` (composable, pub-sub)

**Pattern to follow:**
- Use generated `useCollectionSyncedSubscription`.
- Subscribe once per username.

**Example:**

```typescript
import { watch, type Ref } from 'vue'
import { useCollectionSyncedSubscription } from '../generated/operations'

export function useSyncStatus(usernames: Ref<string[]>) {
  watch(usernames, (names) => {
    names.forEach(username => {
      useCollectionSyncedSubscription(() => ({ username }))
    })
  }, { immediate: true })
}
```

---

### `app/frontend/composables/usePermalink.ts` (composable, transform)

**Analog:** `bggeek-shared-list/src/utils/permalink.ts` (lines 1–58).

```typescript
export function generatePermalink(usernames: string[]): string {
  if (usernames.length === 0) return "/collection";
  const encodedUsernames = usernames
    .map(username => encodeURIComponent(username.trim()))
    .join(",");
  return `/collection?usernames=${encodedUsernames}`;
}

export function parseUsernamesFromUrl(
  usernames: string | string[] | undefined
): string[] {
  if (!usernames) return [];
  const usernamesString = Array.isArray(usernames) ? usernames[0] : usernames;
  return usernamesString
    .split(",")
    .map(username => decodeURIComponent(username.trim()))
    .filter(username => username.length > 0);
}
```

**Pattern to follow:**
- Extend to encode/decode full filter state per UI-SPEC §6.
- Use `URLSearchParams` for encode/decode.

**Example:**

```typescript
import type { Filters } from '../stores/filters'

export function encodePermalink(usernames: string[], filters: Filters): string {
  const params = new URLSearchParams()
  if (usernames.length) params.set('usernames', usernames.join(','))
  if (filters.query) params.set('q', filters.query)
  if (filters.players) params.set('players', String(filters.players))
  if (filters.timeBucket) params.set('time', String(filters.timeBucket))
  if (filters.complexityBucket) params.set('complexity', String(filters.complexityBucket))
  if (filters.sort !== 'name_asc') params.set('sort', filters.sort)
  if (filters.group !== 'none') params.set('group', filters.group)
  if (filters.selectedOwners.size && filters.selectedOwners.size !== usernames.length) {
    params.set('owners', [...filters.selectedOwners].join(','))
  }
  return `/collection?${params.toString()}`
}

export function decodePermalink(search: string): { usernames: string[]; filters: Partial<Filters> } {
  const params = new URLSearchParams(search)
  return {
    usernames: params.get('usernames')?.split(',').filter(Boolean) ?? [],
    filters: {
      query: params.get('q') ?? '',
      players: Number(params.get('players')) || null,
      timeBucket: Number(params.get('time')) || null,
      complexityBucket: Number(params.get('complexity')) || null,
      sort: (params.get('sort') as any) ?? 'name_asc',
      group: (params.get('group') as any) ?? 'none',
      selectedOwners: new Set(params.get('owners')?.split(',').filter(Boolean) ?? [])
    }
  }
}
```

---

### `app/frontend/utils/sorting.ts` (utility, transform)

**Analog:** `bggeek-shared-list/src/utils/sorting.ts` (lines 1–67).

```typescript
export const sortGames = (
  games: ICollectionItem[],
  sortBy: SortOption
): ICollectionItem[] => {
  const sortedGames = [...games];

  switch (sortBy) {
    case "name_asc":
      return sortedGames.sort((a, b) => {
        const nameA =
          typeof a.name === "string" ? a.name : (a.name as any)?.text || "";
        const nameB =
          typeof b.name === "string" ? b.name : (b.name as any)?.text || "";
        return nameA.localeCompare(nameB);
      });

    // ... rating, year comparators
  }
};
```

**Pattern to follow:**
- Add `complexity_asc` / `complexity_desc` using `averageWeight`.
- Simplify name handling (our `MergedThing.name` is always a string).

**Example:**

```typescript
import type { MergedThing } from '../generated/operations'

export type SortOption = 'name_asc' | 'name_desc' | 'rating_asc' | 'rating_desc' | 'year_asc' | 'year_desc' | 'complexity_asc' | 'complexity_desc'

export function sortGames(games: MergedThing[], sortBy: SortOption): MergedThing[] {
  const sorted = [...games]
  switch (sortBy) {
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case 'rating_asc':
      return sorted.sort((a, b) => (a.average ?? 0) - (b.average ?? 0))
    case 'rating_desc':
      return sorted.sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
    case 'year_asc':
      return sorted.sort((a, b) => (a.yearPublished ?? 0) - (b.yearPublished ?? 0))
    case 'year_desc':
      return sorted.sort((a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0))
    case 'complexity_asc':
      return sorted.sort((a, b) => (a.averageWeight ?? 0) - (b.averageWeight ?? 0))
    case 'complexity_desc':
      return sorted.sort((a, b) => (b.averageWeight ?? 0) - (a.averageWeight ?? 0))
    default:
      return sorted
  }
}
```

---

### `app/frontend/utils/grouping.ts` (utility, transform)

**Analog:** `bggeek-shared-list/src/utils/grouping.ts` (lines 1–174).

**Pattern to follow:**
- Port `groupGamesByPlayers`, `groupGamesByRating`, `groupGamesByBestPlayers`.
- Use `MergedThing` fields directly (`minPlayers`, `maxPlayers`, `average`).

---

### `app/frontend/utils/memberColors.ts` (utility, transform)

**Analog:** `bggeek-shared-list/src/utils/memberColors.ts` (lines 1–46).

```typescript
const MEMBER_COLORS = [
  { bg: "blue.500", color: "white" },
  // ...
];

export function getMemberColor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % MEMBER_COLORS.length;
  return MEMBER_COLORS[index];
}
```

**Pattern to follow:**
- Convert Chakra token names (`blue.500`) to Tailwind class names (`bg-blue-500`, `text-white`).
- Keep the hash algorithm identical.

**Example:**

```typescript
const PALETTE = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-green-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-red-500', text: 'text-white' },
  { bg: 'bg-yellow-500', text: 'text-black' },
  { bg: 'bg-cyan-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-lime-500', text: 'text-black' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-sky-500', text: 'text-white' }
]

export function getMemberColor(username: string) {
  let hash = 0
  for (const char of username) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash = hash & hash
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function getMemberInitial(username: string): string {
  return username.charAt(0).toUpperCase()
}
```

---

### `app/frontend/utils/search.ts` (utility, transform)

**Analog:** `bggeek-shared-list/src/utils/search.ts` (lines 1–79).

**Pattern to follow:**
- Port `filterByNumPlayers` and `filterByPlayingTime`.
- Add `filterByComplexity` bucket.
- Expose Fuse.js config for `useFuse`.

**Example:**

```typescript
import type { MergedThing } from '../generated/operations'

export function filterByNumPlayers(games: MergedThing[], players: number | null) {
  if (!players) return games
  return games.filter(g => (g.minPlayers ?? 0) <= players && players <= (g.maxPlayers ?? 99))
}

export function filterByPlayingTime(games: MergedThing[], bucket: number | null) {
  if (!bucket) return games
  return games.filter(g => {
    const max = g.maxPlaytime ?? 0
    switch (bucket) {
      case 1: return max <= 30
      case 2: return max > 30 && max <= 60
      case 3: return max > 60 && max <= 120
      case 4: return max > 120 && max <= 180
      case 5: return max > 180 && max <= 240
      case 6: return max > 240
      default: return false
    }
  })
}

export function filterByComplexity(games: MergedThing[], bucket: number | null) {
  if (!bucket) return games
  return games.filter(g => {
    const weight = g.averageWeight ?? 0
    switch (bucket) {
      case 1: return weight <= 2
      case 2: return weight > 2 && weight <= 3
      case 3: return weight > 3 && weight <= 4
      case 4: return weight > 4
      default: return false
    }
  })
}

export const FUSE_OPTIONS = {
  keys: ['name', 'name.text', 'originalname'],
  threshold: 0.3,
  isCaseSensitive: false
}
```

---

### `app/frontend/entrypoints/styles.css` (config, UI state)

**Analog:** `app/frontend/entrypoints/styles.css` (lines 1–8).

```css
@import "tailwindcss";

@theme {
  --color-accent: #4f46e5;
  --color-destructive: #dc2626;
}
```

**Pattern to follow:**
- Extend `@theme` with owner palette and semantic colors.
- Keep `@import "tailwindcss"` at the top.

**Example additions:**

```css
@import "tailwindcss";

@theme {
  --color-accent: #4f46e5;
  --color-destructive: #dc2626;

  /* Owner palette */
  --color-owner-blue: #3b82f6;
  --color-owner-green: #22c55e;
  /* ... additional owner colors if needed as tokens */
}
```

---

### `config/vite.json` (config, build)

**Analog:** `config/vite.json` (lines 1–17).

```json
{
  "all": {
    "sourceCodeDir": "app/frontend",
    "watchAdditionalPaths": []
  },
  "development": {
    "autoBuild": false,
    "skipProxy": false,
    "publicOutputDir": "",
    "port": 5173
  },
  "test": {
    "autoBuild": true,
    "publicOutputDir": "vite-test",
    "port": 5174
  }
}
```

**Pattern to follow:**
- No changes required for Tailwind v4 (it uses Vite plugin in `vite.config.ts`); verify `skipProxy` is acceptable or set to `true` per PITFALLS.md #9.

---

### `codegen.ts` (config, build)

**Analog:** `codegen.ts` (lines 1–13).

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['app/frontend/**/*.graphql'],
  generates: {
    'app/frontend/generated/operations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-vue-apollo']
    }
  }
}

export default config
```

**Pattern to follow:**
- Add new `.graphql` files under `app/frontend/apollo/{queries,mutations,subscriptions}/`.
- Ensure `rails graphql:schema:dump` runs before `npm run codegen` in CI.

---

## Shared Patterns

### Authentication

Not applicable in Phase 3 (deferred to Phase 4). No auth guards needed.

### GraphQL Error Handling

**Source:** `app/controllers/graphql_controller.rb` (lines 31–38).

```ruby
rescue StandardError => e
  logger.error "[GraphqlController] #{e.message}"
  logger.error e.backtrace.first(10).join("\n")
  render json: {
    errors: [{ message: "Internal server error" }],
    data: {}
  }, status: 500
```

**Apply to:** `GraphqlController` modification.

**Pattern:** Rescue `GraphQL::ExecutionError` separately so validation errors return HTTP 200 with GraphQL `errors` array. Only unexpected errors become 500.

```ruby
rescue GraphQL::ExecutionError => e
  render json: { errors: [{ message: e.message, extensions: e.extensions }], data: {} }, status: 200
rescue StandardError => e
  logger.error "[GraphqlController] #{e.message}"
  logger.error e.backtrace.first(10).join("\n")
  render json: { errors: [{ message: "Internal server error" }], data: {} }, status: 500
end
```

### Apollo Normalized Cache

**Source:** `app/frontend/apollo/client.ts`.

**Apply to:** All composables.

**Pattern:** Treat Apollo `InMemoryCache` as the single source of server truth. Do not duplicate query results in Pinia. Use `cache-and-network` for collection data and standard fetch policies for hot/search.

### Pinia UI-Only State

**Source:** `app/frontend/entrypoints/application.ts` (line 10).

```typescript
app.use(createPinia())
```

**Apply to:** All frontend components.

**Pattern:** Pinia stores hold only UI state (filters, sidebar open, draft inputs, collapsed sections). Server data lives in Apollo cache only.

### Dataloader Batch Loading

**Source:** `app/graphql/boardgame_night_schema.rb` (line 8).

```ruby
use GraphQL::Dataloader
```

**Apply to:** All GraphQL types that expose associations.

**Pattern:** Use `GraphQL::Dataloader::Source` for `owners`, `users`, and `things`. Never query per-item inside a resolver loop.

### Mutation Validation

**Source:** RESEARCH.md Pattern 2.

**Apply to:** `importCollection`, `validateBggUsername`, and all future mutations.

**Pattern:** Instantiate a `dry-rails` `ApplicationContract`, call it, and return validation errors via `GraphQL::ExecutionError` or a typed `errors` field.

### Subscription Broadcasting

**Source:** RESEARCH.md Pattern 3.

**Apply to:** `Bgg::ImportCollectionJob`.

**Pattern:** Broadcast at lifecycle boundaries using `BoardgameNightSchema.subscriptions.trigger(:collection_synced, { username: username }, payload)`. Argument-based scoping routes updates only to subscribers of that username.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `app/graphql/types/subscription_type.rb` | resolver | pub-sub | No `SubscriptionType` exists yet; pattern must come from RESEARCH.md and graphql-ruby docs. |
| `app/graphql/loaders/owners_loader.rb` | loader | batch | `app/graphql/loaders/` directory does not exist; pattern must come from RESEARCH.md. |
| `app/graphql/loaders/users_loader.rb` | loader | batch | Same as above. |
| `app/graphql/loaders/things_loader.rb` | loader | batch | Same as above. |
| `app/contracts/import_collection_contract.rb` | contract | validation | `app/contracts/` directory does not exist; pattern must come from RESEARCH.md. |
| `app/contracts/validate_bgg_username_contract.rb` | contract | validation | Same as above. |
| `app/frontend/composables/useSyncStatus.ts` | composable | pub-sub | No subscription composable exists yet; pattern must come from RESEARCH.md. |

---

## Metadata

**Analog search scope:**
- `app/graphql/**/*`
- `app/models/**/*`
- `app/services/bgg/**/*`
- `app/jobs/**/*`
- `app/controllers/**/*`
- `app/frontend/**/*`
- `db/migrate/*`
- `db/*schema.rb`
- `config/vite.json`
- `codegen.ts`
- `bggeek-shared-list/src/utils/*`
- `.planning/research/reference-bgg-schema.graphql`

**Files scanned:** 40+
**Pattern extraction date:** 2026-07-07
