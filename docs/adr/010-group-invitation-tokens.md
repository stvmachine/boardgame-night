# ADR-010: Group Invitation Tokens

## Status

accepted

## Context

Group owners and admins must be able to invite people to join a friend group. The invite mechanism must support:
- Existing users (direct accept).
- New users (sign up then accept, or accept via a session handoff).
- No-account RSVP for a specific session (the invitee may not have or want a full account yet).
- Per-invite revocation, expiry, and audit history.

The group model itself has a separate, shareable `invite_code` for open enrollment; this ADR covers the **targeted invitation link** sent to a specific email address.

## Decision

We will use a persisted **`InviteToken` table** for targeted group and session invitations.

Specifically:
- `invite_tokens` stores: `group_id`, `inviter_id`, `email`, `role` (default `member`), `token_digest` (SHA-256 of raw token), `status` (`pending` / `accepted` / `revoked` / `expired` / `rsvped`), `expires_at`, `accepted_by_id`, `accepted_at`, and optional `rsvp_session_id` for no-account session invites.
- The raw token is a 256-bit CSPRNG string (`SecureRandom.urlsafe_base64(32)`); only its SHA-256 digest is stored.
- Acceptance is atomic: `UPDATE ... WHERE status = 'pending'` with row-level locking ensures only the first concurrent click succeeds.
- Existing users accept immediately; new users store the token in their browser session and complete the flow after registration.
- For no-account RSVP, the same `InviteToken` row records `status = 'rsvped'` without requiring a full account.
- A reusable `groups.invite_code` is kept as a separate, optional mechanism for open enrollment; it is not covered by this ADR.

## Consequences

- Full auditability: who invited whom, when, and whether the invite was accepted, revoked, or expired.
- Per-invite revocation is a single `UPDATE`.
- The same table supports group joins, new-user signups, and no-account RSVPs.
- Slightly more schema and code than a signed URL, but the only pattern that satisfies all requirements.
- We must not use the token digest as a lookup key without hashing the incoming token first, and we must never log or store raw tokens.

## Alternatives Considered

- **Signed URL with `ActiveSupport::MessageVerifier`** — rejected: no audit trail, no per-token revocation, and cannot represent a no-account RSVP because it requires a persisted record to verify against.
- **Signed URL with `generates_token_for`** — rejected: same limitations as above; requires a pre-existing record and cannot be revoked per-token.
- **JWT** — rejected: stateless by design; single-use enforcement requires a denylist, reintroducing the DB state it was meant to avoid. Adds algorithm confusion risk and complexity.
- **Reusable group code only** — rejected: does not satisfy targeted invitation and audit requirements, though it remains a useful secondary open-enrollment mechanism.

## References

- `docs/adr/008-authentication-session-strategy.md`
- `docs/adr/009-provisional-user-accounts-rsvp.md`
- OWASP token guidance: <https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>
- Project decision (Phase 1): `docs/adr/001-monorepo-rails-api-vue-spa.md`
