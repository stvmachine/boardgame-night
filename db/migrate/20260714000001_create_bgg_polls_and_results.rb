# frozen_string_literal: true

class CreateBggPollsAndResults < ActiveRecord::Migration[8.1]
  def change
    create_table :bgg_polls do |t|
      t.references :bgg_thing, null: false, foreign_key: true
      t.string :name, null: false
      t.string :title
      t.integer :total_votes
      t.timestamps

      t.index [ :bgg_thing_id, :name ], unique: true
    end

    create_table :bgg_poll_results do |t|
      t.references :bgg_poll, null: false, foreign_key: true
      t.string :value, null: false
      t.integer :num_votes, null: false, default: 0
      t.integer :player_count
      t.integer :level
      t.timestamps

      t.index [ :bgg_poll_id, :player_count, :value ], unique: true
    end

    add_column :bgg_things, :poll_data_fetched_at, :datetime
    add_column :bgg_things, :poll_data_error, :text
    add_index :bgg_things, :poll_data_fetched_at
  end
end
