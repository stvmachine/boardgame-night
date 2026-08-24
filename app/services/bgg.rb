# frozen_string_literal: true

module Bgg
  class Error < StandardError; end
  class QueuedResponse < Error; end
  class CollectionNotReadyError < Error; end
  class ResourceNotFound < Error; end
  class ClientError < Error; end
  # BGG's WAF returns 401/403 to server-side API traffic (e.g. datacenter IPs
  # like Render's). Subclasses ClientError so existing rescues still catch it,
  # but lets callers treat "we are blocked" distinctly from a normal 4xx.
  class AccessDeniedError < ClientError; end
  class ServerError < Error; end
  class ServiceError < Error; end
  class NetworkError < Error; end
  class ParseError < Error; end
  class RateLimitError < Error; end
  class InvalidUsernameError < Error; end
end
