# frozen_string_literal: true

class UpdateGroupMemberRoleContract < ApplicationContract
  params do
    required(:group_id).filled(:string)
    required(:user_id).filled(:string)
    required(:role).filled(:string, included_in?: %w[admin member])
  end
end
