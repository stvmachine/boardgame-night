# frozen_string_literal: true

# Configure CORS for development only.
# In production, the SPA is served same-origin by Rails from public/.
# See: https://github.com/cyu/rack-cors

if Rails.env.development?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins "localhost:5173", "127.0.0.1:5173"

      resource "/graphql",
               headers: :any,
               methods: [ :post, :options ]
    end
  end
end
