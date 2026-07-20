class AddSyncRequestedAtToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :sync_requested_at, :datetime
  end
end
