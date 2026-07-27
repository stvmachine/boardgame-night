# frozen_string_literal: true

class MakeUsernameOptionalOnUsers < ActiveRecord::Migration[8.1]
  def change
    change_column_null :users, :username, true
    remove_index :users, column: :username, unique: true
  end
end
