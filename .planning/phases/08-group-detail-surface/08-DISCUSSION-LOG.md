# Phase 8: Group Detail Surface - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 08-Group Detail Surface
**Areas discussed:** Hub layout and mobile order, Upcoming session rules, Spotlight game selection, Member and invite controls

---

## Hub Layout and Mobile Order

### Desktop arrangement

| Option | Description | Selected |
|--------|-------------|----------|
| Main column + side rail | Full-width header; sessions and spotlight in a wide main column; members and invite controls in a narrower rail. | ✓ |
| Single vertical flow | Put all sections in one centered column. | |
| Balanced dashboard grid | Use similarly sized cards in a two-column grid. | |
| You decide | Defer the layout to research and planning. | |

**User's choice:** Main column + side rail.

### Mobile content order

| Option | Description | Selected |
|--------|-------------|----------|
| Sessions → games → members → invite | Prioritize upcoming plans and discovery before management tools. | ✓ |
| Members → sessions → games → invite | Put the group's people first. | |
| Sessions → members → invite → games | Keep social and management content together. | |
| You decide | Defer responsive order to the UI planner. | |

**User's choice:** Sessions → games → members → invite.

### Create-a-night action

| Option | Description | Selected |
|--------|-------------|----------|
| Header button, full-width mobile | Right-aligned header action on desktop; full-width below the description on mobile. | ✓ |
| Header button on all sizes | Keep the compact action beside the title everywhere. | |
| Floating mobile action | Use a fixed floating action on mobile. | |
| You decide | Defer responsive action placement. | |

**User's choice:** Header button, full-width mobile. Existing owner/admin authorization remains unchanged.

### Side-rail scrolling

| Option | Description | Selected |
|--------|-------------|----------|
| Natural page scroll | Scroll all sections together. | |
| Sticky side rail | Keep members and invite controls visible while the main column scrolls. | ✓ |
| Sticky invite only | Keep only a compact invite control visible. | |
| You decide | Resolve from measured content height. | |

**User's choice:** Sticky side rail.

---

## Upcoming Session Rules

### Visible sessions

| Option | Description | Selected |
|--------|-------------|----------|
| Role-aware active list | Everyone sees invited/picking; owner/admin also see drafts; exclude completed/cancelled. | ✓ |
| All non-final sessions | Show draft, invited, and picking to every member. | |
| Scheduled future only | Only show sessions with a future scheduled date. | |
| You decide | Defer visibility rules within current permissions. | |

**User's choice:** Role-aware active list. Undated drafts display **Date TBD**.

### Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Active first, then soonest | Pin Picking first, then invited by date ascending, with undated drafts last. | ✓ |
| Strictly chronological | Sort all dated sessions soonest-first regardless of state. | |
| State groups | Separate Picking, Invited, and Draft sections. | |
| You decide | Choose after inspecting expected session volume. | |

**User's choice:** Active first, then soonest.

### Row navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Whole row + state-aware CTA | Navigate from the entire row and show a trailing next-action label. | ✓ |
| Whole row with chevron | Use one uniform row affordance for every state. | |
| Explicit button only | Navigate only from a dedicated button. | |
| You decide | Defer the accessible navigation treatment. | |

**User's choice:** Whole row + state-aware CTA, navigating to `/s/:id`.

### Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Role-aware empty state | Owner/admin get a create action; members get a neutral message. | ✓ |
| Shared informational state | Show the same neutral state to everyone. | |
| Compact placeholder row | Use one muted line without an action. | |
| You decide | Match the established EmptyState pattern. | |

**User's choice:** Role-aware empty state.

---

## Spotlight Game Selection

### Selection rule

| Option | Description | Selected |
|--------|-------------|----------|
| Most shared, then highest rated | Prioritize owner count, then BGG rating, then name for stability. | ✓ |
| Highest rated only | Show the four highest-rated games. | |
| Deterministic rotating mix | Rotate eligible games on a daily or weekly seed. | |
| You decide | Defer the deterministic query. | |

**User's choice:** Most shared, then highest rated.

### Fewer than four multi-owner games

| Option | Description | Selected |
|--------|-------------|----------|
| Fill with highest-rated single-owner games | Keep multi-owner games first, then complete the four-card grid. | ✓ |
| Only show multi-owner games | Allow a partial or empty grid. | |
| Fill with recently synced games | Use recent imports as fallback. | |
| You decide | Defer fallback and empty-state thresholds. | |

**User's choice:** Fill with highest-rated single-owner games.

### Spotlight card density

| Option | Description | Selected |
|--------|-------------|----------|
| Compact image card + owner stack | Thumbnail, title, rating, and up to three avatars with `+N`. | ✓ |
| Reuse full GameCard | Include year, players, play time, weight, and all owners. | |
| Image and title only | Use a highly visual card with attribution elsewhere. | |
| You decide | Adapt the card to measured width. | |

**User's choice:** Compact image card + owner stack.

### Full-library destination

| Option | Description | Selected |
|--------|-------------|----------|
| Group-scoped CollectionView | Navigate to `/collection?group=<inviteCode>`. | ✓ |
| Nested group library route | Add `/g/:token/collection`. | |
| Expand the hub inline | Replace the preview with the full library in place. | |
| You decide | Align navigation with the Phase 9 redesign. | |

**User's choice:** Group-scoped CollectionView.

---

## Member and Invite Controls

### Invite-link visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Owner and admins only | Match existing invitation authorization. | ✓ |
| Every group member | Let any member share the reusable link. | |
| Owner only | Restrict sharing more than the email-invite flow. | |
| You decide | Preserve the safest existing boundary. | |

**User's choice:** Owner and admins only.

### Per-member action menus

| Option | Description | Selected |
|--------|-------------|----------|
| Only when actions are authorized | Hide empty menus; show only role/remove actions the viewer can perform. | ✓ |
| Menu on every row | Show disabled actions for unauthorized rows. | |
| Managers get one page-level menu | Move management outside member rows. | |
| You decide | Map existing permissions into an accessible menu. | |

**User's choice:** Only when actions are authorized.

### Removal confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Named confirmation dialog | Use a destructive modal naming the member and consequences. | |
| Inline row confirmation | Expand the row with Remove and Cancel controls. | ✓ |
| Two-click menu action | Arm the menu item, then click again to confirm. | |
| You decide | Choose using the available Dialog primitive. | |

**User's choice:** Inline row confirmation, preserving the established behavior.

### Link copying and email invitations

| Option | Description | Selected |
|--------|-------------|----------|
| One combined invite card | Put copy-link controls first and the email/role form below. | ✓ |
| Compact copy card + invite dialog | Move the email form into a modal. | |
| Copy link only on this page | Remove the existing email form from Group Detail. | |
| You decide | Preserve email invites while optimizing density. | |

**User's choice:** One combined invite card.

---

## The Agent's Discretion

The user did not select **You decide** for any discussed decision. Routine visual measurements, exact labels, loading feedback, card click behavior, and Apollo cache details remain implementation discretion as recorded in `08-CONTEXT.md`.

## Deferred Ideas

None — discussion stayed within phase scope.
