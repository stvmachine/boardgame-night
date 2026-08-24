class AddVerifiedToUsers < ActiveRecord::Migration[8.1]
  def up
    add_column :users, :verified, :boolean, null: false, default: false
    # Existing accounts predate email verification; treat them as verified so
    # they aren't locked out of verified-only flows (e.g. password reset).
    User.reset_column_information
    User.where.not(email: nil).update_all(verified: true)
  end

  def down
    remove_column :users, :verified
  end
end
