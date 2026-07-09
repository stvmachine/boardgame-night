# frozen_string_literal: true

class CreateGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :groups do |t|
      t.string :name, null: false
      t.text :description
      t.string :invite_code
      t.references :owner, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :groups, :invite_code, unique: true
  end
end
