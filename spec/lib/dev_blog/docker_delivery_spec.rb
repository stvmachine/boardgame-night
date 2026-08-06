# frozen_string_literal: true

require "rails_helper"
require "dev_blog"
require "open3"
require "yaml"
require "pathname"

RSpec.describe "DevBlog Docker delivery" do
  IMAGE_TAG = "boardgame-night-dev-blog:phase12".freeze
  KAMAL_TIMEOUT = 60

  def run!(*cmd, env: {})
    merged_env = ENV.to_h.merge(env)
    stdout, stderr, status = Open3.capture3(merged_env, *cmd)
    unless status.success?
      raise "command failed: #{cmd.join(' ')}\n#{stderr}\n#{stdout}"
    end

    [stdout, stderr]
  end

  describe "Dockerfile" do
    let(:dockerfile) { Rails.root.join("Dockerfile").read }
    let(:lines) { dockerfile.lines }

    it "runs bin/build-dev-blog in the Ruby image stage after the application is copied" do
      copy_index = lines.index { |line| line.include?("COPY --from=build /app /app") }
      build_index = lines.index { |line| line.include?("bin/build-dev-blog") }
      cmd_index = lines.index { |line| line.start_with?("CMD") }

      expect(copy_index).to be_a(Integer), "COPY --from=build /app /app not found"
      expect(build_index).to be_a(Integer), "bin/build-dev-blog not found"
      expect(cmd_index).to be_a(Integer), "CMD not found"
      expect(build_index).to be > copy_index
      expect(build_index).to be < cmd_index
    end

    it "does not inject RAILS_MASTER_KEY, BGG token, or dotenv private key into the build stage" do
      aggregate_failures do
        expect(dockerfile).not_to match(/RAILS_MASTER_KEY\s*=/)
        expect(dockerfile).not_to match(/BGG_TOKEN\s*=/)
        expect(dockerfile).not_to match(/DOTENV_PRIVATE_KEY_BGGEEK\s*=/)
      end
    end
  end

  describe "Kamal configuration" do
    it "renders a single proxy with both hosts when APP_HOST and DEV_BLOG_HOST are set" do
      stdout, _stderr = run!(
        "bin/kamal", "config",
        env: {
          "APP_HOST" => "app.example.test",
          "DEV_BLOG_HOST" => "blog.example.test"
        }
      )

      config = YAML.safe_load(stdout, permitted_classes: [Symbol])

      expect(config["proxy"]).to be_a(Hash)
      expect(config["proxy"]["ssl"]).to eq(true)
      expect(config["proxy"]["hosts"]).to contain_exactly("app.example.test", "blog.example.test")
      expect(config["proxy"]["healthcheck"]).to eq({ "path" => "/up" })

      expect(config.dig("env", "clear", "DEV_BLOG_HOST")).to eq("blog.example.test")
    end

    it "remains valid YAML when APP_HOST and DEV_BLOG_HOST are unset" do
      env = ENV.to_h.dup
      env.delete("APP_HOST")
      env.delete("DEV_BLOG_HOST")

      stdout, _stderr = run!("bin/kamal", "config", env: env)
      config = YAML.safe_load(stdout, permitted_classes: [Symbol])

      expect(config).to be_a(Hash)
      expect(config).not_to have_key("proxy")
      expect(config.dig("env", "clear", "DEV_BLOG_HOST")).to be_nil
    end
  end

  describe "Docker image build", :docker do
    before(:all) do
      skip "Docker not available" unless system("docker", "info", out: File::NULL, err: File::NULL)

      run!("docker", "build", "--tag", IMAGE_TAG, ".")
    end

    it "contains the generated blog index, stylesheet, posts, and every accepted ADR" do
      adr_check = <<~RUBY
        abort("missing post") if Dir["/app/public/dev-blog/posts/*/index.html"].empty?
        expected = DevBlog::AdrCatalog.load(
          index_path: Pathname("docs/adr/README.md"),
          project_root: Pathname(".")
        ).length
        actual = Dir["/app/public/dev-blog/adrs/*/index.html"].length
        abort("expected \#{expected} ADRs, got \#{actual}") unless actual == expected
      RUBY

      cmd = [
        "docker", "run", "--rm", "--entrypoint", "/bin/sh", IMAGE_TAG,
        "-c",
        "test -f /app/public/dev-blog/index.html && " \
          "test -f /app/public/dev-blog/styles.css && " \
          "ruby -Ilib -rdev_blog -e '#{adr_check}'"
      ]

      stdout, _stderr = run!(*cmd)
      expect(stdout).to be_empty
    end

    it "does not require secrets to build the blog image" do
      stdout, _stderr = run!(
        "docker", "run", "--rm", "--entrypoint", "/bin/sh", IMAGE_TAG,
        "-c", "printenv | grep -E '^(RAILS_MASTER_KEY|BGG_TOKEN|DOTENV_PRIVATE_KEY_BGGEEK)=' || true"
      )

      expect(stdout).to be_empty
    end
  end
end
