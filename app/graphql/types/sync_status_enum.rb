# frozen_string_literal: true

module Types
  class SyncStatusEnum < Types::BaseEnum
    graphql_name "SyncStatus"

    value "QUEUED", "Import is queued and waiting to start"
    value "SYNCING", "Import is in progress"
    value "READY", "Import completed successfully"
    value "ERROR", "Import failed"
  end
end
