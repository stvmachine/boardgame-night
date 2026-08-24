class AddRequestDetailsToSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :sessions, :ip_address, :string
    add_column :sessions, :user_agent, :string
    # Sudo (recent re-authentication) window for gating sensitive changes.
    add_column :sessions, :sudo_at, :datetime
  end
end
