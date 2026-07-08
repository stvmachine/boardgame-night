# frozen_string_literal: true

module Bgg
  class Search
    Result = Struct.new(:id, :name, :year_published, keyword_init: true)

    def self.call(query)
      new(query).results
    end

    def initialize(query, client: Bgg::Client.new)
      @query = query
      @client = client
    end

    def results
      xml = client.search(query)

      xml.css("item").map do |item|
        Result.new(
          id: item["id"],
          name: item.at_css("name")&.[]("value"),
          year_published: item.at_css("yearpublished")&.[]("value")&.to_i
        )
      end
    end

    private

    attr_reader :query, :client
  end
end
