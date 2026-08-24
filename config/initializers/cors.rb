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

      # REST authentication endpoints (sign_in/sign_up/sessions/password/identity/*).
      resource "/sign_in",  headers: :any, methods: [ :post, :options ]
      resource "/sign_up",  headers: :any, methods: [ :post, :options ]
      resource "/sudo",     headers: :any, methods: [ :post, :options ]
      resource "/password", headers: :any, methods: [ :patch, :put, :options ]
      resource "/sessions", headers: :any, methods: [ :get, :options ]
      resource "/sessions/*", headers: :any, methods: [ :get, :delete, :options ]
      resource "/identity/*", headers: :any, methods: [ :get, :post, :patch, :put, :options ]
      resource "/authentications/*", headers: :any, methods: [ :get, :options ]
    end
  end
end
