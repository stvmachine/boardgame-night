# ADR-015: Migrate Authentication to authentication-zero (`--api`) over the Existing Token

## Status

accepted

Supersedes [ADR-008](./008-authentication-session-strategy.md).

## Context

[ADR-008](./008-authentication-session-strategy.md) established a hand-rolled auth
strategy: the Rails 8 built-in generator adapted for API-only Bearer tokens, with
sign up / log in / log out exposed as **GraphQL mutations** (`signIn`, `signUp`,
`signOut`) that returned a DB-backed `Session#has_secure_token`. That shipped and
worked, but it stopped short of the surrounding account-security surface — there was
no password reset, no email verification, no per-session request tracking, no
re-authentication gate for sensitive changes, and no lockout protection.

Rather than build each of those by hand, we adopt [`authentication-zero`](https://github.com/lazaronixon/authentication-zero),
which scaffolds exactly this surface. The app is `config.api_only = true`
(`config/application.rb`), so only the gem's **`--api`** variant applies (there are
no views, and no cookie/session middleware is loaded).

Two facts about the gem, verified against its source, shaped the approach:

1. **`--api` authenticates with a `Session#signed_id` returned in an `X-Session-Token`
   header**, not a stored token or a `Session.active` scope. Adopting that scheme
   would have broken the credential shared by the GraphQL endpoint, Action Cable
   (`/cable` `connectionParams`), the SPA's `localStorage` token, and ~20
   context-authenticated specs.
2. **`--sudoable` and `--lockable` generate nothing in `--api` mode** (sudoable is
   gated behind `!api?`; lockable is an inert flag referenced nowhere).

## Decision

Adopt authentication-zero's **REST controllers, routes, mailers, and reset/verify
machinery**, but **keep the existing DB-backed `has_secure_token` + `Session.active`
token as the single credential**. The bearer token continues to authorize GraphQL
and Action Cable unchanged; only the auth *entry points* move from GraphQL to REST.

Specifically:

- Ran `bin/rails g authentication --api --trackable`, then discarded the outputs that
  conflict with our token model (its `User`/`Session`/`Current`, its `create_*`
  migrations, its `application_controller.rb` global `before_action :authenticate`,
  and its `signed_id` scheme). Kept its REST controllers, `identity/*`
  (email verification + password reset), `UserMailer` + views, and the trackable
  `events` model.
- **REST endpoints** (all under `Auth::BaseController`, which includes the existing
  `Authentication` concern and serializes users via `user_json` so responses never
  leak `password_digest`):
  - `POST /sign_in`, `POST /sign_up` — mint the existing `Session` (`expires_at: 30.days`)
    and return `{ token, sessionId, user }`. Sign-up reuses `SignUpContract` and sends
    the verification email.
  - `DELETE /sessions/:id`, `GET /sessions` — sign out / session management.
  - `POST /sudo` — hand-built re-authentication that stamps `Session#sudo_at`.
  - `PATCH /password`, `PATCH /identity/email` — sudo-gated sensitive changes.
  - `POST`/`PATCH /identity/password_reset`, `GET`/`POST /identity/email_verification`.
  - `GET /authentications/events` — trackable activity log.
- **Additive migrations only**: `users.verified` (backfilled `true` for existing
  accounts), `sessions.{ip_address, user_agent, sudo_at}`, and the `events` table.
  `sessions.token` / `expires_at` are untouched.
- **Hand-built** sudo re-auth and lockout (Rails/rack-attack throttling on the auth
  and email-bomb vectors), since the gem's flags produce nothing in `--api` mode.
- **SPA**: `AuthContext` calls the REST endpoints via `fetch` while keeping its public
  API and the `bgg-night-token` `localStorage` key stable, so its consumers are
  untouched. The GraphQL `signIn`/`signUp`/`signOut` mutations are removed. New pages:
  `/forgot-password`, `/reset-password`, `/verify-email`, `/account/sessions`.
- The `authentication-zero` gem is a **generator-only** dependency (`group: :development`,
  `require: false`) and can be removed once no further regeneration is needed.

## Consequences

- Gains password reset, email verification, per-session ip/user-agent tracking, sudo
  re-auth, an activity log, and REST lockout — without rebuilding them by hand.
- Zero blast radius on the rest of the app: because the token mechanism is preserved,
  `graphql_controller.rb` and `apollo.ts` are unchanged and every context-authenticated
  spec stays green. A request spec proves a REST-minted token authorizes GraphQL and
  that revocation cuts it off (`spec/requests/auth/token_bridges_graphql_spec.rb`).
- Auth now spans two transports (REST for entry points, GraphQL for everything else).
  This is the deliberate cost of reusing the gem's REST scaffold; the shared token is
  what keeps it coherent.
- `upgrade_to_account` and `bind_bgg_username` remain GraphQL mutations (still
  context-authenticated by the preserved token).
- The gem's `--api` `signed_id` scheme and its `--sudoable`/`--lockable` flags are
  intentionally **not** used; sudo and lockout are our own code.
- **Production must enable SMTP** (`config/environments/production.rb`, currently
  commented) before the reset/verify emails can send.

## Alternatives Considered

- **Keep the ADR-008 hand-rolled GraphQL auth and build reset/verify/sudo by hand** —
  rejected: authentication-zero provides exactly this surface, tested and idiomatic.
- **Adopt authentication-zero wholesale, including its `signed_id`/cookie scheme** —
  rejected: would break GraphQL, Action Cable, the SPA token, and ~20 specs for no
  benefit; also impossible for cookies since no session middleware is loaded in
  `api_only` mode.
- **Full cookie-session auth (a-zero HTML variant)** — rejected: requires re-adding
  session/CSRF middleware and reworking the Apollo `authLink` + Action Cable auth; the
  token model already works across both.

## References

- `app/controllers/auth/base_controller.rb`, `app/controllers/{sessions,registrations,passwords,sudos}_controller.rb`, `app/controllers/identity/*`, `app/controllers/authentications/events_controller.rb`
- `app/models/{session,user,current,event}.rb`, `app/models/concerns/authentication.rb`
- `app/controllers/graphql_controller.rb` (unchanged), `config/routes.rb`, `config/initializers/{cors,rack_attack}.rb`
- `app/frontend/contexts/AuthContext.tsx`, `app/frontend/lib/authApi.ts`, `app/frontend/pages/{ForgotPassword,ResetPassword,VerifyEmail,AccountSessions}Page.tsx`
- `spec/requests/auth/*`
- authentication-zero: <https://github.com/lazaronixon/authentication-zero>
- Supersedes: [ADR-008](./008-authentication-session-strategy.md)
