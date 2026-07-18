---
phase: 10-picking-a-game-redesign
reviewed: 2026-07-18T12:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - app/contracts/update_session_details_contract.rb
  - app/graphql/mutations/update_session_details.rb
  - app/graphql/types/mutation_type.rb
  - spec/contracts/update_session_details_contract_spec.rb
  - spec/graphql/update_session_details_mutation_spec.rb
  - codegen.ts
  - app/frontend/apollo/queries/night_session.graphql
  - app/frontend/apollo/mutations/update_session_details.graphql
  - app/frontend/components/session/PickingSessionHeader.vue
  - spec/frontend/PickingSessionHeader.spec.ts
  - app/frontend/components/session/SessionDetailsEditor.vue
  - spec/frontend/SessionDetailsEditor.spec.ts
  - app/frontend/components/collection/GameCard.vue
  - spec/frontend/GameCard.spec.ts
  - app/frontend/components/session/GamePicker.vue
  - spec/frontend/GamePicker.spec.ts
  - app/frontend/views/NightSessionView.vue
  - spec/frontend/NightSessionView.spec.ts
  - lib/tasks/e2e.rake
  - tests/e2e/session_lifecycle.spec.ts
  - tests/e2e/global-setup.ts
  - AGENTS.md
findings:
  critical: 1
  warning: 12
  info: 0
  total: 13
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-07-18T12:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Phase 10 implements the redesigned picking screen, a host-only `updateSessionDetails` mutation, and supporting tests/E2E. The implementation largely follows the UI-SPEC and architecture decisions, but several correctness and accessibility issues remain. The most serious is an unhandled `ArgumentError` in the `updateSessionDetails` resolver when an invalid `scheduledAt` is supplied, which can crash the GraphQL mutation instead of returning a validation error. There are also UI-SPEC violations in the picking header DOM order and the skeleton header behavior, plus live-region accessibility gaps, test coverage holes, and E2E fixture safety issues.

## Critical Issues

### CR-01: `updateSessionDetails` resolver crashes on invalid `scheduledAt`

**File:** `app/graphql/mutations/update_session_details.rb:52-56`
**Issue:** `parse_datetime` calls `Time.parse(value)` without rescuing `ArgumentError`. A client sending an invalid datetime string (e.g., `"not-a-datetime"`) causes an unhandled exception instead of a GraphQL validation error. The contract spec tests the contract in isolation, but the resolver parses before the contract is ever called, so that test does not protect the mutation endpoint.
**Fix:**
```ruby
def parse_datetime(value)
  return nil if value.nil?
  return value.to_datetime if value.respond_to?(:to_datetime)

  Time.parse(value).to_datetime
rescue ArgumentError
  raise GraphQL::ExecutionError, "scheduledAt is not a valid datetime"
end
```

## Warnings

### WR-01: Picking header mobile DOM order violates the UI-SPEC

**File:** `app/frontend/components/session/PickingSessionHeader.vue:63-136`
**Issue:** The UI-SPEC mandates the source/DOM order on every breakpoint be: title/status → metadata → attendees → Edit Details. On mobile (`<lg`) the current DOM order is title/status → Edit Details → metadata → attendees because the Edit Details block is placed before the metadata and attendee blocks. This produces a visual stack that places the Edit Details button before the session context.
**Fix:** Move the Edit Details block after the attendee block in the source, and use Tailwind `order` utilities to pull it visually into the first desktop row:
```vue
<!-- Title and status -->
<div class="lg:order-1 lg:w-1/2">...</div>
<!-- Date and location metadata -->
<div class="lg:order-2 lg:w-1/2">...</div>
<!-- Going attendees -->
<div class="lg:order-2 lg:w-1/2 lg:flex lg:justify-end">...</div>
<!-- Host-only Edit Details -->
<div v-if="isHost" class="lg:order-1 lg:w-1/2 lg:flex lg:justify-end">...</div>
```

### WR-02: Skeleton header shown while session data is available

**File:** `app/frontend/views/NightSessionView.vue:266-275`
**Issue:** The PICKING branch renders a header skeleton whenever `loading` is true, even when `session` already exists (e.g., during a refetch). The UI-SPEC states: "Keep session header geometry visible when base session data is available." The current behavior hides the real header during refetch and contradicts the UI-SPEC.
**Fix:** Only render the header skeleton when session data is absent:
```vue
<div v-if="loading && !session" class="...">...</div>
<PickingSessionHeader v-else ... />
```

### WR-03: Live-region announcements are not reset, so repeated updates are not announced

**File:** `app/frontend/views/NightSessionView.vue:48, 81-85, 106-108`
**Issue:** `detailsAnnouncement` and `pickAnnouncement` are set to fixed strings but never cleared. Because `aria-live="polite"` regions only announce when their text changes, a second "Session details updated" or a second pick of the same game name will not be announced.
**Fix:** Clear the announcement before setting it so the live region always detects a change:
```typescript
onUpdateDetailsDone(() => {
  showDetailsEditor.value = false
  detailsAnnouncement.value = ''
  nextTick(() => {
    detailsAnnouncement.value = 'Session details updated.'
    pickingHeaderRef.value?.focusEditButton()
  })
})
```
Apply the same pattern to `pickAnnouncement` in `handlePicked`.

