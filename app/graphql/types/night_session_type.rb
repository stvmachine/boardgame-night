# frozen_string_literal: true

module Types
  class NightSessionType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :description, String, null: true
    field :state, Types::SessionStateEnum, null: false
    field :host, Types::UserType, null: false
    field :group, Types::GroupType, null: false
    field :scheduled_at, GraphQL::Types::ISO8601DateTime, null: true
    field :location, String, null: true
    field :capacity, Int, null: true
    field :attendances, [Types::AttendanceType], null: false
    field :picked_game, Types::MergedThingType, null: true
    field :attendee_count, Int, null: false
    field :previous_state, Types::SessionStateEnum, null: true
    field :time_budget_minutes, Int, null: false
    field :complexity_preference, String, null: false
    field :suggestions, [Types::SuggestionType], null: true

    def attendances
      object.attendances.includes(:user).to_a
    end

    def attendee_count
      object.attendances.where(response: "going").count
    end

    def suggestions
      require_authentication!
      return nil unless object.state == "picking"
      return nil unless group_member?(context[:current_user])

      attendances = object.attendances.where(response: "going").includes(:user)
      attendee_ids = attendances.pluck(:user_id).uniq
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

    def require_authentication!
      return if context[:current_user].present?

      raise GraphQL::ExecutionError, "Authentication required"
    end

    def group_member?(user)
      object.host_id == user.id || object.group.member_ids.include?(user.id)
    end
  end
end
