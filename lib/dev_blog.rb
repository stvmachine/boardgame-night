# frozen_string_literal: true

require "cgi"
require "date"
require "erb"
require "fileutils"
require "pathname"
require "securerandom"
require "tmpdir"
require_relative "dev_blog/post"
require_relative "dev_blog/post_parser"
require_relative "dev_blog/markdown_converter"
require_relative "dev_blog/template_renderer"

module DevBlog
  class BuildError < StandardError; end

  class BuildResult
    attr_reader :posts, :output_dir, :generated_files

    def initialize(posts:, output_dir:, generated_files:)
      @posts = posts.dup.freeze
      @output_dir = Pathname.new(output_dir)
      @generated_files = generated_files.to_h do |path, bytes|
        [ path.dup.freeze, bytes.dup.freeze ]
      end.freeze
      freeze
    end

    def posts_count
      posts.size
    end
  end

  def self.project_root
    Pathname.new(File.expand_path("..", __dir__))
  end

  class Builder
    DATED_POST_PATTERN = /\A\d{4}-\d{2}-\d{2}-.*\.md\z/.freeze
    ASSETS = %w[styles.css].freeze

    def self.build(source_dir:, output_dir:, project_root: nil, include_drafts: false)
      if project_root
        build_with_root(
          source_dir: source_dir,
          output_dir: output_dir,
          project_root: project_root,
          include_drafts: include_drafts
        )
      else
        build_legacy(
          source_dir: source_dir,
          output_dir: output_dir,
          include_drafts: include_drafts
        )
      end
    end

    def self.render_index(posts)
      templates_path = DevBlog.project_root.join("lib", "dev_blog", "templates")
      renderer = TemplateRenderer.new(templates_dir: templates_path)
      renderer.render_index(posts: posts)
    end

    def self.build_with_root(source_dir:, output_dir:, project_root:, include_drafts:)
      root_path = canonical_project_root(project_root)
      source_path = resolve_path(source_dir, root_path, "source_dir")
      output_path = resolve_path(output_dir, root_path, "output_dir")

      if output_path == root_path
        raise BuildError, "output cannot be project root: #{output_path}"
      end
      if descendant_or_equal?(source_path, output_path)
        raise BuildError, "output cannot contain source directory: #{output_path}"
      end

      templates_path = root_path.join("lib", "dev_blog", "templates")
      assets_path = root_path.join("lib", "dev_blog", "assets")

      renderer = TemplateRenderer.new(templates_dir: templates_path)
      posts = discover_dated_posts(source_path)
      posts = posts.reject(&:draft?) unless include_drafts
      posts = posts.sort

      check_duplicates(posts)
      generated_files = build_file_map(posts, renderer, assets_path)

      output_path.parent.mkpath
      staged_path = Pathname.new(Dir.mktmpdir(".dev-blog-staged-", output_path.parent.to_s))
      begin
        write_staged(staged_path, generated_files)
        replace_output(output_path, staged_path)
      ensure
        FileUtils.rm_rf(staged_path) if staged_path.exist? || staged_path.symlink?
      end

      BuildResult.new(
        posts: posts,
        output_dir: output_path,
        generated_files: generated_files
      )
    rescue BuildError, InvalidPost
      raise
    rescue StandardError => e
      raise BuildError, "failed to build output: #{e.message}"
    end

    def self.build_legacy(source_dir:, output_dir:, include_drafts:)
      # Plan 12-01 compatibility for callers that build isolated temporary
      # directories. Production entrypoints always pass project_root so they
      # receive containment checks and staged replacement.
      source_path = Pathname.new(source_dir)
      output_path = Pathname.new(output_dir)

      templates_path = DevBlog.project_root.join("lib", "dev_blog", "templates")
      assets_path = DevBlog.project_root.join("lib", "dev_blog", "assets")

      renderer = TemplateRenderer.new(templates_dir: templates_path)
      posts = discover_all_posts(source_path)
      posts = posts.reject(&:draft?) unless include_drafts
      posts = posts.sort

      check_duplicates(posts)
      generated_files = build_file_map(posts, renderer, assets_path)

      write_direct(output_path, generated_files)

      BuildResult.new(
        posts: posts,
        output_dir: output_path,
        generated_files: generated_files
      )
    end

    def self.discover_dated_posts(source_path)
      return [] unless source_path.directory?

      source_path.children
        .select { |path| path.file? && DATED_POST_PATTERN.match?(path.basename.to_s) }
        .sort
        .map { |path| PostParser.parse(path) }
    end

    def self.discover_all_posts(source_path)
      return [] unless source_path.directory?

      source_path.glob("*.md").sort.map { |path| PostParser.parse(path) }
    end

    def self.check_duplicates(posts)
      slugs = posts.map(&:slug)
      duplicates = slugs.group_by(&:itself).select { |_, group| group.size > 1 }.keys
      unless duplicates.empty?
        raise BuildError, "duplicate slug(s): #{duplicates.join(', ')}"
      end
    end

    def self.build_file_map(posts, renderer, assets_path)
      files = {}

      files["index.html"] = renderer.render_index(posts: posts).b

      posts.each do |post|
        files["posts/#{post.slug}/index.html"] = renderer.render_post(post: post).b
      end

      ASSETS.each do |name|
        asset_path = assets_path.join(name)
        raise BuildError, "required blog asset not found: #{asset_path}" unless asset_path.file?

        files[name] = asset_path.binread
      end

      files
    end

    def self.write_staged(staging_path, generated_files)
      generated_files.each do |relative_path, bytes|
        target = safe_output_target(staging_path, relative_path)
        target.parent.mkpath
        target.binwrite(bytes)
      end
    end

    def self.write_direct(output_path, generated_files)
      output_path.mkpath
      generated_files.each do |relative_path, bytes|
        target = safe_output_target(output_path, relative_path)
        target.parent.mkpath
        target.binwrite(bytes)
      end
    end

    def self.replace_output(output_path, staged_path)
      output_path = output_path.cleanpath
      staged_path = staged_path.cleanpath
      parent = output_path.parent
      parent.mkpath

      backup = nil
      if output_path.exist? || output_path.symlink?
        raise BuildError, "output exists but is not a directory: #{output_path}" unless output_path.directory?

        backup = unique_backup_path(parent)
        FileUtils.mv(output_path, backup)
      end

      begin
        FileUtils.mv(staged_path, output_path)
      rescue StandardError => swap_error
        begin
          FileUtils.rm_rf(output_path) if output_path.exist? || output_path.symlink?
          FileUtils.mv(backup, output_path) if backup && (backup.exist? || backup.symlink?)
        rescue StandardError => restore_error
          raise BuildError,
            "failed to replace output (#{swap_error.message}) and restore backup (#{restore_error.message})"
        end

        raise swap_error
      ensure
        FileUtils.rm_rf(backup) if backup && backup.exist? && output_path.exist?
      end
    end

    def self.resolve_path(value, project_root, label)
      expanded_path = Pathname.new(value).expand_path
      path = canonical_path(expanded_path)
      root = project_root.cleanpath

      unless descendant_or_equal?(path, root)
        raise BuildError, "#{label} outside project root: #{expanded_path}"
      end

      path
    end

    def self.canonical_project_root(value)
      root = Pathname.new(value).expand_path
      raise BuildError, "project root does not exist: #{root}" unless root.directory?

      root.realpath
    rescue SystemCallError => e
      raise BuildError, "invalid project root: #{e.message}"
    end

    def self.canonical_path(path)
      missing_segments = []
      cursor = path

      until cursor.exist? || cursor.symlink?
        parent = cursor.parent
        raise BuildError, "cannot resolve path: #{path}" if parent == cursor

        missing_segments.unshift(cursor.basename)
        cursor = parent
      end

      resolved = cursor.realpath
      missing_segments.reduce(resolved) { |current, segment| current.join(segment) }.cleanpath
    rescue SystemCallError => e
      raise BuildError, "cannot resolve path #{path}: #{e.message}"
    end

    def self.descendant_or_equal?(path, root)
      path_string = path.cleanpath.to_s
      root_string = root.cleanpath.to_s

      path_string == root_string || path_string.start_with?("#{root_string}#{File::SEPARATOR}")
    end

    def self.safe_output_target(root, relative_path)
      path = Pathname.new(relative_path.to_s)
      segments = path.each_filename.to_a
      if path.absolute? || segments.empty? || segments.any? { |segment| segment == "." || segment == ".." }
        raise BuildError, "unsafe generated output path: #{relative_path}"
      end

      root.join(path).cleanpath
    end

    def self.unique_backup_path(parent)
      loop do
        candidate = parent.join(".dev-blog-output-backup-#{Process.pid}-#{SecureRandom.hex(6)}")
        return candidate unless candidate.exist? || candidate.symlink?
      end
    end
  end
end
