# frozen_string_literal: true

module Bgg
  module Normalizer
    module_function

    def normalize_collection(xml_doc)
      items = xml_doc.css("items > item")
      items.map { |item| normalize_collection_item(item) }
    end

    def normalize_thing(xml_doc)
      item = xml_doc.at_css("items > item")
      return nil unless item

      {
        id: item["id"].to_i,
        type: item["type"],
        name: item.at_css('name[type="primary"]')&.attr("value"),
        alternate_names: item.css('name[type="alternate"]').map { |n| n["value"] },
        description: item.at_css("description")&.text&.strip,
        year_published: item.at_css("yearpublished")&.attr("value")&.to_i,
        min_players: item.at_css("minplayers")&.attr("value")&.to_i,
        max_players: item.at_css("maxplayers")&.attr("value")&.to_i,
        playing_time: item.at_css("playingtime")&.attr("value")&.to_i,
        min_playtime: item.at_css("minplaytime")&.attr("value")&.to_i,
        max_playtime: item.at_css("maxplaytime")&.attr("value")&.to_i,
        min_age: item.at_css("minage")&.attr("value")&.to_i,
        image: item.at_css("image")&.text,
        thumbnail: item.at_css("thumbnail")&.text,
        statistics: {
          users_rated: item.at_css("statistics ratings usersrated")&.attr("value")&.to_i,
          average_rating: item.at_css("statistics ratings average")&.attr("value")&.to_f,
          bayes_average: item.at_css("statistics ratings bayesaverage")&.attr("value")&.to_f,
          stddev: item.at_css("statistics ratings stddev")&.attr("value")&.to_f,
          median: item.at_css("statistics ratings median")&.attr("value")&.to_f,
          owned: item.at_css("statistics ratings owned")&.attr("value")&.to_i,
          average_weight: item.at_css("statistics ratings averageweight")&.attr("value")&.to_f
        }
      }
    end

    def normalize_collection_item(item)
      rating = item.at_css("stats > rating")
      {
        id: item["objectid"].to_i,
        name: item.at_css("name")&.text,
        year_published: item.at_css("yearpublished")&.attr("value")&.to_i,
        image: item.at_css("image")&.text,
        thumbnail: item.at_css("thumbnail")&.text,
        subtype: item["subtype"],
        stats: {
          min_players: item.at_css("stats")&.attr("minplayers")&.to_i,
          max_players: item.at_css("stats")&.attr("maxplayers")&.to_i,
          playing_time: item.at_css("stats")&.attr("playingtime")&.to_i,
          min_playtime: item.at_css("stats")&.attr("minplaytime")&.to_i,
          max_playtime: item.at_css("stats")&.attr("maxplaytime")&.to_i,
          num_owned: item.at_css("stats")&.attr("numowned")&.to_i,
          rating: item.at_css("stats > rating")&.attr("value")&.to_f,
          users_rated: rating&.at_css("usersrated")&.attr("value")&.to_i,
          average: rating&.at_css("average")&.attr("value")&.to_f,
          bayes_average: rating&.at_css("bayesaverage")&.attr("value")&.to_f,
          average_weight: rating&.at_css("averageweight")&.attr("value")&.to_f,
          num_comments: rating&.at_css("numcomments")&.attr("value")&.to_i,
          stddev: rating&.at_css("stddev")&.attr("value")&.to_f,
          median: rating&.at_css("median")&.attr("value")&.to_f
        }
      }
    end
  end
end
