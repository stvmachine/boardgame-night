---
title: "Authentication with Rails Built-Ins: Bearer Tokens over GraphQL"
date: 2026-07-21
description: "Why this app signs users in with has_secure_password and a database-backed Bearer token instead of Devise, JWT, or cookie sessions — and how the flow works end to end."
tags: [rails, authentication, graphql, architecture]
---

## The problem

This app is a Rails 8 API-only backend serving a Vue 3 single-page application through one `/graphql` endpoint. That shape creates an awkward authentication constraint. In production the SPA is compiled into `public/` and served from the same origin as Rails, so cookie sessions would work. In development the SPA runs on Vite at `localhost:5173` while Rails listens on `localhost:3000`, so every request is cross-origin and cookie-based auth pulls us into `credentials: 'include'` and CORS edge cases inside Apollo Client.

We needed a session strategy that keeps users logged in across page loads, works over GraphQL, supports logout from any page, and behaves identically in both environments without environment-specific cookie configuration. ADR-008 records the decision; this post walks through what we actually built.

## The decision: Rails 8 built-ins, adapted for Bearer tokens

Rails 8 ships an authentication generator that scaffolds a `Session` model, a `Current` attributes class, and an `Authentication` controller concern. We ran the generator and then adapted its cookie-oriented output for an API-only Bearer-token flow. The pieces that survived nearly untouched are the interesting ones, because they show how little custom code this required.

Passwords are handled by `has_secure_password` on `User`, backed by bcrypt:

```ruby
class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections
  has_many :sessions, dependent: :destroy
```

Sessions are database rows. The whole model is twelve lines:

```ruby
class Session < ApplicationRecord
  belongs_to :user

  has_secure_token :token

  validates :user, presence: true
  validates :expires_at, presence: true

  scope :active, -> { where("expires_at > ?", Time.current) }
end
```

`has_secure_token :token` generates a CSPRNG token on creation. The `active` scope is the entire expiry mechanism: a session past its `expires_at` simply stops matching lookups.

Request-scoped state lives in a `Current` class, which is the generated code verbatim:

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :session, :user
end
```

The adaptation lives in the `Authentication` concern. Where the generator reads a signed cookie, we read the `Authorization` header:

```ruby
    def authenticate
      token = request.headers["Authorization"]&.remove(/\ABearer\s+/i)
      Current.session = token.present? ? Session.active.find_by(token: token) : nil
      Current.user = Current.session&.user
    end
```

Three lines of real logic. Strip the `Bearer` prefix, look up an active session by token, expose the user. `GraphqlController` includes this concern and injects `current_user` and `current_session` into the GraphQL context for both single-query mode and Apollo's multiplex batch mode, so every resolver sees the same identity regardless of how the request arrived.

Because auth travels in a header rather than a cookie, there is no CSRF surface to mitigate and no cross-origin credential negotiation in development.

## Why not the alternatives

We considered three other approaches and wrote the reasoning into ADR-008.

**Devise** is a full-stack authentication engine. It ships controllers, views, flash messages, and responder logic built for server-rendered apps. In an API-only app serving a SPA we would disable or bypass most of it, and what remains — password hashing, session tracking — is exactly what the Rails 8 generator already gives us. For friend-group accounts with email and password, Devise is machinery without a job.

**JWT access + refresh tokens** was the more serious contender. We rejected it because the costs are real and the benefits do not apply at our scale. JWT brings algorithm-confusion risk, refresh-token rotation, and the awkward fact that stateless tokens cannot be revoked without reintroducing server-side state — usually a denylist, which is a database lookup wearing a different hat. A `Session` row gives us revocation for free: destroy the row and the token is dead. When you are going to hit the database on every authenticated request anyway, the statelessness JWT offers is not buying anything.

**Cookie sessions** work for the same-origin production case but fail our dev/prod parity requirement and offer no per-device revocation.

The trade-off we accepted is explicit: one indexed `Session` lookup per authenticated request. At v1 scale — a handful of friend groups — that is negligible, and it purchases immediate revocation, per-device sessions, and a future "sign out everywhere" feature.

## The GraphQL flow

Sign-in is a mutation, not a separate REST endpoint, so the frontend has exactly one API surface to think about. Input is validated by a dry-validation contract before we touch the database, then a session is created with a thirty-day expiry:

```ruby
    def resolve(email:, password:)
      contract = SignInContract.new.call(email: email, password: password)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      user = User.find_by(email: contract[:email])
      if user.nil? || !user.authenticate(contract[:password])
        raise GraphQL::ExecutionError, "Invalid credentials"
      end

      session = user.sessions.create!(expires_at: 30.days.from_now)

      { token: session.token, user: user }
    end
```

`signUp` follows the same shape — contract first, create the user with `provisional: false`, create the session, return `{ token, user }`. Note the error handling: a wrong email and a wrong password produce the same "Invalid credentials" message, so the endpoint does not reveal which accounts exist.

On the frontend, an Apollo `setContext` link attaches the token to every request:

```ts
const authLink = setContext((_, { headers }) => {
  const token = useAuthStore().token
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  }
})
```

The token lives in the Pinia auth store, not `localStorage`. That was a deliberate choice in ADR-008: a token in `localStorage` is readable by any JavaScript that runs on the page, while a module-scoped store value is gone on a full page reload — a smaller blast radius for XSS at the price of re-authenticating after closing the tab.

Sign-out is where the database-backed model pays off. The whole mutation:

```ruby
module Mutations
  class SignOut < BaseMutation
    field :success, Boolean, null: false

    def resolve
      raise GraphQL::ExecutionError, "Authentication required" unless context[:current_session]

      context[:current_session].destroy
      { success: true }
    end
  end
end
```

One `destroy` and the token stops resolving on the very next request. No denylist, no expiry-window guessing, no waiting for a short-lived token to age out.

## Guests without accounts

The auth story has a second half, because the app's core loop involves inviting friends who do not have accounts yet. ADR-009 introduces provisional user accounts: when an organizer invites someone by email, we find or create a `User` row with `provisional: true` and a generated `guest_*` username. The invitee RSVPs through a magic link — no password, no registration form — and their response is stored in the same `attendances` table as everyone else's.

The upgrade path is a single row update. When a guest decides they want a real account, an `upgrade_to_account` mutation sets `provisional: false` along with their chosen username and password, and their RSVP history comes along untouched. No data migration, no retargeted foreign keys. Group invitations use a persisted `InviteToken` table (ADR-010) that stores only the SHA-256 digest of the raw token, supports per-invite revocation and expiry, and records the no-account RSVP as a first-class status on the same row. The ADRs carry the full reasoning; the point here is that "users" and "guests" are one model, not two systems.

## Deliberately deferred

Some things are not built, and we want that on the record rather than discovered later. The password-reset flow the generator scaffolds exists but has had no polish. There is no token rotation — a token is valid until its session expires or is destroyed. Thirty-day expiry is a first guess, not a tuned value. And while the data model supports "sign out everywhere" (destroy all of a user's sessions), there is no UI for it yet. Each of these is accepted follow-up work with a clear home in the existing design, not a hidden gap in the architecture.
