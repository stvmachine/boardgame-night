# frozen_string_literal: true

module Loaders
  class LastPlayedAtLoader < GraphQL::Dataloader::Source
    def initialize(scope_kind, scope_id)
      super()
      @scope_kind = scope_kind
      @scope_id = scope_id
    end

    def fetch(thing_ids)
      session_dates = case @scope_kind
      when :group
        NightSession
          .where(group_id: @scope_id, picked_game_id: thing_ids)
          .where.not(state: "cancelled")
          .group(:picked_game_id)
          .maximum("COALESCE(scheduled_at, created_at)")
      when :user
        group_ids = Group
          .where(
            "id IN (SELECT group_id FROM group_memberships WHERE user_id = ?) OR id IN (SELECT id FROM groups WHERE owner_id = ?)",
            @scope_id, @scope_id
          )
          .pluck(:id)
        NightSession
          .where(group_id: group_ids, picked_game_id: thing_ids)
          .where.not(state: "cancelled")
          .group(:picked_game_id)
          .maximum("COALESCE(scheduled_at, created_at)")
      else
        {}
      end

      thing_ids.map { |id| normalize_time(session_dates[id]) }
    end

    private

      def normalize_time(datetime)
        return nil unless datetime
        return datetime.utc if datetime.respond_to?(:utc)

        Time.parse("#{datetime} UTC")
      end
  end
end
