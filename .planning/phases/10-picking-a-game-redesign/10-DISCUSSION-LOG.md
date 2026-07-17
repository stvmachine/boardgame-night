# Phase 10: Picking a Game Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 10-picking-a-game-redesign
**Areas discussed:** Suggestion card composition, suggestion query loading, picker result scope, preference handling, picking-header editing

---

## Suggestion Card Composition

| Option | Description | Selected |
|--------|-------------|----------|
| Extend the rich GameCard | Add optional suggestion score/confidence/reason context while preserving collection behavior | ✓ |
| Create a standalone SuggestionCard | Duplicate or wrap the existing game-card anatomy in a separate component | |

**User's choice:** Auto-selected the recommended rich-card extension.
**Notes:** A thin wrapper remains implementation discretion only if it delegates the full base card and does not duplicate anatomy.

---

## Suggestion Query Loading

| Option | Description | Selected |
|--------|-------------|----------|
| Include suggestions in `nightSession` | Resolver short-circuits outside picking and Apollo receives one normalized payload | ✓ |
| Use a second query/fragment | Add a separate request and extra component query state | |

**User's choice:** Auto-selected the main session operation.
**Notes:** Add `suggestions`, `timeBudgetMinutes`, and `complexityPreference`, then regenerate code.

---

## Picker Result Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Ranked shortlist only | Preserve the server's top-eight order and keep the decision focused | ✓ |
| Suggestion-first plus Browse All | Retain the full group-collection query behind a secondary browsing mode | |

**User's choice:** Auto-selected suggestion-only mode.
**Notes:** The Collection route remains the browsing surface; Phase 10 does not duplicate it.

---

## Preference Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Display-only during picking | Show time/complexity context but preserve the existing state guard | ✓ |
| Edit during picking | Broaden `updateSessionPreferences` and change the locked shortlist inputs | |

**User's choice:** Auto-selected display-only preferences.
**Notes:** Ordinary session details are handled separately and must not affect suggestion inputs.

---

## Picking Header Edit Details

| Option | Description | Selected |
|--------|-------------|----------|
| Add `updateSessionDetails` | Host-only title/description/date/location/capacity edits in draft/invited/picking | ✓ |
| Defer Edit Details | Omit the required control because no current mutation supports it | |
| Use read-only Details | Relabel a disclosure without providing editing | |

**User's choice:** Auto-selected the narrowly scoped mutation.
**Notes:** Preferences remain excluded, state remains picking, and the existing draft Schedule action must not be reused as the save action.

---

## The Agent's Discretion

- Dialog vs Sheet vs inline expansion for the details editor.
- Exact score formatting, confidence badge mapping, reason-chip wrapping, avatar cap, and responsive card columns.
- Direct optional props vs a thin delegating wrapper around `GameCard`, provided collection rendering does not change.

## Deferred Ideas

- Game voting and “who brings it” assignment.
- Browse All fallback inside the picker.
- Preference editing after picking begins.
- Session history, play logging, and a dedicated re-pick flow.
