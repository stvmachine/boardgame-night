# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL endpoint does not leak BGG_TOKEN", type: :request do
  it "returns health ok and does not include the BGG token in the response" do
    actual_token = ENV["BGG_TOKEN"]
    skip "BGG_TOKEN not set" unless actual_token.present?

    post "/graphql", params: { query: "{ health }" }, as: :json

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["data"]["health"]).to eq("ok")
    expect(response.body).not_to include(actual_token)
  end
end
