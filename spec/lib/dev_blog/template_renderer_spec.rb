# frozen_string_literal: true

require "rails_helper"
require "dev_blog"

RSpec.describe DevBlog::TemplateRenderer do
  let(:temp_dir) { Dir.mktmpdir("dev-blog-renderer-spec") }

  after do
    FileUtils.remove_entry(temp_dir) if File.directory?(temp_dir)
  end

  def write_template(name, content)
    Pathname.new(temp_dir).join(name).write(content)
  end

  def build_post(attrs = {})
    DevBlog::Post.new(
      slug: attrs.fetch(:slug, "hello"),
      title: attrs.fetch(:title, "Hello"),
      date: attrs.fetch(:date, Date.new(2026, 8, 1)),
      description: attrs.fetch(:description, "A post"),
      tags: attrs.fetch(:tags, [ "rails" ]),
      body: attrs.fetch(:body, "# Hello"),
      body_html: attrs.fetch(:body_html, "<h1>Hello</h1>"),
      draft: attrs.fetch(:draft, false)
    )
  end

  describe ".new" do
    it "accepts a validated templates directory" do
      renderer = described_class.new(templates_dir: temp_dir)
      expect(renderer.templates_dir).to eq(Pathname.new(temp_dir).expand_path)
    end

    it "expands a relative templates directory" do
      renderer = described_class.new(templates_dir: ".")
      expect(renderer.templates_dir).to eq(Pathname.new(".").expand_path)
    end

    it "raises when the templates directory does not exist" do
      missing = Pathname.new(temp_dir).join("missing")

      expect {
        described_class.new(templates_dir: missing)
      }.to raise_error(DevBlog::InvalidPost, /templates directory/)
    end

    it "raises when the templates path is not a directory" do
      file = Pathname.new(temp_dir).join("file.txt")
      file.write("x")

      expect {
        described_class.new(templates_dir: file)
      }.to raise_error(DevBlog::InvalidPost, /templates directory/)
    end
  end

  describe "#render_index" do
    it "renders the index template with escaped metadata" do
      write_template("index.html.erb", <<~ERB)
        <h1><%= h(site_title) %></h1>
        <p><%= h(site_description) %></p>
        <% posts.each do |post| %>
          <article>
            <a href="<%= post.url %>"><%= h(post.title) %></a>
            <time><%= post.date.iso8601 %></time>
            <p><%= h(post.description) %></p>
          </article>
        <% end %>
      ERB

      post = build_post(title: "<script>alert(1)</script>", description: 'foo" onload="evil()')
      renderer = described_class.new(templates_dir: temp_dir)
      html = renderer.render_index(posts: [ post ])

      expect(html).not_to include("<script>alert(1)</script>")
      expect(html).to include("&lt;script&gt;alert(1)&lt;/script&gt;")
      expect(html).not_to include('foo" onload="evil()')
      expect(html).to include(%Q(href="/blog/posts/hello/"))
    end

    it "raises a source-aware error when the index template is missing" do
      renderer = described_class.new(templates_dir: temp_dir)

      expect {
        renderer.render_index(posts: [])
      }.to raise_error(DevBlog::InvalidPost, /index.html.erb/)
    end

    it "raises for traversal-like template names" do
      write_template("index.html.erb", "<html></html>")
      write_template("post.html.erb", "<html></html>")
      write_template("evil.html.erb", "<html></html>")
      renderer = described_class.new(templates_dir: temp_dir)

      expect {
        renderer.render(template_name: "../evil", posts: [])
      }.to raise_error(DevBlog::InvalidPost, /invalid template name/)
    end
  end

  describe "#render_post" do
    it "renders the post template with escaped metadata and unescaped body_html" do
      write_template("post.html.erb", <<~ERB)
        <article>
          <h1><%= h(post.title) %></h1>
          <p class="description"><%= h(post.description) %></p>
          <time><%= post.date.iso8601 %></time>
          <div class="body"><%= body_html %></div>
        </article>
      ERB

      post = build_post(
        title: "<script>alert(1)</script>",
        description: "A \"special\" post",
        body_html: "<p>Safe converted body</p>"
      )
      renderer = described_class.new(templates_dir: temp_dir)
      html = renderer.render_post(post: post)

      expect(html).not_to include("<script>alert(1)</script>")
      expect(html).to include("&lt;script&gt;alert(1)&lt;/script&gt;")
      expect(html).to include("A &quot;special&quot; post")
      expect(html).to include("<div class=\"body\"><p>Safe converted body</p></div>")
    end

    it "exposes no generic raw helper" do
      write_template("post.html.erb", "<%= raw(\"<script>\") %>")
      renderer = described_class.new(templates_dir: temp_dir)

      expect {
        renderer.render_post(post: build_post)
      }.to raise_error(NameError, /raw/)
    end

    it "raises a source-aware error when the post template is missing" do
      write_template("index.html.erb", "<html></html>")
      renderer = described_class.new(templates_dir: temp_dir)

      expect {
        renderer.render_post(post: build_post)
      }.to raise_error(DevBlog::InvalidPost, /post.html.erb/)
    end
  end

  describe "template isolation" do
    it "only loads index.html.erb and post.html.erb from the templates directory" do
      write_template("index.html.erb", "<html>index</html>")
      write_template("post.html.erb", "<html>post</html>")
      write_template("other.html.erb", "<html>other</html>")

      renderer = described_class.new(templates_dir: temp_dir)
      expect(renderer.render_index(posts: [])).to include("index")
      expect(renderer.render_post(post: build_post)).to include("post")

      expect {
        renderer.render(template_name: "other", posts: [])
      }.to raise_error(DevBlog::InvalidPost, /invalid template name/)
    end

    it "rejects an absolute template path outside the templates directory" do
      write_template("index.html.erb", "<html></html>")
      write_template("post.html.erb", "<html></html>")
      renderer = described_class.new(templates_dir: temp_dir)

      expect {
        renderer.render(template_name: "/etc/passwd", posts: [])
      }.to raise_error(DevBlog::InvalidPost, /invalid template name/)
    end
  end

  describe "error handling" do
    it "does not include template source or filesystem paths in source-aware errors" do
      write_template("index.html.erb", "<html></html>")
      renderer = described_class.new(templates_dir: temp_dir)

      expect {
        renderer.render(template_name: "missing.html.erb", posts: [])
      }.to raise_error(DevBlog::InvalidPost, /invalid template name/)
    end
  end
end
