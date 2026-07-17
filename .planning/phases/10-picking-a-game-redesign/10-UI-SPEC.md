---
phase: 10
slug: picking-a-game-redesign
status: approved
reviewed_at: 2026-07-18T00:00:00Z
shadcn_initialized: true
preset: reka-nova
style: reka-nova
font: inter
base_color: neutral
created: 2026-07-17
---

# Phase 10 — Picking a Game Redesign UI Design Contract

> Visual and interaction contract for the attendee-aware Picking state of `/s/:id`. This contract extends the approved Tabletop Social system and the Phase 9 rich-card language; it does not introduce a new visual system.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn-vue CLI (reka-nova style), source-owned components |
| Preset | reka-nova |
| Component library | reka-ui headless accessibility primitives |
| Icon library | Material Symbols Outlined via `@iconify/vue` and the project `Icon` wrapper |
| Font | Inter variable (`@fontsource/inter`) |

**Source of truth:** Phase 5 tokens/primitives and Phase 9 card contracts. No new palette, font, icon package, motion package, or third-party registry is allowed.

---

## Spacing Scale

All spacing uses the established 4px scale:

| Token | Value | Phase 10 usage |
|-------|-------|----------------|
| xs | 4px | Icon/label gaps, badge internals |
| sm | 8px | Chip gaps, compact card rows, avatar-to-count gap |
| md | 16px | Card padding, form field gaps, mobile page padding |
| lg | 24px | Header sections, grid gaps, desktop page padding |
| xl | 32px | Header-to-shortlist separation |
| 2xl | 48px | Major page breathing room |
| 3xl | 64px | Reserved; not required in the dense picking flow |

**Exceptions:** 44px minimum touch target for Edit Details, dialog close, and Pick this game controls. Attendee avatars may use approved 28px/32px sizes because each stack is one labelled, non-interactive group.

---

## Typography

| Role | Size | Weight | Line height | Usage |
|------|------|--------|-------------|-------|
| Body | 16px | 400 | 1.5 | Session metadata, empty/error copy |
| Supporting body | 14px | 400 | 1.5 | Reasons, preference context, helper text |
| Label | 14px | 600 | 1.25 | Buttons, chips, metadata labels |
| Heading | 20px | 600 | 1.2 | Suggestion section title, dialog title |
| Display | 28px | 600 | 1.2 | Session title/page `h1` |

- Game title uses the Phase 9 card contract: 14px/600, `line-clamp-2`.
- Score uses 20px/600 tabular numerals; it is supporting ranking information, not a second page heading.
- Status/confidence badges use 14px/600 with the existing uppercase/small-caps treatment.
- No italic headings or decorative display face.

---

## Color

Use semantic M3 tokens only:

| Role | Token | Usage |
|------|-------|-------|
| Dominant (60%) | `bg-surface text-on-surface` | Page background |
| Secondary (30%) | `bg-surface-container border-outline` | Header, cards, dialog, skeletons |
| Accent (10%) | `primary` / `on-primary` | Pick action, links, selected/focus state |
| Destructive/error | `error` / `on-error-container` | Visible mutation/query errors only |

### Status and confidence mapping

| Meaning | Treatment |
|---------|-----------|
| Picking | Existing `Badge variant="picking"` warning-container semantics |
| High confidence | `Badge variant="completed"`; copy **High confidence** |
| Medium confidence | `Badge variant="invited"`; copy **Medium confidence** |
| Low confidence | `Badge variant="draft"`; copy **Low confidence** |
| Score | Neutral surface-high pill with primary text; never use destructive or success color to imply quality |

Accent is reserved for the primary pick action, Edit Details text/icon affordance, focus rings, and links. Reason chips remain neutral `surface-container-high` so eight cards do not become an indigo wall.

---

## Copywriting Contract

