# frozen_string_literal: true

class DevBlogController < ApplicationController
  POST_SLUG_REGEXP = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/.freeze
  ADR_SLUG_REGEXP = /\A[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*\z/.freeze

  def index
    serve_file(["index.html"], "text/html; charset=utf-8")
  end

  def stylesheet
    serve_file(["styles.css"], "text/css; charset=utf-8")
  end

  def post
    slug = params[:slug].to_s
    head :not_found and return unless POST_SLUG_REGEXP.match?(slug)

    serve_file(["posts", slug, "index.html"], "text/html; charset=utf-8")
  end

  def adr
    adr_slug = params[:adr_slug].to_s
    head :not_found and return unless ADR_SLUG_REGEXP.match?(adr_slug)

    serve_file(["adrs", adr_slug, "index.html"], "text/html; charset=utf-8")
  end

  def not_found
    head :not_found
  end

  def blog_entry
    if request.original_fullpath.start_with?("/blog/")
      index
    else
      redirect_to "/blog/", status: :moved_permanently
    end
  end

  def redirect_to_blog
    blog_entry
  end

  private

    def serve_file(parts, content_type)
      target = safe_target(parts)
      return head :not_found unless target&.file?

      response.headers["Cache-Control"] = "public, max-age=3600"
      response.headers["X-Content-Type-Options"] = "nosniff"
      if content_type.include?("text/html")
        response.headers["Content-Security-Policy"] = static_csp
      end

      send_file target, type: content_type, disposition: "inline"
    end

    def safe_target(parts)
      base = Rails.public_path.join("dev-blog").expand_path
      target = parts.reduce(base) { |path, part| path.join(part) }.expand_path

      target_string = target.to_s
      base_string = base.to_s
      return nil unless target_string == base_string || target_string.start_with?("#{base_string}/")

      target
    end

    def static_csp
      "default-src 'none'; style-src 'self'; script-src 'none'; img-src 'self'; " \
        "object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    end
end
