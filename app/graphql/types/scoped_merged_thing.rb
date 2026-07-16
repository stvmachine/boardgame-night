# frozen_string_literal: true

module Types
  class ScopedMergedThing
    class Scope
      attr_reader :kind, :id

      def initialize(kind, id)
        @kind = kind
        @id = id
        freeze
      end
    end

    attr_reader :thing, :scope

    def initialize(thing, scope)
      @thing = thing
      @scope = scope
      freeze
    end

    delegate :id,
             :name,
             :year_published,
             :min_players,
             :max_players,
             :min_playtime,
             :max_playtime,
             :min_age,
             :image,
             :thumbnail,
             :description,
             :average,
             :bayes_average,
             :users_rated,
             :average_weight,
             :is_expansion,
             :objectid,
             to: :thing
  end
end
