# frozen_string_literal: true

class DevBlogHostConstraint
  HOST_REGEXP = %r{
    \A
    (?=.{1,253}\z)
    (?: [A-Za-z0-9] (?: [A-Za-z0-9-]{0,61} [A-Za-z0-9] )? \. )+
    [A-Za-z0-9] (?: [A-Za-z0-9-]{0,61} [A-Za-z0-9] )?
    \z
  }x.freeze
  HOST_MAX_LENGTH = 253

  def self.matches?(request)
    new.matches?(request)
  end

  def matches?(request)
    configured = configured_host
    return false unless configured

    request.host.to_s.downcase == configured.downcase
  end

  private

    def configured_host
      value = ENV["DEV_BLOG_HOST"].to_s.strip
      return nil if value.empty?
      return nil if value.length > HOST_MAX_LENGTH
      return nil if value.match?(/[[:cntrl:][:space:]]/)
      return nil unless HOST_REGEXP.match?(value)

      value
    end
end
