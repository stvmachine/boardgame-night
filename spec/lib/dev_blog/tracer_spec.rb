# frozen_string_literal: true

require "rails_helper"
require "dev_blog"

RSpec.describe DevBlog do
  let(:temp_dir) { Dir.mktmpdir("dev-blog-spec") }

  after do
    FileUtils.remove_entry(temp_dir) if File.directory?(temp_dir)
  end

  def write_post(dir, filename, frontmatter, body = "")
    Pathname.new(dir).join(filename).write("---\n#{frontmatter}\n---\n#{body}")
  end

  describe ".PostParser" do
    it "accepts Date frontmatter and renders markdown" do
      write_post(temp_dir, "valid.md", "title: Hello\ndate: 2026-08-01\ndescription: Test", "# Hello\n\nbody text")
      post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("valid.md"))

      expect(post.title).to eq("Hello")
      expect(post.date).to eq(Date.new(2026, 8, 1))
      expect(post.description).to eq("Test")
      expect(post.body_html).to include("<h1>Hello</h1>")
      expect(post.body_html).to include("<p>body text</p>")
    end

    it "rejects object tags without constructing objects" do
      write_post(temp_dir, "object.md", "title: Evil\ndate: 2026-08-01\nfoo: !ruby/object:OpenStruct {}", "body")

      expect {
        DevBlog::PostParser.parse(Pathname.new(temp_dir).join("object.md"))
      }.to raise_error(DevBlog::InvalidPost, /invalid frontmatter YAML/)
    end

    it "rejects YAML aliases" do
      write_post(temp_dir, "alias.md", "title: Evil\ndate: 2026-08-01\nfoo: &x bar\nbaz: *x", "body")

      expect {
        DevBlog::PostParser.parse(Pathname.new(temp_dir).join("alias.md"))
      }.to raise_error(DevBlog::InvalidPost, /invalid frontmatter YAML/)
    end
  end

  describe ".MarkdownConverter" do
    it "escapes title/description metadata and rejects raw scripts" do
      title = "<script>alert(1)</script>"
      description = 'foo" onload="evil()'
      body = "<script>alert('x')</script>\n\n[click](javascript:alert(1))"

      write_post(temp_dir, "escape.md", "title: #{title}\ndate: 2026-08-01\ndescription: #{description}", body)
      post = DevBlog::PostParser.parse(Pathname.new(temp_dir).join("escape.md"))

      html = DevBlog::Builder.render_index([ post ])

      expect(html).not_to include("<script>alert(1)</script>")
      expect(html).to include("&lt;script&gt;alert(1)&lt;/script&gt;")
      expect(html).not_to include('foo" onload="evil()')
      expect(html).not_to include("javascript:alert(1)")
      expect(post.body_html).not_to include("<script>alert('x')</script>")
      expect(post.body_html).to include("&lt;script&gt;alert('x')&lt;/script&gt;")
    end
  end

  describe ".Builder" do
    it "does not leak BGG or credential values from the environment" do
      write_post(temp_dir, "secrets.md", "title: Secrets\ndate: 2026-08-01\ndescription: x", "body")

      old_token = ENV["BGG_TOKEN"]
      old_key = ENV["DOTENV_PRIVATE_KEY_BGGEEK"]
      ENV["BGG_TOKEN"] = "supersecrettoken123"
      ENV["DOTENV_PRIVATE_KEY_BGGEEK"] = "pk_deadbeef"

      output = Pathname.new(temp_dir).join("out")
      DevBlog::Builder.build(source_dir: temp_dir, output_dir: output)
      html = output.join("index.html").read

      expect(html).not_to include("BGG_TOKEN")
      expect(html).not_to include("DOTENV_PRIVATE_KEY_BGGEEK")
      expect(html).not_to include("supersecrettoken123")
      expect(html).not_to include("pk_deadbeef")
    ensure
      ENV["BGG_TOKEN"] = old_token if defined?(old_token)
      ENV["DOTENV_PRIVATE_KEY_BGGEEK"] = old_key if defined?(old_key)
    end
  end

  describe "GET /blog" do
    it "redirects /blog to /blog/ and routes before the SPA wildcard" do
      write_post(temp_dir, "route.md", "title: Routed\ndate: 2026-08-01\ndescription: x", "body")
      public_dir = Pathname.new(temp_dir).join("public")
      DevBlog::Builder.build(source_dir: temp_dir, output_dir: public_dir.join("dev-blog"))

      allow(Rails).to receive(:public_path).and_return(public_dir)

      redirect = Rack::MockRequest.new(Rails.application).get("/blog")
      expect(redirect.status).to eq(301)
      expect(redirect.headers["Location"]).to end_with("/blog/")

      response = Rack::MockRequest.new(Rails.application).get("/blog/")
      expect(response.status).to eq(200)
      expect(response.body).to include("Routed")
      expect(response["Content-Type"]).to include("text/html")

      route = Rails.application.routes.recognize_path("/blog/")
      expect(route[:controller]).to eq("dev_blog")
      expect(route[:action]).to eq("blog_entry")
    end

    it "returns 404 when /blog/ generated index is missing" do
      empty_public = Pathname.new(temp_dir).join("public")
      empty_public.mkpath
      allow(Rails).to receive(:public_path).and_return(empty_public)

      response = Rack::MockRequest.new(Rails.application).get("/blog/")
      expect(response.status).to eq(404)
    end
  end
end
