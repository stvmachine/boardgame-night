# frozen_string_literal: true

class AddBggAvatarUrlToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :bgg_avatar_url, :string
    add_index :users, :bgg_username
  end
end
