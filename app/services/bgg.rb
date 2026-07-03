# frozen_string_literal: true

module Bgg
  class Error < StandardError; end
  class QueuedResponse < Error; end
  class CollectionNotReadyError < Error; end
  class ResourceNotFound < Error; end
  class ClientError < Error; end
  class ServerError < Error; end
  class NetworkError < Error; end
  class ParseError < Error; end
  class RateLimitError < Error; end
end
