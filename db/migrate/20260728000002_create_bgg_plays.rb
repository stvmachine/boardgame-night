# frozen_string_literal: true

class CreateBggPlays < ActiveRecord::Migration[8.1]
  def change
    create_table :bgg_plays do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :bgg_play_id, null: false
      t.integer :bgg_game_objectid, null: false
      t.string :game_name
      t.date :date, null: false
      t.integer :quantity, null: false, default: 1
      t.integer :length_minutes, null: false, default: 0
      t.boolean :incomplete, null: false, default: false
      t.boolean :now_in_stats, null: false, default: true
      t.string :location
      t.text :comments
      t.timestamps
    end

    add_index :bgg_plays, :bgg_play_id, unique: true
    add_index :bgg_plays, [ :user_id, :date ]
    add_index :bgg_plays, :bgg_game_objectid

    create_table :bgg_play_players do |t|
      t.references :bgg_play, null: false, foreign_key: true
      t.string :bgg_username
      t.integer :bgg_userid
      t.string :name, null: false
      t.integer :score
      t.integer :rating
      t.boolean :win, null: false, default: false
      t.boolean :new_player, null: false, default: false
      t.string :color
      t.string :start_position
      t.timestamps
    end

    add_index :bgg_play_players, [ :bgg_play_id, :bgg_username ]
  end
end
