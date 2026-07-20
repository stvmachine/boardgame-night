# frozen_string_literal: true

class CreateBggCollections < ActiveRecord::Migration[8.0]
  def change
    create_table :bgg_collections do |t|
      t.references :user, null: false, foreign_key: true
      t.references :bgg_thing, null: false, foreign_key: true
      t.integer :quantity, default: 1, null: false
      t.timestamps
    end
    add_index :bgg_collections, [ :user_id, :bgg_thing_id ], unique: true
  end
end
