---
phase: 10-picking-a-game-redesign
fix_completed: 2026-07-18T14:00:00Z
findings_fixed: 12
findings_deferred: 2
status: fix_complete
---

# Phase 10: Code Review Fix Report

## Fixed Findings

| ID | Severity | Description | Commit | Status |
|----|----------|-------------|--------|--------|
| CR-01 | critical | `updateSessionDetails` resolver crashes on invalid `scheduledAt` | `490dcde` | Fixed |
| WR-01 | warning | Picking header mobile DOM order violates UI-SPEC | `411a804` | Fixed |
| WR-02 | warning | Skeleton header shown during refetch when session data exists | `411a804` | Fixed |
| WR-03 | warning | Live-region announcements cannot repeat | `411a804` | Fixed |
| WR-04 | warning | Loading skeleton does not match card anatomy | `411a804` | Fixed |
| WR-06 | warning | `suggestion.confidence` passed with `as any` | `411a804` | Fixed |
| WR-08 | warning | Header test omits `shadow-card` container class | `c756c1f` | Fixed |
| WR-09 | warning | Route-level test validates UI-SPEC-violating skeleton behavior | `c756c1f`, `d418bb7` | Fixed |
| WR-10 | warning | E2E reason-disclosure check is conditional | `11bb749` | Fixed |
| WR-11 | warning | E2E global setup uses hardcoded macOS temp path | `11bb749` | Fixed |
| WR-12 | warning | E2E fixture files written inside DB transaction | `11bb749` | Fixed |

## Deferred Findings

| ID | Severity | Description | Rationale |
|----|----------|-------------|-----------|
| WR-05 | warning | Nested interactive elements in GameCard are invalid ARIA | Broader shared `GameCard` ARIA redesign that spans Phase 9/10 concerns. Requires restructuring `role="button"` vs nested action button — the UI-SPEC explicitly places the action inside the card. Needs cross-phase a11y audit, not a surgical fix. |
| WR-07 | warning | SessionDetailsEditor uses raw HTML inputs instead of `Input` primitive | New form primitives (`Textarea`, `DateTimeInput`, `NumberInput`) would need to be created or extended from source-owned `Input`. This is a design-system extension task, not a correctness fix. Deferred to a dedicated form-primitives phase. |

## Implementation Details

### CR-01: `parse_datetime` rescue
**File:** `app/graphql/mutations/update_session_details.rb`
**Change:** Added `rescue ArgumentError` → raises `GraphQL::ExecutionError` with descriptive message instead of 500 crash.
```ruby
def parse_datetime(value)
  return nil if value.nil?
  return value.to_datetime if value.respond_to?(:to_datetime)
  Time.parse(value).to_datetime
rescue ArgumentError
  raise GraphQL::ExecutionError, "scheduledAt is not a valid datetime"
end
```

### WR-01: DOM order in PickingSessionHeader
**File:** `app/frontend/components/session/PickingSessionHeader.vue`
**Change:** Moved Edit Details `<div>` block after the attendees block in source order. Desktop placement preserved via `lg:order-1 lg:justify-end` on Edit Details, while metadata and attendees get `lg:order-2`. On mobile (`<lg`), the stack is now: title/status → metadata → attendees → Edit Details, matching UI-SPEC.

### WR-02: Skeleton during refetch
**File:** `app/frontend/views/NightSessionView.vue`
**Change:** Changed `v-if="loading"` to `v-if="loading && !session"` so the real `PickingSessionHeader` is visible when base session data exists (e.g., during refetch). Only renders empty skeleton when there is no session data at all.

### WR-03: Repeatable live-region announcements
**File:** `app/frontend/views/NightSessionView.vue`
**Change:** Cleared announcement values before setting them on next tick so `aria-live` regions always detect a text change.
```typescript
// In onUpdateDetailsDone:
detailsAnnouncement.value = ''
nextTick(() => { detailsAnnouncement.value = 'Session details updated.' })

// In handlePicked:
pickAnnouncement.value = ''
nextTick(() => { pickAnnouncement.value = `${gameName} selected for this night.` })
```
Added `nextTick` to imports from Vue.

