# Phase 7: Suggestion Engine Backend - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 17
**Analogs found:** 16 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/services/suggestions/engine.rb` | service | transform | `app/services/bgg/poll_persister.rb` | role-match |
| `app/graphql/types/suggestion_type.rb` | type | request-response | `app/graphql/types/merged_thing_type.rb` | exact |
| `app/graphql/types/suggestion_breakdown_type.rb` | type | request-response | `app/graphql/types/poll_result_type.rb` | role-match |
| `app/graphql/types/confidence_level_enum.rb` | enum | request-response | `app/graphql/types/session_state_enum.rb` | exact |
| `app/graphql/types/night_session_type.rb` | type | request-response | self (existing type) | exact |
| `db/migrate/...add_suggestion_preferences_to_night_sessions.rb` | migration | schema | `db/migrate/20260714000001_create_bgg_polls_and_results.rb` | role-match |
| `app/models/night_session.rb` | model | CRUD | self (existing model) | exact |
| `app/models/bgg_poll.rb` | model | CRUD | self (existing model) | exact |
| `app/models/bgg_poll_result.rb` | model | CRUD | self (existing model) | exact |
| `app/contracts/update_session_preferences_contract.rb` | contract | request-response | `app/contracts/schedule_session_contract.rb` | exact |
| `app/contracts/create_night_session_contract.rb` | contract | request-response | self (existing contract) | exact |
| `app/contracts/schedule_session_contract.rb` | contract | request-response | self (existing contract) | exact |
| `app/graphql/mutations/update_session_preferences.rb` | mutation | request-response | `app/graphql/mutations/schedule_session.rb` | role-match |
| `app/graphql/mutations/create_night_session.rb` | mutation | request-response | self (existing mutation) | exact |
| `app/graphql/mutations/schedule_session.rb` | mutation | request-response | self (existing mutation) | exact |
| `app/graphql/boardgame_night_schema.rb` | config | config | self (existing schema) | exact |
| `spec/services/suggestions/engine_spec.rb` | test | request-response | `spec/services/bgg/poll_persister_spec.rb` | role-match |

## Pattern Assignments

### `app/services/suggestions/engine.rb` (service, transform)

**Analog:** `app/services/bgg/poll_persister.rb` (service object pattern) and `app/services/bgg/collection_fetcher.rb` (stateless `.call` entry point)

**Service pattern** (lines 1-55 of `app/services/bgg/poll_persister.rb`):
```ruby
# frozen_string_literal: true

module Bgg
  class PollPersister
    def self.persist_from_thing_xml(xml_doc)
      xml_doc.css("items > item").each do |item|
        persist_item(item)
      end
    end

    def self.persist_item(item)
      thing = BggThing.find_by(objectid: item["id"].to_i)
      return unless thing
      # ...
    rescue StandardError => e
      Rails.logger.error("[Bgg::PollPersister] Failed to persist poll for thing #{thing&.objectid}: #{e.message}")
      raise
    end
  end
end
```

**Stateless `.call` entry point** (lines 16-47 of `app/services/bgg/collection_fetcher.rb`):
```ruby
module Bgg
  class CollectionFetcher
    def initialize(client: nil, normalizer: nil)
      @client = client || Bgg::Client.new
      @normalizer = normalizer || Bgg::Normalizer
    end

    def fetch(username)
      cache_key = "bgg:collection:#{username}"
      stale_cache = Rails.cache.read(cache_key)

      Rails.cache.fetch(cache_key, expires_in: 30.minutes) do
        fetch_with_fallback(username)
      end
    rescue => e
      raise e if stale_cache.nil?
      stale_cache
    end
  end
end
```

**Apply to `Suggestions::Engine`:**
- Use `module Suggestions; class Engine; end; end` namespace under `app/services/suggestions/engine.rb`.
- Provide a class-method entry point (`def self.call(...)`) plus an instance initializer and `def call`.
- Return plain value objects (`Struct.new(..., keyword_init: true)`) as shown in `app/graphql/types/query_type.rb` line 122 (`SyncStatus = Struct.new(...)`).
- Keep all scoring pure Ruby; no Active Record queries inside the engine (pre-loaded maps passed in).
- Log unexpected errors with `Rails.logger.error` and re-raise, matching the poll persister pattern.

---

### `app/graphql/types/suggestion_type.rb` (type, request-response)

**Analog:** `app/graphql/types/merged_thing_type.rb`

**Type pattern** (lines 1-13 of `app/graphql/types/merged_thing_type.rb`):
```ruby
# frozen_string_literal: true

