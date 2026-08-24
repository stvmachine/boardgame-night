source "https://rubygems.org"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.1.3", ">= 8.1.3.1"
# Pull patched transitive sanitizer/loofah versions surfaced by bundler-audit.
gem "rails-html-sanitizer", ">= 1.7.1"
gem "loofah", ">= 2.25.2"
# PostgreSQL in production (Render managed Postgres). SQLite is used only in
# development and test — see the :development, :test group below.
gem "pg", "~> 1.5", group: :production
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
# gem "jbuilder"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem "solid_cache"
gem "solid_queue"
gem "solid_cable"

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem "kamal", require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem "thruster", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", "~> 2.0"

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin Ajax possible
# gem "rack-cors"

group :development, :test do
  # Use sqlite3 as the database for Active Record in local development and test.
  gem "sqlite3", ">= 2.1"

  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"

  # Audits gems for known security defects (use config/bundler-audit.yml to ignore issues)
  gem "bundler-audit", require: false

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false

  gem "foreman", require: false

  # Generator-only: scaffolds REST auth (sessions/registrations/passwords/identity).
  # Used to bootstrap the auth-zero migration; can be removed once generation is done.
  gem "authentication-zero", "~> 4.0", require: false
end

gem "vite_rails", "~> 3.11"

gem "graphql", "~> 2.6", ">= 2.6.6"

gem "bcrypt", "~> 3.1"

gem "rack-cors", "~> 3.0", group: [ :development, :test ]

gem "dotenv-rails", "~> 3.2", group: [ :development, :test ]

gem "bullet", "~> 8.1", group: [ :development, :test ]

gem "rspec-rails", "~> 8.0", group: [ :development, :test ]

gem "webmock", "~> 3.26", group: [ :development, :test ]

gem "shoulda-matchers", "~> 6.4", group: [ :development, :test ]

# Dev-only tools
gem "graphiql-rails", "~> 1.10", group: :development
gem "letter_opener", "~> 1.10", group: :development

# BGG Integration: HTTP client + XML parsing + retry middleware

gem "faraday", "~> 2.14"
gem "faraday-retry", "~> 2.4"
gem "nokogiri", "~> 1.19"

# Dev blog: pure-Ruby markdown-to-HTML engine (Psych + kramdown + ERB)
gem "kramdown", "~> 2.5"

gem "dry-rails", "~> 0.7"

# Rate limiting for auth endpoints (T-04-01)
gem "rack-attack", "~> 6.6"

gem "faker", "~> 3.8", groups: [:development, :test]

gem "mutant", "~> 0.16.3", groups: [:development, :test]

gem "mutant-rspec", "~> 0.16.3", groups: [:development, :test]
