# frozen_string_literal: true

namespace :dev_blog do
  desc "Build the static engineering blog without initializing the Rails environment"
  task :build do
    ruby File.expand_path("../../bin/build-dev-blog", __dir__)
  end
end
