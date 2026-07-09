class AddPreviousStateToNightSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :night_sessions, :previous_state, :string
  end
end
