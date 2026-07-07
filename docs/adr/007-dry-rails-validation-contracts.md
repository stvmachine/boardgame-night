# ADR-007: dry-rails/dry-validation as the Single Mutation Validation Boundary

## Status

accepted

## Context

GraphQL mutations need a reusable, testable way to validate and coerce input before calling domain services. Rails Strong Parameters can filter controller params but do not provide rich validation rules, coercion, or i18n error messages. Mixing Strong Parameters with a separate validation layer creates a two-layer boundary that can strip keys the contract expects.

## Decision

Every GraphQL mutation will instantiate a **dry-rails `ApplicationContract` subclass** as the single input-validation boundary.

Examples in Phase 3:

- `ImportCollectionContract` validates the username argument (string, filled, max 50 chars, BGG username format).
- `ValidateBggUsernameContract` validates the username argument before a live BGG lookup.

If a contract fails, the mutation returns a structured `ValidationResult`/`ImportResult` with field-level errors rather than raising an opaque `GraphQL::ExecutionError`.

We will **not** use Rails Strong Parameters for GraphQL mutation input.

## Consequences

- Validation rules are explicit, reusable, and easy to unit test.
- Coercion and default values are handled consistently by the contract.
- Frontend receives structured, field-level errors suitable for form display.
- There is no ambiguity about which layer owns input validation.

## Alternatives Considered

- **Rails Strong Parameters** — rejected: insufficient for rich validation; mixing it with dry-validation creates a conflicting two-layer boundary.
- **Inline `raise` checks in resolvers** — rejected: not reusable, harder to test, and produces less useful error messages.

## References

- `app/contracts/import_collection_contract.rb`
- `app/contracts/validate_bgg_username_contract.rb`
- `app/contracts/application_contract.rb`
- <https://hanamiframework.github.io/dry-rails/>
- `.planning/phases/03-graphql-api-collection-surface-v1-parity/03-RESEARCH.md`
