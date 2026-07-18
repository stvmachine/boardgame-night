---
phase: 11-polish-e2e-hardening
plan: 01
subsystem: ui
tags: [vue, pinia, theme, dark-mode, accessibility, playwright]

requires:
  - phase: 05-design-system-foundation
    provides: Semantic light/dark Material 3 tokens and source-owned UI primitives
  - phase: 09-home-collection-redesign
    provides: Redesigned Account navigation and responsive Tabletop Social shell
provides:
  - Persisted Light, Dark, and System appearance preference
  - Pre-mount document-root theme restoration without avoidable flash
  - Accessible Account appearance control with live system-theme updates
  - Focused unit, component, build, and protected browser evidence
affects: [11-02-playwright-ci, 11-04-responsive-dark-qa]

tech-stack:
  added: []
  patterns:
    - Allowlisted localStorage preference resolved into explicit reactive theme state
    - Synchronous head bootstrap followed by Pinia-owned root synchronization

key-files:
  created:
    - tests/e2e/theme.spec.ts
    - spec/frontend/uiStore.spec.ts
    - spec/frontend/AccountView.spec.ts
  modified:
    - app/frontend/index.html
    - app/frontend/stores/ui.ts
    - app/frontend/entrypoints/application.ts
    - app/frontend/views/AccountView.vue

key-decisions:
  - "Missing or invalid stored preferences remain unsaved Light; only explicit Light, Dark, or System choices persist."
  - "The head bootstrap and Pinia store share the same allowlist and root class/color-scheme contract."
  - "System media changes update both exposed resolvedTheme state and the document root atomically."

patterns-established:
  - "Theme bootstrap: apply a safe allowlisted preference before the Vue module executes, then initialize Pinia before app.mount."
  - "Appearance selection: native fieldset/legend grouping around the source-owned single-select ToggleGroup without mismatched radio semantics."

requirements-completed: [DEBT-01]

coverage:
  - id: D1
    description: "Persisted Light, Dark, and System preferences apply to the document root before Vue mounts and survive navigation/reload."
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: "spec/frontend/uiStore.spec.ts (13 tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/theme.spec.ts#persists an accessible appearance choice before mount"
        status: pass
    human_judgment: false
  - id: D2
    description: "Account exposes exactly three accessible appearance choices using the existing Material 3 hierarchy and semantic tokens."
    requirement: DEBT-01
    verification:
      - kind: automated_ui
        ref: "spec/frontend/AccountView.spec.ts (12 tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/theme.spec.ts#persists an accessible appearance choice before mount"
        status: pass
    human_judgment: false
  - id: D3
    description: "System preference changes update reactive resolved theme state and root presentation live with idempotent listener cleanup."
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: "spec/frontend/uiStore.spec.ts#live System media change updates resolvedTheme and root state"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-07-18
status: complete
---

# Phase 11 Plan 01: Appearance Slice Summary

**Persisted Light/Dark/System appearance with safe pre-mount restoration, accessible Account controls, and live system-theme synchronization**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-18T22:45:00Z
- **Completed:** 2026-07-18T23:03:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Restored an allowlisted saved appearance before Vue loads, preventing an avoidable light flash for returning dark-mode users.
- Added an accessible Account appearance selector with exactly Light, Dark, and System choices using semantic Material 3 surfaces.
- Kept root state, persisted preference, and live operating-system theme changes synchronized with focused automated evidence.

## Task Commits

1. **Tasks 1–2: Persist preference and apply it before mount** - `43d2e73` (feat)
2. **Tasks 2–3: Add and harden accessible Account appearance controls** - `313ba04` (feat)

## Files Created/Modified
- `app/frontend/index.html` - Safe blocking theme bootstrap before module execution.
- `app/frontend/stores/ui.ts` - Allowlisted persistence, reactive resolution, root updates, and media listener lifecycle.
- `app/frontend/entrypoints/application.ts` - Pinia theme initialization before `app.mount`.
- `app/frontend/views/AccountView.vue` - Semantic Appearance fieldset and three-way control.
- `spec/frontend/uiStore.spec.ts` - Theme default, safety, persistence, and live-system coverage.
- `spec/frontend/AccountView.spec.ts` - Appearance semantics, interaction, touch-target, and regression coverage.
- `tests/e2e/theme.spec.ts` - Real browser persistence and pre-mount behavior journey.

## Decisions Made
- Used the existing source-owned ToggleGroup inside a fieldset/legend rather than introducing a new form primitive.
- Ignored falsy single-select emissions so the persisted preference can never become an invalid empty value.
- Exposed `resolvedTheme` as reactive state so operating-system changes cannot leave consumers with a stale cached value.

## Deviations from Plan

None - the implementation stayed within the seven Plan 11-01 owned files and the locked D-11/D-12 behavior.

## Issues Encountered
- Two GSD executor passes and one design-specialist pass returned without changes. A bounded fixer recovery implemented the plan, after which review caught and corrected live resolved-theme state and invalid radiogroup semantics before commit.
- The production build passes with existing Vite/Rolldown dependency warnings about deprecated HMR options and ignored `@vueuse/core` pure annotations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 11-02 can include the new theme browser journey in the full deterministic Chromium CI suite.
- The responsive/dark matrix in Plan 11-04 can extend `tests/e2e/theme.spec.ts` without changing the appearance contract.

## Self-Check: PASSED
- All seven Plan 11-01 owned files exist and are committed.
- Focused Vitest: 25/25 passed.
- Production Vite build passed.
- Protected Playwright appearance journey: 1/1 passed with byte-identical fixture restoration.
- `git diff --check` passed for owned files.

---
*Phase: 11-polish-e2e-hardening*
*Completed: 2026-07-18*
