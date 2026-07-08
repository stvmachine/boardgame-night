# ADR-012: Session Lifecycle State Machine

## Status

accepted

## Context

A boardgame night session progresses from creation to game selection. The v1 requirements describe states: draft → scheduled → rsvp_open → picking → completed. For a small friend-group app, the distinction between "scheduled" and "rsvp_open" is operationally the same as "invites sent": once an invite is sent, people can RSVP. We need a state model that is clear for the host, easy to implement, and aligned with the existing dry-validation → GraphQL mutation pattern.

## Decision

We will use a **manual 4-state state machine**: `draft → invited → picking → completed`.

Specifically:
- `draft`: the session is being created/edited; no invites sent.
- `invited`: invites sent, RSVPs open; host can see RSVP status and resend invites.
- `picking`: host is choosing a game from the group's merged collection; RSVPs are closed.
- `completed`: a game has been picked; the session is read-only history.
- Transitions are explicit mutations driven by the host: `scheduleSession`, `startPicking`, `pickGame`, `cancelSession`, `reopenSession`.
- Guard clauses prevent invalid transitions (e.g., `pickGame` only from `picking`).
- The host may advance early (e.g., start picking even if not everyone has RSVPed); warnings are surfaced in the mutation payload but not blocking.
- Editing details after invites are sent requires confirmation if the change affects invitees (e.g., changing `scheduled_at`).

## Consequences

- Simple model: one integer `state` column, one `transition_to!` method, ~20 lines of Ruby.
- Clear UI affordances: the current state drives which actions are visible.
- Zero background jobs for state management; all transitions are synchronous mutations.
- Future auto-advance or nudging can be added with a single Solid Queue recurring job without changing the core state machine.
- The `scheduled` and `rsvp_open` requirements from REQUIREMENTS.md are merged into `invited`; this is a deliberate simplification for v1 and should be documented in the requirement traceability.

## Alternatives Considered

- **Time-based auto-advance (derived state)** — rejected: confusing when the host's intent differs from the schedule; derived state fights ActiveRecord conventions and requires cron jobs for enforcement.
- **Hybrid manual + auto-advance** — rejected: better long-term UX, but adds a background job and nudging infrastructure that is marginal value for 3–10 person friend groups. Can be added later.
- **Minimal 2-state (`draft` / `completed`)** — rejected: loses the important `picking` phase that gates the game-selection UI and game-filtering by attendee count.

## References

- `.planning/REQUIREMENTS.md` §SESS-01 through SESS-06
- `docs/adr/007-dry-rails-validation-contracts.md`
- `docs/adr/010-group-invitation-tokens.md`
- `docs/adr/011-group-collection-view.md`
