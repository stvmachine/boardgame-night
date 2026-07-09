# frozen_string_literal: true

class InviteToGroupContract < ApplicationContract
  EMAIL_FORMAT = /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/.freeze

  params do
    required(:group_id).filled(:string)
    required(:email).filled(:string, max_size?: 254, format?: EMAIL_FORMAT)
    optional(:role).maybe(:string, included_in?: %w[member admin])
  end
end
