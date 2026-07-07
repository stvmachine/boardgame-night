Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"

  # GraphiQL explorer for development
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # SPA catch-all: serve the SPA for any HTML request that isn't handled above
  root "spa#index"
  get "*path", to: "spa#index", constraints: ->(req) { req.format == :html }
end
