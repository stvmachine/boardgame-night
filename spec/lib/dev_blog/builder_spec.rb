# frozen_string_literal: true

require "rails_helper"
require "dev_blog"
require "digest"
require "open3"
require "rbconfig"

RSpec.describe DevBlog::Builder do
  let(:project_root) do
    temp_parent = DevBlog.project_root.join("tmp")
    temp_parent.mkpath
    Pathname.new(Dir.mktmpdir(".dev-blog-builder-project-", temp_parent.to_s))
  end
  let(:source_dir) { project_root.join("docs", "development") }
  let(:output_dir) { project_root.join("public", "dev-blog") }
  let(:templates_dir) { project_root.join("lib", "dev_blog", "templates") }
  let(:assets_dir) { project_root.join("lib", "dev_blog", "assets") }

  after do
    FileUtils.remove_entry(project_root) if project_root.directory?
  end

  def write_post(filename, frontmatter, body = "")
    source_dir.join(filename).write("---\n#{frontmatter}\n---\n#{body}")
  end

  def copy_templates_and_assets
    templates_dir.mkpath
    assets_dir.mkpath

    Pathname.new(File.expand_path("../../../lib/dev_blog/templates", __dir__)).glob("*.erb").each do |src|
      FileUtils.cp(src, templates_dir.join(src.basename))
    end

    Pathname.new(File.expand_path("../../../lib/dev_blog/assets", __dir__)).glob("*.css").each do |src|
      FileUtils.cp(src, assets_dir.join(src.basename))
    end
  end

  def build(**kwargs)
    defaults = {
      project_root: project_root,
      source_dir: source_dir,
      output_dir: output_dir,
      adr_catalog_path: nil
    }
    described_class.build(**defaults.merge(kwargs))
  end

  describe ".build" do
    before do
      source_dir.mkpath
      copy_templates_and_assets
    end

    it "returns a BuildResult with no posts for an empty source directory" do
      result = build

      expect(result).to be_a(DevBlog::BuildResult)
      expect(result.posts_count).to eq(0)
      expect(result.output_dir).to eq(output_dir.realpath)
      expect(output_dir.join("index.html")).to be_file
      expect(output_dir.join("styles.css")).to be_file
    end

    it "builds an index and post pages for dated markdown files" do
      write_post("2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01\ndescription: A greeting", "# Hello\n\nbody")
      write_post("2026-08-02-world.md", "title: World\ndate: 2026-08-02\ndescription: Another post", "# World")

      result = build

      expect(result.posts_count).to eq(2)
      index = output_dir.join("index.html").read
      expect(index).to include("<h1>Engineering posts</h1>")
      expect(index).to include('href="./posts/hello/"')
      expect(index).to include('href="./posts/world/"')
      expect(index).to include('href="./styles.css"')
      expect(index).to include("World") # newest first

      expect(output_dir.join("posts", "hello", "index.html")).to be_file
      expect(output_dir.join("posts", "world", "index.html")).to be_file

      post = output_dir.join("posts", "hello", "index.html").read
      expect(post).to include('href="../../styles.css"')
      expect(post).to include('href="../../"')
      expect(post).to include("<h1>Hello</h1>")
      expect(post).to include("<div class=\"post-body\"")
    end

    it "builds an accepted catalog ADR through the static lane" do
      adr_dir = project_root.join("docs", "adr")
      adr_dir.mkpath
      adr_dir.join("README.md").write(<<~MARKDOWN)
        # Architecture Decision Records

        ## Index

        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-monorepo-rails-api-vue-spa.md) | Monorepo with Rails 8 API-only and Vue 3 Vite SPA | accepted | 2026-07-07 |

        ## Status Key
      MARKDOWN
      adr_dir.join("001-monorepo-rails-api-vue-spa.md").write(<<~MARKDOWN)
        # ADR-001: Monorepo with Rails 8 API-only and Vue 3 Vite SPA

        ## Status

        accepted

        ## Context

        Historical body.
      MARKDOWN
      write_post("2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01", "body")

      result = build(adr_catalog_path: adr_dir.join("README.md"))

      expect(result).to be_a(DevBlog::BuildResult)
      expect(result.adrs_count).to eq(1)
      index = output_dir.join("index.html").read
      expect(index).to include("<h2>Architecture Decisions</h2>")
      expect(index).to include('href="./adrs/001-monorepo-rails-api-vue-spa/"')

      adr_page = output_dir.join("adrs", "001-monorepo-rails-api-vue-spa", "index.html").read
      expect(adr_page).to include("Architecture Decision Record 001")
      expect(adr_page).to include("<h1>Monorepo with Rails 8 API-only and Vue 3 Vite SPA</h1>")
      expect(adr_page).to include("Historical body")
      expect(adr_page).to include("This decision record captures the reasoning at a point in time")
      expect(adr_page).to include('href="../../styles.css"')
      expect(adr_page).to include('href="../../"')
    end

    it "excludes drafts by default and includes them with include_drafts: true" do
      write_post("2026-08-01-published.md", "title: Published\ndate: 2026-08-01\ndescription: x", "body")
      write_post("2026-08-02-draft.md", "title: Draft\ndate: 2026-08-02\ndescription: y\ndraft: true", "body")

      result = build
      expect(result.posts_count).to eq(1)
      expect(output_dir.join("posts", "draft", "index.html")).not_to exist

      result = build(include_drafts: true)
      expect(result.posts_count).to eq(2)
      expect(output_dir.join("posts", "draft", "index.html")).to be_file
    end

    it "sorts posts by date descending with a slug tie-break" do
      write_post("2026-08-01-zzz.md", "title: Z\ndate: 2026-08-01", "body")
      write_post("2026-08-01-aaa.md", "title: A\ndate: 2026-08-01", "body")
      write_post("2026-08-02-bbb.md", "title: B\ndate: 2026-08-02", "body")

      result = build
      expect(result.posts.map(&:slug)).to eq(["bbb", "aaa", "zzz"])
    end

    it "raises BuildError for duplicate slugs" do
      write_post("2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01", "body")
      write_post("2026-08-02-hello.md", "title: Hello 2\ndate: 2026-08-02", "body")

      expect {
        build
      }.to raise_error(DevBlog::BuildError, /duplicate slug.*hello/)
    end

    it "ignores non-dated files and README.md" do
      write_post("2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01", "body")
      source_dir.join("README.md").write("# README")
      source_dir.join("notes.txt").write("notes")
      source_dir.join("subdir").mkpath
      source_dir.join("subdir", "2026-08-02-nested.md").write("---\ntitle: Nested\ndate: 2026-08-02\n---\n")

      result = build
      expect(result.posts_count).to eq(1)
    end

    it "produces deterministic byte-identical output across rebuilds" do
      write_post("2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01\ndescription: A greeting", "body")

      build
      first_hash = Digest::SHA256.file(output_dir.join("index.html")).hexdigest
      post_hash = Digest::SHA256.file(output_dir.join("posts", "hello", "index.html")).hexdigest

      build
      expect(Digest::SHA256.file(output_dir.join("index.html")).hexdigest).to eq(first_hash)
      expect(Digest::SHA256.file(output_dir.join("posts", "hello", "index.html")).hexdigest).to eq(post_hash)
    end

    it "removes stale files on a successful second build" do
      write_post("2026-08-01-keep.md", "title: Keep\ndate: 2026-08-01", "body")
      build
      output_dir.join("stale.html").write("stale")
      output_dir.join("posts", "stale", "index.html").parent.mkpath
      output_dir.join("posts", "stale", "index.html").write("stale")

      build
      expect(output_dir.join("stale.html")).not_to exist
      expect(output_dir.join("posts", "stale", "index.html")).not_to exist
      expect(output_dir.join("posts", "keep", "index.html")).to be_file
    end

    it "preserves the prior output when a staged build fails" do
      write_post("2026-08-01-keep.md", "title: Keep\ndate: 2026-08-01", "body")
      build
      original_index = output_dir.join("index.html").read

      write_post("2026-08-02-hello.md", "title: Hello\ndate: 2026-08-02", "body")
      write_post("2026-08-03-hello.md", "title: Duplicate\ndate: 2026-08-03", "body") # duplicate slug

      expect {
        build
      }.to raise_error(DevBlog::BuildError)

      expect(output_dir.join("index.html").read).to eq(original_index)
      expect(output_dir.join("posts", "keep", "index.html")).to be_file
    end

    it "rejects an output directory equal to the project root" do
      expect {
        described_class.build(
          project_root: project_root,
          source_dir: source_dir,
          output_dir: project_root
        )
      }.to raise_error(DevBlog::BuildError, /output cannot be project root/)
    end

    it "rejects source/output paths outside the project root" do
      outside = Pathname.new(Dir.mktmpdir("dev-blog-outside"))
      begin
        expect {
          described_class.build(
            project_root: project_root,
            source_dir: outside,
            output_dir: output_dir
          )
        }.to raise_error(DevBlog::BuildError, /outside project root/)

        expect {
          described_class.build(
            project_root: project_root,
            source_dir: source_dir,
            output_dir: outside
          )
        }.to raise_error(DevBlog::BuildError, /outside project root/)
      ensure
        FileUtils.remove_entry(outside) if outside.directory?
      end
    end

    it "rejects sibling-prefix and symlink paths outside the project root" do
      sibling = Pathname.new("#{project_root}-evil")
      outside = Pathname.new(Dir.mktmpdir("dev-blog-symlink-outside"))
      sibling.mkpath
      project_root.join("outside-link").make_symlink(outside)

      expect {
        build(output_dir: sibling.join("public", "dev-blog"))
      }.to raise_error(DevBlog::BuildError, /outside project root/)

      expect {
        build(output_dir: project_root.join("outside-link", "dev-blog"))
      }.to raise_error(DevBlog::BuildError, /outside project root/)
    ensure
      FileUtils.remove_entry(sibling) if defined?(sibling) && sibling.directory?
      FileUtils.remove_entry(outside) if defined?(outside) && outside.directory?
    end

    it "rejects an output directory that contains the source directory" do
      expect {
        build(output_dir: project_root.join("docs"))
      }.to raise_error(DevBlog::BuildError, /output cannot contain source directory/)
    end

    it "restores the prior output and removes temporary siblings when the staged swap fails" do
      write_post("2026-08-01-keep.md", "title: Keep\ndate: 2026-08-01", "body")
      build
      original_index = output_dir.join("index.html").read
      write_post("2026-08-02-new.md", "title: New\ndate: 2026-08-02", "body")

      staged_move_failed = false
      allow(FileUtils).to receive(:mv).and_wrap_original do |original, source, destination, *args|
        source_path = Pathname.new(source.to_s)
        if !staged_move_failed && source_path.basename.to_s.start_with?(".dev-blog-staged-")
          staged_move_failed = true
          raise IOError, "simulated staged swap failure"
        end

        original.call(source, destination, *args)
      end

      expect {
        build
      }.to raise_error(DevBlog::BuildError, /simulated staged swap failure/)

      expect(output_dir.join("index.html").read).to eq(original_index)
      expect(output_dir.join("posts", "keep", "index.html")).to be_file
      expect(output_dir.join("posts", "new", "index.html")).not_to exist
      expect(project_root.glob("**/.dev-blog-*")).to be_empty
    end

    it "removes staging and backup siblings after a successful build" do
      write_post("2026-08-01-clean.md", "title: Clean\ndate: 2026-08-01", "body")

      build

      expect(project_root.glob("**/.dev-blog-*")).to be_empty
    end

    it "rejects unsafe relative paths in the generated file map" do
      staging = project_root.join("staging")
      staging.mkpath

      expect {
        described_class.send(:write_staged, staging, { "../escape.html" => "unsafe" })
      }.to raise_error(DevBlog::BuildError, /unsafe generated output path/)
      expect(project_root.join("escape.html")).not_to exist
    end

    it "does not leak sentinel credential names or values into generated output" do
      write_post("2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01\ndescription: A greeting", "body")

      ENV["BGG_TOKEN"] = "phase12-secret-token-value"
      ENV["DOTENV_PRIVATE_KEY_BGGEEK"] = "phase12-secret-key-value"

      result = build
      result.generated_files.each do |_, bytes|
        text = bytes.dup.force_encoding("UTF-8")
        expect(text).not_to include("BGG_TOKEN")
        expect(text).not_to include("DOTENV_PRIVATE_KEY_BGGEEK")
        expect(text).not_to include("phase12-secret-token-value")
        expect(text).not_to include("phase12-secret-key-value")
      end
    ensure
      ENV.delete("BGG_TOKEN")
      ENV.delete("DOTENV_PRIVATE_KEY_BGGEEK")
    end
  end

  describe ".project_root" do
    it "returns the repository root from lib/dev_blog.rb location" do
      root = DevBlog.project_root
      expect(root.join("lib", "dev_blog.rb")).to be_file
      expect(root.join(".gitignore")).to be_file
    end
  end

  describe "plain-Ruby entrypoints" do
    let(:repository_root) { DevBlog.project_root }
    let(:cli_path) { repository_root.join("bin", "build-dev-blog") }

    def with_repository_sandbox
      temp_parent = repository_root.join("tmp")
      temp_parent.mkpath
      sandbox = Pathname.new(Dir.mktmpdir(".dev-blog-cli-spec-", temp_parent.to_s))
      yield sandbox
    ensure
      FileUtils.remove_entry(sandbox) if defined?(sandbox) && sandbox.directory?
    end

    def write_cli_post(source, filename, draft: false)
      source.mkpath
      source.join(filename).write(<<~MARKDOWN)
        ---
        title: CLI post
        date: 2026-08-02
        description: Built without Rails
        draft: #{draft}
        ---
        # CLI post
      MARKDOWN
    end

    it "builds through the executable CLI without loading Rails or leaking sentinel secrets" do
      expect(cli_path).to be_executable

      with_repository_sandbox do |sandbox|
        source = sandbox.join("source")
        output = sandbox.join("output")
        draft_output = sandbox.join("draft-output")
        write_cli_post(source, "2026-08-02-published.md")
        write_cli_post(source, "2026-08-03-draft.md", draft: true)

        environment = {
          "BGG_TOKEN" => "phase12-secret-token-value",
          "DOTENV_PRIVATE_KEY_BGGEEK" => "phase12-secret-key-value"
        }
        standalone_script = <<~RUBY
          at_exit { abort("Rails unexpectedly loaded") if defined?(Rails) }
          ARGV.replace(["--source", #{source.to_s.dump}, "--output", #{output.to_s.dump}])
          load #{cli_path.to_s.dump}
        RUBY

        stdout, stderr, status = Open3.capture3(
          environment,
          RbConfig.ruby,
          "-I#{repository_root.join('lib')}",
          "-e",
          standalone_script,
          chdir: repository_root.to_s
        )

        expect(status).to be_success
        expect(stdout).to include("Built 1 post")
        expect(stderr).to be_empty
        expect(output.join("posts", "published", "index.html")).to be_file
        expect(output.join("posts", "draft", "index.html")).not_to exist

        draft_stdout, draft_stderr, draft_status = Open3.capture3(
          environment,
          cli_path.to_s,
          "--source",
          source.to_s,
          "--output",
          draft_output.to_s,
          "--include-drafts",
          chdir: repository_root.to_s
        )

        expect(draft_status).to be_success
        expect(draft_stdout).to include("Built 2 posts")
        expect(draft_stderr).to be_empty
        expect(draft_output.join("posts", "draft", "index.html")).to be_file

        public_text = (output.glob("**/*").select(&:file?) + draft_output.glob("**/*").select(&:file?))
          .map(&:binread)
          .join
        [ stdout, stderr, draft_stdout, draft_stderr, public_text ].each do |text|
          expect(text).not_to include("BGG_TOKEN")
          expect(text).not_to include("DOTENV_PRIVATE_KEY_BGGEEK")
          expect(text).not_to include("phase12-secret-token-value")
          expect(text).not_to include("phase12-secret-key-value")
        end
      end
    end

    it "exposes a Rake wrapper without an environment prerequisite and ignores generated output" do
      stdout, stderr, status = Open3.capture3("bin/rake", "-P", chdir: repository_root.to_s)

      expect(status).to be_success, stderr
      expect(stdout).to include("rake dev_blog:build")
      expect(stdout).not_to match(/rake dev_blog:build\s*=>.*environment/)

      _ignore_stdout, ignore_stderr, ignore_status = Open3.capture3(
        "git",
        "check-ignore",
        "-q",
        "public/dev-blog/index.html",
        chdir: repository_root.to_s
      )
      expect(ignore_status).to be_success, ignore_stderr
    end
  end

  describe "tracer compatibility" do
    it "still supports the Plan 12-01 source_dir:/output_dir: keyword call" do
      source_dir.mkpath
      copy_templates_and_assets
      write_post("2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01", "body")

      result = described_class.build(source_dir: source_dir, output_dir: output_dir)
      expect(result.posts_count).to eq(1)
      expect(output_dir.join("index.html")).to be_file
    end
  end
end
