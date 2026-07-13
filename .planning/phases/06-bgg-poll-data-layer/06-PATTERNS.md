# Phase 06: BGG Poll Data Layer - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 25
**Analogs found:** 24 / 25

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `db/migrate/20260714000001_create_bgg_polls_and_results.rb` | migration | CRUD | `db/migrate/20260703000001_create_bgg_things.rb` | exact |
| `app/models/bgg_poll.rb` | model | CRUD | `app/models/bgg_collection.rb` | role-match |
| `app/models/bgg_poll_result.rb` | model | CRUD | `app/models/bgg_collection.rb` | role-match |
| `app/models/bgg_thing.rb` (modify) | model | CRUD | `app/models/bgg_thing.rb` (existing) | exact |
| `app/services/bgg/poll_persister.rb` | service | CRUD | `app/services/bgg/collection_persister.rb` | role-match |
| `app/services/bgg/client.rb` (modify) | service | request-response | `app/services/bgg/collection_fetcher.rb` | role-match |
| `app/services/bgg/normalizer.rb` (modify) | service | transform | `app/services/bgg/normalizer.rb` (existing) | exact |
| `app/jobs/bgg/enrich_thing_polls_job.rb` | job | batch | `app/jobs/bgg/import_collection_job.rb` | role-match |
| `app/jobs/bgg/backfill_poll_data_job.rb` | job | batch | `app/jobs/bgg/import_collection_job.rb` | role-match |
| `app/jobs/bgg/import_collection_job.rb` (modify) | job | event-driven | `app/jobs/bgg/import_collection_job.rb` (existing) | exact |
| `lib/tasks/bgg_poll_backfill.rake` | rake task | batch | `lib/tasks/graphql.rake` | role-match |
| `app/graphql/types/poll_type.rb` | GraphQL type | request-response | `app/graphql/types/owner_type.rb` | role-match |
| `app/graphql/types/poll_result_type.rb` | GraphQL type | request-response | `app/graphql/types/hot_item_type.rb` | role-match |
| `app/graphql/types/thing_fields.rb` (modify) | GraphQL type | request-response | `app/graphql/types/merged_thing_type.rb` | role-match |
| `app/graphql/loaders/polls_loader.rb` | loader | batch | `app/graphql/loaders/owners_loader.rb` | exact |
| `app/graphql/boardgame_night_schema.rb` (modify) | config | config | `app/graphql/boardgame_night_schema.rb` (existing) | exact |
| `spec/services/bgg/normalizer_spec.rb` (modify) | test | test | `spec/services/bgg/normalizer_spec.rb` (existing) | exact |
| `spec/services/bgg/client_spec.rb` (modify) | test | test | `spec/services/bgg/client_spec.rb` (existing) | exact |
| `spec/services/bgg/poll_persister_spec.rb` | test | test | `spec/services/bgg/collection_persister_spec.rb` | role-match |
| `spec/jobs/bgg/enrich_thing_polls_job_spec.rb` | test | test | `spec/jobs/bgg/import_collection_job_spec.rb` | role-match |
| `spec/jobs/bgg/backfill_poll_data_job_spec.rb` | test | test | `spec/jobs/bgg/import_collection_job_spec.rb` | role-match |
| `spec/models/bgg_poll_spec.rb` | test | test | `spec/models/bgg_collection_spec.rb` | role-match |
| `spec/models/bgg_poll_result_spec.rb` | test | test | `spec/models/bgg_collection_spec.rb` | role-match |
| `spec/graphql/loaders/polls_loader_spec.rb` | test | test | `spec/graphql/loaders/owners_loader_spec.rb` | exact |

## Pattern Assignments

### `db/migrate/20260714000001_create_bgg_polls_and_results.rb` (migration, CRUD)

**Analog:** `db/migrate/20260703000001_create_bgg_things.rb`

**Migration pattern** (lines 1-23):
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

**Add-column pattern** (from `db/migrate/20260707000001_add_statistics_to_bgg_things.rb`, lines 1-13):
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
  end
end
```

---

### `app/models/bgg_poll.rb` (model, CRUD)

**Analog:** `app/models/bgg_collection.rb`

**Model pattern** (lines 1-9):
```ruby
# frozen_string_literal: true

class BggCollection < ApplicationRecord
  belongs_to :user
  belongs_to :bgg_thing

  validates :user_id, uniqueness: { scope: :bgg_thing_id }
  validates :quantity, numericality: { greater_than_or_equal_to: 1 }
