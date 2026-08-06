# frozen_string_literal: true

require "rails_helper"
require "dev_blog"
require "nokogiri"
require "fileutils"

RSpec.describe "DevBlog content pipeline" do
  EXPECTED_POSTS = %w[
    board-game-night-lifecycle
    challenges-and-decisions
    graphql-wiring-react-to-rails
    merged-collection-query-deep-dive
    authentication-with-rails-built-ins
  ].freeze

  before(:all) do
    tmp_parent = DevBlog.project_root.join("tmp")
    tmp_parent.mkpath

    @output_dir = Pathname.new(Dir.mktmpdir(".dev-blog-content-pipeline-", tmp_parent.to_s))

    ENV["BGG_TOKEN"] = "phase12-secret-sentinel"
    ENV["DOTENV_PRIVATE_KEY_BGGEEK"] = "phase12-key-sentinel"

    @result = DevBlog::Builder.build(
      project_root: DevBlog.project_root,
      source_dir: DevBlog.project_root.join("docs", "development"),
      output_dir: @output_dir,
      adr_catalog_path: DevBlog.project_root.join("docs", "adr", "README.md")
    )
  end

  after(:all) do
    FileUtils.remove_entry(@output_dir) if @output_dir&.directory?
    ENV.delete("BGG_TOKEN")
    ENV.delete("DOTENV_PRIVATE_KEY_BGGEEK")
  end

  it "builds a result with five dated posts and all accepted ADRs" do
    expect(@result).to be_a(DevBlog::BuildResult)
    expect(@result.posts_count).to eq(5)
    expect(@result.adrs_count).to be >= 14
  end

  it "links every dated post from the index in date-descending slug order" do
    index_path = @output_dir.join("index.html")
    expect(index_path).to be_file

    index_html = index_path.read
    doc = Nokogiri::HTML5(index_html)
    post_links = doc.css("section.posts ol.post-list li a")
      .map { |a| a["href"] }
      .select { |href| href.start_with?("./posts/") }

    slugs = post_links.map { |href| href.sub(%r{\A./posts/}, "").sub(%r{/\z}, "") }

    expect(slugs).to eq(EXPECTED_POSTS)
  end

  it "renders a valid, substantive HTML page for every dated post" do
    EXPECTED_POSTS.each do |slug|
      post_path = @output_dir.join("posts", slug, "index.html")
      expect(post_path).to be_file

      html = post_path.read
      doc = Nokogiri::HTML5(html)

      expect(doc.at_css("html")).to be_present
      expect(doc.at_css("title")).to be_present
      expect(doc.at_css("body")).to be_present
      expect(doc.at_css("article.post")).to be_present
      expect(doc.at_css("article.post h1")).to be_present

      body_node = doc.at_css("div.post-body")
      expect(body_node).to be_present
      expect(body_node.text.gsub(/\s+/, " ").strip.length).to be > 300
    end
  end

  it "does not leak sentinel credential names or values into any generated file" do
    secrets = [
      "BGG_TOKEN",
      "DOTENV_PRIVATE_KEY_BGGEEK",
      "phase12-secret-sentinel",
      "phase12-key-sentinel"
    ]

    @result.generated_files.each do |relative_path, bytes|
      text = bytes.dup.force_encoding("UTF-8")
      secrets.each do |secret|
        expect(text).not_to include(secret),
          "found secret #{secret.inspect} in generated #{relative_path}"
      end
    end
  end

  it "does not contain executable raw HTML in generated pages" do
    html_files = @output_dir.glob("**/*.html")
    expect(html_files).not_to be_empty

    html_files.each do |path|
      doc = Nokogiri::HTML5(path.read)

      expect(doc.css("script")).to be_empty,
        "unexpected <script> in #{path.relative_path_from(@output_dir)}"

      event_attrs = doc.xpath("//@*").select { |attr| attr.name.match?(/\Aon/i) }
      expect(event_attrs).to be_empty,
        "unexpected event attribute in #{path.relative_path_from(@output_dir)}"
    end
  end

  it "preserves the accepted ADR output from Plan 12-04" do
    index_html = @output_dir.join("index.html").read
    expect(index_html).to include("<h2>Architecture Decisions</h2>")
    expect(index_html).to include("./adrs/001-monorepo-rails-api-vue-spa/")

    adr_page = @output_dir.join("adrs", "001-monorepo-rails-api-vue-spa", "index.html")
    expect(adr_page).to be_file

    doc = Nokogiri::HTML5(adr_page.read)
    expect(doc.at_css("aside.historical-notice")).to be_present
    expect(doc.at_css("article.adr")).to be_present

    @result.adrs.each do |adr|
      expect(@output_dir.join("adrs", adr.output_slug, "index.html")).to be_file
    end
  end

  it "flags any dated post that still presents superseded Vue/Pinia behavior as current" do
    source_dir = DevBlog.project_root.join("docs", "development")
    dated_posts = source_dir
      .children
      .select { |path| path.file? && path.basename.to_s.match?(/\A\d{4}-\d{2}-\d{2}-.*\.md\z/) }

    expect(dated_posts.size).to eq(5)

    dated_posts.each do |path|
      body = DevBlog::PostParser.parse(path).body
      expect(body).not_to match(/\b(?:Vue|Pinia|@vue)\b/),
        "#{path.basename} contains unlabeled superseded frontend references"
    end
  end
end
