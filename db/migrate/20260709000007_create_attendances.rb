# frozen_string_literal: true

class CreateAttendances < ActiveRecord::Migration[8.1]
  def change
    create_table :attendances do |t|
      t.references :night_session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :response, null: false
      t.datetime :responded_at
      t.timestamps
    end

    add_index :attendances, [ :night_session_id, :user_id ], unique: true
  end
end
