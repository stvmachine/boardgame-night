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
    # ADR-NNN link text, number, relative path, title, status, date
    INDEX_ROW_PATTERN = %r{
      \A\s*\|\s*\[\s*ADR-(\d{3})\s*\]\s*\(\s*(\S+)\s*\)\s*\|\s*([^|]+?)\s*\|\s*(\S+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*\z
    }x.freeze
    HEADER_ROW_PATTERN = /\A\s*\|\s*ADR\s*\|\s*Title\s*\|\s*Status\s*\|\s*Date\s*\|/.freeze
    HEADER_SEPARATOR_PATTERN = /\A\s*\|[\-\s|]+\|\s*\z/.freeze
    TABLE_ROW_PATTERN = /\A\s*\|/.freeze
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
      candidates = rows.map { |row| parse_row(row) }
      validate_uniqueness(candidates)
      accepted = candidates.select { |candidate| candidate.status == "accepted" }
      accepted.sort
    end

    private

      def validate_index_path
        unless @index_path.file?
          raise InvalidPost, "ADR catalog index not found: #{@index_path}"
        end

        unless descendant_or_equal?(@index_path, @project_root)
          raise InvalidPost, "ADR catalog index outside project root: #{@index_path}"
        end
      end

      def extract_rows(content)
        content.lines(chomp: true).filter_map do |line|
          next if line.strip.empty?
          next unless TABLE_ROW_PATTERN.match?(line)
          next if HEADER_ROW_PATTERN.match?(line)
          next if HEADER_SEPARATOR_PATTERN.match?(line)

          line
        end
      end

      def parse_row(line)
        match = INDEX_ROW_PATTERN.match(line)
        unless match
          raise InvalidPost, "malformed ADR catalog row: #{line.strip.inspect}"
        end

        number_text, link_path, title, status, date_text = match.captures
        number = number_text.to_i
        title = title.strip
        status = status.strip.downcase

        validate_link_path(link_path, number_text)
        source_path = resolve_source_path(link_path, number_text)
        slug = extract_slug(source_path, number_text)
        body = read_body(source_path)
        validate_body(body, number_text, title, status, source_path)

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

      def validate_link_path(link_path, number_text)
        if link_path.downcase.end_with?("readme.md")
          raise InvalidPost, "ADR-#{number_text} cannot link to README: #{link_path}"
        end

        unless link_path.start_with?("./") && link_path.end_with?(".md")
          raise InvalidPost, "ADR-#{number_text} link must be a direct relative .md path: #{link_path}"
        end

        if link_path.include?("..") || link_path.include?("//") || link_path.include?("%")
          raise InvalidPost, "ADR-#{number_text} link is unsafe: #{link_path}"
        end

        relative = link_path.sub(%r{\A\./}, "")

        if relative.include?("/")
          raise InvalidPost,
                "ADR-#{number_text} link must be a direct relative .md path: #{link_path}"
        end

        if relative.start_with?(".")
          raise InvalidPost, "ADR-#{number_text} link targets a hidden file: #{link_path}"
        end

        filename_pattern = /\A#{number_text}-[a-z0-9]+(?:-[a-z0-9]+)*\.md\z/
        unless filename_pattern.match?(relative)
          raise InvalidPost,
                "ADR-#{number_text} link filename must match #{number_text}-<slug>.md: #{link_path}"
        end
      end

      def resolve_source_path(link_path, number_text)
        relative = link_path.sub(%r{\A\./}, "")
        path = (@index_dir + relative).expand_path

        unless path.file? && path.readable?
          raise InvalidPost, "ADR-#{number_text} source file missing: #{path}"
        end

        if path.symlink?
          raise InvalidPost, "ADR-#{number_text} source file must be a regular file: #{link_path}"
        end

        real_path = path.realpath
        unless descendant_or_equal?(real_path, @index_dir)
          raise InvalidPost, "ADR-#{number_text} link escapes ADR directory: #{link_path}"
        end

        path
      end

      def extract_slug(path, number_text)
        basename = path.basename.to_s.sub(/\.md\z/, "")

        unless basename.start_with?("#{number_text}-")
          raise InvalidPost,
                "ADR-#{number_text} filename must begin with #{number_text}-: #{path}"
        end

        basename.sub(/\A\d{3}-/, "")
      end

      def read_body(path)
        path.read(encoding: "UTF-8")
      end

      def validate_body(body, number_text, title, status, source_path)
        h1 = body.lines(chomp: true).first
        h1_match = H1_PATTERN.match(h1.to_s)
        unless h1_match
          raise InvalidPost, "ADR-#{number_text} body H1 is missing or malformed: #{source_path}"
        end

        body_title = h1_match[1].strip
        unless body_title == title
          raise InvalidPost,
                "ADR-#{number_text} body title does not match catalog: #{source_path}"
        end

        status_match = STATUS_PATTERN.match(body)
        unless status_match
          raise InvalidPost, "ADR-#{number_text} body ## Status section is missing: #{source_path}"
        end

        body_status = status_match[1].strip.downcase
        unless body_status == status
          raise InvalidPost,
                "ADR-#{number_text} body status does not match catalog: #{source_path}"
        end
      end

      def validate_uniqueness(candidates)
        numbers = candidates.map(&:number)
        slugs = candidates.map(&:output_slug)
        paths = candidates.map { |adr| adr.source_path.expand_path.realpath.to_s }

        collections = { numbers: numbers, slugs: slugs, paths: paths }
        collections.each do |key, collection|
          duplicates = collection.group_by(&:itself).select { |_, group| group.size > 1 }.keys
          unless duplicates.empty?
            raise InvalidPost, "duplicate ADR #{key} in catalog: #{duplicates.join(', ')}"
          end
        end
      end

      def descendant_or_equal?(path, root)
        path_string = path.cleanpath.to_s
        root_string = root.cleanpath.to_s
        path_string == root_string || path_string.start_with?("#{root_string}#{File::SEPARATOR}")
      end
  end
end
