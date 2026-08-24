# Architecture Decision Records

This directory contains the architecture decision records (ADRs) for the boardgame-night-rails-vue project. Each ADR captures a significant decision, the context in which it was made, the chosen option, and its consequences.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./001-monorepo-rails-api-vue-spa.md) | Monorepo with Rails 8 API-only and Vite SPA (frontend is React — see ADR-016) | accepted | 2026-07-07 |
| [ADR-002](./002-rails-owns-bgg-communication.md) | Rails Owns All BoardGameGeek Communication | accepted | 2026-07-07 |
| [ADR-003](./003-graphql-n-plus-one-dataloader.md) | GraphQL N+1 Prevention with GraphQL::Dataloader | accepted | 2026-07-07 |
| [ADR-004](./004-solid-queue-cache-cable.md) | Solid Queue, Solid Cache, and Solid Cable Instead of Redis | accepted | 2026-07-07 |
| [ADR-005](./005-bgg-collection-import-pipeline.md) | Async BGG Collection Import Pipeline | accepted | 2026-07-07 |
| [ADR-006](./006-vue-apollo-normalized-cache.md) | Apollo Client 3.x with Normalized Cache (React — see ADR-016) | accepted | 2026-07-07 |
| [ADR-007](./007-dry-rails-validation-contracts.md) | dry-rails/dry-validation as the Single Mutation Validation Boundary | accepted | 2026-07-07 |
| [ADR-008](./008-authentication-session-strategy.md) | Authentication Session Strategy | superseded | 2026-07-09 |
| [ADR-009](./009-provisional-user-accounts-rsvp.md) | Provisional User Accounts for No-Account RSVP | accepted | 2026-07-09 |
| [ADR-010](./010-group-invitation-tokens.md) | Group Invitation Tokens | accepted | 2026-07-09 |
| [ADR-011](./011-group-collection-view.md) | Group Collection View | accepted | 2026-07-09 |
| [ADR-012](./012-session-lifecycle-state-machine.md) | Session Lifecycle State Machine | accepted | 2026-07-09 |
| [ADR-013](./013-rubocop-indentation-cops.md) | Re-enable RuboCop Indentation Cops Over rails-omakase Defaults | accepted | 2026-07-20 |
| [ADR-014](./014-dev-blog-engine.md) | Pure-Ruby Static Site Generator for the Dev Blog | accepted | 2026-07-21 |
| [ADR-015](./015-authentication-zero-rest-migration.md) | Migrate Authentication to authentication-zero (`--api`) over the Existing Token | accepted | 2026-08-24 |
| [ADR-016](./016-frontend-spa-react-not-vue.md) | Frontend SPA Implemented in React 19, Not Vue 3 | accepted | 2026-08-24 |
| [ADR-017](./017-oxfmt-javascript-formatter.md) | Adopt oxfmt (Oxc) as the JavaScript/TypeScript Formatter | accepted | 2026-08-24 |

## Status Key

- **accepted**: The decision has been accepted and is in use.
- **proposed**: The decision is under discussion.
- **deprecated**: The decision has been superseded by a later ADR.
- **superseded**: The decision has been replaced; see the linked ADR.

## Adding a New ADR

1. Use the next available number (zero-padded to three digits).
2. Follow the MADR format: Status, Context, Decision, Consequences, Alternatives Considered, References.
3. Update the index table above with the new ADR.
4. Link to the implementation files and research notes that motivated the decision.