end
```

---

### `app/models/bgg_poll_result.rb` (model, CRUD)

**Analog:** `app/models/bgg_collection.rb`

**Model pattern** (same as above):
```ruby
class BggCollection < ApplicationRecord
  belongs_to :user
  belongs_to :bgg_thing

  validates :user_id, uniqueness: { scope: :bgg_thing_id }
  validates :quantity, numericality: { greater_than_or_equal_to: 1 }
end
```

---

### `app/models/bgg_thing.rb` (model, CRUD)

**Analog:** `app/models/bgg_thing.rb` (existing)

**Association pattern** (lines 1-9):
```ruby
class BggThing < ApplicationRecord
  has_many :bgg_collections, dependent: :destroy
  has_many :users, through: :bgg_collections

  validates :objectid, presence: true, uniqueness: true
  validates :name, presence: true
```

---

### `app/services/bgg/poll_persister.rb` (service, CRUD)

**Analog:** `app/services/bgg/collection_persister.rb`

**Service class pattern** (lines 1-56):
```ruby
# frozen_string_literal: true

module Bgg
  class CollectionPersister
    attr_reader :user

    def initialize(user:)
      @user = user
    end

    # Persist a normalized collection hash.
    # Returns { added: Integer, updated: Integer, errors: Array }
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
```

**Upsert pattern** (lines 33-54):
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
        average: item[:stats]&.[](:average),
        bayes_average: item[:stats]&.[](:bayes_average),
        users_rated: item[:stats]&.[](:users_rated),
        average_weight: item[:stats]&.[](:average_weight),
        num_comments: item[:stats]&.[](:num_comments)
      )
      thing.save! if thing.changed?
      thing
    end
```

---

### `app/services/bgg/client.rb` (service, request-response)

**Analog:** `app/services/bgg/collection_fetcher.rb`

**Cache pattern** (lines 36-47):
```ruby
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
```

**XML merge pattern** (lines 98-114):
```ruby
    def merge_docs(doc_a, doc_b)
      boardgame_items = doc_a.css("item")
      expansion_items = doc_b.css("item")

      total_count = boardgame_items.length + expansion_items.length

      merged = Nokogiri::XML::Document.new
      root = merged.create_element("items")
      root["totalitems"] = total_count.to_s
      root["pubdate"] = doc_a.at_css("items")&.attr("pubdate") ||
                        doc_b.at_css("items")&.attr("pubdate") || ""

      all_items = boardgame_items + expansion_items
      all_items.each { |item| root.add_child(item.dup) }
      merged.root = root
      merged
    end
```

**Per-thing request pattern** (from `app/services/bgg/client.rb`, lines 32-36):
```ruby
    def thing(ids)
      handle_faraday_errors do
        perform_request("thing", id: Array(ids).join(","), stats: 1)
      end
    end
```

---

### `app/services/bgg/normalizer.rb` (service, transform)

**Analog:** `app/services/bgg/normalizer.rb` (existing)

**Nokogiri parsing pattern** (lines 12-41):
```ruby
    def normalize_thing(xml_doc)
      item = xml_doc.at_css("items > item")
      return nil unless item

      {
        id: item["id"].to_i,
        type: item["type"],
        name: item.at_css('name[type="primary"]')&.attr("value"),
        alternate_names: item.css('name[type="alternate"]').map { |n| n["value"] },
        description: item.at_css("description")&.text&.strip,
        year_published: item.at_css("yearpublished")&.attr("value")&.to_i,
        min_players: item.at_css("minplayers")&.attr("value")&.to_i,
        max_players: item.at_css("maxplayers")&.attr("value")&.to_i,
        playing_time: item.at_css("playingtime")&.attr("value")&.to_i,
        min_playtime: item.at_css("minplaytime")&.attr("value")&.to_i,
        max_playtime: item.at_css("maxplaytime")&.attr("value")&.to_i,
        min_age: item.at_css("minage")&.attr("value")&.to_i,
        image: item.at_css("image")&.text,
        thumbnail: item.at_css("thumbnail")&.text,
        statistics: {
          users_rated: item.at_css("statistics ratings usersrated")&.attr("value")&.to_i,
          average_rating: item.at_css("statistics ratings average")&.attr("value")&.to_f,
          bayes_average: item.at_css("statistics ratings bayesaverage")&.attr("value")&.to_f,
          stddev: item.at_css("statistics ratings stddev")&.attr("value")&.to_f,
          median: item.at_css("statistics ratings median")&.attr("value")&.to_f,
          owned: item.at_css("statistics ratings owned")&.attr("value")&.to_i,
          average_weight: item.at_css("statistics ratings averageweight")&.attr("value")&.to_f
        }
      }
    end
```

