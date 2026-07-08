# frozen_string_literal: true

class AddStatisticsToBggThings < ActiveRecord::Migration[8.0]
  def change
    change_table :bgg_things do |t|
      t.decimal :average, precision: 10, scale: 6
      t.decimal :bayes_average, precision: 10, scale: 6
      t.integer :users_rated
      t.decimal :average_weight, precision: 10, scale: 6
      t.integer :num_comments
    end
  end
end
