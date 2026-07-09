# frozen_string_literal: true

class AcceptGroupInviteContract < ApplicationContract
  params do
    required(:token).filled(:string)
  end
end
