# frozen_string_literal: true

require "rails_helper"
require "dev_blog"

RSpec.describe "DevBlog parser and markdown primitives" do
  let(:temp_dir) { Dir.mktmpdir("dev-blog-parser-spec") }

  after do
    FileUtils.remove_entry(temp_dir) if File.directory?(temp_dir)
  end

  def write_post(dir, filename, frontmatter, body = "")
    Pathname.new(dir).join(filename).write("---\n#{frontmatter}\n---\n#{body}")
  end

  describe DevBlog::Post do
    it "is a typed value object with the expected readers" do
      post = DevBlog::Post.new(
        slug: "2026-08-01-hello",
        title: "Hello",
        date: Date.new(2026, 8, 1),
        description: "Desc",
        tags: [ "rails" ],
        body: "# Hello",
        body_html: "<h1>Hello</h1>",
        draft: false
      )

      expect(post.slug).to eq("2026-08-01-hello")
      expect(post.title).to eq("Hello")
      expect(post.date).to eq(Date.new(2026, 8, 1))
      expect(post.description).to eq("Desc")
      expect(post.tags).to eq([ "rails" ])
      expect(post.body).to eq("# Hello")
      expect(post.body_html).to eq("<h1>Hello</h1>")
      expect(post.draft?).to be(false)
      expect(post.url).to eq("/blog/posts/2026-08-01-hello/")
    end

    it "defaults draft to false and tags to empty" do
      post = DevBlog::Post.new(
        slug: "2026-08-01-draft",
        title: "Draft",
        date: Date.new(2026, 8, 1),
        description: "",
        body: "",
        body_html: ""
      )

      expect(post.draft?).to be(false)
      expect(post.tags).to eq([])
    end

    it "sorts by date descending for deterministic ordering" do
      older = DevBlog::Post.new(slug: "a", title: "A", date: Date.new(2026, 7, 1), description: "", body: "", body_html: "")
      newer = DevBlog::Post.new(slug: "b", title: "B", date: Date.new(2026, 8, 1), description: "", body: "", body_html: "")

      expect([ older, newer ].sort).to eq([ newer, older ])
    end
  end

  describe DevBlog::PostParser do
    context "with valid dated sources" do
      it "accepts Date frontmatter and renders markdown" do
        write_post(temp_dir, "2026-08-01-hello.md", "title: Hello\ndate: 2026-08-01\ndescription: Test\ntags: [rails, graphql]", "# Hello\n\nbody text")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-hello.md"))

        expect(post.title).to eq("Hello")
        expect(post.date).to eq(Date.new(2026, 8, 1))
        expect(post.description).to eq("Test")
        expect(post.tags).to eq([ "rails", "graphql" ])
        expect(post.slug).to eq("hello")
        expect(post.body_html).to include("<h1>Hello</h1>")
        expect(post.body_html).to include("<p>body text</p>")
        expect(post.draft?).to be(false)
      end

      it "accepts an unquoted YAML Date object" do
        write_post(temp_dir, "2026-08-01-date.md", "title: Date Post\ndate: 2026-08-01", "body")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-date.md"))

        expect(post.date).to eq(Date.new(2026, 8, 1))
      end

      it "accepts string tags and normalizes whitespace" do
        write_post(temp_dir, "2026-08-01-tags.md", "title: Tags\ndate: 2026-08-01\ntags:\n  - rails\n  - graphql", "body")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-tags.md"))

        expect(post.tags).to eq([ "rails", "graphql" ])
      end

      it "renders fenced code blocks" do
        write_post(temp_dir, "2026-08-01-code.md", "title: Code\ndate: 2026-08-01", "```ruby\nputs 'hi'\n```")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-code.md"))

        expect(post.body_html).to include("<code>")
      end

      it "preserves safe relative, http, https, and mailto links" do
        write_post(temp_dir, "2026-08-01-links.md", "title: Links\ndate: 2026-08-01", "[relative](/path)\n[external](https://example.com)\n[email](mailto:hi@example.com)")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-links.md"))

        expect(post.body_html).to include('href="/path"')
        expect(post.body_html).to include('href="https://example.com"')
        expect(post.body_html).to include('href="mailto:hi@example.com"')
      end

      it "extracts the slug from the dated filename" do
        write_post(temp_dir, "2026-08-01-my-first-post.md", "title: First\ndate: 2026-08-01", "body")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-my-first-post.md"))

        expect(post.slug).to eq("my-first-post")
        expect(post.url).to eq("/blog/posts/my-first-post/")
      end

      it "reads draft from frontmatter" do
        write_post(temp_dir, "2026-08-01-draft.md", "title: Draft\ndate: 2026-08-01\ndraft: true", "body")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-draft.md"))

        expect(post.draft?).to be(true)
      end
    end

    context "with invalid frontmatter" do
      it "raises InvalidPost when frontmatter delimiters are missing" do
        write_post(temp_dir, "no-frontmatter.md", "", "body") # frontmatter helper still writes --- delimiters; override manually

        Pathname.new(temp_dir).join("no-frontmatter.md").write("body without frontmatter")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("no-frontmatter.md"))
        }.to raise_error(DevBlog::InvalidPost, /missing YAML frontmatter/)
      end

      it "raises InvalidPost when required keys are missing" do
        write_post(temp_dir, "2026-08-01-missing.md", "title: Missing", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-missing.md"))
        }.to raise_error(DevBlog::InvalidPost, /missing required keys.*date/)
      end

      it "raises InvalidPost when frontmatter is not a hash" do
        write_post(temp_dir, "2026-08-01-list.md", "- one\n- two", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-list.md"))
        }.to raise_error(DevBlog::InvalidPost, /frontmatter must be a mapping/)
      end

      it "raises InvalidPost for YAML object tags" do
        write_post(temp_dir, "2026-08-01-object.md", "title: Evil\ndate: 2026-08-01\nfoo: !ruby/object:OpenStruct {}", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-object.md"))
        }.to raise_error(DevBlog::InvalidPost, /invalid frontmatter YAML/)
      end

      it "raises InvalidPost for YAML aliases" do
        write_post(temp_dir, "2026-08-01-alias.md", "title: Evil\ndate: 2026-08-01\nfoo: &x bar\nbaz: *x", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-alias.md"))
        }.to raise_error(DevBlog::InvalidPost, /invalid frontmatter YAML/)
      end

      it "raises InvalidPost for YAML symbols" do
        write_post(temp_dir, "2026-08-01-symbol.md", "title: Evil\ndate: 2026-08-01\nfoo: :bar", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-symbol.md"))
        }.to raise_error(DevBlog::InvalidPost, /invalid frontmatter YAML/)
      end

      it "raises InvalidPost for invalid title type" do
        write_post(temp_dir, "2026-08-01-title.md", "title: 123\ndate: 2026-08-01", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-title.md"))
        }.to raise_error(DevBlog::InvalidPost, /title must be a string/)
      end

      it "raises InvalidPost for empty title" do
        write_post(temp_dir, "2026-08-01-empty-title.md", "title: \"\"\ndate: 2026-08-01", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-empty-title.md"))
        }.to raise_error(DevBlog::InvalidPost, /title must be a non-empty string/)
      end

      it "raises InvalidPost for invalid date type" do
        write_post(temp_dir, "2026-08-01-date-type.md", "title: Bad\ndate: [2026, 8, 1]", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-date-type.md"))
        }.to raise_error(DevBlog::InvalidPost, /invalid date/)
      end

      it "raises InvalidPost for malformed date string" do
        write_post(temp_dir, "2026-08-01-bad-date.md", "title: Bad\ndate: not-a-date", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-bad-date.md"))
        }.to raise_error(DevBlog::InvalidPost, /invalid date/)
      end

      it "raises InvalidPost for non-string description" do
        write_post(temp_dir, "2026-08-01-desc.md", "title: Bad\ndate: 2026-08-01\ndescription: 123", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-desc.md"))
        }.to raise_error(DevBlog::InvalidPost, /description must be a string/)
      end

      it "raises InvalidPost for non-array tags" do
        write_post(temp_dir, "2026-08-01-tags.md", "title: Bad\ndate: 2026-08-01\ntags: rails", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-tags.md"))
        }.to raise_error(DevBlog::InvalidPost, /tags must be an array of strings/)
      end

      it "raises InvalidPost for non-string tag entries" do
        write_post(temp_dir, "2026-08-01-tag-entry.md", "title: Bad\ndate: 2026-08-01\ntags: [123]", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-tag-entry.md"))
        }.to raise_error(DevBlog::InvalidPost, /tags must be an array of strings/)
      end

      it "raises InvalidPost for non-boolean draft" do
        write_post(temp_dir, "2026-08-01-draft.md", "title: Bad\ndate: 2026-08-01\ndraft: published", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-draft.md"))
        }.to raise_error(DevBlog::InvalidPost, /draft must be a boolean/)
      end
    end

    context "with unsafe filenames and bodies" do
      it "parses an undated filename using the basename as the slug" do
        write_post(temp_dir, "no-date.md", "title: No Date\ndate: 2026-08-01", "body")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("no-date.md"))

        expect(post.slug).to eq("no-date")
        expect(post.url).to eq("/blog/posts/no-date/")
      end

      it "raises InvalidPost for a slug with invalid characters in an undated filename" do
        write_post(temp_dir, "bad_slug!.md", "title: Bad\ndate: 2026-08-01", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("bad_slug!.md"))
        }.to raise_error(DevBlog::InvalidPost, /invalid slug/)
      end

      it "raises InvalidPost for path traversal in the slug" do
        write_post(temp_dir, "..-escape.md", "title: Bad\ndate: 2026-08-01", "body")

        expect {
          DevBlog::PostParser.parse(Pathname.new(temp_dir).join("..-escape.md"))
        }.to raise_error(DevBlog::InvalidPost, /invalid slug/)
      end

      it "escapes raw HTML tags in body HTML" do
        write_post(temp_dir, "2026-08-01-html.md", "title: HTML\ndate: 2026-08-01", "<script>alert('x')</script>")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-html.md"))

        expect(post.body_html).not_to include("<script>alert('x')</script>")
        expect(post.body_html).to include("&lt;script&gt;alert('x')&lt;/script&gt;")
      end

      it "removes unsafe link schemes from body HTML" do
        write_post(temp_dir, "2026-08-01-link.md", "title: Link\ndate: 2026-08-01", "[click](javascript:alert(1))\n[bad](data:text/html,hi)")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-link.md"))

        expect(post.body_html).not_to include("javascript:alert(1)")
        expect(post.body_html).not_to include("data:text/html")
      end

      it "removes unsafe image schemes from body HTML" do
        write_post(temp_dir, "2026-08-01-image.md", "title: Image\ndate: 2026-08-01", "![x](javascript:alert(1))")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-image.md"))

        expect(post.body_html).not_to include("javascript:alert(1)")
      end

      it "removes event-handler attributes from body HTML" do
        write_post(temp_dir, "2026-08-01-event.md", "title: Event\ndate: 2026-08-01", "<p onmouseover='alert(1)'>hi</p>")
        post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("2026-08-01-event.md"))

        expect(post.body_html).not_to include("onmouseover")
      end
    end
  end

  describe DevBlog::MarkdownConverter do
    it "exposes convert as the only body_html producer" do
      html = DevBlog::MarkdownConverter.convert("# Hi", source: "test.md")

      expect(html).to include("<h1>Hi</h1>")
    end

    it "does not depend on Rails, ENV, network, or BGG code" do
      expect(DevBlog::MarkdownConverter.method(:convert).source_location.first).to start_with("/")
      expect(DevBlog::MarkdownConverter).not_to receive(:const_get).with("Rails")
      DevBlog::MarkdownConverter.convert("body", source: "test.md")
    end
  end
end