| Element | Exact copy |
|---------|------------|
| Page status | Picking |
| Edit action | **Edit Details** |
| Details dialog title | Edit session details |
| Details dialog description | Update the session information. Game preferences stay locked while picking. |
| Details save | **Save details** |
| Details cancel | Cancel |
| Details save error | Couldn't save session details. Check the fields and try again. |
| Suggestion heading | Game Suggestions (Filtered for `{N}` Players) |
| Time context | Up to `{minutes}` min |
| Complexity context | `{preference}` complexity |
| Card primary CTA | **Pick this game** |
| Card pending CTA | Picking… |
| Non-host guidance | The host will choose the game. |
| No-attendee heading | No confirmed players yet |
| No-attendee body | Once guests RSVP Going, suggestions will appear here. |
| No-match heading | No games fit this night |
| No-match body | The confirmed players don't have an eligible game in the shared collection. |
| Query error heading | Couldn't load suggestions |
| Query error body | Check your connection and try again. |
| Query retry | **Try again** |
| Pick error | Couldn't pick `{game}`. Try again. |
| Missing date | Date TBD |
| Missing location | Location TBD |

Do not fabricate recommendation percentages or owner availability. Render backend-generated `reasons` verbatim as text chips; score and confidence come from GraphQL.

---

## Registry Safety

| Registry | Blocks used | Safety gate |
|----------|-------------|-------------|
| Existing source-owned primitives | Card, Badge, Button, AvatarGroup, Dialog, Input, Textarea/field pattern, Skeleton, Icon | Already committed and covered by primitive tests |
| shadcn-vue CLI | none required | No generator invocation expected |
| Third-party registries | none | Prohibited |

Any icon in the new surface must use the project `Icon` wrapper with Material Symbols names. Do not add or restore `@lucide/vue`.

---

## Component Contract

### Composition root

`NightSessionView.vue` remains the route-level query/error/state boundary. The `PICKING` branch composes:

1. `PickingSessionHeader` (new or extracted from the existing header)
2. preference context and suggestion heading
3. suggestion loading/error/empty/content state
4. `GamePicker` rewritten around `session.suggestions`

The source/DOM order must match this sequence on every breakpoint.

### Picking session header

**Container:** `rounded-xl border border-outline bg-surface-container shadow-card p-4 md:p-6`.

**Desktop (`lg+`):**
- First row: title/status block left; host-only Edit Details outline button right.
- Title is the page `h1`; Picking badge sits inline when space permits and wraps below without clipping.
- Second row: date/time and location metadata left; going-attendee labelled avatar group/count right.

**Mobile (`<lg`):**
- Stack title → Picking badge → date/location → attendee group → full-width Edit Details.
- Button remains after attendee context in source order and spans available width.

**Attendees:**
- Include only `response === GOING`.
- Show up to 5 avatars at `md+`, up to 4 below `md`, followed by `AvatarGroupCount` `+N` when needed.
- Adjacent visible copy: `{N} going`; accessible group name: `{N} confirmed players: {names}`.
- Avatar group is informative, not individually interactive.

### Edit session details

Use a source-owned `Dialog` for a focused edit flow. At widths below 640px, content uses `w-[calc(100vw-32px)] max-h-[calc(100dvh-32px)] overflow-y-auto`; at `sm+`, `max-w-xl`.

Field order:
1. Title (required)
2. Description (optional)
3. Date and time
4. Location
5. Capacity

Do not place time budget or complexity preference in editable controls. Show one neutral helper line: **Game preferences stay locked while picking.**

Interaction:
- Open only for the host; non-hosts do not render the button or hidden dialog trigger.
- Initial focus moves to Title; Escape and Cancel close without saving.
- Save validates inline, then disables Save and Cancel while pending and shows **Saving…**.
- On success, close, restore focus to Edit Details, and announce **Session details updated.** through an `aria-live="polite"` region.
- On failure, keep entered values and dialog open; show the contract error at the top and focus the error summary.
- Dirty close requires no extra confirmation in this phase; Cancel discards the unsaved dialog draft.

### Suggestion section header

