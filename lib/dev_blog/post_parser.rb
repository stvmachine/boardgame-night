# frozen_string_literal: true

require "cgi"
require "date"
require "pathname"
require "psych"
require_relative "post"
require_relative "markdown_converter"

module DevBlog
  class InvalidPost < StandardError; end

  class PostParser
    REQUIRED_KEYS = %w[title date].freeze
    DATED_FILENAME_PATTERN = /\A(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md\z/.freeze
    SLUG_PATTERN = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/.freeze

    def self.parse(path)
      path = Pathname.new(path)
      content = path.read(encoding: "UTF-8")

      unless content.start_with?("---\n") || content.start_with?("---\r\n")
        raise InvalidPost, "missing YAML frontmatter: #{path}"
      end

      _, frontmatter, body = content.split("---", 3)

      if frontmatter.nil? || body.nil?
        raise InvalidPost, "missing YAML frontmatter: #{path}"
      end

      slug = parse_slug(path.basename.to_s)
      meta = load_frontmatter(frontmatter, path)

      missing = REQUIRED_KEYS - meta.keys
      unless missing.empty?
        raise InvalidPost, "missing required keys #{missing.join(', ')}: #{path}"
      end

      title = validate_string(meta["title"], "title", path)
      raise InvalidPost, "title must be a non-empty string: #{path}" if title.empty?

      date = validate_date(meta["date"], path)
      description = validate_string(meta.fetch("description", ""), "description", path)
      tags = validate_tags(meta.fetch("tags", []), path)
      draft = validate_boolean(meta.fetch("draft", false), "draft", path)

      body_html = MarkdownConverter.convert(body, source: path.to_s)

      Post.new(
        slug: slug,
        title: title,
        date: date,
        description: description,
        tags: tags,
        body: body,
        body_html: body_html,
        draft: draft
      )
    end

    def self.parse_slug(basename)
      name = basename.sub(/\.md\z/, "")

      if (match = DATED_FILENAME_PATTERN.match(basename))
        name = match[2]
      end

      unless SLUG_PATTERN.match?(name)
        raise InvalidPost, "invalid slug #{name.inspect} in filename: #{basename}"
      end

      name
    end

    def self.load_frontmatter(frontmatter, path)
      meta = Psych.safe_load(
        frontmatter,
        permitted_classes: [ Date ],
        permitted_symbols: [],
        aliases: false,
        filename: path.to_s
      )

      unless meta.is_a?(Hash)
        raise InvalidPost, "frontmatter must be a mapping: #{path}"
      end

      meta
    rescue Psych::Exception => e
      raise InvalidPost, "invalid frontmatter YAML in #{path}: #{e.message}"
    end

    def self.validate_date(value, path)
      case value
      when Date
        value
      when String
        Date.parse(value.strip)
      else
        raise InvalidPost, "invalid date value #{value.inspect}: #{path}"
      end
    rescue Date::Error => e
      raise InvalidPost, "invalid date: #{e.message}: #{path}"
    end

    def self.validate_string(value, name, path)
      unless value.is_a?(String)
        raise InvalidPost, "#{name} must be a string: #{path}"
      end
      value.strip
    end

    def self.validate_tags(value, path)
      unless value.is_a?(Array) && value.all? { |tag| tag.is_a?(String) }
        raise InvalidPost, "tags must be an array of strings: #{path}"
      end
      value.map(&:strip).reject(&:empty?)
    end

    def self.validate_boolean(value, name, path)
      unless value == true || value == false
        raise InvalidPost, "#{name} must be a boolean: #{path}"
      end
      value
    end
  end
end
