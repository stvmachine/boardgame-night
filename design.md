# BoardGameNight — Redesign Brief

A design brief for **Claude Design**. Goal: a full visual redesign of an existing,
working web app. The app's behavior and data are fixed; the **look, layout, and feel are open**.
No fixed aesthetic is prescribed — propose a direction that fits the product and justify it.

Reference screenshots of every current screen ship alongside this file (`/design-screenshots/`).
They show *what exists today*, not a target. Treat them as the starting point to improve on.

---

## 1. The product

BoardGameNight helps a group of friends **decide what board game to play tonight**.

Members link their [BoardGameGeek](https://boardgamegeek.com) (BGG) usernames; the app merges
everyone's collections into one deduplicated shelf. From there a group spins up a **night session**:
invite people, set player count / time / complexity, and the app **ranks games everyone can play**
with a confidence score and human-readable reasons. Groups also track upcoming/past sessions and play history.

**Primary job to be done:** _"We're 4 people with 90 minutes — what should we play, from games we actually own?"_

**Users:** casual-to-hobbyist board gamers organizing recurring game nights. Used on both desktop
(browsing/planning) and phone (at the table, night-of).

---

## 2. Screens

The app is a single-page React app. Each row is a route to redesign.

| Screen | Route | Purpose & key elements |
|---|---|---|
| **Landing** | `/` | Marketing home for logged-out visitors. Hero ("merge collections"), instant BGG-username try box, a live "Trending on BGG" card strip, a 4-step "how it works" tour, CTA, footer. |
| **Login / Signup** | `/login`, `/signup` | Simple centered auth forms (email + password; signup adds username + optional BGG username). |
| **Collection** | `/collection` | The merged group shelf. Left filter rail (search, owners w/ counts, player-count range, play-time, complexity segmented control), sort + grid/list toggle, responsive card grid. Each card: cover, name, BGG rating, blurb, player range, play time, weight, owner initials. ~20–100+ games. |
| **Hot Games** | `/hot` | Full BGG "hotness" ranking as a dense browsable grid (rank badge, cover, ratings/weight/players). |
| **Groups** | `/groups` | List of the user's groups (name, blurb, member avatars, game count) + "New group". Often just 1–2 groups. |
| **Group detail** | `/g/:token` | Group hub. Upcoming sessions list (date chip, title, status pill, "going" count, action), members panel (roles, invite link + email invite), "shared collection spotlight" cards, and play-history feed (frequently empty → needs a good empty state). Primary CTA: **Create a night**. |
| **Group sessions** | `/g/:token/sessions` | Past sessions list with status pills (Completed / Cancelled) and the game that was played. |
| **Session detail** | `/s/:id` | **The core feature.** Session header (title, status, date/place/host), attendee + constraints summary, then **ranked game suggestions**: cards with score, confidence, and reason chips ("fits player count", "fits time budget", "best at N players — X% votes"), expandable reasons. Host picks the game. Also handles completed/cancelled states. |
| **Account** | `/account` | Profile settings: appearance (Light/Dark/System), display name, email, BGG username + "sync collection", sign out. |

**Cross-cutting shell** (present on every screen):
- **Top nav** — logo, primary links (Collection · Groups · Sessions · Account), theme toggle, account menu / auth buttons.
- **Footer** — marketing-style multi-column footer. _Consider whether it belongs inside the authenticated app or only on public pages._
- **Mobile tab bar** — bottom nav (Collection · Groups · + · Account) below `md`. Grid collapses to 2 columns.

---

## 3. Current design system (starting point — evolve it)

- **Type:** Inter (body/UI), **Bricolage Grotesque** (display/headings), JetBrains Mono (numeric/mono).
- **Themes:** Light is default; full Dark theme required. Both must be first-class.
- **Palette (light):** warm off-white page `#f8f7f4`, white surfaces, ink `#1a1a20`, indigo brand `#4f46e5`; status greens/ambers/reds; gold star for ratings.
- **Palette (dark):** near-black `#0f0f12`, raised greys, indigo `#6366f1`.
- **Shape/feel:** ~12px radius, soft card shadows, an "aurora" radial-gradient wash, spring easing, skeleton shimmer loaders, subtle press/scale on tap.

Everything above is **changeable** — colors, type, shape, motion. It's context, not a constraint. If you
keep the indigo/warm-neutral identity, sharpen it; if you replace it, make the new system coherent across all screens and both themes.

---

## 4. Hard constraints (don't break these)

1. **Stack:** React 19 + React Router + **Tailwind CSS v4** with CSS-variable design tokens (`@theme`, semantic vars mapped to shadcn-style names). Deliver the redesign as Tailwind/token changes and component restyles — not a rewrite in another framework.
2. **Data is fixed:** every field shown today comes from a GraphQL API and must stay representable (ratings, weight, player range, play time, owners, session status, suggestion score/reasons, etc.). Redesign the presentation, not the schema.
3. **Both themes:** light + dark must be fully designed, with tokens defined for each. Respect `prefers-reduced-motion`.
4. **Responsive:** desktop → phone, including the bottom tab bar and multi-column → 2-column reflow. Night-of usage is phone-first.
5. **Routes/screens stay** as listed; you may restructure layout *within* a screen and rethink the shell.
6. **Graceful media:** cover images are often missing or slow. Cards must look intentional with a **strong image fallback** (never raw broken-image alt text, which happens today).

---

## 5. Goals — what a good redesign fixes

- **Make the Session/suggestions screen the star.** It's the app's reason to exist; today it reads as a generic card grid. Give scoring, confidence, and reasons a clear, scannable, trustworthy visual language.
- **Stronger information hierarchy.** Collection and Hot Games are data-dense; make scanning by rating / players / time / owner effortless. Filters should feel powerful, not like a plain form.
- **Warm, social, game-night personality** without sacrificing clarity — this is friends planning fun, not an enterprise dashboard.
- **Great empty & sparse states.** Groups (1 group), play history (none yet), new sessions — these are common and currently feel empty/unfinished. Design them as intentional first-run moments.
- **A cohesive shell.** Reconcile the marketing footer with the in-app experience; make top nav + mobile tab bar feel like one system.
- **Fix the landing "how it works" section** (currently a heading over blank space) into a real, compelling explainer.
- **Delight in the details:** loading skeletons, hover/press, status pills, avatars, rating/weight chips — consistent and polished across every screen.

---

## 6. Deliverables

1. A **proposed design direction** (mood, palette, type, shape, motion) with a one-paragraph rationale tied to the product.
2. Redesigned **key screens** as high-fidelity mockups, in **both light and dark**, desktop and mobile:
   - Session detail (suggestions) — the hero screen
   - Collection (grid + filters)
   - Group detail
   - Landing
   - Plus the shared shell (top nav, mobile tab bar) and the reusable **game card** in its states (with cover, without cover, in a suggestion with reasons).
3. The **design-token set** for both themes (colors, type scale, radii, shadows, spacing) expressed so it maps cleanly onto Tailwind v4 `@theme` variables.
4. Notes on component states: loading (skeleton), empty, error, hover/press, selected.

Keep the output focused on these — depth on the hero screens over breadth across every minor view.