module Types
  class MergedThingType < Types::BaseObject
    include Types::ThingFields

    field :owners, [Types::OwnerType], null: false

    def owners
      dataloader.with(Loaders::OwnersLoader).load(object.id)
    end
  end
end
```

**Apply to `SuggestionType`:**
- Inherit from `Types::BaseObject`.
- Define fields: `thing` (`Types::MergedThingType`), `score` (`Float`), `breakdown` (`Types::SuggestionBreakdownType`), `confidence` (`Types::ConfidenceLevelEnum`), `reasons` (`[String]`).
- The GraphQL object should be the `Suggestions::Engine::Result` struct; each field delegates to the struct's attributes.

---

### `app/graphql/types/suggestion_breakdown_type.rb` (type, request-response)

**Analog:** `app/graphql/types/poll_result_type.rb` (expected small value-only type; if absent, use `Types::BaseObject` pattern)

**Base object pattern** (lines 1-9 of `app/graphql/types/base_object.rb`):
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

**Apply to `SuggestionBreakdownType`:**
- Inherit from `Types::BaseObject`.
- Define scalar fields: `player_count_fit`, `time_fit`, `complexity_fit`, `community_rating`, `ownership_bonus` as `Float, null: false`.
- Expose the `Suggestions::Engine::Breakdown` struct directly.

---

### `app/graphql/types/confidence_level_enum.rb` (enum, request-response)

**Analog:** `app/graphql/types/session_state_enum.rb`

**Enum pattern** (lines 1-13 of `app/graphql/types/session_state_enum.rb`):
```ruby
# frozen_string_literal: true

module Types
  class SessionStateEnum < Types::BaseEnum
    graphql_name "SessionState"

    value "DRAFT", "Session is being edited", value: "draft"
    value "INVITED", "Invitations sent, RSVPs open", value: "invited"
    value "PICKING", "Host is picking a game", value: "picking"
    value "COMPLETED", "Game picked and session finalized", value: "completed"
    value "CANCELLED", "Session was cancelled and can be reopened", value: "cancelled"
  end
end
```

**Apply to `ConfidenceLevelEnum`:**
- Inherit from `Types::BaseEnum`.
- Set `graphql_name "ConfidenceLevel"`.
- Values: `HIGH`, `MEDIUM`, `LOW` with descriptions mapping to vote thresholds.

---

### `app/graphql/types/night_session_type.rb` (type, request-response)

**Analog:** self (existing type)

**Computed field pattern** (lines 15-25 of `app/graphql/types/night_session_type.rb`):
```ruby
# frozen_string_literal: true

module Types
  class NightSessionType < Types::BaseObject
    field :attendances, [Types::AttendanceType], null: false
    field :picked_game, Types::MergedThingType, null: true
    field :attendee_count, Int, null: false
    field :previous_state, Types::SessionStateEnum, null: true

    def attendances
      object.attendances.includes(:user).to_a
    end

    def attendee_count
      object.attendances.where(response: "going").count
    end
  end
end
```

**Apply to `suggestions` field:**
- Add `field :suggestions, [Types::SuggestionType], null: true`.
- In resolver: return `nil` unless `object.state == "picking"` and current user is a member/host.
- Load `attendee_ids` from `object.attendances.where(response: "going").pluck(:user_id)`.
- Fetch candidate pool via `BggThing.merged_for_users(attendee_ids).to_a`.
- Batch-load polls and owners with `dataloader.with(Loaders::PollsLoader).load_all(thing_ids)` and `dataloader.with(Loaders::OwnersLoader).load_all(thing_ids)` (same API as `MergedThingType#owners` and `ThingFields#polls`).
- Call `Suggestions::Engine.call(...)` and return the results.

---

### `db/migrate/...add_suggestion_preferences_to_night_sessions.rb` (migration, schema)

