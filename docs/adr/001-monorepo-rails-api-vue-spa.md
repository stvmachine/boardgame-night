# ADR-001: Monorepo with Rails 8 API-only and Vue 3 Vite SPA

## Status

accepted

## Context

The project is a rewrite of an existing stack consisting of a separate Node/Apollo Server GraphQL proxy (`bgg-graphql-proxy`) and a Next.js frontend (`bggeek-shared-list`). Maintaining two repositories, two deploys, and CORS between them adds operational overhead that is disproportionate for a single-user-persona friend-group app. The team wants the API and frontend to stay in sync and deploy atomically.

A Rails API-only backend combined with a Vue 3 SPA served from Rails keeps all server-side logic (BGG credentials, rate limiting, caching) in one place while letting Vue own the UI.

## Decision

We will build the application as a **single git repository monorepo** with:

- **Ruby on Rails 8.x in API-only mode** as the backend and GraphQL server.
- **Vue 3 with Vite** as the frontend SPA, integrated via `vite_rails`.
- Rails serves the built SPA from `public/` in production and proxies to the Vite dev server in development.
- GraphQL is the single API surface between Vue and Rails.

## Consequences

- One Kamal 2 deploy produces one Docker image that serves both the SPA and `/graphql`.
- No CORS in production; the frontend is same-origin.
- Frontend and backend versions move together; no cross-repo coordination for schema changes.
- Rails cannot use Hotwire/Turbo because the UI lives entirely in Vue.
- Vite dev server runs independently in development, proxied by Rails for HMR.

## Alternatives Considered

- **Separate frontend + backend repos** — rejected: doubles deployment and health-check surface.
- **Next.js full-stack app** — rejected: the project explicitly requested Rails + Vue and a rewrite from the existing Next.js app.

## References

- `PROJECT.md` § Constraints
- Phase 1 planning and monorepo shell implementation
