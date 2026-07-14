# frozen_string_literal: true

class AddSuggestionPreferencesToNightSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :night_sessions, :time_budget_minutes, :integer, default: 120, null: false
    add_column :night_sessions, :complexity_preference, :string, default: "Any", null: false
  end
end
