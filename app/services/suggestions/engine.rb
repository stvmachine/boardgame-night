# frozen_string_literal: true

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
      things
        .map { |thing| score_thing(thing) }
        .compact
        .sort_by { |r| [-r.score, r.thing.objectid] }
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
        confidence: confidence_level(thing),
        reasons: reason_chips(thing, player_fit, time_fit, complexity_fit, ownership_bonus)
      )
    end

    # D-01
    def player_count_suitability(thing)
      return 0 if attendee_count_out_of_range?(thing)

      poll = suggested_numplayers_poll(thing)
      return clamp(low_confidence_fallback(thing)) if poll.nil? || thing.poll_data_fetched_at.nil?

      results = poll.results_for_player_count(attendee_count)
      total = results.sum(&:num_votes)

      value = if total < 20
        low_confidence_fallback(thing)
      elsif total < 50
        smoothed_suitability(results, total)
      else
        raw_suitability(results, total)
      end

      clamp(value)
    end

    def raw_suitability(results, total)
      best = results.select(&:best?).sum(&:num_votes)
      rec = results.select(&:recommended?).sum(&:num_votes)

      100.0 * (best.to_f / total + 0.6 * rec.to_f / total)
    end

    def smoothed_suitability(results, total)
      best = results.select(&:best?).sum(&:num_votes)
      rec = results.select(&:recommended?).sum(&:num_votes)

      denominator = total + 2.0
      best_pct = best.to_f / denominator
      rec_pct = (rec + 1).to_f / denominator

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

    def attendee_count_out_of_range?(thing)
      min = thing.min_players || 1
      max = thing.max_players || min
      !attendee_count.between?(min, max)
    end

    def suggested_numplayers_poll(thing)
      polls_by_thing[thing.id]&.find { |p| p.name == "suggested_numplayers" }
    end

    # D-02
    def time_fit_for(thing)
      budget = session.time_budget_minutes || 120
      max = thing.max_playtime || thing.playing_time || Float::INFINITY
      min = thing.min_playtime || thing.playing_time || 0

      return 100.0 if max <= budget
      return 60.0 if min <= budget

      0.0
    end

    # D-03
    def complexity_fit_for(thing)
      return 50.0 if session.complexity_preference == "Any"

      target = COMPLEXITY_TARGETS.fetch(session.complexity_preference)
      weight = thing.average_weight || 0.0
      distance = (weight - target).abs

      clamp(100.0 - (distance * 30))
    end

    # D-04
    def community_rating_for(thing)
      rating = thing.bayes_average || thing.average || 0.0
      clamp(100.0 * (rating / 10.0))
    end

    # D-05
    def ownership_bonus_for(thing)
      return 0.0 if attendee_count.zero?

      owners = owners_by_thing[thing.id] || []
      attending_owners = owners.count { |owner| attendee_user_ids.include?(owner.user_id) }
      clamp(100.0 * attending_owners / attendee_count)
    end

    def clamp(value)
      [0.0, value, 100.0].sort[1]
    end

    # D-12
    def confidence_level(thing)
      poll = suggested_numplayers_poll(thing)
      return "LOW" if poll.nil? || thing.poll_data_fetched_at.nil?

      total = poll.results_for_player_count(attendee_count).sum(&:num_votes)

      case total
      when 50.. then "HIGH"
      when 20..49 then "MEDIUM"
      else "LOW"
      end
    end

    # D-15
    def reason_chips(thing, player_fit, time_fit, complexity_fit, ownership_bonus)
      chips = []
      chips << player_count_reason(thing)
      chips << time_reason(thing)
      chips << complexity_reason(thing)
      chips << ownership_reason(thing) if ownership_bonus.positive?
      chips.compact
    end

    def player_count_reason(thing)
      poll = suggested_numplayers_poll(thing)
      return "#{attendee_count} players may fit (limited community data)" if poll.nil? || thing.poll_data_fetched_at.nil?

      results = poll.results_for_player_count(attendee_count)
      total = results.sum(&:num_votes)
      return "#{attendee_count} players may fit (limited community data)" if total < 20

      best = results.select(&:best?).sum(&:num_votes)
      best_pct = total.zero? ? 0 : (100.0 * best / total).round
      "Best at #{attendee_count} players (#{best_pct}% Best votes)"
    end

    def time_reason(thing)
      budget = session.time_budget_minutes || 120
      max = thing.max_playtime || thing.playing_time
      min = thing.min_playtime || thing.playing_time
      return "Playtime not listed" if max.nil?

      if max <= budget
        "#{max} min fits your #{budget} min budget"
      elsif min && min <= budget
        "#{min}–#{max} min may fit your #{budget} min budget"
      else
        "#{max} min exceeds your #{budget} min budget"
      end
    end

    def complexity_reason(thing)
      weight = thing.average_weight || 0.0
      "#{session.complexity_preference} complexity (#{weight.round(1)})"
    end

    def ownership_reason(thing)
      owners = owners_by_thing[thing.id] || []
      attending_owners = owners.select { |owner| attendee_user_ids.include?(owner.user_id) }
      names = attending_owners.map { |owner| owner.user.display_name }.sort

      case names.size
      when 1 then "Owned by #{names.first}"
      when 2 then "Owned by #{names.join(" & ")}"
      else "Owned by #{names.first} + #{names.size - 1} more"
      end
    end
  end
end