- Section `h2`: **Game Suggestions (Filtered for N Players)**.
- Use the server `attendeeCount`; never infer from avatar DOM.
- Under the heading, show neutral read-only chips for **Up to N min** and **X complexity**.
- On mobile, heading and chips stack with `gap-2`; desktop may align chips on the same row if the heading remains first in source order.

### Suggestion cards

Reuse the Phase 9 `GameCard` grid anatomy; no list toggle appears on this screen.

**Base anatomy preserved:**
- 4:3 thumbnail/fallback
- title, rating/weight metadata, plain-text description
- capped owner avatars
- players/time/complexity footer
- whole-card fixed BGG link behavior with nested action isolation

**Suggestion extension, after title/description and before footer:**
- rank/score row: `Score {roundedScore}` neutral pill and confidence badge
- reason list: first 3 backend reason strings as wrapping neutral chips; if more exist, expose remaining reasons through a labelled **Show more reasons** disclosure rather than truncating silently
- card action footer: host-only full-width primary **Pick this game** button; non-host neutral text **The host will choose the game.**

Do not render the five numeric breakdown factors by default. The score, confidence, and human-readable reasons provide enough explanation without turning cards into dashboards.

### Pick interaction

- `@click.stop` and keyboard isolation prevent the action from opening BGG.
- Pending state is scoped to the selected card. Its action reads **Picking…** and is disabled; all other pick buttons are disabled until the mutation settles to prevent competing submissions.
- No optimistic state change. Apollo applies the returned normalized `NightSession`, then state-driven composition replaces the picker with `SessionSummary`.
- Mutation failure leaves cards and ranking in place and shows an inline error associated with the selected card.
- Success announcement: **{game} selected for this night.** Use `aria-live="polite"` before the completed view mounts.

---

## Layout and Responsive Contract

### Page width and spacing

