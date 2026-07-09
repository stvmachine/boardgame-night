# frozen_string_literal: true

class CreateInviteTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :invite_tokens do |t|
      t.references :group, null: false, foreign_key: true
      t.references :inviter, null: false, foreign_key: { to_table: :users }
      t.references :accepted_by, foreign_key: { to_table: :users }
      t.references :night_session
      t.string :email, null: false
      t.string :role, default: "member"
      t.string :token_digest, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :expires_at, null: false
      t.datetime :accepted_at

      t.timestamps
    end

    add_index :invite_tokens, :token_digest, unique: true
  end
end
