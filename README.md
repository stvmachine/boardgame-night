# Boardgame Night

A board game collection and night-organizing app for groups of friends. Users create friend groups, link their BoardGameGeek (BGG) usernames, and the app merges everyone's collections into a shared deduplicated view. From there, any member can spin up a boardgame night session — invite group members, get game suggestions drawn from the shared pool, and pick what to play.

Built as a monorepo with Ruby on Rails 8 (API-only) serving a GraphQL API consumed by a React 19 frontend.

## Tech Stack

- **Backend:** Ruby on Rails 8.1 API-only, SQLite, Solid Queue, Solid Cache
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4
- **API:** GraphQL via `graphql-ruby` and `@apollo/client`
- **Deployment:** Kamal 2 (single container)

## Prerequisites

- Ruby 3.4+ (managed via `.ruby-version` and rbenv)
- Node.js 20+ (managed via `.nvmrc` if present, or use the active LTS)
- SQLite (no external database needed for local development)

## Setup

```bash
# Install Ruby dependencies
bundle install

# Install JavaScript dependencies
npm install

# Create and load the database
bin/rails db:create db:schema:load

# Optional: seed demo data
bin/rails db:seed
```

### BGG Credentials

The BGG XML API token is loaded from `.env.bggeek`, which is gitignored and never committed. Create it at the repo root:

```bash
touch .env.bggeek
```

Add your credentials if you have them; for local collection-browsing work against seeded fixtures, the token is not required.

## Development

Start both the Rails server and Vite dev server with Foreman:

```bash
./bin/dev
```

The Rails API runs on `http://localhost:3000` and the Vite dev server runs on `http://localhost:5173`. The SPA is served from the Vite dev server in development, with API requests proxied to Rails.

### GraphQL Explorer

Visit `http://localhost:3000/graphiql` to explore the schema and run queries directly.

## Testing

### Unit / Component Tests

Frontend tests run with Vitest and jsdom:

```bash
npm run test
```

### End-to-End Tests

E2E tests use Playwright. The suite seeds its own database fixtures via `bin/rails e2e:seed` before starting the dev server, so no live BGG credentials are needed.

```bash
npm run e2e
```

To run a single spec file:

```bash
npx playwright test tests/e2e/collection.spec.ts
```

## Deployment

Deployment is handled by Kamal 2. Rails serves the built React SPA from `public/` as a single container, so there is no separate frontend deploy. Build the production assets locally to verify:

```bash
bin/vite build
```

See `config/deploy.yml` for Kamal configuration.