- Keep the AppShell content boundary; picking content uses `max-w-7xl mx-auto p-4 md:p-6`.
- Header to suggestion section: `mt-8` / 32px.
- Section header to cards: `mt-4` / 16px.
- Suggestion grid: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`.
- Tracks must use `minmax(0, 1fr)` behavior; titles and chips may wrap but never cause horizontal scroll.

### Verification widths

Verify 320px, 375px, 414px, 768px, 1024px, and 1280px:
- No horizontal scroll.
- Header DOM order remains title/status → metadata → attendees → Edit Details.
- Edit Details is full width below `sm`, intrinsic width above.
- Cards are one column below `md`, two at `md`–`xl`, three at `xl+`.
- Reason chips wrap within card width; no chip is horizontally scrollable.
- Dialog remains within 16px viewport gutters and scrolls internally on short screens.

---

## State Contracts

### Initial loading

- Keep session header geometry visible when base session data is available.
- Render 8 suggestion skeletons matching card anatomy: 4:3 media, title, two description lines, score/confidence pills, three reason chips, footer, and action.
- If the full session query is loading, render a header skeleton followed by the same grid skeletons.

### No confirmed attendees

- Trigger when `state === PICKING`, `attendeeCount === 0`, and suggestions is empty.
- Use the shared `EmptyState`: **No confirmed players yet** / **Once guests RSVP Going, suggestions will appear here.**
- Do not show Browse All or an unauthorized RSVP-management CTA.

### No eligible suggestions

- Trigger when `attendeeCount > 0` and suggestions is empty.
- Copy: **No games fit this night** / **The confirmed players don't have an eligible game in the shared collection.**
- Do not silently fall back to the entire group collection.

### Query error

- Shared error card with **Couldn't load suggestions**, connection guidance, and **Try again** calling Apollo refetch.
- Preserve header and session context while retrying.

### Non-host viewer

- May see header, preferences, score, confidence, reasons, and game data.
- Does not render Edit Details or pick controls.
- Each card ends with **The host will choose the game.**

---

## Accessibility Contract

- Exactly one page `h1` (session title) and one suggestion section `h2`; game titles use `h3` semantics inside cards.
- Focus style: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- Edit Details, dialog buttons, disclosure, retry, and pick actions meet 44px targets.
- Dialog has `DialogTitle`, description, focus trap, Escape handling, and trigger-focus restoration.
- Avatar group has one accessible label listing confirmed count/names; decorative initials are hidden from duplicate announcements.
- Score and confidence are text, not color-only. Confidence labels remain explicit.
- Reason disclosure uses `aria-expanded` and `aria-controls`.
- Card-level external link and nested controls are separate keyboard stops; Enter/Space on Pick never activates BGG navigation.
- Error summaries use `role="alert"`; successful updates and picks use polite announcements.
- Pending buttons expose `aria-busy="true"` and remain disabled.

---

## Motion, Dark Mode, and Content Safety

- Reuse Phase 9 card hover only for the BGG card link: `hover:shadow-md hover:-translate-y-1 transition-all duration-300`.
- Under `prefers-reduced-motion`, remove translation and reduce transitions to opacity/color ≤150ms.
- Dialog open/close follows existing reka-ui motion and reduced-motion behavior; no celebratory animation after a pick.
- All surfaces/text/statuses use semantic M3 tokens so dark mode requires no per-component override.
- Descriptions and backend reasons render through Vue text interpolation only; no `v-html`.
- Fixed BGG URLs use persisted `objectid` and `noopener,noreferrer`.

---

## Preserved Contracts and Prohibitions

### Must preserve
- Server suggestion order and top-eight limit.
- Suggestions `null` outside picking and empty list semantics during picking.
- Host-only `pickGame` and group-collection eligibility checks.
- Apollo normalized cache as the server-data source of truth.
- Phase 9 collection-card rendering when suggestion context is absent.
- Existing completed `SessionSummary` destination.

### Must not add
- Voting, attendee ranking, or “who brings it” assignment.
- Browse All or a second group-collection query in the picker.
- Time-budget or complexity editing after picking starts.
- Session history, play logging, game detail route, or a dedicated re-pick flow.
- New UI/icon/motion dependencies or hard-coded palette classes.

---

## Testable Acceptance Matrix

| Contract | Requirement / decision | Automated proof required |
|----------|------------------------|--------------------------|
| Header shows title, Picking badge, date, going avatars/count, host Edit Details | PICK-01; D-01–D-03 | Component tests for host/non-host, mobile order, missing date/location, going-only attendees |
| Edit Details saves ordinary fields during picking and keeps preferences absent/locked | PICK-01; D-04–D-06 | Mutation contract/auth/state specs plus dialog save/cancel/failure/focus tests |
| Main session operation exposes suggestions and preferences | PICK-02; D-07 | Generated-operation type check and GraphQL request coverage |
| UI preserves top-eight server order and never queries Browse All | PICK-02; D-08 | Component assertion on rendered order and Apollo operation spy |
| Empty semantics distinguish no attendees from no matches | PICK-02; D-09 | Component tests for both exact copy branches |
| Suggestion cards preserve rich anatomy and add score/confidence/reasons | PICK-02; D-10–D-12 | Card tests for plain text, chips, disclosure, confidence text, BGG/action isolation |
| Only host can edit or pick; members see guidance | PICK-03; D-13 | Component and direct GraphQL authorization tests |
| Pick pending/error/success behavior uses mutation result and transitions to summary | PICK-03; D-14–D-15 | Component mutation tests and full Playwright session lifecycle journey |
| Responsive, dark, reduced-motion, and keyboard contracts hold | PICK-01–03 | Source assertions/component classes plus browser checks at mobile and desktop widths |

Browser acceptance target: extend `tests/e2e/session_lifecycle.spec.ts` to enter picking, verify the attendee-filtered heading and reasoned cards, edit ordinary details as host, pick one suggestion, and observe the existing completed summary. Protect mutable E2E fixture JSON files with byte-preserving backup/restore around every Playwright run.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-07-18
