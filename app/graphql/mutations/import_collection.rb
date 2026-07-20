# frozen_string_literal: true

module Mutations
  class ImportCollection < BaseMutation
    argument :username, String, required: true, description: "BGG username whose collection should be imported"

    field :user, Types::UserType, null: false, description: "The local user record for the requested BGG username"

    def resolve(username:)
      contract = ImportCollectionContract.new.call(username: username)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      bgg_username = contract[:username]
      user = User.find_or_initialize_by(bgg_username: bgg_username) do |u|
        u.username = bgg_username
      end
      user.password = SecureRandom.hex(16) if user.new_record?
      user.save!

      if user.last_synced_at.present? && 15.minutes.ago < user.last_synced_at
        remaining_seconds = (user.last_synced_at + 15.minutes - Time.current).to_i
        raise GraphQL::ExecutionError,
              "Collection for '#{bgg_username}' was synced recently. " \
              "Cooldown active: #{remaining_seconds} seconds remaining."
      end

      # Dedupe: don't enqueue if an import for this username is already pending.
      # The frontend fires this mutation on every page load while status is QUEUED,
      # so without this guard a stopped worker lets jobs pile up unboundedly.
      # The job clears sync_requested_at when it finishes (see ImportCollectionJob),
      # so a stale timestamp only lingers if the worker died mid-import; in that
      # case the cooldown above and the 15-minute staleness window below bound it.
      pending = user.sync_requested_at.present? && user.sync_requested_at > 15.minutes.ago

      unless pending
        user.update!(sync_requested_at: Time.current)
        Bgg::ImportCollectionJob.perform_later(bgg_username)
      end
      context[:sync_status_for_username] = bgg_username

      { user: user }
    end
  end
end