**Analog:** `db/migrate/20260714000001_create_bgg_polls_and_results.rb` and `db/migrate/20260707000001_add_statistics_to_bgg_things.rb`

**Migration pattern** (lines 1-30 of `db/migrate/20260714000001_create_bgg_polls_and_results.rb`):
```ruby
# frozen_string_literal: true

class CreateBggPollsAndResults < ActiveRecord::Migration[8.1]
  def change
    create_table :bgg_polls do |t|
      t.references :bgg_thing, null: false, foreign_key: true
      t.string :name, null: false
      t.string :title
      t.integer :total_votes
      t.timestamps

      t.index [:bgg_thing_id, :name], unique: true
    end

    # ...
    add_column :bgg_things, :poll_data_fetched_at, :datetime
    add_column :bgg_things, :poll_data_error, :text
  end
end
```

**Add-column pattern** (lines 1-13 of `db/migrate/20260707000001_add_statistics_to_bgg_things.rb`):
```ruby
class AddStatisticsToBggThings < ActiveRecord::Migration[8.0]
  def change
    change_table :bgg_things do |t|
      t.decimal :average, precision: 10, scale: 6
      t.integer :users_rated
      t.decimal :average_weight, precision: 10, scale: 6
    end
  end
end
```

**Apply to new migration:**
- Use `ActiveRecord::Migration[8.1]`.
- Add `time_budget_minutes` as `integer, default: 120, null: false`.
- Add `complexity_preference` as `string, default: "Any", null: false`.

---

### `app/models/night_session.rb` (model, CRUD)

**Analog:** self (existing model)

**Validation pattern** (lines 1-35 of `app/models/night_session.rb`):
```ruby
class NightSession < ApplicationRecord
  belongs_to :group
  belongs_to :host, class_name: "User"
  belongs_to :picked_game, class_name: "BggThing", optional: true
  has_many :attendances, dependent: :destroy
  has_many :attendees, through: :attendances, source: :user
  has_many :invite_tokens, dependent: :destroy

  validates :title, presence: true
  validates :state, presence: true, inclusion: { in: %w[draft invited picking completed cancelled] }
  validates :group, presence: true
  validates :host, presence: true
end
```

**Apply to new columns:**
- Add `VALID_COMPLEXITY_PREFS = %w[Light Medium Medium-Heavy Heavy Any].freeze`.
- Add `validates :complexity_preference, inclusion: { in: VALID_COMPLEXITY_PREFS }`.
- Add `validates :time_budget_minutes, numericality: { greater_than: 0 }, allow_nil: true`.

---

### `app/models/bgg_poll.rb` (model, CRUD)

**Analog:** self (existing model)

**Model helper pattern** (lines 1-8 of `app/models/bgg_poll.rb`):
```ruby
class BggPoll < ApplicationRecord
  belongs_to :bgg_thing
  has_many :bgg_poll_results, dependent: :destroy

  validates :name, presence: true
end
```

**Apply to helper method:**
- Add `def results_for_player_count(n)` that returns `bgg_poll_results.select { |r| r.player_count == n }`.
- Keep it simple and memoization-free; the loader already eager-loads `bgg_poll_results`.

---

### `app/models/bgg_poll_result.rb` (model, CRUD)

**Analog:** self (existing model)

**Validation pattern** (lines 1-8 of `app/models/bgg_poll_result.rb`):
```ruby
class BggPollResult < ApplicationRecord
  belongs_to :bgg_poll

  validates :value, presence: true
  validates :num_votes, numericality: { greater_than_or_equal_to: 0 }
end
```

**Apply to helper methods:**
- Add `def best?; value == "Best"; end`, `def recommended?; value == "Recommended"; end`, `def not_recommended?; value == "Not Recommended"; end`.

---

### `app/contracts/update_session_preferences_contract.rb` (contract, request-response)

**Analog:** `app/contracts/schedule_session_contract.rb`

**Contract pattern** (lines 1-10 of `app/contracts/schedule_session_contract.rb`):
```ruby
# frozen_string_literal: true

class ScheduleSessionContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:scheduled_at).maybe(:date_time)
    optional(:location).maybe(:string, max_size?: 200)
    optional(:capacity).maybe(:integer, gt?: 0)
  end
end
```

