# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL endpoint does not leak BGG_TOKEN", type: :request do
  let(:plaintext_token_sentinel) { "SPEC_SENTINEL_TOKEN_PLACEHOLDER" }

  it "returns health ok and does not include the BGG token in the response" do
    post "/graphql", params: { query: "{ health }" }, as: :json

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json["data"]["health"]).to eq("ok")
    expect(response.body).not_to include(plaintext_token_sentinel)
  end
end
