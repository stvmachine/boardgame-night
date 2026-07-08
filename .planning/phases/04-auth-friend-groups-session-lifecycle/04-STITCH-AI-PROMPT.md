# Stitch.ai UI Redesign Prompt — BoardGame Night

> Paste this entire document into Stitch.ai (or similar AI UI mockup tool) to generate mockups for the full application. The prompt is structured as: app overview → design system → existing screens → new screens → user flows.

---

## App Overview

**Name:** BoardGame Night
**Tagline:** Merge your BoardGameGeek collections and pick games everyone can play for boardgame night.
**Platform:** Responsive web app (mobile-first, desktop sidebar layout). No native mobile app.
**Audience:** Groups of 3–10 friends who own board games and want to organize game nights.

**What it does:**
1. Users create accounts and link their BoardGameGeek (BGG) username.
2. Users create friend groups and invite friends via magic links.
3. The app merges everyone's BGG collections into a shared, deduplicated view.
4. Any group member can create a "boardgame night" session — pick a date, invite the group, see RSVPs.
5. The host manually picks a game from the shared collection (filtered by who's coming and player count).
6. The session lifecycle tracks: draft → invited → picking → completed.

---

## Design System

### Color Palette (60-30-10 rule)

| Role | Hex | Tailwind Token | Usage |
|------|-----|----------------|-------|
| Dominant (60%) | `#fafafa` | `neutral-50` | Page background, outer surfaces |
| Secondary (30%) | `#ffffff` | `white` | Cards, sidebar, nav, modals, input backgrounds |
| Accent (10%) | `#4f46e5` | `indigo-600` | Primary actions, links, focus rings, selected states, badges |
| Destructive | `#dc2626` | `red-600` | Destructive actions only (remove, cancel, leave, revoke) |

**Accent is reserved for:** primary action buttons, navigation links, logo text, focus rings, active/selected filter badges, game rating badges, mobile menu toggle focus ring.

### Typography

| Role | Size | Weight | Line Height | Tailwind |
|------|------|--------|-------------|----------|
| Body | 16px | 400 regular | 1.5 | `text-base font-normal leading-relaxed` |
| Label | 14px | 600 semibold | 1.4 | `text-sm font-semibold` |
| Heading | 20px | 600 semibold | 1.2 | `text-xl font-semibold` |
| Display | 28px | 600 semibold | 1.1 | `text-3xl font-semibold` |

Font stack: Inter / system-ui / sans-serif (Tailwind default).

### Spacing Scale (multiples of 4)

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding, badge padding |
| sm | 8px | Compact element spacing, input padding-y, card gap |
| md | 16px | Default element spacing, section padding, form gap |
| lg | 24px | Section padding, page content gaps |
| xl | 32px | Layout gaps, major card margins |
| 2xl | 48px | Hero/empty state vertical spacing |
| 3xl | 64px | Page-level spacing |

**Exceptions:** 44px minimum hit area for icon-only buttons; 280px fixed width for desktop sidebar.

### Component Styling Conventions

- **Inputs:** `border-neutral-300`, `focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500`
- **Primary buttons:** `bg-indigo-600 text-white` (disabled: `bg-neutral-300 text-neutral-500`)
- **Secondary buttons:** `border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50`
- **Destructive buttons:** `bg-red-600 hover:bg-red-700 text-white`
- **Inline errors:** `text-sm text-red-600` below the field
- **Global error alert:** `rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700`
- **Cards:** `rounded-xl border border-neutral-200 bg-white shadow-sm`
- **Status badges:**
  - draft — `bg-neutral-100 text-neutral-700`
  - invited — `bg-indigo-100 text-indigo-800`
  - picking — `bg-amber-100 text-amber-800`
  - completed — `bg-green-100 text-green-800`

### Icons
Inline SVG only. No icon library dependency. Use simple line icons (stroke-based, 24x24 viewBox, stroke-width 2).

### No component library
Tailwind CSS v4 utility classes + project-specific Vue components. No shadcn, no headless UI library, no Chakra.

---

## Layout Shell

### Desktop (≥768px)
- Fixed 280px sidebar on the left containing: logo, navigation links, collectors list, filter controls.
- Main content area fills remaining width with `p-4 md:p-6` padding.
- Header is minimal — just the mobile menu toggle (hidden on desktop).

### Mobile (<768px)
- Sidebar collapses into a slide-in drawer toggled by a hamburger button (44px hit area).
- Main content is full-width with `p-4` padding.
- Drawer overlays content with a semi-transparent backdrop.

---

## Existing Screens (Phase 1–3 — already built, redesign for polish)

### 1. Home / Landing (`/`)
**Purpose:** First impression. Lets anyone enter BGG usernames and see a merged collection without an account.

**Layout:**
- Centered hero section (`max-w-3xl mx-auto`):
  - Display heading: "Find the perfect game for your next board game night"
  - Subtext: "Merge your BoardGameGeek collections, filter by players and time, and pick what to play."
- Username input card (white card, rounded-xl, border, shadow-sm):
  - Input field for BGG usernames (comma-separated or one at a time)
  - "Merge collections" primary button
- Hot Games section below:
  - List of trending/hot BGG games with thumbnail, name, rank, rating badge

**Focal point:** The hero heading. Use `text-3xl md:text-4xl font-bold text-neutral-900`.

### 2. Collection View (`/collection`)
**Purpose:** The merged collection grid — the core feature. Shows deduplicated games from all linked BGG users.

**Layout (desktop):**
- Left sidebar (280px): Collectors section (collapsible), filter controls (search, player count, time, complexity, rating), sort control, group-by toggle
- Main area: Game grid with cards

**Game Card:**
- Thumbnail image (BGG game image)
- Game name (Heading size)
- Metadata row: player count range, playtime, complexity weight
- Rating badge (indigo accent if ≥7.0)
- Owner avatars (colored initials, not photos)

**States:**
- Empty (no collectors): "No collectors selected" heading + "Add BGG usernames to merge collections" body
- Loading: Skeleton grid (pulsing placeholder cards)
- Error: "Couldn't load this page. Please check your connection and try again."

### 3. Hot Games (`/hot`)
**Purpose:** Browse trending BGG games. Simple list view with thumbnails.

---

## New Screens (Phase 4 — design these)

### 4. Sign Up (`/signup`)
**Purpose:** Create a new account with email, password, and BGG username.

**Layout:**
- Centered card (`max-w-md mx-auto`, `p-6`, white card on neutral-50 bg)
- Display heading: "Create your account"
- Form fields (stacked, `space-y-4`):
  - Email address (label + input + inline error)
  - Password (label + input + inline error)
  - Confirm password (label + input + inline error)
  - BGG username (label + input + helper text "Enter your BoardGameGeek username")
- Primary button: "Sign up" (full width, indigo)
- Link below: "Already have an account? Log in" (indigo link)
- Global error alert if signup fails

### 5. Log In (`/login`)
**Purpose:** Email + password login. Token stored in memory (not localStorage).

**Layout:**
- Centered card (`max-w-md mx-auto`)
- Display heading: "Welcome back"
- Form fields:
  - Email address
  - Password
- Primary button: "Log in" (full width, indigo)
- Link: "Don't have an account? Sign up"
- Redirects to previous page after login (or `/groups` by default)

### 6. Account (`/account`)
**Purpose:** View/edit profile, bind BGG username, manage sessions, log out.

**Layout:**
- Card section: Profile
  - Email (read-only display)
  - BGG username (editable input + "Update" button)
  - "Linked BGG collection: X games" info text
- Card section: Active sessions
  - List of devices/sessions with "Revoke" (destructive) button per row
- Card section: Danger zone
  - "Log out" button (secondary, not destructive)
  - "Log out of all devices" button (destructive, confirmation required)

### 7. Groups List (`/groups`)
**Purpose:** See all friend groups, create new ones.

**Layout:**
- Page heading: "Your groups" + "Create a group" primary button (top right)
- Grid of group cards (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`):
  - Group name (Heading)
  - Member count + avatars (colored initials, max 5 shown + "+N")
  - "X games in shared collection" info text
  - Click card → group detail page
- Empty state: "No groups yet" heading + "Create a group to invite friends and start merging your collections." body + "Create a group" button

### 8. Group Detail (`/g/:token`)
**Purpose:** Group overview, members, shared collection, sessions.

**Layout (tabs or sections):**
- Group header: name, description, member avatars, "Create a night" primary button
- Section: Members
  - List of members with role badges (Owner / Admin / Member)
  - Each row: avatar, name, BGG username, role badge
  - Owner/admin actions: "Invite" (opens invite link display), "Remove member" (destructive, confirmation)
  - "Leave group" button at bottom (destructive, confirmation)
- Section: Invite link
  - Read-only input with the magic-link URL
  - "Copy link" button (shows "Copied!" hint in indigo on success)
  - "Revoke invite" button (destructive, confirmation) — revokes all pending tokens
- Section: Shared Collection
  - Reuses the collection grid from `/collection` but scoped to group members
  - Shows "X games from N collections" header
- Section: Sessions
  - List of upcoming/past sessions for this group
  - Each session card: title, date, status badge, attendee count
  - "Create a night" primary button

### 9. Create Group (`/groups/new` or inline form on `/groups`)
**Purpose:** Simple form to name and describe a new group.

**Layout:**
- Centered card
- Display heading: "Create a group"
- Form fields:
  - Group name (required)
  - Group description (optional, textarea)
- Primary button: "Create group"
- After creation: redirect to group detail page

### 10. Session Detail (`/s/:id`)
**Purpose:** The boardgame night session page. Changes layout based on lifecycle state.

**Layout — Draft state:**
- Session title (editable input)
- Form fields: Date/time, Location, Capacity
- "Send invites" primary button (transitions to `invited`)
- "Cancel" destructive button (deletes session)

**Layout — Invited state:**
- Session title (read-only heading)
- Date/time, location, capacity (read-only display)
- RSVP dashboard:
  - Going count (green badge), Not going count (neutral badge), Pending count
  - List of invitees with RSVP status icons
- "Start picking" primary button (transitions to `picking`)
- "Cancel night" destructive button (confirmation: "This will delete the session and notify invited guests. This action cannot be undone.")
- "Edit details" secondary button (returns to draft-like edit mode)

**Layout — Picking state:**
- Session title + date header
- Attendee count display: "X going"
- Player count filter (auto-constrained by attendee count, shows "Filtering for N players")
- Game grid (reuses collection grid, filtered by player count)
- Each game card has a "Pick this game" primary button
- "Pick game" action selects the game and transitions to `completed`
- "Back to RSVPs" secondary button

**Layout — Completed state:**
- Session title + date header
- "Picked game" card: large game card with thumbnail, name, metadata
- Attendee list with avatars
- "Reopen" secondary button (transitions back to `picking`)
- Read-only — no editing

### 11. RSVP Landing Page (`/invite/:token`)
**Purpose:** Magic-link page for invited guests. Works without an account.

**Layout:**
- Centered card (`max-w-md`)
- Session title (Heading)
- Host name, date/time, location (metadata display)
- Two equal-width buttons side by side:
  - "Going" (primary, indigo, full width)
  - "Not going" (secondary outline, neutral, full width)
- If "Going" selected:
  - Optional "Your nickname" input field appears
  - "Confirm RSVP" primary button
- After RSVP:
  - Confirmation summary: "You're going!" or "You won't be attending"
  - Read-only attendee count
  - If user has no account: "Create an account to manage your RSVPs and join future nights" link

### 12. Authenticated Header Nav
**Purpose:** Navigation changes when logged in.

**Logged-in nav links:** Home, Collection, Hot, Groups, Account
**Logged-out nav links:** Home, Collection, Hot, Log in, Sign up
**Log out:** Available from Account page or a dropdown menu in the header.

---

## User Flows to Mockup

### Flow 1: New User Signup → Create Group → Invite Friends
1. User lands on Home, clicks "Sign up"
2. Fills email, password, BGG username → account created
3. Redirected to `/groups` (empty state)
4. Clicks "Create a group" → fills name/description
5. Group created → redirected to group detail
6. Clicks "Invite" → copies magic link → sends to friend
7. Friend opens link → joins group (or signs up first)

### Flow 2: Create a Game Night → Invite → RSVP → Pick Game
1. Group member clicks "Create a night" on group page
2. Fills title, date, location, capacity → saves as draft
3. Clicks "Send invites" → session transitions to `invited`
4. Invitees receive magic link → open `/invite/:token`
5. Invitee clicks "Going" → optionally enters nickname → confirmed
6. Host sees RSVP dashboard update in real-time
7. Host clicks "Start picking" → session transitions to `picking`
8. Host sees game grid filtered by attendee count
9. Host clicks "Pick this game" on a game → session transitions to `completed`
10. All attendees see the completed session with the picked game

### Flow 3: No-Account RSVP
1. Non-user receives magic link via email/text
2. Opens `/invite/:token` on mobile
3. Sees session details (title, host, date, location)
4. Clicks "Going" → optional nickname field appears
5. Confirms → sees "You're going!" confirmation + attendee count
6. Optional: clicks "Create an account" link to upgrade

---

## Additional Notes for the AI

- **Responsive:** Every screen must work at 375px (mobile), 768px (tablet), and 1280px (desktop).
- **Dark mode:** Not required for v1, but design should not preclude it (use Tailwind semantic tokens, not hardcoded hex in components).
- **Accessibility:** All icon-only buttons need `aria-label` or tooltip fallback. Form inputs need associated labels. Color contrast must meet WCAG AA.
- **No images of people:** Use colored initials (deterministic from name) for all avatars. No photo uploads in v1.
- **Game images:** Use BGG thumbnail URLs (external). Show a placeholder (neutral-200 bg with game icon) while loading.
- **Empty states:** Every list/grid must have a purposeful empty state with a heading, body text, and a CTA button.
- **Loading states:** Use skeleton placeholders (pulsing `bg-neutral-200 animate-pulse` blocks), not spinners.
- **Error states:** Use the global error alert style. Never show raw API errors to the user.
- **Destructive actions:** Always require a two-step confirmation. First click reveals the confirmation area, second click executes with a red button.
- **Status badges:** Use the color-coded badges defined above for session states.
- **Copy tone:** Friendly, direct, specific. No generic "Submit" or "Click here". Every CTA names the action.