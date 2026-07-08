# frozen_string_literal: true

class CreateBggThings < ActiveRecord::Migration[8.0]
  def change
    create_table :bgg_things do |t|
      t.integer :objectid, null: false
      t.string :name, null: false
      t.integer :year_published
      t.integer :min_players
      t.integer :max_players
      t.integer :playing_time
      t.integer :min_playtime
      t.integer :max_playtime
      t.integer :min_age
      t.string :image
      t.string :thumbnail
      t.text :description
      t.timestamps
    end
    add_index :bgg_things, :objectid, unique: true
    add_index :bgg_things, :name
  end
end
