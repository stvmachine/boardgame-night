# frozen_string_literal: true

class CreateNightSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :night_sessions do |t|
      t.string :title, null: false
      t.text :description
      t.string :state, null: false, default: "draft"
      t.references :group, null: false, foreign_key: true
      t.references :host, null: false, foreign_key: { to_table: :users }
      t.references :picked_game, foreign_key: { to_table: :bgg_things }
      t.datetime :scheduled_at
      t.string :location
      t.integer :capacity
      t.timestamps
    end

    add_index :night_sessions, :state
  end
end
