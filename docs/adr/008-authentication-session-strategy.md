# ADR-008: Authentication Session Strategy

## Status

Superseded

Superseded by [ADR-015](./015-authentication-zero-rest-migration.md)

The DB-backed Bearer-token mechanism decided here is retained, but sign up / log in /
log out moved from GraphQL mutations to REST controllers via authentication-zero, and
the account-security surface (password reset, email verification, session tracking,
sudo, lockout) was added. See ADR-015.

> **Correction:** the "Decision" below says the token is kept in a Pinia store *not*
> `localStorage` and the frontend is Vue. Neither held: the SPA is **React**
> ([ADR-016](./016-frontend-spa-react-not-vue.md)) and the token lives in
> **`localStorage`** (key `bgg-night-token`), attached via an Apollo `setContext` link.

## Context

Phase 4 introduces user accounts (sign up, log in, log out, BGG username binding). The project is a Rails 8 API-only application serving a Vue 3 SPA. In production the SPA is served from the same origin (`public/`), so cookie-based sessions would work; in development the SPA runs on `localhost:5173` and Rails on `localhost:3000`, so cross-origin credentials are required for cookie sessions.

The `User` model already uses `has_secure_password` (bcrypt). The GraphQL API is the sole frontend-facing API, and Apollo Client batches queries over HTTP and uses Action Cable for subscriptions.

We need a session strategy that:
- Keeps users logged in across page loads.
- Works over GraphQL (single `/graphql` endpoint).
- Supports logout from any page.
- Does not introduce unnecessary complexity or gem dependencies.
- Works in both dev (cross-origin) and prod (same-origin) without brittle cookie/CORS configuration.

## Decision

We will use the **Rails 8 built-in authentication generator adapted for API-only Bearer tokens**.

Specifically:
- Run `bin/rails generate authentication` to scaffold `Session`, `Current`, the `Authentication` concern, and password-reset mailers.
- Add a `token` column to the generated `sessions` table and generate a CSPRNG token on session creation.
- Modify the `Authentication` concern to resolve the current session from the `Authorization: Bearer <token>` header instead of a cookie.
- Expose login/signup/logout as GraphQL mutations (or dedicated JSON endpoints if simpler for the initial SPA page load) that return the session token.
- The frontend stores the token in a JavaScript module-scoped variable or Pinia store (not `localStorage`) and sends it on every Apollo request via a `setContext` link.
- Logout destroys the `Session` row, making the token invalid immediately.

## Consequences

- Reuses the officially-supported Rails 8 authentication stack (`has_secure_password`, `Session`, `Current`) with minimal adaptation.
- Gives us per-device session tracking, "sign out everywhere," and password reset for free.
- No CSRF concern because auth is carried in the `Authorization` header, not a cookie.
- Avoids JWT complexity (algorithm pinning, refresh rotation, token expiry windows, revocation denylist).
- One indexed `Session` lookup per authenticated request — negligible at v1 scale.
- In development, cross-origin requests are simpler because the token travels in a header, avoiding cookie `credentials: 'include'` edge cases in Apollo Client.
- We must write a small adapter (token column, header-based `resume_session`, JSON responses) because the generator is cookie-oriented by default.

## Alternatives Considered

- **Rails session cookie (`ActionDispatch::Session::CookieStore`)** — rejected: works for same-origin SPAs but requires cross-origin cookie handling in dev and offers no per-device revocation.
- **JWT access + refresh tokens** — rejected: over-engineered for a single-origin browser SPA. Adds algorithm confusion risk, refresh rotation, and stateful revocation without matching benefit.
- **Custom opaque token table without the generator** — rejected: feasible but reinvents the parts of the generator (password reset, `Current`, `Session` model) that we can reuse.

## References

- `app/models/user.rb`
- `app/controllers/graphql_controller.rb`
- `app/frontend/apollo/client.ts`
- Rails 8 Authentication Generator: <https://guides.rubyonrails.org/v8.1/security.html#authentication-generator>
- AvoHQ guide: "Rails API authentication with the auth generator" (Sep 2025)
- Project decision (Phase 1): `docs/adr/001-monorepo-rails-api-vue-spa.md`