**Base contract pattern** (lines 1-5 of `app/contracts/application_contract.rb`):
```ruby
# frozen_string_literal: true

class ApplicationContract < Dry::Validation::Contract
  config.messages.backend = :i18n
end
```

**Apply to new contract:**
- Inherit from `ApplicationContract`.
- `required(:session_id).filled(:string)`.
- `optional(:time_budget_minutes).maybe(:integer, gt?: 0)`.
- `optional(:complexity_preference).maybe(:string, included_in?: COMPLEXITY_PREFS)`.

---

### `app/contracts/create_night_session_contract.rb` and `app/contracts/schedule_session_contract.rb` (contract, request-response)

**Analog:** self (existing contracts)

**Apply modifications:**
- Add `optional(:time_budget_minutes).maybe(:integer, gt?: 0)` to both contracts.
- Add `optional(:complexity_preference).maybe(:string, included_in?: COMPLEXITY_PREFS)` to both contracts.

---

### `app/graphql/mutations/update_session_preferences.rb` (mutation, request-response)

**Analog:** `app/graphql/mutations/schedule_session.rb`

**Mutation pattern** (lines 1-75 of `app/graphql/mutations/schedule_session.rb`):
```ruby
module Mutations
  class ScheduleSession < BaseMutation
    argument :session_id, ID, required: true
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false
    argument :location, String, required: false
    argument :capacity, Integer, required: false

    field :session, Types::NightSessionType, null: false
    field :invites_sent, Integer, null: false

    def resolve(session_id:, scheduled_at: nil, location: nil, capacity: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      scheduled_at = parse_datetime(scheduled_at)

      contract = ScheduleSessionContract.new.call(
        session_id: session_id,
        scheduled_at: scheduled_at,
        location: location,
        capacity: capacity
      )
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: session_id)
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to schedule this session"
      end

      # ...
      session.update!(...)

      { session: session }
    end
  end
end
```

**Apply to new mutation:**
- Inherit from `BaseMutation`.
- Arguments: `session_id`, `time_budget_minutes`, `complexity_preference` (all optional except `session_id`).
- Field: `session, Types::NightSessionType, null: false`.
- Check `context[:current_user]`.
- Validate with `UpdateSessionPreferencesContract`.
- Authorize host only and restrict to states before `"picking"`.
- Update `time_budget_minutes` and/or `complexity_preference`.

---

### `app/graphql/mutations/create_night_session.rb` and `app/graphql/mutations/schedule_session.rb` (mutation, request-response)

**Analog:** self (existing mutations)

**Apply modifications:**
- Add `argument :time_budget_minutes, Integer, required: false` and `argument :complexity_preference, String, required: false` (or a new `Types::ComplexityPreferenceEnum`).
- Pass through to contracts and `NightSession.create!` / `session.update!` calls.

---

### `app/graphql/boardgame_night_schema.rb` (config, config)

**Analog:** self (existing schema)

**Orphan type registration pattern** (lines 10-27 of `app/graphql/boardgame_night_schema.rb`):
```ruby
orphan_types(
  Types::ThingType,
  Types::MergedThingType,
  Types::MergedCollectionType,
  Types::OwnerType,
  Types::UserType,
  Types::UserSyncStatusType,
  Types::HotItemType,
  Types::SearchResultType,
  Types::ValidationResultType,
  Types::GroupType,
  Types::GroupMembershipType,
  Types::SessionInviteType,
  Types::NightSessionType,
  Types::AttendanceType,
  Types::PollType,
  Types::PollResultType
)
```

**Apply to schema:**
- Add `Types::SuggestionType`, `Types::SuggestionBreakdownType`, and `Types::ConfidenceLevelEnum` to `orphan_types` so codegen sees them even if reached only via `NightSessionType`.

---

### `spec/services/suggestions/engine_spec.rb` (test, request-response)

**Analog:** `spec/services/bgg/poll_persister_spec.rb`

