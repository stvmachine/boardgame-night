# frozen_string_literal: true

require "rails_helper"

RSpec.describe "validateBggUsername mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation ValidateBggUsername($username: String!) {
        validateBggUsername(username: $username) {
          validationResult {
            valid
            username
            exists
            avatar
          }
        }
      }
    GRAPHQL
  end

  let(:user_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <user id="12345" name="stevmachine">
          <avatarlink value="https://cf.geekdo-images.com/avatar/12345.jpg" />
        </user>
      </items>
    XML
  end

  let(:missing_user_xml) do
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <user name="nobody"></user>
      </items>
    XML
  end

  it "returns valid and exists for a real BGG username" do
    stub_request(:get, /boardgamegeek.com\/xmlapi2\/user/)
      .with(query: hash_including(name: "stevmachine"))
      .to_return(status: 200, body: user_xml, headers: { "Content-Type" => "text/xml" })

    result = BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })

    expect(result["errors"]).to be_nil
    data = result.dig("data", "validateBggUsername", "validationResult")
    expect(data["valid"]).to be true
    expect(data["username"]).to eq("stevmachine")
    expect(data["exists"]).to be true
    expect(data["avatar"]).to eq("https://cf.geekdo-images.com/avatar/12345.jpg")
  end

  it "returns valid but not exists for a missing BGG user" do
    stub_request(:get, /boardgamegeek.com\/xmlapi2\/user/)
      .with(query: hash_including(name: "nobody"))
      .to_return(status: 200, body: missing_user_xml, headers: { "Content-Type" => "text/xml" })

    result = BoardgameNightSchema.execute(mutation, variables: { username: "nobody" })

    expect(result["errors"]).to be_nil
    data = result.dig("data", "validateBggUsername", "validationResult")
    expect(data["valid"]).to be true
    expect(data["exists"]).to be false
  end

  it "returns valid but not exists when BGG responds with 404" do
    stub_request(:get, /boardgamegeek.com\/xmlapi2\/user/)
      .with(query: hash_including(name: "nobody"))
      .to_return(status: 404, body: "")

    result = BoardgameNightSchema.execute(mutation, variables: { username: "nobody" })

    expect(result["errors"]).to be_nil
    data = result.dig("data", "validateBggUsername", "validationResult")
    expect(data["valid"]).to be true
    expect(data["exists"]).to be false
  end

  it "returns invalid for a malformed username" do
    result = BoardgameNightSchema.execute(mutation, variables: { username: "bad name!" })

    expect(result["errors"]).to be_nil
    data = result.dig("data", "validateBggUsername", "validationResult")
    expect(data["valid"]).to be false
    expect(data["exists"]).to be false
  end
end