### WR-04: Loading skeleton does not match the required card anatomy

**File:** `app/frontend/components/session/GamePicker.vue:86-103`
**Issue:** The UI-SPEC requires eight skeletons that match the card anatomy: "4:3 media, title, two description lines, score/confidence pills, three reason chips, footer, and action." The current skeleton only has media, title, two description lines, one generic pill, and an action; it lacks the score/confidence pills and three reason chips.
**Fix:** Add skeleton placeholders for the score/confidence row and three reason chips before the footer/action skeletons, mirroring the real card layout.

### WR-05: Nested interactive elements in `GameCard` are invalid ARIA

**File:** `app/frontend/components/collection/GameCard.vue:136-146, 235-237, 332-334`
**Issue:** The card root has `role="button"` and `tabindex="0"`, but it contains a real `<button>` action slot (Pick this game / Show more reasons). ARIA prohibits nesting interactive elements inside other interactive elements; screen readers may misannounce the card and its nested controls. The UI-SPEC requires the action slot to be inside the card, but the current implementation sacrifices ARIA validity.
**Fix:** Either remove `role="button"`/`tabindex="0"` from the card and expose a dedicated, visible "Open on BGG" button/link, or restructure so the pick action is outside the card's interactive boundary. At minimum, add a comment documenting the deliberate UI-SPEC-driven ARIA compromise and consider an a11y audit.

### WR-06: `suggestion.confidence` is cast with `as any`

**File:** `app/frontend/components/session/GamePicker.vue:157`
**Issue:** The confidence value is passed to `GameCard` via `suggestion.confidence as any`, bypassing the generated `Suggestion` type and the `GameCard` prop type. This hides potential mismatches between the backend enum/schema and the frontend prop contract.
**Fix:** Remove the cast. If the generated type disagrees with `GameCard`'s `'HIGH' | 'MEDIUM' | 'LOW' | null`, fix the schema or the prop type instead of masking it with `any`.

### WR-07: `SessionDetailsEditor` uses raw HTML inputs instead of the project's `Input` primitive

**File:** `app/frontend/components/session/SessionDetailsEditor.vue:218-238, 260-266`
**Issue:** The description, datetime, and capacity fields use raw `<textarea>`, `<input type="datetime-local">`, and `<input type="number">` with hand-rolled Tailwind classes. The title and location fields use the source-owned `Input` primitive. This inconsistency risks divergent focus states, validation styling, and future maintenance.
**Fix:** Extend the design system with `Textarea`, `DateTimeInput`, and `NumberInput` primitives (or reuse the existing `Input` if it supports these types) and use them consistently for all form fields.

### WR-08: Header test omits the `shadow-card` container class

**File:** `spec/frontend/PickingSessionHeader.spec.ts:184-196`
**Issue:** The test verifies the approved container classes but does not assert `shadow-card`, which is explicitly required by the UI-SPEC container contract. A regression that removes `shadow-card` would not be caught.
**Fix:** Add `expect(container.classes()).toContain('shadow-card')` to the existing test.

### WR-09: Route-level test validates the UI-SPEC-violating skeleton-header behavior

**File:** `spec/frontend/NightSessionView.spec.ts:260-267`
**Issue:** The test expects the skeleton header to be shown when `loading` is true, even though `session` data is provided. This test encodes the behavior that violates the UI-SPEC rule to keep the real header visible when base session data is available.
**Fix:** Update the test to expect the real `PickingSessionHeader` when `session` exists and `loading` is true. Add a separate test that verifies the skeleton header only appears when `session` is null.

### WR-10: E2E reason-disclosure check is conditional and may pass silently

**File:** `tests/e2e/session_lifecycle.spec.ts:105-110`
**Issue:** The disclosure keyboard interaction is wrapped in `if (await showMoreReasons.isVisible().catch(() => false))`. If the seeded suggestions never produce more than three reasons, the disclosure will not exist and this part of the keyboard/accessibility contract will not be exercised.
**Fix:** Ensure the e2e seed produces a suggestion with more than three reasons (or hardcode the reason list in the seed), then assert the disclosure exists unconditionally before testing keyboard expansion.

### WR-11: E2E global setup uses a hardcoded macOS temp path

**File:** `tests/e2e/global-setup.ts:11`
**Issue:** `backupDir` is hardcoded to `/var/folders/yr/v0ygzpgd79b5pr9vlt83fswc0000gn/T/opencode/phase10-picking`. This path is specific to the current macOS environment and will fail on Linux/CI or on a different user account.
**Fix:** Use the OS temp directory and a project-scoped subdirectory:
```typescript
import { tmpdir } from 'os'
const backupDir = resolve(tmpdir(), 'opencode', 'phase10-picking')
```

### WR-12: E2E fixture files are written inside the DB transaction

**File:** `lib/tasks/e2e.rake:187-203`
**Issue:** The JSON fixture files are written while still inside the `ActiveRecord::Base.transaction` block. If the transaction rolls back after the writes, the fixture files will contain IDs from a failed transaction, leaving the E2E fixtures in a corrupt state.
**Fix:** Move the `File.write` calls outside the transaction block so they only execute after the database changes have committed successfully.

---

_Reviewed: 2026-07-18T12:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
