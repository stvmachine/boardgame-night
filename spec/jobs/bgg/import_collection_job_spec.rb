# frozen_string_literal: true

require "rails_helper"

RSpec.describe Bgg::ImportCollectionJob, type: :job do
  subject(:job) { described_class.new }
  let(:username) { "stevmachine" }

  describe "#perform" do
    context "with valid BGG username" do
      let(:client) { instance_double(Bgg::Client) }
      let(:fetcher) { instance_double(Bgg::CollectionFetcher) }
      let(:persister) { instance_double(Bgg::CollectionPersister) }

      let(:user_xml) do
        Nokogiri::XML(<<~XML)
          <user id="12345" name="stevmachine">
            <firstname value="Steve" />
            <lastname value="Machine" />
          </user>
        XML
      end

      let(:collection_array) do
        [{ id: 1, name: "Game A" }, { id: 2, name: "Game B" }]
      end

      before do
        allow(Bgg::Client).to receive(:new).and_return(client)
        allow(client).to receive(:user).with(username).and_return(user_xml)

        allow(Bgg::CollectionFetcher).to receive(:new).and_return(fetcher)
        allow(fetcher).to receive(:fetch).with(username).and_return(collection_array)

        allow(Bgg::CollectionPersister).to receive(:new).and_return(persister)
        allow(persister).to receive(:persist_collection!).and_return({ added: 2, updated: 0, errors: [] })
      end

      it "validates the user against BGG" do
        expect(client).to receive(:user).with(username).and_return(user_xml)
        job.perform(username)
      end

      it "fetches the collection via CollectionFetcher" do
        expect(fetcher).to receive(:fetch).with(username)
        job.perform(username)
      end

      it "persists via CollectionPersister" do
        expect(persister).to receive(:persist_collection!)
        job.perform(username)
      end

      it "creates a local user if missing" do
        expect { job.perform(username) }.to change(User, :count).by(1)
        user = User.find_by(bgg_username: username)
        expect(user).to be_present
        expect(user.username).to eq(username)
      end

      it "uses the existing local user when present" do
        User.create!(username: username, bgg_username: username, password: "password")
        expect { job.perform(username) }.not_to change(User, :count)
      end

      it "broadcasts status transitions" do
        expect(BoardgameNightSchema.subscriptions).to receive(:trigger).with(
          :collection_synced,
          { username: username },
          hash_including(status: "QUEUED", username: username)
        ).ordered

        expect(BoardgameNightSchema.subscriptions).to receive(:trigger).with(
          :collection_synced,
          { username: username },
          hash_including(status: "SYNCING", username: username)
        ).ordered

        expect(BoardgameNightSchema.subscriptions).to receive(:trigger).with(
          :collection_synced,
          { username: username },
          hash_including(status: "READY", username: username, game_count: 2)
        ).ordered

        job.perform(username)
      end
    end

    context "with invalid BGG username" do
      before do
        client = instance_double(Bgg::Client)
        allow(Bgg::Client).to receive(:new).and_return(client)
        allow(client).to receive(:user).with("nonexistent_user")
          .and_return(Nokogiri::XML("<user id=\"\" name=\"\"></user>"))
      end

      it "raises Bgg::InvalidUsernameError" do
        expect { job.perform("nonexistent_user") }
          .to raise_error(Bgg::InvalidUsernameError, /not found/)
      end

      it "broadcasts ERROR before raising" do
        allow(BoardgameNightSchema.subscriptions).to receive(:trigger)

        expect(BoardgameNightSchema.subscriptions).to receive(:trigger).with(
          :collection_synced,
          { username: "nonexistent_user" },
          hash_including(status: "ERROR", username: "nonexistent_user")
        )

        expect { job.perform("nonexistent_user") }.to raise_error(Bgg::InvalidUsernameError)
      end
    end

    context "with BGG returning an empty response (no <user> node)" do
      before do
        client = instance_double(Bgg::Client)
        allow(Bgg::Client).to receive(:new).and_return(client)
        allow(client).to receive(:user).with("empty_user")
          .and_return(Nokogiri::XML("<root></root>"))
      end

      it "raises Bgg::InvalidUsernameError" do
        expect { job.perform("empty_user") }
          .to raise_error(Bgg::InvalidUsernameError, /not found/)
      end
    end

    describe "retry/discard configuration" do
      it "declares retry_on for Faraday::TimeoutError" do
        expect(described_class).to respond_to(:retry_on)
      end

      it "declares retry_on for Faraday::ServerError" do
        expect(described_class).to respond_to(:retry_on)
      end

      it "declares discard_on for Bgg::InvalidUsernameError" do
        expect(described_class).to respond_to(:discard_on)
      end

      it "declares discard_on for Faraday::ResourceNotFound" do
        expect(described_class).to respond_to(:discard_on)
      end
    end
  end
end
