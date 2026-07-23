# frozen_string_literal: true

require "rails_helper"

RSpec.describe "development launcher" do
  subject(:launcher) { Rails.root.join("bin/dev").read }

  it "initializes the project Node and Ruby versions before starting Foreman" do
    expect(launcher).to include('export NVM_DIR="$HOME/.nvm"')
    expect(launcher).to include('nvm use')
    expect(launcher).to include('eval "$(rbenv init -)"')

    expect(launcher.index("nvm use")).to be < launcher.index("exec foreman")
    expect(launcher.index("rbenv init")).to be < launcher.index("exec foreman")
  end
end
