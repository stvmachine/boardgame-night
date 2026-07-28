# frozen_string_literal: true

class CreateGameScores < ActiveRecord::Migration[8.1]
  def change
    create_table :game_scores do |t|
      t.references :night_session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :score, null: false, default: 0
      t.integer :rank
      t.timestamps
    end

    add_index :game_scores, [ :night_session_id, :user_id ], unique: true
  end
end