---

### `app/jobs/bgg/enrich_thing_polls_job.rb` (job, batch)

**Analog:** `app/jobs/bgg/import_collection_job.rb`

**Job class pattern** (lines 14-70):
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

  def perform(username)
    broadcast(username, "QUEUED")
    broadcast(username, "SYNCING")

    validate_user!(username)

    collection = Bgg::CollectionFetcher.new.fetch(username)

    user = User.find_or_create_by!(bgg_username: username) do |u|
      u.username = username
      u.password = SecureRandom.hex(16)
    end

    result = Bgg::CollectionPersister.new(user: user).persist_collection!(collection)
    Rails.logger.info("[Bgg::ImportCollectionJob] Successfully imported #{result[:added]} games, " \
                      "#{result[:updated]} updated for '#{username}'")

    user.update!(last_synced_at: Time.current)

    broadcast(username, "READY", game_count: result[:added] + result[:updated])
  end
```

---

### `app/jobs/bgg/backfill_poll_data_job.rb` (job, batch)

**Analog:** `app/jobs/bgg/import_collection_job.rb`

**Job class pattern** (same as above):
```ruby
class Bgg::ImportCollectionJob < ApplicationJob
  queue_as :bgg_imports
  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5

  discard_on Bgg::ResourceNotFound
  discard_on ActiveJob::DeserializationError
```

---

### `app/jobs/bgg/import_collection_job.rb` (job, event-driven)

**Analog:** `app/jobs/bgg/import_collection_job.rb` (existing)

**Enqueue-after-completion pattern** (lines 42-70):
```ruby
  def perform(username)
    broadcast(username, "QUEUED")
    broadcast(username, "SYNCING")

    validate_user!(username)
    collection = Bgg::CollectionFetcher.new.fetch(username)

    user = User.find_or_create_by!(bgg_username: username) do |u|
      u.username = username
      u.password = SecureRandom.hex(16)
    end

    result = Bgg::CollectionPersister.new(user: user).persist_collection!(collection)
    user.update!(last_synced_at: Time.current)

    broadcast(username, "READY", game_count: result[:added] + result[:updated])
  end
```

---

### `lib/tasks/bgg_poll_backfill.rake` (rake task, batch)

**Analog:** `lib/tasks/graphql.rake`

**Rake task pattern** (lines 1-5):
```ruby
# frozen_string_literal: true

require "graphql/rake_task"

GraphQL::RakeTask.new(schema_name: "BoardgameNightSchema", directory: ".")
```

---

### `app/graphql/types/poll_type.rb` (GraphQL type, request-response)

**Analog:** `app/graphql/types/owner_type.rb`

**Type pattern** (lines 1-16):
```ruby
# frozen_string_literal: true

module Types
  class OwnerType < Types::BaseObject
    field :bgg_username, String, null: false
    field :avatar, String, null: true

    def bgg_username
      object.user.bgg_username || object.user.username
    end

    def avatar
      object.user.bgg_avatar_url
    end
  end
end
```

---

### `app/graphql/types/poll_result_type.rb` (GraphQL type, request-response)

**Analog:** `app/graphql/types/hot_item_type.rb`

**Type pattern** (lines 1-11):
```ruby
# frozen_string_literal: true

module Types
  class HotItemType < Types::BaseObject
    field :id, ID, null: false, description: "BGG thing ID for this hot item."
    field :rank, Integer, null: false, description: "Rank on the BGG hotness list."
    field :name, String, null: false, description: "Primary name of the game."
    field :year_published, Integer, null: true, description: "Year the game was published."
    field :thumbnail, String, null: true, description: "Thumbnail image URL."
  end
