# frozen_string_literal: true

require "cgi"
require "date"
require "pathname"
require_relative "post_parser"
require_relative "markdown_converter"

module DevBlog
  class Adr
    include Comparable

    attr_reader :number, :slug, :title, :status, :date, :source_path, :body, :body_html

    def initialize(number:, slug:, title:, status:, date:, source_path:, body:, body_html:)
      @number = number
      @slug = slug
      @title = title
      @status = status
      @date = date
      @source_path = source_path
      @body = body
      @body_html = body_html
      freeze
    end

    def output_slug
      "#{number.to_s.rjust(3, '0')}-#{slug}"
    end

    def <=>(other)
      number <=> other.number
    end

    def eql?(other)
      other.is_a?(Adr) && number == other.number
    end

    def hash
      number.hash
    end
  end

  class AdrCatalog
    INDEX_ROW_PATTERN = %r{\A\s*\|\s*\[\s*(ADR-(\d{3}))\s*\]\s*\(\s*(\.\/[^)\s]+\.md)\s*\)\s*\|\s*([^|]+?)\s*\|\s*(\S+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*\z}.freeze
    ADR_DIR_PATTERN = %r{\A\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\z}.freeze
    H1_PATTERN = /\A#\s*ADR-\d{3}:\s*(.+?)\s*\z/.freeze
    STATUS_PATTERN = /^##\s*Status\s*\n\s*(.+?)\s*$/m.freeze

    def self.load(index_path:, project_root:)
      new(index_path: index_path, project_root: project_root).load
    end

    def initialize(index_path:, project_root:)
      @index_path = Pathname.new(index_path).expand_path.realpath
      @project_root = Pathname.new(project_root).expand_path.realpath
      @index_dir = @index_path.parent
    end

    def load
      validate_index_path
      content = @index_path.read(encoding: "UTF-8")
      rows = extract_rows(content)
      adrs = rows.map { |row| parse_row(row) }
      adrs.sort
    end

    private

      def validate_index_path
        unless @index_path.file?
          raise InvalidPost, "ADR catalog index not found: #{@index_path}"
        end

        canonical = @index_path.expand_path
        unless descendant_or_equal?(canonical, @project_root)
          raise InvalidPost, "ADR catalog index outside project root: #{@index_path}"
        end
      end

      def extract_rows(content)
        content.lines(chomp: true).select { |line| INDEX_ROW_PATTERN.match?(line) }
      end

      def parse_row(line)
        match = INDEX_ROW_PATTERN.match(line)
        unless match
          raise InvalidPost, "malformed ADR catalog row: #{line.strip.inspect}"
        end

        _link_text, number_text, link_path, title, status, date_text = match.captures
        number = number_text.to_i
        title = title.strip
        status = status.strip.downcase

        source_path = resolve_source_path(link_path, number)
        slug = extract_slug(source_path, number)
        body = read_body(source_path)
        validate_body(body, number, title, status, source_path)

        body_html = MarkdownConverter.convert(body, source: source_path.to_s)

        Adr.new(
          number: number,
          slug: slug,
          title: title,
          status: status,
          date: Date.parse(date_text),
          source_path: source_path,
          body: body,
          body_html: body_html
        )
      end

      def resolve_source_path(link_path, number)
        unless link_path.start_with?("./") && link_path.end_with?(".md")
          raise InvalidPost, "ADR-#{number.to_s.rjust(3, '0')} link must be a direct relative .md path: #{link_path}"
        end

        if link_path.include?("..") || link_path.include?(":") || link_path.include?("//")
          raise InvalidPost, "ADR-#{number.to_s.rjust(3, '0')} link is unsafe: #{link_path}"
        end

        relative = link_path.sub(%r{\A\./}, "")
        path = (@index_dir + relative).expand_path

        unless path.file? && path.readable?
          raise InvalidPost, "ADR-#{number.to_s.rjust(3, '0')} source file missing: #{path}"
        end

        real_path = path.realpath
        unless descendant_or_equal?(real_path, @index_dir)
          raise InvalidPost, "ADR-#{number.to_s.rjust(3, '0')} link escapes ADR directory: #{link_path}"
        end

        if path.basename.to_s.casecmp("README.md") == 0
          raise InvalidPost, "ADR-#{number.to_s.rjust(3, '0')} cannot link to README: #{link_path}"
        end

        path
      end

      def read_body(path)
        path.read(encoding: "UTF-8")
      end

      def extract_slug(path, number)
        basename = path.basename.to_s.sub(/\.md\z/, "")
        expected_prefix = number.to_s.rjust(3, "0")

        unless %r{\A#{expected_prefix}-}.match?(basename)
          raise InvalidPost,
                "ADR-#{expected_prefix} filename must begin with #{expected_prefix}-: #{path}"
        end

        basename.sub(/\A\d{3}-/, "")
      end

      def validate_body(body, number, title, status, source_path)
        h1 = body.lines(chomp: true).first
        h1_match = H1_PATTERN.match(h1.to_s)
        unless h1_match
          raise InvalidPost, "ADR-#{number.to_s.rjust(3, '0')} body H1 is missing or malformed: #{source_path}"
        end

        body_title = h1_match[1].strip
        unless body_title == title
          raise InvalidPost,
                "ADR-#{number.to_s.rjust(3, '0')} body title does not match catalog: #{source_path}"
        end

        status_match = STATUS_PATTERN.match(body)
        unless status_match
          raise InvalidPost, "ADR-#{number.to_s.rjust(3, '0')} body ## Status section is missing: #{source_path}"
        end

        body_status = status_match[1].strip.downcase
        unless body_status == status
          raise InvalidPost,
                "ADR-#{number.to_s.rjust(3, '0')} body status does not match catalog: #{source_path}"
        end
      end

      def descendant_or_equal?(path, root)
        path_string = path.cleanpath.to_s
        root_string = root.cleanpath.to_s
        path_string == root_string || path_string.start_with?("#{root_string}#{File::SEPARATOR}")
      end
  end
end
