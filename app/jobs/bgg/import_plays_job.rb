# frozen_string_literal: true

# Bgg::ImportPlaysJob fetches a user's play history from BGG and persists it locally.
#
# Flow:
#   1. Paginate through BGG's plays endpoint (100 per page)
#   2. Upsert BggPlay records (dedup by bgg_play_id)
#   3. Upsert BggPlayPlayer records for each play
#
# Concurrency: shares the "bgg_api" lock with ImportCollectionJob.
class Bgg::ImportPlaysJob < ApplicationJob
  queue_as :bgg_imports

  limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes

  retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
  retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5
  discard_on Bgg::ResourceNotFound
  discard_on ActiveJob::DeserializationError

  def perform(username, max_pages: 10)
    client = Bgg::Client.new
    user = User.find_by(bgg_username: username)
    raise Bgg::InvalidUsernameError, "User '#{username}' not found locally" unless user

    imported = 0
    page = 1

    while page <= max_pages
      xml = client.plays(username: username, page: page)
      result = Bgg::Normalizer.normalize_plays(xml)

      break if result[:plays].empty?

      result[:plays].each do |play_data|
        upsert_play(user, play_data)
        imported += 1
      end

      # Stop if we've fetched all pages (total / 100 per page)
      total_pages = (result[:total] / 100.0).ceil
      break if page >= total_pages

      page += 1
    end

    Rails.logger.info("[Bgg::ImportPlaysJob] Imported #{imported} plays for '#{username}'")
    { imported: imported }
  end

  private

    def upsert_play(user, play_data)
      play = BggPlay.find_or_initialize_by(bgg_play_id: play_data[:bgg_play_id])
      play.assign_attributes(
        user: user,
        bgg_game_objectid: play_data[:game_objectid],
        game_name: play_data[:game_name],
        date: play_data[:date],
        quantity: play_data[:quantity],
        length_minutes: play_data[:length],
        incomplete: play_data[:incomplete],
        now_in_stats: play_data[:now_in_stats],
        location: play_data[:location],
        comments: play_data[:comments]
      )
      play.save!

      # Replace player records
      play.bgg_play_players.destroy_all
      play_data[:players].each do |player_data|
        play.bgg_play_players.create!(
          bgg_username: player_data[:username],
          bgg_userid: player_data[:userid],
          name: player_data[:name],
          score: player_data[:score],
          rating: player_data[:rating],
          win: player_data[:win],
          new_player: player_data[:new_player],
          color: player_data[:color],
          start_position: player_data[:start_position]
        )
      end
    end
end