end
```

---

### `app/graphql/types/thing_fields.rb` (GraphQL type, request-response)

**Analog:** `app/graphql/types/merged_thing_type.rb`

**Shared concern + Dataloader pattern** (lines 1-13):
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

**Field declaration pattern** (from `app/graphql/types/thing_fields.rb`, lines 7-24):
```ruby
    included do
      field :id, GraphQL::Types::ID, null: false
      field :name, GraphQL::Types::String, null: false
      field :year_published, GraphQL::Types::Int, null: true
      field :min_players, GraphQL::Types::Int, null: true
      field :max_players, GraphQL::Types::Int, null: true
      field :min_playtime, GraphQL::Types::Int, null: true
      field :max_playtime, GraphQL::Types::Int, null: true
      field :min_age, GraphQL::Types::Int, null: true
      field :image, GraphQL::Types::String, null: true
      field :thumbnail, GraphQL::Types::String, null: true
      field :description, GraphQL::Types::String, null: true
      field :average, GraphQL::Types::Float, null: true
      field :bayes_average, GraphQL::Types::Float, null: true
      field :users_rated, GraphQL::Types::Int, null: true
      field :average_weight, GraphQL::Types::Float, null: true
      field :is_expansion, GraphQL::Types::Boolean, null: false
    end
```

---

### `app/graphql/loaders/polls_loader.rb` (loader, batch)

**Analog:** `app/graphql/loaders/owners_loader.rb`

**Dataloader pattern** (lines 1-14):
```ruby
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

### `app/graphql/boardgame_night_schema.rb` (config, config)

**Analog:** `app/graphql/boardgame_night_schema.rb` (existing)

**Orphan types pattern** (lines 10-25):
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
    Types::AttendanceType
  )
```

---

### `spec/services/bgg/normalizer_spec.rb` (test)

**Analog:** `spec/services/bgg/normalizer_spec.rb` (existing)

**Normalizer test pattern** (lines 85-129):
```ruby
  describe ".normalize_thing" do
    context "with full thing data" do
      let(:xml) { Nokogiri::XML(file_fixture("stevmachine_thing.xml").read) }
      let(:result) { described_class.normalize_thing(xml) }

      it "extracts the thing id and type" do
        expect(result[:id]).to eq(174_430)
        expect(result[:type]).to eq("boardgame")
      end

      it "extracts statistics" do
        expect(result[:statistics][:average_rating]).to eq(8.8)
        expect(result[:statistics][:bayes_average]).to eq(8.4)
        expect(result[:statistics][:users_rated]).to eq(30_000)
        expect(result[:statistics][:owned]).to eq(50_000)
        expect(result[:statistics][:average_weight]).to eq(3.8)
      end
    end
  end
```

---

### `spec/services/bgg/client_spec.rb` (test)

**Analog:** `spec/services/bgg/client_spec.rb` (existing)

**Cache test pattern** (lines 99-121):
```ruby
  before do
    allow(Rails).to receive(:cache).and_return(cache)
  end

  describe "#collection" do
    it "caches the collection response and returns the cached doc on the next call" do
      different_xml = collection_xml.sub("Gloomhaven", "Different Game")

      stub_request(:get, /boardgamegeek.com\/xmlapi2\/collection/)
        .with(query: hash_including(username: "stevmachine"))
        .to_return(
          { status: 200, body: collection_xml, headers: { "Content-Type" => "text/xml" } },
          { status: 200, body: different_xml, headers: { "Content-Type" => "text/xml" } }
        )

      first_result = client.collection("stevmachine")
      second_result = client.collection("stevmachine")

      expect(first_result).to be_a(Nokogiri::XML::Document)
      expect(second_result).to be_a(Nokogiri::XML::Document)
      expect(second_result.at_css("name").text).to eq("Gloomhaven")
    end
  end
```

---

### `spec/services/bgg/poll_persister_spec.rb` (test)

**Analog:** `spec/services/bgg/collection_persister_spec.rb`

**Persister test pattern** (lines 1-45):
```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::CollectionPersister, type: :service do
  let(:user) { User.create!(username: "testuser", bgg_username: "testuser", password: "password") }
  let(:collection_xml) { File.read(Rails.root.join("spec/fixtures/files/stevmachine_collection.xml")) }
  subject { described_class.new(user: user) }

  describe "#persist_collection!" do
    it "persists all collection items (boardgames and expansions)" do
      collection = Bgg::Normalizer.normalize_collection(Nokogiri::XML(collection_xml))
      result = subject.persist_collection!(collection)
      expect(result[:added]).to eq(3)
      expect(user.bgg_things.count).to eq(3)
    end

    it "upserts existing things without duplication" do
      BggThing.create!(objectid: 174430, name: "Old Name")
      collection = Bgg::Normalizer.normalize_collection(Nokogiri::XML(collection_xml))
      result = subject.persist_collection!(collection)
      expect(user.bgg_things.where(objectid: 174430).count).to eq(1)
      expect(user.bgg_things.find_by(objectid: 174430).name).to eq("Gloomhaven")
    end
  end
