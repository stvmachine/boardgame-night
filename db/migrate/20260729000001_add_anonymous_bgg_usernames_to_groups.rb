# frozen_string_literal: true

class AddAnonymousBggUsernamesToGroups < ActiveRecord::Migration[8.0]
  def change
    add_column :groups, :anonymous_bgg_usernames, :text

    remove_foreign_key :groups, column: :owner_id
    change_column_null :groups, :owner_id, true
  end
end
