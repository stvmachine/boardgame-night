# frozen_string_literal: true

require "rails_helper"
require "yaml"

RSpec.describe "Action Cable development contract" do
  # ── Route order ────────────────────────────────────────────────
  it "mounts ActionCable.server at /cable before the SPA catch-all" do
    routes_text = `bin/rails routes --suppressed-output 2>&1`
    # Find the ActionCable line and a spa#index line, ensure cable comes first.
    cable_line = routes_text.lines.find { |l| l.include?("ActionCable") && l.include?("/cable") }
    spa_line   = routes_text.lines.find { |l| l.include?("spa#index") }
    expect(cable_line).to be_present, "Expected ActionCable.server mount at /cable"
    expect(spa_line).to be_present, "Expected spa#index catch-all route"
    cable_idx = routes_text.lines.index(cable_line)
    spa_idx   = routes_text.lines.index(spa_line)
    expect(cable_idx).to be < spa_idx, "ActionCable mount must appear before spa#index"
  end

  # ── Adapter ────────────────────────────────────────────────────
  it "uses solid_cable adapter in development" do
    cable_yml = YAML.safe_load_file(Rails.root.join("config/cable.yml"))
    dev_config = cable_yml["development"]
    expect(dev_config).to be_present
    expect(dev_config["adapter"]).to eq("solid_cable")
  end

  # ── Forgery protection ─────────────────────────────────────────
  it "does not disable request-forgery protection globally" do
    dev_file = Rails.root.join("config/environments/development.rb")
    content = File.read(dev_file)
    # The disable line may appear as a comment; ensure it is NOT uncommented.
    uncommented = content.lines.select { |l| l.include?("disable_request_forgery_protection") && !l.strip.start_with?("#") }
    expect(uncommented).to be_empty,
      "Expected disable_request_forgery_protection to remain commented out"
  end

  # ── Development origin allowlist ───────────────────────────────
  it "allows exactly localhost:5173 and 127.0.0.1:5173 in development" do
    dev_file = Rails.root.join("config/environments/development.rb")
    content = File.read(dev_file)
    expect(content).to include('"http://localhost:5173"')
    expect(content).to include('"http://127.0.0.1:5173"')
    # No wildcard or regex patterns
    expect(content).not_to include("*")
  end

  # ── Production untouched ───────────────────────────────────────
  it "does not add development origins to production" do
    prod_file = Rails.root.join("config/environments/production.rb")
    content = File.read(prod_file)
    expect(content).not_to include("allowed_request_origins")
    expect(content).not_to include("localhost:5173")
  end

  # ── Vite proxy ─────────────────────────────────────────────────
  it "Vite config proxies /cable with ws: true" do
    vite_config = Rails.root.join("vite.config.ts")
    content = File.read(vite_config)
    expect(content).to include("'/cable'")
    expect(content).to include("ws: true")
    expect(content).to include("localhost:3000")
  end

  # ── Apollo consumer ────────────────────────────────────────────
  it "Apollo client creates Action Cable consumer at /cable" do
    client_path = Rails.root.join("app/frontend/apollo/client.ts")
    content = File.read(client_path)
    expect(content).to include("createConsumer('/cable')")
  end

  # ── Procfile.e2e does not need separate cable config ───────────
  it "Procfile.e2e does not start a separate cable process (Rails serves it)" do
    procfile = Rails.root.join("Procfile.e2e")
    content = File.read(procfile)
    # Rails serves Action Cable in-process via the mount; no separate cable worker.
    expect(content).not_to include("cable")
  end

  # ── Routes file contains the mount ─────────────────────────────
  it "config/routes.rb mounts ActionCable.server at /cable" do
    routes_file = Rails.root.join("config/routes.rb")
    content = File.read(routes_file)
    expect(content).to include('mount ActionCable.server => "/cable"')
  end
end
