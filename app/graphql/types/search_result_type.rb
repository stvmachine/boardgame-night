# frozen_string_literal: true

module Types
  class SearchResultType < Types::BaseObject
    field :id, ID, null: false, description: "BGG thing ID for the search result."
    field :name, String, null: false, description: "Name of the game."
    field :year_published, Integer, null: true, description: "Year the game was published."
  end
end
