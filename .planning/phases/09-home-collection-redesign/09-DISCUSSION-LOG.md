# Phase 9: Home & Collection Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 09-home-collection-redesign
**Areas discussed:** Home/Hot relationship, collection filter layout, stats sourcing, rich-card density, segmented controls, Recently Played data

---

## Home and Hot Route Relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both | Trending preview on Home; standalone `/hot` and nav item remain | ✓ |
| Consolidate | Redirect `/hot` to Home trending | |
| Home only | Remove Hot navigation and standalone page | |

**Auto-selected choice:** Keep both.
**Notes:** Preserves existing navigation while HOME-03 gains a dashboard preview and View all path.

---

## Collection Filter Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive hybrid | Persistent Collection-local panel at `xl`; Sheet below `xl` | ✓ |
| Always persistent | Second sidebar beside the 280px app nav at desktop widths | |
| Always overlay | Filters never remain visible beside results | |

**Auto-selected choice:** Responsive hybrid.
**Notes:** Avoids excessive horizontal chrome while honoring the structured-sidebar requirement and Phase 5 D-14.

---

## Personal Stats Data

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated GraphQL stats read | Database-backed, authenticated counts without fetching full collections | ✓ |
| Client aggregation | Count whatever happens to be present in Apollo cache | |
| Multiple existing queries | Fetch collection, groups, and sessions separately | |

**Auto-selected choice:** Dedicated GraphQL stats read.
**Notes:** Signed-out users receive a sign-in prompt; protected counts are never inferred or leaked.

---

## Rich Card Description Density

| Option | Description | Selected |
|--------|-------------|----------|
| Clamped by view | Two lines in grid, three lines in horizontal list, plain text | ✓ |
| Full description | Render complete BGG HTML on every card | |
| No description | Keep current compact cards | |

**Auto-selected choice:** Clamped by view.
**Notes:** Meets COLL-20 without unsafe HTML or overwhelming the scan hierarchy.

---

## Complexity Segmented Control

| Option | Description | Selected |
|--------|-------------|----------|
| Accessible reusable primitive | Source-owned reka-ui ToggleGroup or equivalent | ✓ |
| Adapt Tabs | Treat complexity options as tab navigation | |
| Loose buttons | Independent buttons with hand-built keyboard behavior | |

**Auto-selected choice:** Accessible reusable primitive.
**Notes:** Must support single selection and keyboard navigation and be reusable in Phase 10.

---

## Recently Played Sort

| Option | Description | Selected |
|--------|-------------|----------|
| Existing night-session history | Sort by latest authorized picked-game session | ✓ |
| Disabled placeholder | Show the option but wait for v2 play logging | |
| Hide the option | Defer the requirement entirely | |

**Auto-selected choice:** Existing night-session history.
**Notes:** Makes the required sort functional without adding play logging or a history UI. Missing history sorts last with deterministic ties.

---

## The Agent's Discretion

- Exact GraphQL type names and batched query implementation.
- Exact filter chip presentation, card breakpoints, and Sheet motion.
- Exact source-owned segmented-control implementation, provided accessibility and Phase 10 reuse are maintained.

## Deferred Ideas

- Play logging and history UI remain v2.
- Server-side collection search remains deferred.
- Hot-route consolidation and new discovery controls are outside Phase 9.
