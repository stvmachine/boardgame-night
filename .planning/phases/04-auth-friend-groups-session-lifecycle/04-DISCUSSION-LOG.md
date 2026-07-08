# Phase 4: Auth + Friend Groups + Session Lifecycle — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `04-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-07-09
**Phase:** 04-Auth + Friend Groups + Session Lifecycle
**Areas discussed:** Auth session strategy, No-account RSVP / provisional profiles, Magic-link invite flow, Group collection view, Session lifecycle state machine

---

## Auth Session Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Rails session cookie | Re-enable CookieStore in API-only Rails; credentials cross-origin in dev | |
| JWT access + refresh tokens | Short-lived access token in memory, httpOnly refresh cookie | |
| Custom opaque session token | Hand-rolled `Session` model with bearer token | |
| **Rails 8 auth generator + Bearer token** | Run generator, add `token` column, resolve from `Authorization` header | ✓ |

**User's choice:** Approved the orchestrator's recommendation after parallel research.
**Notes:** Chosen because it reuses the official Rails 8 stack, gives per-device revocation and password reset for free, avoids JWT complexity, and works cleanly over GraphQL with an Apollo `setContext` link.

---

## No-Account RSVP / Provisional Profiles

| Option | Description | Selected |
|--------|-------------|----------|
| Separate `Guest` table + `rsvp_responses` | Guests are not users; upgrade requires data migration | |
| **Provisional `User` rows** | Add `provisional` flag; upgrade is a single `UPDATE` | ✓ |
| Polymorphic `Attendee` | `User` or `Guest` via type/id; no FK, complex upgrade | |
| Nullable password on `User` | Disable `has_secure_password` validations for guests | |

**User's choice:** Approved the orchestrator's recommendation after parallel research.
**Notes:** Provisional users keep GraphQL simple (`UserType` only), Apollo cache normalized, and upgrade path trivial. Group membership validation prevents provisional users from contributing collections.

---

## Magic-Link Invite Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Signed URL (`MessageVerifier`) | Stateless, no DB, but no audit/revocation and no no-account RSVP | |
| `generates_token_for` | Idiomatic Rails, but requires pre-existing record and no per-token revocation | |
| **Token table (`InviteToken`)** | CSPRNG token hashed in DB; full audit, revocation, no-account RSVP | ✓ |
| JWT | Stateless, but revocation needs denylist; complexity without benefit | |
| Reusable code only | Group password; no targeted invites | |

**User's choice:** Approved the orchestrator's recommendation after parallel research.
**Notes:** The `InviteToken` table is the only pattern that satisfies all v1 requirements: targeted invites, audit trail, per-invite revocation, new-user flow, and no-account RSVP. Reusable group join codes are kept as a secondary optional mechanism.

---

## Group Collection View

| Option | Description | Selected |
|--------|-------------|----------|
| **Dynamic computation** | Reuse `BggThing.merged_for_users` + `OwnersLoader` | ✓ |
| Persisted `GroupCollection` snapshot | Denormalized table rebuilt on sync/join/leave | |
| Materialized database view | Not supported by SQLite (v1 DB) | |
| `Rails.cache` of merged result | Large object serialization; invalidation complexity | |

**User's choice:** Approved the orchestrator's recommendation after parallel research.
**Notes:** Dynamic computation is already implemented, ~5–15ms at v1 scale, perfectly fresh, and avoids write amplification. Snapshot/cache considered over-engineered for v1.

---

## Session Lifecycle State Machine

| Option | Description | Selected |
|--------|-------------|----------|
| **Manual 4-state (`draft → invited → picking → completed`)** | Host-driven transitions; merge `scheduled`/`rsvp_open` | ✓ |
| Time-based auto-advance | Derived state from timestamps | |
| Hybrid manual + auto-advance | Host can override, system nudges by time | |
| Minimal 2-state (`draft` / `completed`) | No explicit `picking` phase | |

**User's choice:** Approved the orchestrator's recommendation after parallel research.
**Notes:** Manual 4-state is the simplest fit for the existing mutation/contract pattern and friend-group UX. Hybrid can be added later without changing the model.

---

## Claude's Discretion

- Exact column names for `Group` and `Session` (within the decided data model).
- Whether login/signup are GraphQL mutations or dedicated JSON endpoints.
- Email delivery mechanism in dev vs production.
- Rate-limiting implementation details (Rack::Attack).

## Deferred Ideas

- Game suggestion engine (SUGG-01/02) — v2.
- Ranked voting / "who brings it" (VOTE-01/02) — v2.
- 4-state RSVP (RSVP-01) — v2.
- Recurring sessions (SESS-07) — v2.
- Session auto-advance / nudging — future enhancement.
- Server-side search for group collections — v2.

---

*Phase: 4-Auth + Friend Groups + Session Lifecycle*
*Discussion logged: 2026-07-09*
