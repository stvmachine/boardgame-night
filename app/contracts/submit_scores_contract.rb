# frozen_string_literal: true

class SubmitScoresContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    required(:scores).array(:hash) do
      required(:user_id).filled(:string)
      required(:score).filled(:integer)
      optional(:rank).maybe(:integer)
    end
  end

  rule(:session_id) do
    key(:session_id).failure(:invalid?) unless NightSession.exists?(id: value)
  end

  rule(:scores).each do
    key(:scores).failure(:empty?) if value.empty?
  end
end
