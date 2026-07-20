# frozen_string_literal: true

require "rails_helper"
require "yaml"

RSpec.describe "CI workflow (.github/workflows/ci.yml)" do
  let(:workflow) { YAML.safe_load_file(Rails.root.join(".github/workflows/ci.yml"), aliases: true) }

  it "triggers on pull_request and push to main" do
    # YAML 1.1 parses "on" as the boolean true; handle both forms.
    on_trigger = workflow["on"] || workflow[true]
    expect(on_trigger).to have_key("pull_request")
    expect(on_trigger.dig("push", "branches")).to include("main")
  end

  it "has top-level permissions: contents: read (least privilege)" do
    expect(workflow.dig("permissions", "contents")).to eq("read")
  end

  it "has a dedicated e2e job separate from scan_ruby, lint, and test" do
    expect(workflow.dig("jobs", "e2e")).to be_present
    %w[scan_ruby lint test].each do |job|
      expect(workflow.dig("jobs", job)).to be_present
    end
    expect(workflow.dig("jobs", "e2e", "runs-on")).to eq("ubuntu-latest")
  end

  it "does not give write permissions to the e2e job" do
    job = workflow.dig("jobs", "e2e")
    perms = job["permissions"] || {}
    expect(perms["contents"] || workflow.dig("permissions", "contents")).to eq("read")
  end

  it "installs Ruby with bundler cache" do
    steps = workflow.dig("jobs", "e2e", "steps")
    ruby_step = steps.find { |s| s["uses"]&.start_with?("ruby/setup-ruby") }
    expect(ruby_step).to be_present
    expect(ruby_step.dig("with", "bundler-cache")).to be true
  end

  it "sets up Node from .nvmrc with npm cache" do
    steps = workflow.dig("jobs", "e2e", "steps")
    node_step = steps.find { |s| s["uses"]&.start_with?("actions/setup-node") }
    expect(node_step).to be_present
    expect(node_step.dig("with", "node-version-file")).to eq(".nvmrc")
    expect(node_step.dig("with", "cache")).to eq("npm")
  end

  it "installs dependencies via npm ci (not npm install)" do
    steps = workflow.dig("jobs", "e2e", "steps")
    install_step = steps.find { |s| s["run"]&.include?("npm ci") }
    expect(install_step).to be_present
  end

  it "installs Chromium with OS dependencies" do
    steps = workflow.dig("jobs", "e2e", "steps")
    chromium_step = steps.find { |s| s["run"]&.include?("playwright install") }
    expect(chromium_step).to be_present
    expect(chromium_step["run"]).to include("--with-deps chromium")
  end

  it "prepares development databases via db:prepare" do
    steps = workflow.dig("jobs", "e2e", "steps")
    db_step = steps.find { |s| s["run"]&.include?("db:prepare") }
    expect(db_step).to be_present
    expect(db_step.dig("env", "RAILS_ENV")).to eq("development")
  end

  it "runs the full e2e suite via npm run e2e" do
    steps = workflow.dig("jobs", "e2e", "steps")
    e2e_step = steps.find { |s| s["run"]&.include?("npm run e2e") }
    expect(e2e_step).to be_present
  end

  it "uploads Playwright artifacts only on failure" do
    steps = workflow.dig("jobs", "e2e", "steps")
    upload_step = steps.find { |s| s["uses"]&.include?("upload-artifact") }
    expect(upload_step).to be_present
    expect(upload_step["if"]).to eq("failure()")
    expect(upload_step.dig("with", "retention-days")).to eq(7)
  end

  it "uploads playwright-report and test-results directories" do
    steps = workflow.dig("jobs", "e2e", "steps")
    upload_step = steps.find { |s| s["uses"]&.include?("upload-artifact") }
    paths = Array(upload_step.dig("with", "path"))
    expect(paths).to include(/playwright-report/)
    expect(paths).to include(/test-results/)
  end

  it "installs only libvips as an explicit apt dependency (Playwright installs Chromium OS deps)" do
    steps = workflow.dig("jobs", "e2e", "steps")
    apt_step = steps.find { |s| s["run"]&.include?("apt-get install") }
    expect(apt_step).to be_present
    expect(apt_step["run"]).to include("libvips")
    expect(apt_step["run"]).not_to include("libnss3")
    expect(apt_step["run"]).not_to include("libcups2")
  end

  it "sets workers to 1 for deterministic serialized execution" do
    config_path = Rails.root.join("tests/e2e/playwright.config.ts")
    config_content = File.read(config_path)
    expect(config_content).to include("workers: 1")
  end

  it "sets a 60-second default timeout for serialized execution" do
    config_path = Rails.root.join("tests/e2e/playwright.config.ts")
    config_content = File.read(config_path)
    expect(config_content).to include("timeout: 60_000")
  end

  it "runs RSpec tests (not Minitest) in the test job" do
    steps = workflow.dig("jobs", "test", "steps")
    test_step = steps.find { |s| s["run"]&.include?("rspec") }
    expect(test_step).to be_present
    expect(test_step["run"]).to include("bundle exec rspec")
    expect(test_step["run"]).not_to include("rails db:test:prepare test")
  end

  it "keeps retries at zero (Playwright config) and does not add flaky tolerance" do
    # The Playwright config is the source of truth for retries.
    config_path = Rails.root.join("tests/e2e/playwright.config.ts")
    config_content = File.read(config_path)
    expect(config_content).to include("retries: 0")
  end

  it "does not use dotenvx or .env.bggeek in Procfile.e2e commands" do
    procfile_path = Rails.root.join("Procfile.e2e")
    procfile_lines = File.readlines(procfile_path)
    command_lines = procfile_lines.reject { |l| l.strip.start_with?("#") || l.strip.empty? }
    command_lines.each do |line|
      expect(line).not_to include("dotenvx")
      expect(line).not_to include(".env.bggeek")
    end
  end

  it "bin/dev-e2e references Procfile.e2e not Procfile.dev" do
    dev_e2e = Rails.root.join("bin/dev-e2e")
    content = File.read(dev_e2e)
    expect(content).to include("Procfile.e2e")
    expect(content).not_to include("Procfile.dev")
  end

end
