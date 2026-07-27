# BoardGameNight — V0 Website Specification

> **Purpose:** This document is the complete design specification for generating a stunning, multi-page website via v0.dev (Vercel's AI design tool) for the BoardGameNight app. It serves as the source-of-truth prompt reference for v0 generations and the design contract for porting to the existing Vue 3 + Tailwind CSS codebase.
>
> **Research basis:** 10 parallel research agents analyzed competitors (BGG, BGA, Letterboxd, Spotify, Kickstarter, Tabletop Simulator, Boardy, Kallax.io, What2Play, Yucata, BSW, GameShelf, CardboardMaid), landing page design (Linear, Notion, Razorpay Sprint 26, Waabi, Clerk, Loops, Neon), mobile-first UX, color/typography trends, card grid patterns, and game night flow design.

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Page Inventory](#2-page-inventory)
3. [Page 1: Landing / Home](#3-page-1-landing--home)
4. [Page 2: Collection Browser](#4-page-2-collection-browser)
5. [Page 3: Group Management](#5-page-3-group-management)
6. [Page 4: Session Planner](#6-page-4-session-planner)
7. [Page 5: Game Night Dashboard](#7-page-5-game-night-dashboard)
8. [Page 6: Auth (Login / Signup)](#8-page-6-auth-login--signup)
9. [Page 7: Account Settings](#9-page-7-account-settings)
10. [Mobile Navigation](#10-mobile-navigation)
11. [Shared Components](#11-shared-components)
12. [Animation & Interaction](#12-animation--interaction)
13. [Loading & Empty States](#13-loading--empty-states)
14. [V0 Prompt Templates](#14-v0-prompt-templates)
15. [Porting Guide (v0 → Vue)](#15-porting-guide-v0--vue)
16. [Research Sources](#16-research-sources)

---

## 1. Design System

### 1.1 Visual Identity

**Core aesthetic:** A warm, inviting "game night at home" feel. Dark-first because the app is used in the evening, in dimly lit rooms, during actual game nights. Game box art is the hero — the UI frames it, never fights it.

**Analogy:** Think Spotify's card grid + Letterboxd's poster pride + Linear's dark premium feel, but with a warmer, more tactile personality. Not cold SaaS — cozy game room.

### 1.2 Color Palette

#### Dark Theme (Primary — default for v0)

| Token | Hex | Tailwind class | Purpose |
|-------|-----|---------------|---------|
| `--bg-page` | `#0f0f12` | `bg-[#0f0f12]` | Page background — deepest layer |
| `--bg-surface` | `#1a1a20` | `bg-[#1a1a20]` | Cards, panels, surfaces |
| `--bg-surface-raised` | `#24242e` | `bg-[#24242e]` | Elevated cards, hover state |
| `--bg-surface-overlay` | `#2e2e3a` | `bg-[#2e2e3a]` | Modals, dropdowns, highest layer |
| `--text-primary` | `#e8e8ed` | `text-[#e8e8ed]` | Headlines, primary text |
| `--text-secondary` | `#9c9cb0` | `text-[#9c9cb0]` | Body text, descriptions |
| `--text-muted` | `#6b6b80` | `text-[#6b6b80]` | Labels, captions, disabled |
| `--border` | `#2e2e3a` | `border-[#2e2e3a]` | Card borders, dividers |

#### Accent Colors

| Token | Hex | Tailwind class | Usage |
|-------|-----|---------------|-------|
| `--accent-primary` | `#6366f1` | `bg-indigo-500` | CTAs, links, active nav, primary actions |
| `--accent-primary-hover` | `#818cf8` | `bg-indigo-400` | Button hover states |
| `--accent-success` | `#22c55e` | `bg-green-500` | Confirmed RSVPs, available games, owned badge |
| `--accent-warning` | `#f59e0b` | `bg-amber-500` | Timer warnings, maybe RSVPs, pending state |
| `--accent-error` | `#ef4444` | `bg-red-500` | Errors, not-coming, remove actions |
| `--accent-fun-coral` | `#fb7185` | `bg-rose-400` | Playful moments, suggestions, dice rolls |
| `--accent-fun-teal` | `#2dd4bf` | `bg-teal-400` | Player counts, secondary interactions, badges |
| `--accent-gold` | `#e6b800` | `bg-yellow-500` | Winners, ratings stars, achievement badges |

#### Light Theme (Secondary)

| Token | Hex |
|-------|-----|
| `--bg-page` | `#f8f7f4` (warm off-white) |
| `--bg-surface` | `#ffffff` |
| `--text-primary` | `#1a1a20` |
| `--accent-primary` | `#4f46e5` (slightly darker for WCAG on white) |

### 1.3 Typography

**Fonts (Google Fonts):**
- **Headings:** `Bricolage Grotesque` (variable, 200-800 weight) — the breakout typeface of 2025-2026. Has personality without being silly. Feels designed, not default.
- **Body:** `Inter` (variable, 100-900 weight) — the gold standard UI font. Screen-optimized, high x-height.
- **Monospace/accent:** `JetBrains Mono` — for stats, scores, timers.

```css
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:opsz,wght@14..32,100..900&family=JetBrains+Mono:wght@400;500&display=swap');
```

**Type Scale:**

| Level | Size | Weight | Font | Line Height |
|-------|------|--------|------|-------------|
| Display | `clamp(2.5rem, 2rem + 3vw, 3.5rem)` | 800 | Bricolage Grotesque | 1.1 |
| H1 | `clamp(1.75rem, 1.5rem + 2vw, 2.5rem)` | 700 | Bricolage Grotesque | 1.2 |
| H2 | `clamp(1.25rem, 1rem + 1.5vw, 1.75rem)` | 600 | Bricolage Grotesque | 1.3 |
| H3 | `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` | 600 | Inter | 1.4 |
| Body | `1rem` (16px) | 400 | Inter | 1.5 |
| Small | `0.875rem` (14px) | 400 | Inter | 1.5 |
| Caption | `0.75rem` (12px) | 500 | Inter | 1.4 |
| Stat | `1.5rem` | 500 | JetBrains Mono | 1.2 |

**Letter-spacing:** Use negative tracking (`-0.02em` to `-0.03em`) on Display and H1 for that intentional, modern feel (Linear pattern).

### 1.4 Elevation System

```
Level 0 — page background        → bg-[#0f0f12]
Level 1 — cards, sidebars        → bg-[#1a1a20] + border-[#2e2e3a] border
Level 2 — hovered/raised cards   → bg-[#24242e]
Level 3 — modals, dropdowns      → bg-[#2e2e3a] + backdrop-blur
Level 4 — toast notifications    → bg-[#2e2e3a] + shadow-2xl
```

On dark backgrounds, elevation is communicated via **lightness**, not shadows (shadows are invisible on dark surfaces).

### 1.5 Border Radius

| Element | Radius |
|---------|--------|
| Cards | `0.75rem` (12px) |
| Buttons | `0.5rem` (8px) |
| Badges/pills | `9999px` (full) |
| Avatars | `9999px` (full) |
| Modals | `1rem` (16px) |
| Input fields | `0.5rem` (8px) |

### 1.6 Spacing Scale

Use Tailwind's default 4px grid: `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `6` = 24px, `8` = 32px, `12` = 48px, `16` = 64px, `20` = 80px, `24` = 96px.

For section-level spacing, prefer generous: `py-20` (80px) to `py-24` (96px) on landing page sections, `py-8` to `py-12` on app content.

### 1.7 Icons

- **Primary:** Lucide icons (`lucide-vue-next`) — 1600+ icons, consistent 24px grid, thin-to-medium stroke
- **Game-specific:** Kenney Board Game Info icons (player counts, timers, complexity) rendered at matching 24px / 1.5px stroke weight
- **Board game metadata icons available in Lucide:** `dices`, `timer`, `users`, `trophy`, `star`, `target`, `check-circle`, `shuffle`, `crown`, `hourglass`, `plus-circle`, `search`, `bell`, `gamepad-2`

### 1.8 Shadows

```css
/* Card hover shadow */
--shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);

/* Modal overlay */
--shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

/* Subtle button glow on primary */
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.15);
```

### 1.9 Glassmorphism (Restrained)

Use selectively — frosted glass only on:
- Sticky navigation bar (on scroll: `backdrop-blur(20px) saturate(180%)`)
- Modal overlays (`backdrop-blur(4px)`)
- Player avatar rings (subtle glass border)

Never on: data tables, lists, form inputs, content-heavy areas.

---

## 2. Page Inventory

| # | Page | Route | Auth | Description |
|---|------|-------|------|-------------|
| 1 | **Landing / Home** | `/` | No | Marketing landing page + app homepage for logged-in users |
| 2 | **Collection Browser** | `/collection` | No | Merged BGG collection grid with filters |
| 3 | **Group Management** | `/groups` | Yes | List groups + create group |
| 4 | **Session Planner** | `/g/:token` | No | Group detail + create/manage sessions |
| 5 | **Game Night Dashboard** | `/s/:id` | No | Active session lifecycle (draft → picking → completed) |
| 6 | **Auth** | `/login`, `/signup` | No | Login and signup forms |
| 7 | **Account Settings** | `/account` | Yes | Profile, BGG username, theme |

---

## 3. Page 1: Landing / Home

### 3.1 Hero Section

**Layout:** Full-width dark section with aurora/mesh gradient background. Centered content.

**Content:**
- **Eyebrow text:** "For groups of 3-10 board game friends" (small, `text-indigo-400`, uppercase tracking-wider)
- **Headline:** "Board game night, sorted." (Display size, Bricolage Grotesque, 800 weight, tight tracking)
- **Subheadline:** "Merge your group's collections, discover games everyone can play, and spin up a session in seconds." (body, `text-[#9c9cb0]`)
- **Primary CTA:** "Start your game night" (indigo-500 button, large, with subtle glow shadow)
- **Secondary CTA:** "See how it works →" (ghost button, text link style)
- **Social proof line:** "Join 847 groups already playing" (small, muted, below CTAs)

**Hero visual:** Animated illustration on the right (desktop) / below (mobile) showing the 4-step flow:
1. Friend avatars appear around a table icon
2. Game covers cascade and merge into a single grid
3. A "suggestion" card pops up with a checkmark
4. Confetti + "Game Night!" celebration

**Aurora background:**
```css
background: #0f0f12;
background-image:
  radial-gradient(600px circle at 20% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
  radial-gradient(400px circle at 80% 70%, rgba(251, 113, 133, 0.06) 0%, transparent 50%),
  radial-gradient(500px circle at 50% 50%, rgba(45, 212, 191, 0.04) 0%, transparent 40%);
```

### 3.2 Social Proof Strip

Below hero. Horizontal scrolling row with:
- "Integrates with BoardGameGeek" + BGG logo (or placeholder)
- Stats: "12,400 games merged" · "3,200 sessions hosted" · "847 active groups"
- Style: `border-y border-[#2e2e3a]`, `py-6`, flex justify-center gap-12

### 3.3 Feature Tour (4-Chapter)

**Layout:** Numbered chapters (01 / 02 / 03 / 04) with alternating left-right layout. Each chapter occupies one full viewport-height section with scroll-triggered reveal.

**Chapter 01 — CONNECT**
- Heading: "Link your BGG username"
- Body: "Your collection appears instantly. One username, your entire library."
- Visual: Mockup of BGG username input → collection populating

**Chapter 02 — MERGE**
- Heading: "Everyone's games, one shelf"
- Body: "Duplicates disappear. You see your group's combined library — deduplicated, searchable, filterable."
- Visual: Two collections merging into one grid with dedup animation

**Chapter 03 — SUGGEST**
- Heading: "Who's coming? What's available?"
- Body: "Filter by player count, time, complexity. See only games everyone can play tonight."
- Visual: Filter sidebar with results narrowing in real-time

**Chapter 04 — PLAY**
- Heading: "Spin up a session. Invite your crew."
- Body: "Create a night, send invites, vote on games. From planning to playing in 60 seconds."
- Visual: Session card with RSVP dashboard + game suggestion cards

**Style per chapter:**
- Large number (`text-8xl font-bold text-indigo-500/10`) positioned absolutely
- Heading in Bricolage Grotesque
- Body in Inter, `text-[#9c9cb0]`
- Visual as a device frame (rounded-lg, shadow-2xl, overflow-hidden)

### 3.4 Testimonials

**Layout:** 3-column card grid (stacks on mobile).

**Card structure:**
- Quote text (italic, `text-[#e8e8ed]`)
- Author: avatar + name + group name
- Stat: "Group of 5 · 47 games merged"

**Style:** Cards with `bg-[#1a1a20]` surface, rounded-lg, `p-6`, subtle border.

### 3.5 Final CTA

Full-width section, centered:
- Heading: "Ready for your next game night?"
- Subheading: "No credit card. No commitment. Just games."
- Button: "Create your group — free" (large, indigo-500)
- Background: subtle aurora gradient (same as hero, lighter)

### 3.6 Footer

Dark footer with 3-column layout:
- **Product:** Features, How it Works, Pricing (placeholder), Changelog
- **Resources:** BGG Integration, Help Center, API Docs
- **Company:** About, Blog, Twitter, GitHub
- Bottom: "Made for game nights" + copyright

---

## 4. Page 2: Collection Browser

### 4.1 Layout

**Desktop:** Left sidebar (filter panel, 280px) + main content area (scrollable grid)
**Mobile:** Full-width grid + filter button that opens a bottom sheet

### 4.2 Top Bar

```
┌──────────────────────────────────────────────────────┐
│ [🔍 Search games...          ] [Sort: Name ▼] [⬡ ⊞] │
│                                                      │
│ [3-4 Players ×] [<60m ×] [Strategy ×] [Clear all]  │ ← active filter chips
└──────────────────────────────────────────────────────┘
```

- **Search:** Debounced input (300ms), placeholder "Search games..."
- **Sort dropdown:** Name (A-Z), Rating (high to low), Player count, Play time, Recently added
- **View toggle:** Grid (default) / List icon buttons
- **Active filter chips:** Each with `×` to remove, "Clear all" link

### 4.3 Filter Sidebar (Desktop)

```
┌──────────────────────┐
│ Filters              │
│                      │
│ ▼ Players       [3] ▶│
│   [2] [3] [4] [5] [6]│  ← chip-style toggles
│                      │
│ ▼ Play Time     [1] ▶│
│   <30m  30-60m       │
│   60-90m  90m+       │
│                      │
│ ▼ Complexity    [1] ▶│
│   ═════●═════════    │  ← range slider
│   Light       Heavy  │
│   [Light] [Med] [Heavy] [Any] ← quick picks
│                      │
│ ▼ Rating        [0] ▶│
│   ★★★★☆ & up        │
│   ★★★☆☆ & up        │
│                      │
│ ▼ Category      [2] ▶│
│   [Search categories…]│
│   □ Strategy (47)    │
│   □ Family (34)      │
│   □ Party (22)       │
│   [+ Show 8 more]    │
│                      │
│ ▼ Owned By      [1] ▶│
│   □ Alex ✓           │
│   □ Sam ✓            │
│   □ Jordan ✓         │
└──────────────────────┘
```

**Key UX rules:**
- Show counts on every facet: `Strategy (47)` not just `Strategy`
- AND across facets, OR within: "Players: 3 OR 4" AND "Time: <60m"
- Progressive disclosure: top 5-6 values per facet, then "Show N more"
- URL persistence: encode filters in query params for share/bookmark/back-button

### 4.4 Filter Bottom Sheet (Mobile)

Full-screen drawer sliding up from bottom:
- Header: "Filters (3 active)" with close button
- Scrollable facets with the same structure as desktop
- Sticky bottom bar: "Reset" (ghost) + "Show 47 games" (primary)
- Auto-close after applying

### 4.5 Game Card Grid

**Grid layout:**
```css
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
  gap: 1.25rem;
}
```

**Card structure:**
```
┌──────────────────────┐
│                       │
│   BOARD GAME          │
│   COVER ART           │
│   (2:3 aspect ratio)  │
│                       │
│  ┌─────────────────┐  │
│  │ Owned ✓  │ ★ 7.8│  │  ← status + rating overlay
│  └─────────────────┘  │
│                       │
├──────────────────────┤
│ Game Title            │  ← 1-2 lines, truncate with ellipsis
│ ┌──────┐ ┌────┐ ┌──┐ │
│ │ 2-4 P│ │45m │ │7.8││  ← player count, time, rating badges
│ └──────┘ └────┘ └──┘ │
│ [Strategy] [Family]   │  ← max 2 category pills + "+N"
└──────────────────────┘
```

**Card CSS specs:**
- Image container: `aspect-ratio: 2/3`, `overflow: hidden`, `object-fit: cover`
- Title: `font-weight: 600`, `line-height: 1.3`, `line-clamp: 2`
- Badges: `rounded-full`, `px-2 py-0.5`, `text-xs`, `bg-[#24242e]`
- Category pills: `rounded-full`, `bg-indigo-500/10`, `text-indigo-400`, `text-[10px]`
- Ownership badge: absolute positioned top-right, `bg-green-500/90`, `text-white`

**Hover state (desktop only):**
```css
@media (hover: hover) {
  .game-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  .game-card:hover img {
    transform: scale(1.05);
  }
}
```

**Touch state:**
```css
@media (hover: none) {
  .game-card:active {
    transform: scale(0.97);
  }
}
```

### 4.6 List View (alternative)

Table-style layout with columns:
| Thumbnail | Name | Players | Time | Complexity | Rating | Categories | Owner |

Compact rows, each 56px height. Useful for power users who want density.

---

## 5. Page 3: Group Management

### 5.1 Groups List

**Layout:** Card grid of user's groups (2-3 columns desktop, 1 column mobile).

**Group card structure:**
```
┌──────────────────────────────┐
│  [Color/Emoji] Strategy Crew │  ← group name with icon
│  5 members · 89 games merged │  ← stats
│                               │
│  [●●●●●]                     │  ← member avatars (overlapping)
│                               │
│  Last session: 3 days ago    │  ← activity indicator
│  Next session: Friday 7pm    │  ← upcoming (if any)
│                               │
│  [View Group →]              │
└──────────────────────────────┘
```

**Card style:** `bg-[#1a1a20]`, `rounded-lg`, `p-6`, hover lift effect.

### 5.2 Create Group Form

**Layout:** Centered card, max-width 480px.

**Fields:**
1. Group name (text input, required)
2. Description (textarea, optional)
3. Group emoji/icon picker (optional, fun touch)
4. Invite method: "Share link" (generated automatically) or "Enter email"

**CTA:** "Create Group" (indigo-500)

**Post-creation:** Show invite link with copy button + "Share" social buttons.

---

## 6. Page 4: Session Planner (Group Detail)

### 6.1 Layout

**Desktop:** Split view — Left panel (group info, 360px) + Right panel (sessions, scrollable)
**Mobile:** Stacked vertical layout

### 6.2 Left Panel: Group Info

```
┌──────────────────────────────┐
│  [Emoji] Strategy Crew       │
│  "Our weekly game night"     │
│                               │
│  Members (5)                  │
│  [Avatar Alex] BGG: alex123  │
│  [Avatar Sam]   BGG: samplays│
│  [Avatar Jordan] BGG: jordbg │
│  [Avatar Riley] BGG: rileyb  │
│  [Avatar Casey] BGG: casey_m │
│                               │
│  Merged Collection: 89 games │
│  [View Collection →]         │
│                               │
│  Invite Link                  │
│  ┌───────────────────┐ [Copy]│
│  │ bgn.gg/g/abc123   │       │
│  └───────────────────┘       │
│                               │
│  [+ Invite Friend]           │
└──────────────────────────────┘
```

### 6.3 Right Panel: Sessions

**Upcoming sessions:**
```
┌──────────────────────────────┐
│  🎲 Friday Night Battle      │  ← session title
│  📅 Jul 25, 2025 · 7:00 PM   │  ← scheduled time
│  📍 Alex's Place             │  ← location
│                               │
│  RSVPs:                      │
│  [● Alex] ✓ Going            │
│  [● Sam]   ✓ Going           │
│  [● Jordan] ? Maybe          │
│  [● Riley] — No response     │
│  [● Casey] ✓ Going           │
│                               │
│  3/5 confirmed · 2 pending   │  ← progress bar
│  ████████░░░░░ 60%            │
│                               │
│  [Open Session →]            │
└──────────────────────────────┘
```

**Past sessions:** Compact list with game played, winner, date.

**Create session button:** Floating action button or prominent "Schedule Game Night" CTA.

### 6.4 Create Session Flow

**Wizard pattern (3 steps):**

1. **Name & Date:** Session title + date/time picker + location
2. **Configure:** Player capacity, description, game preferences (optional)
3. **Invite:** Select group members to invite, preview invite message, send

Or: **Quick Night** one-click from saved group (bypasses wizard, uses defaults).

---

## 7. Page 5: Game Night Dashboard

### 7.1 Session Lifecycle States

| State | Visual | Primary Action |
|-------|--------|---------------|
| **DRAFT** | Gray badge, dimmed UI | Edit details / Send invites |
| **INVITED** | Blue badge, RSVP dashboard visible | Wait for RSVPs / Start picking |
| **PICKING** | Amber badge, game suggestion cards | Vote on games / Pick game |
| **IN_PROGRESS** | Green badge, active timer | Score tracking |
| **COMPLETED** | Gold badge, summary + stats | View summary / Rematch |
| **CANCELLED** | Red badge, muted UI | Reopen session |

### 7.2 INVITED State — RSVP Dashboard

```
┌─────────────────────────────────────────────┐
│  🎲 Friday Night Battle                      │
│  📅 Jul 25, 2025 · 7:00 PM · Alex's Place   │
│  Status: INVITED  ●  3/5 confirmed          │
├─────────────────────────────────────────────┤
│                                               │
│  RSVP Dashboard                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │ Alex │ │ Sam  │ │Jordan│ │Riley │ │Casey ││
│  │  ✓   │ │  ✓   │ │  ?   │ │  —   │ │  ✓   ││
│  │Going │ │Going │ │Maybe │ │      │ │Going ││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│                                               │
│  Progress: ████████████░░░░░ 60%              │
│                                               │
│  [Nudge non-responders]                       │
│  [Start Picking →] (enabled at 3+ confirmed) │
└─────────────────────────────────────────────┘
```

### 7.3 PICKING State — Game Suggestions

```
┌─────────────────────────────────────────────┐
│  🎲 Friday Night Battle · PICKING            │
│                                               │
│  Tonight: 4 confirmed players, 90 min        │
│                                               │
│  ┌─── Suggested Games ──────────────────────┐ │
│  │                                           │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐        │ │
│  │  │ Wingspan│ │Ticket  │ │Azul    │        │ │
│  │  │ ████████│ │to Ride │ │████████│        │ │
│  │  │ 90% match│ │85%    │ │80%    │        │ │
│  │  │ 2-5p 45m│ │2-5p 45m│ │2-4p 30m│        │ │
│  │  │ 3 own it│ │4 own  │ │4 own  │        │ │
│  │  │ [Vote ✓]│ │[Vote ✓]│ │[Vote ✓]│        │ │
│  │  └────────┘ └────────┘ └────────┘        │ │
│  │                                           │ │
│  │  Show match breakdown:                    │ │
│  │  ✅ Fits player count (4)                  │ │
│  │  ✅ Within time limit (90 min)             │ │
│  │  ✅ Owned by 3/4 attendees                │ │
│  │  ⚠ Best at 4 (this group has 4) — perfect │ │
│  │                                           │ │
│  │  [🎲 Random Pick] [🔄 Show More]          │ │
│  └───────────────────────────────────────────┘ │
│                                               │
│  ┌─── Voting Results ───────────────────────┐ │
│  │ Wingspan: ███ 3 votes  ← WINNER          │ │
│  │ Ticket to Ride: ██ 2 votes                │ │
│  │ Azul: █ 1 vote                            │ │
│  └───────────────────────────────────────────┘ │
│                                               │
│  [Start Playing Wingspan →]                   │
└─────────────────────────────────────────────┘
```

### 7.4 IN_PROGRESS State — Active Game

```
┌─────────────────────────────────────────────┐
│  🎲 Wingspan · IN PROGRESS                   │
│                                               │
│  ⏱ 01:23:45                                  │
│                                               │
│  ┌─── Scoreboard ──────────────────────────┐ │
│  │  Player    │ Round 1 │ Round 2 │ Total  │ │
│  │  Alex      │   12    │   18    │  30    │ │
│  │  Sam       │   15    │   14    │  29    │ │
│  │  Jordan    │    8    │   22    │  30    │ │
│  │  Casey     │   11    │   16    │  27    │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Session Aura: "Clutch" — 2 lead changes      │
│                                               │
│  ┌─── Game Tools ──────────────────────────┐ │
│  │ [🎲 Dice] [⏱ Timer] [🔀 Turn Order]    │ │
│  │ [🪙 Coin] [📝 Notes] [🎯 Counter]       │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  [End Game →]                                │
└─────────────────────────────────────────────┘
```

### 7.5 COMPLETED State — Session Summary

```
┌─────────────────────────────────────────────┐
│  🎲 Wingspan · COMPLETED                     │
│                                               │
│  🏆 Winner: Jordan (34 points)               │
│                                               │
│  Final Standings:                             │
│  1. Jordan — 34 pts  🏆                      │
│  2. Alex — 30 pts                             │
│  3. Sam — 29 pts                              │
│  4. Casey — 27 pts                            │
│                                               │
│  Duration: 1h 23m · 4 players                │
│  Session Aura: "Comeback King" — Jordan won   │
│  from last place in final round               │
│                                               │
│  Session Chronicle:                           │
│  • Alex led rounds 1-2                        │
│  • Jordan surged +14 in round 3               │
│  • Closest finish this month!                 │
│                                               │
│  [📸 Photo] [🎲 Rematch] [📋 Play Again]     │
└─────────────────────────────────────────────┘
```

---

## 8. Page 6: Auth (Login / Signup)

### 8.1 Layout

**Centered card** on dark background with aurora gradient.

```
┌──────────────────────────┐
│                           │
│  🎲 BoardGameNight        │  ← logo
│                           │
│  [Login] [Sign Up]        │  ← tab toggle
│                           │
│  Email                    │
│  ┌──────────────────┐     │
│  │                  │     │
│  └──────────────────┘     │
│                           │
│  Password                 │
│  ┌──────────────────┐     │
│  │                  │     │
│  └──────────────────┘     │
│                           │
│  [Sign In]                │  ← full-width indigo button
│                           │
│  or                       │
│                           │
│  [Continue with BGG →]    │  ← secondary/outline button
│                           │
└──────────────────────────┘
```

### 8.2 Signup Flow

After account creation, redirect to onboarding:
1. Link BGG username (with progress bar for async import)
2. Create or join a group
3. See merged collection → "Aha!" moment

---

## 9. Page 7: Account Settings

### 9.1 Layout

Single-column, max-width 600px, centered.

### 9.2 Sections

```
┌──────────────────────────────┐
│  Profile                      │
│  [Avatar] Edit name / email  │
│                               │
│  BGG Integration              │
│  Username: alex123            │
│  Status: Synced 2h ago       │
│  [Refresh Collection]         │
│  [Change Username]            │
│                               │
│  Theme                        │
│  ○ Light  ● Dark  ○ System   │
│                               │
│  Notifications                │
│  □ Session invites            │
│  □ RSVP reminders             │
│  □ Game suggestions           │
│                               │
│  [Sign Out]                   │  ← red text button
└──────────────────────────────┘
```

---

## 10. Mobile Navigation

### Bottom Tab Bar

```
┌──────────────────────────────────────┐
│                                      │
│          Content area                │
│                                      │
├──────────────────────────────────────┤
│  🏠    📚    ➕    👥    👤         │
│ Home  Collect New  Groups Profile    │
└──────────────────────────────────────┘
```

**Rules:**
- 5 tabs: Home, Collection, + (create session), Groups, Profile
- Icons + labels (never icons-only — reduces comprehension by 30-40%)
- Active state: `text-indigo-400` color + subtle weight change
- Touch targets: minimum 48×48px
- Safe area: `padding-bottom: env(safe-area-inset-bottom)`
- The "+" tab opens a create-session quick-action, not a page

### Session Flow: Hub-and-Spoke

During active session management (creating, picking, playing), hide the tab bar with a full-screen card-stack experience. Prominent "Back" button at top.

---

## 11. Shared Components

### 11.1 Navigation Bar (Desktop)

**Sticky top bar with glassmorphism on scroll:**

```
┌─────────────────────────────────────────────────────────┐
│ 🎲 BoardGameNight  Collection  Groups  Sessions  [🌙]  [👤] │
└─────────────────────────────────────────────────────────┘
```

- Logo + wordmark on left
- Nav links center
- Theme toggle (sun/moon) + user avatar on right
- Glass effect: starts transparent, morphs to `backdrop-blur(20px) saturate(180%)` + `bg-[#0f0f12]/80` on scroll
- Border-bottom appears on scroll: `border-[#2e2e3a]`

### 11.2 AppShell (Logged-In)

**Desktop:** Left sidebar (collapsible, 260px) + top bar + content area
**Mobile:** Top bar + content + bottom tab bar

**Sidebar content:**
- Logo
- Navigation links (Home, Collection, Groups)
- "My Groups" section with group list
- Theme toggle at bottom
- Collapse button

### 11.3 MemberAvatar

Circular avatar with:
- Color-coded ring (per-member color assignment)
- Fallback to initials
- Online indicator dot (green, bottom-right)
- Size variants: `sm` (32px), `md` (40px), `lg` (56px)

### 11.4 GameCard

As specified in section 4.5. The core visual primitive of the app.

### 11.5 Badge System

| Badge | Style |
|-------|-------|
| DRAFT | `bg-[#6b6b80]/20 text-[#9c9cb0]` |
| INVITED | `bg-blue-500/20 text-blue-400` |
| PICKING | `bg-amber-500/20 text-amber-400` |
| COMPLETED | `bg-green-500/20 text-green-400` |
| CANCELLED | `bg-red-500/20 text-red-400` |

### 11.6 Skeleton Loaders

Match exact card geometry. Shimmer animation at 1.5s. Use `bg-[#1a1a20]` with gradient overlay. Always render 12 skeletons in the grid layout.

### 11.7 Toast Notifications

Slide in from top-right. Auto-dismiss after 4s.
- Success: green icon + message
- Error: red icon + message
- Info: indigo icon + message

### 11.8 Dialogs / Modals

- `bg-[#2e2e3a]` background, `rounded-xl`, `shadow-2xl`
- Backdrop: `bg-black/50 backdrop-blur(4px)`
- Header: title in H3, close X button
- Footer: ghost "Cancel" + primary action button
- Scroll content variant for long content

---

## 12. Animation & Interaction

### 12.1 Principles

1. **CSS-only where possible** — `transform` + `opacity` only for 60fps GPU-composited animations
2. **Spring physics** — use `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy entry, `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for smooth exit
3. **Respect `prefers-reduced-motion`** — wrap all animations in `@media (prefers-reduced-motion: no-preference)`
4. **No animation longer than 300ms** — impatient users bounce
5. **Stagger at 80ms** — for lists of cards/items appearing

### 12.2 Specific Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Card hover | `translateY(-3px)` + shadow | 200ms | ease |
| Card image zoom | `scale(1.05)` on parent hover | 300ms | `cubic-bezier(.25,.46,.45,.94)` |
| Page sections (scroll reveal) | `opacity: 0 → 1` + `translateY(24px → 0)` | 400ms | ease-out |
| Staggered card entrance | Sequential fade-in-up | 200ms per card, 80ms stagger | ease-out |
| Button hover | `scale(1.02)` + shadow glow | 150ms | ease |
| Button press | `scale(0.97)` | 100ms | ease |
| Modal open | `opacity: 0 → 1` + `scale(0.95 → 1)` | 200ms | spring-like |
| Modal close | `opacity: 1 → 0` + `scale(1 → 0.95)` | 150ms | ease-in |
| Toast enter | Slide from top-right + fade | 300ms | spring-like |
| Toast exit | Fade + slide right | 200ms | ease-in |
| Badge/score update | Brief `scale(1.1 → 1)` pulse | 300ms | spring |
| Loading spinner | Continuous rotation | 1s | linear |
| Skeleton shimmer | Background gradient sweep | 1.5s | linear infinite |

### 12.3 Scroll Reveal (CSS View Timelines)

```css
@keyframes fade-in-up {
  from { opacity: 0; translate: 0 24px; }
  to   { opacity: 1; translate: 0 0; }
}

@media (prefers-reduced-motion: no-preference) {
  .reveal-on-scroll {
    animation: fade-in-up linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 25%;
  }
}
```

Zero JavaScript. Gracefully degrades in unsupported browsers.

### 12.4 Page Transitions

Use the View Transitions API (Chrome 111+, Safari 18+) for cross-page transitions:
- Shared-element morph on the logo/nav
- Content crossfade
- `transition: 300ms ease`

---

## 13. Loading & Empty States

### 13.1 Skeleton Screens

Every data-dependent section has a skeleton variant that matches its loaded layout exactly. The skeleton uses a shimmer animation (1.5s loop, gradient sweep).

**Skeleton rules:**
- Match exact card geometry (same aspect ratio, padding, grid placement)
- Vary shimmer bar widths (last line shorter)
- `aria-hidden="true"` on skeleton, live region announces when content loads
- Fade transition from skeleton to content: 200ms opacity crossfade

### 13.2 Empty States

Every empty state includes:
1. An icon/illustration (relating to the context)
2. A brief explanation (what this screen IS when populated)
3. A single primary action (what to do next)

| Context | Icon | Message | CTA |
|---------|------|---------|-----|
| No BGG linked | `gamepad-2` | "Connect your BoardGameGeek account to see your collection" | "Link BGG Account" |
| Empty collection | `package-open` | "Your collection is empty. Import from BGG to get started" | "Import Collection" |
| No groups yet | `users` | "Create a group to start merging collections with friends" | "Create Group" |
| No sessions | `calendar-plus` | "No game nights scheduled. Time to plan one!" | "Schedule Game Night" |
| Filters match nothing | `search-x` | "No games match your current filters" | "Clear Filters" |
| Session in draft | `pencil` | "Waiting for details. Add a date and invite your crew." | "Edit Session" |

### 13.3 Error States

| Error | Display | Action |
|-------|---------|--------|
| BGG API down | Warning banner: "BGG is temporarily unavailable. Showing cached collection." | Auto-retry in 30s |
| Import failed | Error card: "Import failed. Your BGG username may be incorrect." | "Try Again" |
| Network offline | Toast: "You're offline. Some features may be limited." | Auto-recover |

---

## 14. V0 Prompt Templates

### 14.1 Landing Page (Main Prompt)

```
Build a landing page for "BoardGameNight" — a board game collection and
night-organizing app for friend groups.

STRUCTURE (in order):
1. Sticky nav (logo, links, theme toggle, auth CTA)
2. Hero with animated product feel — headline "Board game night, sorted."
   + subhead + dual CTAs + animated illustration showing the 4-step flow
3. Social proof strip (BGG integration badge + stats)
4. 4-chapter feature tour (CONNECT → MERGE → SUGGEST → PLAY) with
   scroll-triggered reveals, alternating left/right layout
5. Testimonials (3-card grid)
6. Final CTA section (full-width band)
7. Footer (3-column)

DESIGN:
- Dark-first (#0f0f12 background, warm-shifted darks)
- Aurora/mesh gradient in hero (indigo + coral + teal at low opacity)
- Accent: indigo-500 (#6366f1) for CTAs and active states only
- Typography: Bricolage Grotesque headings (variable, 200-800), Inter body
- Cards: bg-[#1a1a20], rounded-xl, border-[#2e2e3a]
- Generous whitespace (py-20 sections)
- Scroll-reveal animations (fade-in-up, 80ms stagger)
- Spring-physics button hovers
- Mobile-first responsive

BEHAVIOR:
- Hero CTA scrolls to signup
- Nav becomes glass-morphism on scroll (backdrop-blur + transparent bg)
- Feature chapters reveal on scroll entry
- Pricing section is NOT needed (it's free)
- No carousel auto-play
- All animations respect prefers-reduced-motion

COMPONENTS: shadcn/ui + Tailwind CSS v4 + Lucide icons
```

### 14.2 Collection Browser

```
Build a board game collection browser page for "BoardGameNight".

LAYOUT:
- Desktop: 280px left sidebar (filter panel) + main scrollable area
- Mobile: full-width grid + filter button → bottom sheet drawer

FILTER SIDEBAR (desktop):
- Text search input (debounced)
- Player count: chip toggles (1-6+)
- Play time: chip toggles (<30m, 30-60m, 60-90m, 90m+)
- Complexity: dual-range slider (1-5) with quick picks (Light/Med/Heavy/Any)
- Rating: clickable star tiers
- Category: searchable list with progressive disclosure (top 6 + "Show more")
- Ownership: member checkboxes with avatars
- Show counts on every facet (e.g., "Strategy (47)")

ACTIVE FILTER CHIPS:
- Horizontal bar above grid showing active filters with × to remove
- "Clear all" link at the end

GRID:
- Responsive CSS Grid: repeat(auto-fill, minmax(200px, 1fr))
- Game cards: 2:3 cover image, title, player count badge, time badge, rating, category pills
- Hover: translateY(-3px) + image scale(1.05)
- Skeleton loading state (12 shimmer cards)

SORT BAR:
- Search input + Sort dropdown (Name, Rating, Players, Time, Recently added)
- Grid/List view toggle
- Result count: "Showing 47 of 89 games"

DESIGN: Same dark theme as landing. Cards on #1a1a20 surface. Indigo accents.
```

### 14.3 Group Detail + Session Planner

```
Build a group detail page with session planning for "BoardGameNight".

LAYOUT:
- Desktop: split view — 360px left (group info) + right (sessions list)
- Mobile: stacked vertical

LEFT PANEL:
- Group name + emoji + description
- Member list with avatars + BGG usernames
- Merged collection count + link to collection
- Invite link with copy button
- "Invite Friend" button

RIGHT PANEL:
- "Schedule Game Night" primary CTA button
- Upcoming sessions as cards with: title, date/time, location, RSVP dashboard
  (member avatars with status: going/maybe/no response), progress bar
- Past sessions as compact list items

SESSION CARD:
- Color-coded status badge (draft/invited/picking/completed)
- Title, date, location
- RSVP grid showing each member's response
- Progress bar (confirmed/total)
- "Open Session" or "Start Picking" action button

DESIGN: Dark theme. Session cards on #1a1a20 surface. Status badges use
the semantic color system. RSVP avatars with colored rings.
```

### 14.4 Game Night Dashboard

```
Build a game night session dashboard for "BoardGameNight". This is the
active session view that progresses through states: INVITED → PICKING →
IN_PROGRESS → COMPLETED.

INVITED STATE:
- Session header (title, date, location, status badge)
- RSVP dashboard: avatar grid with status indicators (✓ Going, ? Maybe, — No response)
- Progress bar showing confirmation rate
- "Nudge" button for non-responders
- "Start Picking" button (enabled at 3+ confirmed)

PICKING STATE:
- Tonight's constraints summary (player count, time available)
- Game suggestion cards (3-5 games): cover art, match percentage, player count, time, ownership by attendees
- Match breakdown explanation (why each game scored as it did)
- Vote buttons on each card
- Live vote tally bar chart
- "Random Pick" dice button + "Show More" button
- "Start Playing [Game Name]" button when votes are in

IN_PROGRESS STATE:
- Active game name + timer (JetBrains Mono font)
- Scoreboard table (player names, round scores, totals)
- Session aura/mood indicator ("Clutch", "Comeback", "Dominant")
- Game tools panel: dice roller, timer, turn order randomizer, coin flip, counter
- "End Game" button

COMPLETED STATE:
- Winner celebration (gold crown icon, winner name large)
- Final standings list (ranked, with score)
- Session chronicle (narrative summary of key moments)
- Duration, player count stats
- Action buttons: Photo, Rematch, Play Again, Back to Group

DESIGN: Dark theme. Each state has a distinct accent color for its badge.
Timer uses JetBrains Mono. Scoreboard is clean table with alternating row colors.
```

---

## 15. Porting Guide (v0 → Vue)

### 15.1 What v0 Generates vs What You Need

| v0 Output | Vue Equivalent |
|-----------|---------------|
| React JSX (`<div className="...">`) | Vue SFC (`<template>` + `class="..."`) |
| `useState` / `useEffect` | `ref()` / `onMounted()` in `<script setup>` |
| shadcn/ui (React) | shadcn-vue (already installed) |
| Lucide React | `lucide-vue-next` |
| `clsx` | `cn()` utility (already in `lib/utils.ts`) |
| Next.js routing | Vue Router (already configured) |
| Tailwind v4 | Already using Tailwind v4 |
| `'use client'` directives | Not needed in Vue |

### 15.2 Porting Steps

1. **Extract the layout/structure** from v0's React output — the JSX tree maps almost 1:1 to Vue `<template>`
2. **Replace `className`** with `class` (or keep using `cn()` for conditional classes)
3. **Replace React hooks** with Vue Composition API:
   - `useState(initial)` → `ref(initial)`
   - `useEffect(fn, deps)` → `watchEffect(fn)` or `watch(deps, fn)`
   - `onClick={handler}` → `@click="handler"`
4. **Replace shadcn imports** with shadcn-vue equivalents (same API, different import paths)
5. **Copy Tailwind classes verbatim** — they're identical between React and Vue
6. **Test responsive behavior** at 320px, 768px, 1024px, 1440px

### 15.3 Component Mapping

| v0 Component | Vue Component |
|-------------|---------------|
| shadcn Button | `components/ui/button/Button.vue` (exists) |
| shadcn Card | `components/ui/card/Card.vue` (exists) |
| shadcn Dialog | `components/ui/dialog/Dialog.vue` (exists) |
| shadcn Sheet | `components/ui/sheet/Sheet.vue` (exists) |
| shadcn Tabs | `components/ui/tabs/Tabs.vue` (exists) |
| shadcn Badge | `components/ui/badge/Badge.vue` (exists) |
| shadcn Select | `components/ui/select/Select.vue` (exists) |
| shadcn Input | `components/ui/input/Input.vue` (exists) |
| shadcn Skeleton | `components/ui/skeleton/Skeleton.vue` (exists) |
| shadcn Slider | `components/ui/slider/Slider.vue` (exists) |
| shadcn Tooltip | `components/ui/tooltip/Tooltip.vue` (exists) |
| shadcn Avatar | `components/ui/avatar/Avatar.vue` (exists) |

### 15.4 New Components to Create

These don't exist in the current codebase and need to be built:

- `GameCard.vue` — the core collection card component
- `FilterSidebar.vue` — faceted filter panel
- `FilterBottomSheet.vue` — mobile filter drawer
- `ActiveFilterChips.vue` — horizontal chip bar
- `SessionCard.vue` — session preview card with RSVP
- `RSVPDashboard.vue` — avatar grid with status indicators
- `GameSuggestionCard.vue` — suggested game with match score
- `Scoreboard.vue` — in-game score table
- `GameTools.vue` — dice, timer, randomizer panel
- `SessionSummary.vue` — completed session view
- `AuroraBackground.vue` — animated gradient background
- `ScrollReveal.vue` — intersection observer wrapper
- `SkeletonGrid.vue` — skeleton loading state for collection grid

---

## 16. Research Sources

### Competitors Analyzed

| Platform | Key Insight Borrowed |
|----------|---------------------|
| **Board Game Arena** | Preference gradient (okay/prefer not/reluctant/never), Simple/Advanced lobby toggle, Action Bar pattern |
| **Tabletop Simulator** | Play Mode / Edit Mode separation |
| **Letterboxd** | Poster grid as interface, diary/log view, bottom tab navigation |
| **Spotify** | Content as color source, card-based grid, dark-first, achromatic UI with vibrant content |
| **Linear** | Dark premium aesthetic, scroll-triggered storytelling, spring-physics animations |
| **Notion** | Custom illustration system, character-driven branding, progressive disclosure |
| **Kickstarter** | Hero table-presence shot, "write for scanning" pattern, GIF explainer format |
| **BGG** | Advanced search patterns (to improve upon), collection data model |
| **Boardy** | AI personality in group chat, proactive nudge system |
| **Kallax.io** | Cross-collection natural language search |
| **What2Play** | AI re-ranking with transparency, multi-table seating |
| **BG Stats** | Stats as the hook (H-index, heat maps, play frequency) |
| **Yucata** | No-rank-demotion philosophy, anti-tracking ethics |
| **BSW** | Color-coded table states |
| **Board Game Tools** | Single-purpose tool dashboard during play |

### Design Trend Sources

| Topic | Source |
|-------|--------|
| Dark mode 2026 | Lucky Graphics, ColorArchive gaming dark mode guide |
| Typography trends | Mantlr Font Pairing Guide, Google Fonts trending |
| Glassmorphism | Line25 2026 trends, Rajesh R Nair analysis |
| Animation patterns | Creative Alive Micro-Interactions 2026 |
| Mobile navigation | Phone Simulator 2026, GenDesigns Mobile UI 2026 |
| Responsive design | StudioMeyer, CSS Gallery Pro, Scrimba 2026 guides |
| Card grid patterns | Craftshift, Mobbin, Pinterest/Unsplash analysis |
| Scroll reveals | CSS View Timelines spec (Chrome 115+, Safari 26) |
| v0.dev patterns | Vercel documentation, community prompting guides |

---

*This specification is designed to be read by both humans and v0.dev. Each section provides enough detail for v0 to generate a production-quality draft, and enough context for a developer to port the output to the existing Vue 3 codebase.*