### WR-04: Skeleton anatomy
**File:** `app/frontend/components/session/GamePicker.vue`
**Change:** Replaced single generic pill skeleton with two-chip score/confidence row plus three-chip reason row, matching the UI-SPEC card anatomy: `4:3 media → title → 2 description lines → score/confidence pills → 3 reason chips → action`.

### WR-06: Confidence type alignment
**File:** `app/frontend/components/collection/GameCard.vue`, `app/frontend/components/session/GamePicker.vue`
**Change:** Imported `ConfidenceLevel` enum type from `@/generated/types` and used it in `GameCard`'s prop typing instead of the raw string union. Removed `as any` cast from `GamePicker.vue`, which now passes `suggestion.confidence` directly.

### WR-08: shadow-card assertion
**File:** `spec/frontend/PickingSessionHeader.spec.ts`
**Change:** Added `expect(container.classes()).toContain('shadow-card')` to the container class test.

### WR-09: Skeleton header test correction
**File:** `spec/frontend/NightSessionView.spec.ts`
**Change:** Replaced the test that asserted skeleton on loading+session with two tests:
1. Verifies outer loading message (not PICKING skeleton) when session is absent
2. Verifies real header is preserved during refetch when session exists

### WR-10: Unconditional reason disclosure
**File:** `tests/e2e/session_lifecycle.spec.ts`
**Change:** Removed `if (await showMoreReasons.isVisible().catch(() => false))` conditional. Now asserts `toBeVisible()` unconditionally before keyboard interaction. The seed produces 4 reasons for Wingspan (player count, time, complexity, ownership), so `hasMoreReasons` triggers and the disclosure is always present.

### WR-11: Portable temp path
**File:** `tests/e2e/global-setup.ts`
**Change:** Replaced hardcoded `/var/folders/yr/...` with `resolve(tmpdir(), 'opencode', 'phase10-picking')` using `os.tmpdir()`.

### WR-12: Fixture writes after transaction
**File:** `lib/tasks/e2e.rake`
**Change:** Extracted `File.write` calls outside the `ActiveRecord::Base.transaction` block. Declared variables (`alice`, `bob`, `group`, session objects) before the transaction, assigned inside, and wrote fixture JSON files only after the transaction commits.

## Verification Results

| Check | Result | Details |
|-------|--------|---------|
| Mutation RSpec | ✅ PASS | 24 examples, 0 failures |
| Phase 10 Vitest | ✅ PASS | 42 + 16 tests, 0 failures |
| Production build | ✅ PASS | Built in 910ms |
| vue-tsc diagnostics (changed files) | ✅ PASS | 0 new errors; pre-existing errors in unrelated files |
| E2E lifecycle test | ✅ PASS | Protected wrapper with backup/restore; fixture diff restored |
| Fixture diff after verification | ✅ EMPTY | `git diff --stat tests/e2e/fixtures/` returns nothing |

## Commits

```
490dcde fix(10): rescue ArgumentError in parse_datetime for invalid scheduledAt (CR-01)
411a804 fix(10): correct header DOM order, skeleton refetch, live-region repeats, skeleton anatomy, confidence typing (WR-01 WR-02 WR-03 WR-04 WR-06)
c756c1f fix(10): add shadow-card assertion, correct skeleton-header refetch test (WR-08 WR-09)
11bb749 fix(10): unconditional reason disclosure, portable tmpdir backup, fixture writes after transaction (WR-10 WR-11 WR-12)
d418bb7 fix(10): correct skeleton-absent loading test assertion per unreachable PICKING skeleton (WR-09)
```

All commits are after `b8a8d63`. The only non-staged dirt is pre-existing: `.planning/HANDOFF.json` (deleted), `.planning/phases/01-*/` modifications, and `.planning/phases/09-*/` untracked file — none related to Phase 10 or this fix.
