# frozen_string_literal: true

module DevBlog
  class Post
    include Comparable

    attr_reader :slug, :title, :date, :description, :tags, :body, :body_html, :draft

    def initialize(slug:, title:, date:, description: "", tags: [], body: "", body_html: "", draft: false)
      @slug = slug
      @title = title
      @date = date
      @description = description
      @tags = tags
      @body = body
      @body_html = body_html
      @draft = draft
    end

    def draft?
      @draft == true
    end

    def url
      "/blog/posts/#{slug}/"
    end

    def <=>(other)
      # Sort by date descending (newest first); undated drafts sort last.
      cmp = other.date <=> date
      cmp.zero? ? (slug <=> other.slug) : cmp
    end

    def eql?(other)
      other.is_a?(Post) && slug == other.slug && date == other.date
    end

    def hash
      [ slug, date ].hash
    end
  end
end
