# frozen_string_literal: true

require "rails_helper"
require "dev_blog"
require "fileutils"
require "nokogiri"
require "pathname"
require "securerandom"

RSpec.describe "DevBlog delivery" do
  SENTINEL_ENV = "phase12-sentinel" # matches other phase-12 test suites

  SENSITIVE_NAMES = [
    "BGG_TOKEN",
    "DOTENV_PRIVATE_KEY_BGGEEK",
    "RAILS_MASTER_KEY",
  ].freeze

  SENSITIVE_VALUES = [
    SENTINEL_ENV,
    "phase12-key-sentinel",
    "phase12-master-sentinel",
  ].freeze

  let(:project_root) { DevBlog.project_root }
  let(:source_dir) { project_root.join("docs", "development") }
  let(:adr_catalog_path) { project_root.join("docs", "adr", "README.md") }
  before(:all) do
    # Build into a temporary directory under the project root so the builder's
    # path-safety check passes and we can inspect output independently of
    # public/ and the request specs.
    ENV["BGG_TOKEN"] = SENTINEL_ENV
    ENV["DOTENV_PRIVATE_KEY_BGGEEK"] = SENTINEL_ENV

    tmp_base = DevBlog.project_root.join("tmp")
    FileUtils.mkdir_p(tmp_base)
    @output_dir = tmp_base.join("dev-blog-delivery-#{SecureRandom.hex(4)}")
    FileUtils.mkdir_p(@output_dir)

    @result = DevBlog::Builder.build(
      project_root: DevBlog.project_root,
      source_dir: DevBlog.project_root.join("docs", "development"),
      output_dir: @output_dir,
      adr_catalog_path: DevBlog.project_root.join("docs", "adr", "README.md")
    )

    ENV.delete("BGG_TOKEN")
    ENV.delete("DOTENV_PRIVATE_KEY_BGGEEK")
  end

  after(:all) do
    FileUtils.rm_rf(@output_dir) if @output_dir&.directory?
  end

  def html_doc(path)
    Nokogiri.HTML5(path.read)
  end

  def assert_valid_html_document!(path, article_class: "post")
    doc = html_doc(path)

    expect(doc.at_css("html")).to be_present, "#{path} missing <html>"
    expect(doc.at_css("head")).to be_present, "#{path} missing <head>"
    expect(doc.at_css("title")).to be_present, "#{path} missing <title>"
    expect(doc.at_css("body")).to be_present, "#{path} missing <body>"
    expect(doc.at_css("main")).to be_present, "#{path} missing <main>"
    expect(doc.at_css("article.#{article_class}")).to be_present, "#{path} missing <article class='#{article_class}'>"
    expect(doc.at_css("h1")).to be_present, "#{path} missing <h1>"
  end

  it "builds the expected number of posts and accepted ADRs" do
    expect(@result.posts_count).to be >= 6
    expect(@result.adrs_count).to be >= 14
  end

  it "generates an index with links to every post and accepted ADR" do
    index_path = @output_dir.join("index.html")
    expect(index_path).to be_file

    doc = html_doc(index_path)
    expect(doc.at_css("title")).to be_present

    post_links = doc.css("section.posts ol.post-list li a").map { |a| a["href"] }
    expected_post_links = @result.posts.map { |post| "./posts/#{post.slug}/" }
    expect(post_links).to include(*expected_post_links)

    adr_links = doc.css("section.adrs ol.post-list li a").map { |a| a["href"] }
    expected_adr_links = @result.adrs.map { |adr| "./adrs/#{adr.output_slug}/" }
    expect(adr_links).to include(*expected_adr_links)
  end

  it "renders a valid HTML page for every post" do
    @result.posts.each do |post|
      path = @output_dir.join("posts", post.slug, "index.html")
      expect(path).to be_file, "missing post page for #{post.slug}"

      assert_valid_html_document!(path, article_class: "post")
      doc = html_doc(path)
      expect(doc.at_css("title").text.strip).to eq(post.title)
      expect(doc.at_css("h1").text.strip).to eq(post.title)
      expect(doc.at_css("link[rel='stylesheet']")["href"]).to eq("../../styles.css")
    end
  end

  it "renders a valid HTML page for every accepted ADR with a historical notice" do
    @result.adrs.each do |adr|
      path = @output_dir.join("adrs", adr.output_slug, "index.html")
      expect(path).to be_file, "missing ADR page for #{adr.output_slug}"

      assert_valid_html_document!(path, article_class: "adr")
      doc = html_doc(path)
      expect(doc.at_css("title").text.strip).to eq(adr.title)
      expect(doc.at_css("h1").text.strip).to eq(adr.title)
      expect(doc.at_css("aside.historical-notice")).to be_present,
        "#{path} missing historical notice"
      expect(doc.at_css("link[rel='stylesheet']")["href"]).to eq("../../styles.css")
    end
  end

  it "emits a stylesheet" do
    stylesheet = @output_dir.join("styles.css")
    expect(stylesheet).to be_file
    expect(stylesheet.read).to be_present
  end

  it "generates output whose post slugs match the dated source posts" do
    expected_slugs = DevBlog::Builder.discover_dated_posts(source_dir).map(&:slug)
    output_slugs = @result.posts.map(&:slug)
    expect(output_slugs).to match_array(expected_slugs)
  end

  it "generates output whose ADR slugs match the accepted ADR catalog" do
    expected_adrs = DevBlog::AdrCatalog.load(
      index_path: adr_catalog_path,
      project_root: project_root
    )
    expected_slugs = expected_adrs.map(&:output_slug)
    output_slugs = @result.adrs.map(&:output_slug)
    expect(output_slugs).to match_array(expected_slugs)
  end

  it "does not leak sentinel credential names or values into any generated file" do
    sensitive_patterns = (SENSITIVE_NAMES + SENSITIVE_VALUES).reject(&:empty?)

    generated_files = @output_dir.glob("**/*").select(&:file?)
    expect(generated_files).not_to be_empty

    generated_files.each do |path|
      text = path.read
      sensitive_patterns.each do |pattern|
        expect(text).not_to include(pattern),
          "#{path.relative_path_from(@output_dir)} contains #{pattern.inspect}"
      end
    end
  end

  it "does not contain executable raw HTML in generated pages" do
    html_files = @output_dir.glob("**/*.html")
    expect(html_files).not_to be_empty

    html_files.each do |path|
      doc = Nokogiri.HTML5(path.read)
      expect(doc.css("script")).to be_empty,
        "unexpected <script> in #{path.relative_path_from(@output_dir)}"

      event_attrs = doc.xpath("//@*").select { |attr| attr.name.match?(/\Aon/i) }
      expect(event_attrs).to be_empty,
        "unexpected event attribute in #{path.relative_path_from(@output_dir)}"
    end
  end
end
