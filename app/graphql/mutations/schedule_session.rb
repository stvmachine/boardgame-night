# frozen_string_literal: true

module Mutations
  class ScheduleSession < BaseMutation
    argument :session_id, ID, required: true
    argument :scheduled_at, GraphQL::Types::ISO8601DateTime, required: false
    argument :location, String, required: false
    argument :capacity, Integer, required: false

    argument :time_budget_minutes, Integer, required: false
    argument :complexity_preference, String, required: false

    field :session, Types::NightSessionType, null: false
    field :invites_sent, Integer, null: false

    def resolve(session_id:, scheduled_at: nil, location: nil, capacity: nil, time_budget_minutes: nil, complexity_preference: nil)
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

      scheduled_at = parse_datetime(scheduled_at)

      contract_payload = {
        session_id: session_id,
        scheduled_at: scheduled_at,
        location: location,
        capacity: capacity
      }
      contract_payload[:time_budget_minutes] = time_budget_minutes unless time_budget_minutes.nil?
      contract_payload[:complexity_preference] = complexity_preference unless complexity_preference.nil?

      contract = ScheduleSessionContract.new.call(contract_payload)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      session = NightSession.find_by(id: session_id)
      raise GraphQL::ExecutionError, "Session not found" unless session

      unless session.host_id == context[:current_user].id
        raise GraphQL::ExecutionError, "You must be the session host to schedule this session"
      end

      unless session.can_schedule?
        raise GraphQL::ExecutionError, "Session cannot be scheduled from #{session.state}"
      end

      session.update!(
        scheduled_at: contract[:scheduled_at],
        location: contract[:location],
        capacity: contract[:capacity],
        state: "invited"
      )

      preference_updates = {}
      preference_updates[:time_budget_minutes] = contract[:time_budget_minutes] unless time_budget_minutes.nil?
      preference_updates[:complexity_preference] = contract[:complexity_preference] unless complexity_preference.nil?
      session.update!(preference_updates) if preference_updates.any?

      invite_count = 0
      session.group.group_memberships.includes(:user).find_each do |membership|
        next if membership.user_id == session.host_id

        raw_token, digest = InviteToken.generate_raw_token
        invite = InviteToken.create!(
          group: session.group,
          inviter: context[:current_user],
          email: membership.user.email,
          night_session: session,
          token_digest: digest,
          status: "pending",
          expires_at: 7.days.from_now
        )
        invite.raw_token = raw_token
        InviteMailerJob.perform_later(invite.id, raw_token)
        invite_count += 1
      end

      { session: session, invites_sent: invite_count }
    end

    private

    def parse_datetime(value)
      return nil if value.nil?
      return value.to_datetime if value.respond_to?(:to_datetime)

      Time.parse(value).to_datetime
    end
  end
end
