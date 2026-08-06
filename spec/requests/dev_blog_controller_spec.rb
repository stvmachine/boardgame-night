# frozen_string_literal: true

require "rails_helper"
require "dev_blog"
require "fileutils"

RSpec.describe "DevBlogController", type: :request do
  BLOG_HOST = "blog.example.test"
  PRIMARY_HOST = "app.example.test"
  SENTINEL_ENV = "phase12-sentinel"

  KNOWN_POST_SLUG = "authentication-with-rails-built-ins"
  KNOWN_ADR_SLUG = "001-monorepo-rails-api-vue-spa"

  def with_env(key, value)
    original = ENV[key]
    ENV[key] = value
    begin
      yield
    ensure
      ENV[key] = original
    end
  end

  def assert_static_html_headers!
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    expect(response.headers["Content-Security-Policy"]).to include("default-src 'none'")
    expect(response.headers["Content-Security-Policy"]).to include("script-src 'none'")
  end

  before(:all) do
    @pre_existing_output = Rails.public_path.join("dev-blog").directory?

    # Build a fresh site in the public location so the controller can serve it.
    ENV["BGG_TOKEN"] = SENTINEL_ENV
    ENV["DOTENV_PRIVATE_KEY_BGGEEK"] = SENTINEL_ENV
    FileUtils.rm_rf(Rails.public_path.join("dev-blog"))
    DevBlog::Builder.build(
      project_root: DevBlog.project_root,
      source_dir: DevBlog.project_root.join("docs", "development"),
      output_dir: Rails.public_path.join("dev-blog"),
      adr_catalog_path: DevBlog.project_root.join("docs", "adr", "README.md")
    )
  ensure
    ENV.delete("BGG_TOKEN")
    ENV.delete("DOTENV_PRIVATE_KEY_BGGEEK")
  end

  after(:all) do
    # Only remove the output if we generated it ourselves. If it was already
    # present before the suite, leave it in place for other consumers.
    FileUtils.rm_rf(Rails.public_path.join("dev-blog")) unless @pre_existing_output
  end

  around(:each) do |example|
    with_env("DEV_BLOG_HOST", nil) do
      example.run
    end
  end

  describe "configured-host routing" do
    it "serves the index at root" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/"

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("text/html")
        expect(response.body).to include("Engineering posts")
        assert_static_html_headers!
      end
    end

    it "serves the stylesheet" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/styles.css"

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("text/css")
        expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
        expect(response.body).to include("--accent")
      end
    end

    it "serves a known post" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/posts/#{KNOWN_POST_SLUG}/"

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("text/html")
        expect(response.body).to include("authentication")
        assert_static_html_headers!
      end
    end

    it "serves a known ADR" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/adrs/#{KNOWN_ADR_SLUG}/"

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("text/html")
        expect(response.body).to include("Architecture Decision Record")
        expect(response.body).to include("Historical note")
        assert_static_html_headers!
      end
    end

    it "keeps the health check available" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/up"

        expect(response).to have_http_status(:ok)
      end
    end

    it "returns 404 for unknown paths and does not fall through to the SPA" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/no-such-page"

        expect(response).to have_http_status(:not_found)
        expect(response.body).to be_empty
      end
    end

    it "returns 404 for non-GET methods on the blog host" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        post "/posts/#{KNOWN_POST_SLUG}/"

        expect(response).to have_http_status(:not_found)
      end
    end

    it "does not serve application routes on the blog host" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/graphql"

        expect(response).to have_http_status(:not_found)
      end
    end

    it "rejects traversal attempts" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/posts/%2e%2e%2fstyles.css"

        expect(response).to have_http_status(:not_found)
      end
    end

    it "rejects requested extensions" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/posts/#{KNOWN_POST_SLUG}.json"

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with invalid DEV_BLOG_HOST values" do
      %w[
        https://blog.example.test
        blog.example.test:8080
        blog.example.test/sub
        *.example.test
        blog..example.test
        blog example.test
        blog.example.test\t
        blog
        .example.test
      ].each do |invalid|
        it "does not activate the host route for #{invalid.inspect}" do
          with_env("DEV_BLOG_HOST", invalid) do
            host! BLOG_HOST
            get "/"

            # Falls through to the SPA catch-all, which is HTML from the app.
            expect(response).to have_http_status(:ok)
            expect(response.body).not_to include("Engineering posts")
          end
        end
      end
    end
  end

  describe "primary-host /blog/ routing" do
    it "redirects /blog to /blog/" do
      host! PRIMARY_HOST
      get "/blog"

      expect(response).to have_http_status(:moved_permanently)
      expect(response.headers["Location"]).to end_with("/blog/")
    end

    it "serves the index at /blog/" do
      host! PRIMARY_HOST
      get "/blog/"

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/html")
      expect(response.body).to include("Engineering posts")
      assert_static_html_headers!
    end

    it "serves the stylesheet under /blog/" do
      host! PRIMARY_HOST
      get "/blog/styles.css"

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/css")
      expect(response.body).to include("--accent")
    end

    it "serves a known post under /blog/" do
      host! PRIMARY_HOST
      get "/blog/posts/#{KNOWN_POST_SLUG}/"

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/html")
      expect(response.body).to include("authentication")
      assert_static_html_headers!
    end

    it "serves a known ADR under /blog/" do
      host! PRIMARY_HOST
      get "/blog/adrs/#{KNOWN_ADR_SLUG}/"

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/html")
      expect(response.body).to include("Architecture Decision Record")
      assert_static_html_headers!
    end

    it "returns 404 for unknown /blog paths and does not fall through to the SPA" do
      host! PRIMARY_HOST
      get "/blog/no-such-page"

      expect(response).to have_http_status(:not_found)
      expect(response.body).to be_empty
    end

    it "returns 404 for traversal under /blog/" do
      host! PRIMARY_HOST
      get "/blog/posts/%2e%2e%2fstyles.css"

      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for requested extensions under /blog/" do
      host! PRIMARY_HOST
      get "/blog/posts/#{KNOWN_POST_SLUG}.json"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "shared safety" do
    it "returns 404 for a missing post on both mounts" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/posts/does-not-exist/"
        expect(response).to have_http_status(:not_found)
      end

      host! PRIMARY_HOST
      get "/blog/posts/does-not-exist/"
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for a missing ADR on both mounts" do
      with_env("DEV_BLOG_HOST", BLOG_HOST) do
        host! BLOG_HOST
        get "/adrs/999-does-not-exist/"
        expect(response).to have_http_status(:not_found)
      end

      host! PRIMARY_HOST
      get "/blog/adrs/999-does-not-exist/"
      expect(response).to have_http_status(:not_found)
    end
  end
end