**Service test pattern** (lines 1-58 of `spec/services/bgg/poll_persister_spec.rb`):
```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::PollPersister, type: :service do
  let(:thing_xml) { file_fixture("stevmachine_thing.xml").read }
  let(:doc) { Nokogiri::XML(thing_xml) }

  describe ".persist_from_thing_xml" do
    it "persists a BggPoll and BggPollResults for each player count" do
      thing = BggThing.create!(objectid: 174_430, name: "Gloomhaven")

      described_class.persist_from_thing_xml(doc)

      poll = thing.bgg_polls.find_by(name: "suggested_numplayers")
      expect(poll).to be_present
      expect(poll.title).to eq("User Suggested Number of Players")
      expect(poll.total_votes).to eq(2000)
      expect(poll.bgg_poll_results.count).to eq(12)
    end
  end
end
```

**Apply to engine spec:**
- `require "rails_helper"`.
- Create users, group, session, attendances, BggThing records, BggPoll/BggPollResult records, and BggCollections.
- Call `Suggestions::Engine.call(...)` with pre-loaded maps and assert on returned `Result` structs.
- Test edge cases: no poll data, thin votes (<20), out-of-range attendee count, time budget exceeded, complexity preference "Any", zero attending owners.

---

## Shared Patterns

### Authentication / Authorization in Resolvers

**Source:** `app/graphql/mutations/create_night_session.rb` (lines 14-35) and `app/graphql/mutations/start_picking.rb` (lines 10-20)

**Apply to:** `NightSessionType#suggestions`, `Mutations::UpdateSessionPreferences`

```ruby
raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

membership = group.group_memberships.find_by(user_id: context[:current_user].id)
unless group.owner_id == context[:current_user].id || (membership && %w[owner admin].include?(membership.role))
  raise GraphQL::ExecutionError, "You must be an owner or admin of the group to create a session"
end
```

For `suggestions`, restrict to group members or host. For `updateSessionPreferences`, restrict to host only.

### Dataloader Batch Loading

**Source:** `app/graphql/loaders/polls_loader.rb` and `app/graphql/loaders/owners_loader.rb`

**Apply to:** `NightSessionType#suggestions`

```ruby
# PollsLoader
module Loaders
  class PollsLoader < GraphQL::Dataloader::Source
    def fetch(thing_ids)
      polls = BggPoll
        .where(bgg_thing_id: thing_ids)
        .includes(:bgg_poll_results)
        .group_by(&:bgg_thing_id)

      thing_ids.map { |id| polls[id] || [] }
    end
  end
end

# Usage in resolver
polls = dataloader.with(Loaders::PollsLoader).load_all(thing_ids)
owners = dataloader.with(Loaders::OwnersLoader).load_all(thing_ids)
```

### GraphQL Enum Pattern

**Source:** `app/graphql/types/session_state_enum.rb`

**Apply to:** `ConfidenceLevelEnum` (and optional `ComplexityPreferenceEnum`)

```ruby
module Types
  class SessionStateEnum < Types::BaseEnum
    graphql_name "SessionState"

    value "DRAFT", "Session is being edited", value: "draft"
    # ...
  end
end
```

### Contract Validation Pattern

**Source:** `app/contracts/schedule_session_contract.rb` and `app/contracts/application_contract.rb`

**Apply to:** all modified/new contracts

```ruby
class ScheduleSessionContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:scheduled_at).maybe(:date_time)
  end
end
```

In mutations:
```ruby
contract = ScheduleSessionContract.new.call(...)
raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?
```

### Model Test Pattern

**Source:** `spec/models/night_session_spec.rb` and `spec/models/bgg_poll_spec.rb`

**Apply to:** `spec/models/night_session_spec.rb` (new validations), `spec/models/bgg_poll_spec.rb` (helper), `spec/models/bgg_poll_result_spec.rb` (helpers)

```ruby
RSpec.describe NightSession, type: :model do
  describe "validations" do
    it { should validate_inclusion_of(:state).in_array(%w[draft invited picking completed]) }
  end
end
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | — | — | All classified files have strong existing analogs in the codebase. |

## Metadata

**Analog search scope:** `app/services/`, `app/graphql/types/`, `app/graphql/loaders/`, `app/graphql/mutations/`, `app/models/`, `app/contracts/`, `db/migrate/`, `spec/services/`, `spec/graphql/types/`, `spec/models/`
**Files scanned:** 30+
**Pattern extraction date:** 2026-07-14