end
```

---

### `spec/jobs/bgg/enrich_thing_polls_job_spec.rb` (test)

**Analog:** `spec/jobs/bgg/import_collection_job_spec.rb`

**Job test pattern** (lines 5-95):
```ruby
RSpec.describe Bgg::ImportCollectionJob, type: :job do
  subject(:job) { described_class.new }
  let(:username) { "stevmachine" }

  describe "#perform" do
    context "with valid BGG username" do
      let(:client) { instance_double(Bgg::Client) }
      let(:fetcher) { instance_double(Bgg::CollectionFetcher) }
      let(:persister) { instance_double(Bgg::CollectionPersister) }

      before do
        allow(Bgg::Client).to receive(:new).and_return(client)
        allow(Bgg::CollectionFetcher).to receive(:new).and_return(fetcher)
        allow(Bgg::CollectionPersister).to receive(:new).and_return(persister)
      end
    end
  end
end
```

**Retry/discard config test** (lines 137-166):
```ruby
    describe "retry/discard configuration" do
      it "retries on Bgg::NetworkError and Bgg::ServerError" do
        handlers = described_class.rescue_handlers.map { |klass, _| klass }
        expect(handlers).to include("Bgg::NetworkError")
        expect(handlers).to include("Bgg::ServerError")
      end

      it "discards on Bgg::ResourceNotFound and Bgg::InvalidUsernameError" do
        handlers = described_class.rescue_handlers.map { |klass, _| klass }
        expect(handlers).to include("Bgg::ResourceNotFound")
        expect(handlers).to include("Bgg::InvalidUsernameError")
      end
    end
```

---

### `spec/jobs/bgg/backfill_poll_data_job_spec.rb` (test)

**Analog:** `spec/jobs/bgg/import_collection_job_spec.rb`

**Job test pattern** (same as above):
```ruby
RSpec.describe Bgg::ImportCollectionJob, type: :job do
  subject(:job) { described_class.new }

  describe "#perform" do
    let(:client) { instance_double(Bgg::Client) }

    before do
      allow(Bgg::Client).to receive(:new).and_return(client)
    end
  end
end
```

---

### `spec/models/bgg_poll_spec.rb` (test)

**Analog:** `spec/models/bgg_collection_spec.rb`

**Model test pattern** (lines 1-18):
```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe BggCollection, type: :model do
  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:bgg_thing) }
  end

  describe "validations" do
    let(:user) { User.create!(username: "alice", password: "password") }
    let(:thing) { BggThing.create!(objectid: 1, name: "Test Game") }
    subject { BggCollection.new(user: user, bgg_thing: thing) }
    it { should validate_uniqueness_of(:user_id).scoped_to(:bgg_thing_id) }
    it { should validate_numericality_of(:quantity).is_greater_than_or_equal_to(1) }
  end
end
```

---

### `spec/models/bgg_poll_result_spec.rb` (test)

**Analog:** `spec/models/bgg_collection_spec.rb`

**Model test pattern** (same as above):
```ruby
RSpec.describe BggCollection, type: :model do
  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:bgg_thing) }
  end

  describe "validations" do
    subject { BggCollection.new(user: user, bgg_thing: thing) }
    it { should validate_uniqueness_of(:user_id).scoped_to(:bgg_thing_id) }
  end
end
```

---

### `spec/graphql/loaders/polls_loader_spec.rb` (test)

**Analog:** `spec/graphql/loaders/owners_loader_spec.rb`

**Loader test pattern** (lines 1-31):
```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe Loaders::OwnersLoader do
  describe "#fetch" do
    let(:user1) { User.create!(username: "alice", bgg_username: "bggalice", password: "password") }
    let(:user2) { User.create!(username: "bob", bgg_username: "bggbob", password: "password") }
    let(:thing1) { BggThing.create!(objectid: 1, name: "Game A") }
    let(:thing2) { BggThing.create!(objectid: 2, name: "Game B") }

    before do
      BggCollection.create!(user: user1, bgg_thing: thing1)
      BggCollection.create!(user: user2, bgg_thing: thing1)
      BggCollection.create!(user: user1, bgg_thing: thing2)
    end

    it "returns owners in input order for each thing id" do
      result = Loaders::OwnersLoader.new.fetch([thing1.id, thing2.id])
      expect(result.size).to eq(2)
      expect(result[0].map(&:user)).to contain_exactly(user1, user2)
      expect(result[1].map(&:user)).to contain_exactly(user1)
    end

    it "returns an empty array for unknown thing ids" do
      result = Loaders::OwnersLoader.new.fetch([thing1.id, 99_999])
      expect(result[0]).not_to be_empty
      expect(result[1]).to be_empty
    end
  end
