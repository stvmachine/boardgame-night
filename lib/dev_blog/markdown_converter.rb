# frozen_string_literal: true

require "kramdown"
require "nokogiri"

module DevBlog
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

    def self.convert(markdown, source: nil)
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
      html = sanitize_link_tags(html, "a", "href")
      sanitize_link_tags(html, "img", "src")
    end

    def self.sanitize_link_tags(html, tag, attr_name)
      pattern = /<#{tag}\s+([^>]*)#{attr_name}=["']?([^"'>\s]+)["']?([^>]*)>/i
      html.gsub(pattern) do |_match|
        prefix = Regexp.last_match(1)
        value = Regexp.last_match(2)
        suffix = Regexp.last_match(3)

        if unsafe_scheme?(value)
          %Q(<#{tag} #{prefix}#{attr_name}="##{suffix}>)
        else
          %Q(<#{tag} #{prefix}#{attr_name}="#{escape_attribute(value)}"#{suffix}>)
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
end
