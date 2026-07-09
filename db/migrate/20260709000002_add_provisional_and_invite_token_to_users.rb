# frozen_string_literal: true

class AddProvisionalAndInviteTokenToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :provisional, :boolean, null: false, default: false
    add_column :users, :invite_token, :string
    add_index :users, :invite_token, unique: true
  end
end