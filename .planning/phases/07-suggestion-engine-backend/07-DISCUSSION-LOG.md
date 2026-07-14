# Phase 7: Suggestion Engine Backend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 7-Suggestion Engine Backend
**Areas discussed:** Scoring formulas, Session inputs, GraphQL API shape, Confidence & shortlist, Explanation format, Suggestion availability

---

## Scoring Formulas

| Option | Description | Selected |
|--------|-------------|----------|
| Graded poll ratios | Score = (Best×1.0 + Rec×0.5 - NRec×1.0) / total_votes | |
| Binary bestPlayerCount match | 1.0 if attendee_count == bestPlayerCount, 0.0 otherwise | |
| Hybrid: best + recommended | 1.0 if best, 0.5 if recommended, 0.0 if not recommended | |

**User's choice:** Research — don't make up solutions. Directed to FEATURES.md which already specifies the Schmaus adjusted-rating formula.
**Notes:** The scoring formula is fully specified in `.planning/research/FEATURES.md` §"Poll-Based Suggestion Engine". All 5 component formulas (player_count_suitability, time_fit, complexity_fit, community_rating, ownership_bonus) are locked by research. No new decisions needed — downstream agents follow FEATURES.md exactly.

---

## Session Inputs

| Option | Description | Selected |
|--------|-------------|----------|
| New columns on night_sessions | Add time_budget_minutes:integer (default 120) and complexity_preference:string (default "Any") via migration | ✓ |
| Query arguments only | No migration; frontend passes time_budget and complexity_preference as GraphQL query arguments | |
| Derive from context | No user input; time_budget defaults to 120, complexity derived from group collection average weight | |

**User's choice:** New columns on night_sessions
**Notes:** Host sets preferences when creating/scheduling the session. Editable before entering "picking" state. Defaults: 120 min, "Any".

---

## GraphQL API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Field on NightSessionType | `suggestions: [SuggestionType]` computed on demand, no persistence | ✓ |
| Root query with sessionId arg | `query { suggestions(sessionId: ID!) }` as a root query | |
| Mutation that persists shortlist | `mutation { generateSuggestions(sessionId: ID!) }` that stores to a new table | |

**User's choice:** Field on NightSessionType
**Notes:** Follows existing pattern (attendee_count is also a computed field). No persistence — always fresh.

---

## Candidate Pool

| Option | Description | Selected |
|--------|-------------|----------|
| Games owned by attending members | Only score games where ≥1 attendee owns the game via BggCollection | ✓ |
| Full group merged collection | Score all games in the group's merged collection regardless of attendance | |
| Attendee-owned + filter by player count | Pre-filter by [min_players, max_players] before scoring | |

**User's choice:** Games owned by attending members
**Notes:** A game nobody brings can't be played. ownership_bonus naturally rewards multi-owner games.

---

## Confidence Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Enum: HIGH / MEDIUM / LOW | HIGH ≥50 votes, MEDIUM 20-49, LOW <20 (fallback heuristic) | ✓ |
| Boolean: isLowConfidence | True when poll votes < 20 | |
| Numeric: voteCount + confidenceScore | Raw vote count and 0-1 confidence score | |

**User's choice:** Enum: HIGH / MEDIUM / LOW
**Notes:** Matches FEATURES.md's "flag low-confidence" spec. Frontend can show a badge or tooltip.

---

## Shortlist Size

| Option | Description | Selected |
|--------|-------------|----------|
| Top 8 | Fixed number, sorted by score descending, exclude score 0 | ✓ |
| Top N with minimum score threshold | Up to 8, but only games with score > 30 | |
| Configurable limit argument | Add a `limit` argument (default 8) | |

**User's choice:** Top 8
**Notes:** Matches FEATURES.md spec. Fixed number, predictable, enough for a friend group.

---

## Explanation Format

| Option | Description | Selected |
|--------|-------------|----------|
| Structured fields + reason chips | Numeric breakdown fields AND `reasons: [String]` array of human-readable chips | ✓ |
| Numeric fields only | Just the 5 numeric score components; frontend generates all text | |
| Reason strings only | Just `reasons: [String]` array; no numeric breakdown | |

**User's choice:** Structured fields + reason chips
**Notes:** Frontend can show chips directly and use numeric fields for tooltips/sorting. Backend generates reason strings.

---

## Suggestion Availability

| Option | Description | Selected |
|--------|-------------|----------|
| Only in 'picking' state | Suggestions only when session.state == "picking"; nil otherwise | ✓ |
| Available in 'invited' and 'picking' | Host can preview before formally entering picking | |
| Always available | Works in any state with attendees | |

**User's choice:** Only in 'picking' state
**Notes:** Matches UX flow: host enters picking mode → frontend fetches suggestions → host picks from shortlist. Returns nil (not empty array) in other states to distinguish "not available" from "no matches".

---

## Agent's Discretion

- Service class structure (Suggestions::Engine vs Suggestions::Scorer vs module)
- Whether to add helper methods on BggPoll/BggPollResult or compute in service
- Dataloader usage for batch-loading in the resolver
- Whether complexity_preference needs a GraphQL enum type or plain string
- Edge case handling for games with no poll_data_fetched_at
- Whether preference columns are set via existing mutations or a new updateSessionPreferences mutation
- Exact reason chip text format

## Deferred Ideas

None — discussion stayed within phase scope.