end
```

## Shared Patterns

### BGG XML Parsing
**Source:** `app/services/bgg/normalizer.rb` (lines 12-41)
**Apply to:** `app/services/bgg/normalizer.rb` (poll parsing extension)
```ruby
item = xml_doc.at_css("items > item")
return nil unless item

{
  id: item["id"].to_i,
  name: item.at_css('name[type="primary"]')&.attr("value"),
  # ...
  statistics: {
    users_rated: item.at_css("statistics ratings usersrated")&.attr("value")&.to_i
  }
}
```

### BGG API Concurrency Lock
**Source:** `app/jobs/bgg/import_collection_job.rb` (lines 14-36)
**Apply to:** `app/jobs/bgg/enrich_thing_polls_job.rb`, `app/jobs/bgg/backfill_poll_data_job.rb`
```ruby
class Bgg::ImportCollectionJob < ApplicationJob
  queue_as :bgg_imports

  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5

  discard_on Bgg::ResourceNotFound
  discard_on ActiveJob::DeserializationError
end
```

### Solid Cache / Rails.cache Pattern
**Source:** `app/services/bgg/collection_fetcher.rb` (lines 36-47)
**Apply to:** `app/services/bgg/client.rb` (thing caching)
```ruby
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
```

### GraphQL Dataloader Pattern
**Source:** `app/graphql/loaders/owners_loader.rb` (lines 1-14)
**Apply to:** `app/graphql/loaders/polls_loader.rb`
```ruby
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

### GraphQL Shared Concern Pattern
**Source:** `app/graphql/types/thing_fields.rb` (lines 1-26)
**Apply to:** `app/graphql/types/thing_fields.rb` (poll fields)
```ruby
module Types
  module ThingFields
    extend ActiveSupport::Concern

    included do
      field :id, GraphQL::Types::ID, null: false
      field :name, GraphQL::Types::String, null: false
      # ...
      field :is_expansion, GraphQL::Types::Boolean, null: false
    end
  end
end
```

### ActiveRecord Upsert Pattern
**Source:** `app/services/bgg/collection_persister.rb` (lines 33-54)
**Apply to:** `app/services/bgg/poll_persister.rb`
```ruby
thing = BggThing.find_or_initialize_by(objectid: item[:id])
thing.assign_attributes(
  name: item[:name],
  # ...
)
thing.save! if thing.changed?
```

### RSpec Job Test Doubles Pattern
**Source:** `spec/jobs/bgg/import_collection_job_spec.rb` (lines 5-37)
**Apply to:** `spec/jobs/bgg/enrich_thing_polls_job_spec.rb`, `spec/jobs/bgg/backfill_poll_data_job_spec.rb`
```ruby
RSpec.describe Bgg::ImportCollectionJob, type: :job do
  subject(:job) { described_class.new }
  let(:client) { instance_double(Bgg::Client) }
  let(:fetcher) { instance_double(Bgg::CollectionFetcher) }
  let(:persister) { instance_double(Bgg::CollectionPersister) }

  before do
    allow(Bgg::Client).to receive(:new).and_return(client)
    allow(Bgg::CollectionFetcher).to receive(:new).and_return(fetcher)
    allow(Bgg::CollectionPersister).to receive(:new).and_return(persister)
  end
end
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/tasks/bgg_poll_backfill.rake` | rake task | batch | No existing domain-specific rake tasks; use `GraphQL::RakeTask` pattern as minimal reference. |

## Metadata

**Analog search scope:** `app/services/bgg/`, `app/jobs/bgg/`, `app/models/`, `app/graphql/`, `db/migrate/`, `lib/tasks/`, `spec/`
**Files scanned:** 40+
**Pattern extraction date:** 2026-07-14
