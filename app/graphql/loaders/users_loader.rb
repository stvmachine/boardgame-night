# frozen_string_literal: true

module Loaders
  class UsersLoader < GraphQL::Dataloader::Source
    def fetch(usernames)
      users_by_username = User.where(bgg_username: usernames).index_by(&:bgg_username)
      usernames.map { |username| users_by_username[username] }
    end
  end
end
