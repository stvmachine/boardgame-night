Rails.application.routes.draw do
  # REST authentication (authentication-zero, --api). The bearer token these
  # endpoints mint also authorizes /graphql and /cable. API-only: no HTML
  # :new/:edit actions.
  post "sign_in", to: "sessions#create"
  post "sign_up", to: "registrations#create"
  resource  :sudo,     only: :create
  resource  :password, only: :update
  resources :sessions, only: [ :index, :show, :destroy ]
  namespace :identity do
    resource :email,              only: :update
    resource :email_verification, only: [ :show, :create ]
    resource :password_reset,     only: [ :create, :update ]
  end
  namespace :authentications do
    resources :events, only: :index
  end
  # Configurable exact-host blog routes — must appear before /graphql and the SPA
  # catch-all so that unknown traffic on the blog host fails closed here.
  constraints DevBlogHostConstraint.new do
    get "up" => "rails/health#show", as: :blog_host_health_check

    get "/" => "dev_blog#index", as: :dev_blog_host_root
    get "styles.css" => "dev_blog#stylesheet", as: :dev_blog_host_styles

    get "posts/:slug",
        to: "dev_blog#post",
        as: :dev_blog_host_post,
        constraints: { slug: /[a-z0-9]+(?:-[a-z0-9]+)*/ },
        format: false

    get "adrs/:adr_slug",
        to: "dev_blog#adr",
        as: :dev_blog_host_adr,
        constraints: { adr_slug: /[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*/ },
        format: false

    match "*unmatched", to: "dev_blog#not_found", via: :all
  end

  post "/graphql", to: "graphql#execute"

  # GraphiQL explorer for development
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Action Cable — mount before SPA wildcard so WebSocket upgrades route correctly.
  mount ActionCable.server => "/cable"

  # Primary-host blog routes — /blog canonicalizes to /blog/, then allowlisted
  # generated resources are served before the SPA fallback.
  get "blog", to: "dev_blog#blog_entry", as: :dev_blog_root

  get "blog/styles.css" => "dev_blog#stylesheet", as: :dev_blog_styles

  get "blog/posts/:slug",
      to: "dev_blog#post",
      as: :dev_blog_post,
      constraints: { slug: /[a-z0-9]+(?:-[a-z0-9]+)*/ },
      format: false

  get "blog/adrs/:adr_slug",
      to: "dev_blog#adr",
      as: :dev_blog_adr,
      constraints: { adr_slug: /[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*/ },
      format: false

  match "blog/*unmatched", to: "dev_blog#not_found", via: :all

  # SPA catch-all: serve the SPA for any HTML request that isn't handled above
  root "spa#index"
  get "*path", to: "spa#index", constraints: ->(req) { req.format == :html }
end
