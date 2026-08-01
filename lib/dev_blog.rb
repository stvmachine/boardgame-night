# frozen_string_literal: true

require "cgi"
require "date"
require "erb"
require "fileutils"
require "kramdown"
require "nokogiri"
require "pathname"
require "psych"

module DevBlog
  class InvalidPost < StandardError; end

  Post = Struct.new(:slug, :title, :date, :description, :tags, :body_html, keyword_init: true) do
    def <=>(other)
      other.date <=> date
    end
  end

  class PostParser
    REQUIRED_KEYS = %w[title date].freeze

    def self.parse(path)
      content = Pathname.new(path).read(encoding: "UTF-8")

      unless content.start_with?("---\n") || content.start_with?("---\r\n")
        raise InvalidPost, "missing YAML frontmatter: #{path}"
      end

      _, frontmatter, body = content.split("---", 3)

      if frontmatter.nil? || body.nil?
        raise InvalidPost, "missing YAML frontmatter: #{path}"
      end

      begin
        meta = Psych.safe_load(
          frontmatter,
          permitted_classes: [ Date ],
          permitted_symbols: [],
          aliases: false
        )
      rescue Psych::Exception => e
        raise InvalidPost, "invalid frontmatter YAML in #{path}: #{e.message}"
      end

      unless meta.is_a?(Hash)
        raise InvalidPost, "frontmatter must be a mapping: #{path}"
      end

      missing = REQUIRED_KEYS - meta.keys
      unless missing.empty?
        raise InvalidPost, "missing required keys #{missing.join(', ')}: #{path}"
      end

      title = meta["title"].to_s.strip
      date = parse_date(meta["date"])
      description = meta["description"].to_s.strip
      tags = Array(meta["tags"]).map { |tag| tag.to_s.strip }.reject(&:empty?)

      if title.empty?
        raise InvalidPost, "title cannot be empty: #{path}"
      end

      slug = Pathname.new(path).basename(".*").to_s
      body_html = MarkdownConverter.convert(body)

      Post.new(
        slug: slug,
        title: title,
        date: date,
        description: description,
        tags: tags,
        body_html: body_html
      )
    end

    def self.parse_date(value)
      case value
      when Date
        value
      when String
        Date.parse(value.strip)
      else
        raise InvalidPost, "invalid date value: #{value.inspect}"
      end
    rescue Date::Error => e
      raise InvalidPost, "invalid date: #{e.message}"
    end
  end

  class HtmlSanitizer
    UNSAFE_TAGS = %w[script style iframe object embed form input textarea button].freeze
    EVENT_ATTR_PATTERN = /\Aon/i

    def self.sanitize(html)
      fragment = Nokogiri::HTML5.fragment(html)
      sanitize_node(fragment)
      fragment.to_html
    end

    def self.sanitize_node(node)
      node.children.each do |child|
        if child.element?
          if UNSAFE_TAGS.include?(child.name)
            child.replace(Nokogiri::HTML5.fragment(escape_text(child.to_html)))
          else
            child.attribute_nodes.each do |attr|
              child.remove_attribute(attr.name) if attr.name.match?(EVENT_ATTR_PATTERN)
            end
            sanitize_node(child)
          end
        end
      end
    end

    def self.escape_text(text)
      text.gsub(/[<>&"]/) { |char| "&##{char.ord};" }
    end
  end

  class MarkdownConverter
    UNSAFE_SCHEMES = %w[javascript data vbscript file].freeze

    def self.convert(markdown)
      html = Kramdown::Document.new(markdown, kramdown_options).to_html
      html = HtmlSanitizer.sanitize(html)
      sanitize_links(html)
    end

    def self.kramdown_options
      {
        auto_ids: false,
        entity_output: :numeric,
        parse_block_html: false,
        parse_span_html: false,
        html_to_native: false,
        syntax_highlighter: nil
      }
    end

    def self.sanitize_links(html)
      html.gsub(/<a\s+([^>]*)href=["']?([^"'>\s]+)["']?([^>]*)>/i) do |_match|
        prefix = Regexp.last_match(1)
        href = Regexp.last_match(2)
        suffix = Regexp.last_match(3)

        if unsafe_scheme?(href)
          %Q(<a #{prefix}href="#" data-removed-unsafe="true"#{suffix}>)
        else
          %Q(<a #{prefix}href="#{escape_attribute(href)}"#{suffix}>)
        end
      end
    end

    def self.unsafe_scheme?(uri)
      scheme = uri.to_s.split(":").first.to_s.downcase
      UNSAFE_SCHEMES.include?(scheme)
    end

    def self.escape_attribute(value)
      value.gsub(/["&<>]/) { |char| "&##{char.ord};" }
    end
  end

  class Builder
    INDEX_TEMPLATE = <<~ERB
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title><%= CGI.escapeHTML(site_title) %></title>
        <meta name="description" content="<%= CGI.escapeHTML(site_description) %>">
      </head>
      <body>
        <header>
          <h1><%= CGI.escapeHTML(site_title) %></h1>
          <p><%= CGI.escapeHTML(site_description) %></p>
        </header>
        <main>
          <% posts.each do |post| %>
            <article>
              <h2><a href="/blog/posts/<%= post.slug %>/"><%= CGI.escapeHTML(post.title) %></a></h2>
              <time datetime="<%= post.date.iso8601 %>"><%= post.date.strftime("%B %-d, %Y") %></time>
              <p><%= CGI.escapeHTML(post.description) %></p>
            </article>
          <% end %>
        </main>
      </body>
      </html>
    ERB

    def self.build(source_dir:, output_dir:)
      source_path = Pathname.new(source_dir)
      output_path = Pathname.new(output_dir)

      posts = source_path.glob("*.md").map { |path| PostParser.parse(path) }.sort

      output_path.mkpath
      output_path.join("index.html").write(render_index(posts), encoding: "UTF-8")

      { posts_count: posts.size, output_dir: output_path }
    end

    def self.render_index(posts)
      site_title = "Boardgame Night Engineering Blog"
      site_description = "Notes on building the boardgame-night Rails + React app."
      ERB.new(INDEX_TEMPLATE, trim_mode: "-").result(binding)
    end
  end
end
