---
phase: 260721-j5g-write-a-dev-blog-post-in-docs-developmen
plan: 01
subsystem: docs
tags: [dev-blog, documentation, authentication, architecture]
status: complete
dependency_graph:
  requires: [docs/adr/008-authentication-session-strategy.md, docs/adr/009-provisional-user-accounts-rsvp.md, docs/adr/010-group-invitation-tokens.md]
  provides: [docs/development/2026-07-21-authentication-with-rails-built-ins.md]
  affects: []
tech_stack:
  added: []
  patterns: [SSG-ready plain-Markdown dev-blog post with YAML frontmatter, YYYY-MM-DD-kebab-title.md naming convention for docs/development/]
key_files:
  created:
    - docs/development/2026-07-21-authentication-with-rails-built-ins.md
  modified: []
decisions:
  - Established docs/development/ naming convention (YYYY-MM-DD-kebab-title.md) with plain YAML frontmatter (title, date, description, tags) so any future SSG can consume posts
metrics:
  duration: ~10 min
  completed: 2026-07-21
  tasks: 2
  files: 1
requirements:
  - v1.2-dev-blog-auth-post
---

# Phase 260721-j5g Plan 01: Authentication Architecture Dev-Blog Post Summary

**One-liner:** Dev-blog post explaining ADR-008's `has_secure_password` + database-backed Bearer-token auth over GraphQL, with every code snippet verified verbatim against source.

## What Was Built

Created `docs/development/2026-07-21-authentication-with-rails-built-ins.md` (1112 words of prose, 1289 words total), the first post in `docs/development/`, establishing the `YYYY-MM-DD-kebab-title.md` naming convention. The post covers all six required sections:

1. **The problem** — API-only Rails 8 + Vue 3 SPA, dev cross-origin vs. prod same-origin constraint.
2. **The decision (ADR-008)** — Rails 8 authentication generator adapted for Bearer tokens, with verbatim snippets from `user.rb`, `session.rb` (whole file), `current.rb`, and the `authenticate` method from `authentication.rb`.
3. **Rejected alternatives** — Devise (full-stack engine fighting API-only), JWT (algorithm confusion + stateful revocation with no payoff), cookie sessions (dev/prod parity failure). Accepted trade-off stated: one indexed Session lookup per request.
4. **The GraphQL flow** — verbatim `SignIn#resolve` (dry-validation contract, 30-day expiry, uniform "Invalid credentials"), verbatim Apollo `authLink` from `client.ts` (Pinia store, not localStorage), verbatim whole-file `sign_out.rb` as the revocation story.
5. **Guests without accounts** — ADR-009 provisional users + ADR-010 invite tokens, referenced rather than re-explained.
6. **Deliberately deferred** — password-reset polish, token rotation, 30-day expiry tuning, "sign out everywhere" UI.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write the authentication architecture blog post | d93c9c8 | docs/development/2026-07-21-authentication-with-rails-built-ins.md |
| 2 | Verify snippet fidelity against source and commit | d93c9c8 | (same commit — verification + commit task) |

## Verification Results

- File exists at target path with required frontmatter (title, date, description, tags): PASS
- Word count: 1289 total (`wc -w`, gate 800–1400), 1112 prose-only (target 800–1200): PASS
- All 7 fenced code blocks verified verbatim against source via exact string match: PASS
  - Block 1 → `app/models/user.rb`
  - Block 2 → `app/models/session.rb`
  - Block 3 → `app/models/current.rb`
  - Block 4 → `app/models/concerns/authentication.rb`
  - Block 5 → `app/graphql/mutations/sign_in.rb`
  - Block 6 → `app/frontend/apollo/client.ts`
  - Block 7 → `app/graphql/mutations/sign_out.rb`
- Banned tone words (delve, seamless, effortlessly, game-changer, best-in-class): 0 matches: PASS
- Additional tone check (robust, leverage): 0 matches; the only two `!` characters are inside verbatim Ruby code (`!user.authenticate`, `create!`): PASS
- Factual claims cross-checked against ADR-008/009/010 (30-day expiry, no localStorage, destroy-on-logout, one DB lookup per request, SHA-256 token digests): PASS
- Commit `docs(blog): add authentication architecture post` exists in git log (d93c9c8): PASS
- Post-commit deletion check: no deletions; working tree clean: PASS

## Deviations from Plan

None — plan executed exactly as written. Tasks 1 and 2 landed in a single atomic commit (d93c9c8) because Task 2's only file change would have been snippet corrections, and none were needed after verbatim verification.

## Known Stubs

None. This is a content deliverable; all claims are grounded in current source files and accepted ADRs.

## Self-Check: PASSED

- FOUND: docs/development/2026-07-21-authentication-with-rails-built-ins.md
- FOUND: commit d93c9c8 (`docs(blog): add authentication architecture post`)
