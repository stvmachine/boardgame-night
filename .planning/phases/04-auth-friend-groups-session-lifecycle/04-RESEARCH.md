# Phase 4 Research: Auth, Groups, Invitations, and Session Lifecycle

**Phase:** 04 — Auth + Friend Groups + Session Lifecycle
**Researched:** 2026-07-09
**Method:** Parallel agent research on five gray areas; findings synthesized below.

---

## 1. Authentication Session Strategy

### Findings
- Rails 8 ships a built-in authentication generator (`bin/rails generate authentication`) that scaffolds `User` (with `has_secure_password`), `Session`, `Current`, and password-reset mailers.
- The generator is cookie-oriented by default. For an API-only + Vue SPA, the consensus adaptation is to add a `token` column to `sessions` and return the token as JSON from login, then resolve the session from the `Authorization: Bearer <token>` header.
- CookieStore sessions work for same-origin SPAs but lack per-device revocation and require cross-origin cookie handling in dev.
- JWT access/refresh tokens add complexity (algorithm pinning, refresh rotation, revocation denylist) without clear benefit for a single-origin browser SPA with no mobile client.
- Opaque custom session tokens are feasible but reinvent the generator's scaffolding.

### Recommendation
Use the Rails 8 authentication generator adapted for API-only Bearer tokens. Store token in JS memory (or Pinia) and attach via Apollo `setContext`. Logout destroys the `Session` row.

### References
- Rails 8 Security Guide: Authentication Generator
- AvoHQ: "Rails API authentication with the auth generator" (Sep 2025)
- Nikita Sinenko: "Rails 8 Authentication" (Nov 2025)
- a-chacon PoC: using Rails 8 auth system in API-only mode (Oct 2024)
- Stanza.dev Rails API Authentication course (2025)
- TTB Software: "Rails 8 authentication generator sessions without Devise" (Apr 2026)

---

## 2. No-Account RSVP / Provisional Profiles

### Findings
- A separate `Guest` table keeps schema purity but creates a painful upgrade path: every RSVP row must be retargeted when the guest creates an account.
- A polymorphic `Attendee` (`User` or `Guest`) avoids a new table but loses FK constraints, requires GraphQL union types, and still needs migration on upgrade.
- Adding a `provisional:boolean` flag to the existing `User` table makes upgrade a single `UPDATE`, keeps Apollo's normalized cache simple, and lets `Session.attendees` return `[User!]!`.
- The main risk is preventing provisional users from being treated as full group members (they cannot contribute BGG collections). This is mitigated by a model validation.
- Auto-generate `guest_*` usernames for provisional rows and hide them in the UI via a `displayName` field.

### Recommendation
Use provisional `User` rows for no-account invitees. Extend `UserType` with `isProvisional` and `displayName`. Guard group memberships with `user_must_not_be_provisional`.

### References
- Project codebase: `app/models/user.rb`, `app/graphql/types/user_type.rb`
- Internal agent research: oracle data-model analysis (2026-07-09)

---

## 3. Magic-Link Group and Session Invitations

### Findings
- Signed URLs (`MessageVerifier` / `generates_token_for`) are simple and tamper-proof but provide no audit trail, no per-token revocation, and cannot represent a no-account RSVP because they require a persisted record to verify against.
- JWTs are stateless; single-use enforcement requires a denylist, negating the statelessness benefit and adding algorithm confusion risk.
- A persisted `InviteToken` table with a SHA-256 hashed CSPRNG token is the dominant production pattern. It provides: audit trail, per-invite revocation, atomic acceptance, existing-user direct join, new-user session handoff, and no-account RSVP support (via `status = 'rsvped'`).
- A reusable group join code (`groups.invite_code`) is a useful secondary open-enrollment mechanism but does not satisfy targeted invitation requirements.

### Recommendation
Use an `InviteToken` table as the primary targeted invitation mechanism. Keep `generates_token_for` for password reset and email verification only.

### References
- rameerez/organizations gem (2026)
- Viprasol SaaS Team Invitations (2026)
- MojoAuth: "Are magic links secure?" (2026)
- maheshkukreja/secure-patterns: team invitations checklist
- OWASP Authentication Cheat Sheet

---

## 4. Group Collection View

### Findings
- The existing `BggThing.merged_for_users` scope and `OwnersLoader` already implement the merged collection query efficiently.
- At v1 scale (5–20 members, ~200 games each), the dynamic query is ~5–15ms total for the merge + owners batch.
- A persisted snapshot table adds write amplification on every sync, join, or leave, and requires diff-and-delete logic to handle removals.
- SQLite (v1 database) does not support materialized views.
- Caching large serialized object graphs in Solid Cache can be slower than re-running the query and introduces invalidation complexity.

### Recommendation
Compute the group merged collection dynamically from members' `bgg_collections`. Reuse the existing scope and Dataloader source.

### References
- Project codebase: `app/models/bgg_thing.rb`, `app/graphql/loaders/owners_loader.rb`
- Internal agent research: oracle performance analysis (2026-07-09)

---

## 5. Session Lifecycle State Machine

### Findings
- The original 5-state requirement (`draft → scheduled → rsvp_open → picking → completed`) over-models a friend-group app: sending invites is effectively opening RSVPs.
- Time-based auto-advance is confusing when host intent differs from the schedule and requires cron jobs.
- A hybrid manual + auto-advance model is better long-term UX but adds infrastructure marginal for v1.
- A minimal 2-state model loses the important `picking` phase that gates game selection.
- A manual 4-state model (`draft → invited → picking → completed`) matches the existing mutation/contract pattern, is simple to implement, and can be extended with auto-advance later.

### Recommendation
Use a manual 4-state state machine with explicit host-driven transitions. Merge `scheduled` and `rsvp_open` into `invited`.

### References
- Internal agent research: oracle state-machine analysis (2026-07-09)
- `.planning/REQUIREMENTS.md` §SESS-01 through SESS-06

---

## Summary of Decisions

| Area | Decision | ADR |
|------|----------|-----|
| Auth session | Rails 8 generator + Bearer token | ADR-008 |
| No-account RSVP | Provisional `User` rows | ADR-009 |
| Magic-link invites | `InviteToken` table | ADR-010 |
| Group collection | Dynamic computation | ADR-011 |
| Session lifecycle | Manual 4-state machine | ADR-012 |
