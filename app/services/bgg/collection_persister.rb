# frozen_string_literal: true

module Bgg
  class CollectionPersister
    attr_reader :client, :user

    def initialize(client: Bgg::Client.new, user:)
      @client = client
      @user = user
    end

    # Fetch collection from BGG and persist to database.
    # Returns { added: Integer, updated: Integer, errors: Array }
    def fetch_and_persist!(bgg_username: user.bgg_username)
      raise ArgumentError, "User has no bgg_username" unless bgg_username

      collection_xml = client.collection(bgg_username)
      collection = Bgg::Normalizer.normalize_collection(collection_xml)

      persist_collection!(collection)
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
  end
end
