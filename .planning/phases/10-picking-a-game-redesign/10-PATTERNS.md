# Phase 10: Picking a Game Redesign - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 14
**Analogs found:** 12 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/graphql/mutations/update_session_details.rb` | mutation | request-response | `app/graphql/mutations/update_session_preferences.rb` | exact |
| `app/contracts/update_session_details_contract.rb` | utility / validation | transform | `app/contracts/schedule_session_contract.rb` | role-match |
| `spec/graphql/update_session_details_mutation_spec.rb` | test | request-response | `spec/graphql/update_session_preferences_mutation_spec.rb` | exact |
| `app/graphql/types/night_session_type.rb` | model / type | transform | `app/graphql/types/night_session_type.rb` | self (extend) |
| `app/frontend/apollo/queries/night_session.graphql` | query | request-response | `app/frontend/apollo/queries/night_session.graphql` | self (extend) |
| `app/frontend/apollo/mutations/update_session_details.graphql` | mutation | request-response | `app/frontend/apollo/mutations/schedule_session.graphql` | role-match |
| `app/frontend/views/NightSessionView.vue` | view / component | request-response | `app/frontend/views/NightSessionView.vue` | self (extend) |
| `app/frontend/components/session/PickingSessionHeader.vue` | component | display | `app/frontend/components/session/SessionSummary.vue` | role-match |
| `app/frontend/components/session/GamePicker.vue` | component | event-driven | `app/frontend/components/session/GamePicker.vue` | self (rewrite) |
| `app/frontend/components/session/SessionDetailsEditor.vue` | component | form | `app/frontend/components/session/SessionEditor.vue` | role-match |
| `app/frontend/components/collection/GameCard.vue` | component | display | `app/frontend/components/collection/GameCard.vue` | self (extend) |
| `tests/e2e/session_lifecycle.spec.ts` | test | end-to-end | `tests/e2e/session_lifecycle.spec.ts` | self (extend) |
| `app/frontend/generated/types.ts` | generated | request-response | `app/frontend/generated/types.ts` | self (regenerate) |
| `app/frontend/generated/operations.ts` | generated | request-response | `app/frontend/generated/operations.ts` | self (regenerate) |

## Pattern Assignments

### `app/graphql/mutations/update_session_details.rb` (mutation, request-response)

**Analogs:** `app/graphql/mutations/update_session_preferences.rb` (host/state guard), `app/graphql/mutations/schedule_session.rb` (datetime parsing + detail update)

**Imports / class signature** (lines 1-9 from `update_session_preferences.rb`):
```ruby
# frozen_string_literal: true

module Mutations
  class UpdateSessionDetails < BaseMutation
    argument :session_id, ID, required: true
    # ... additional detail arguments
    field :session, Types::NightSessionType, null: false
```

**Auth / host / state guard pattern** (lines 11-30 from `update_session_preferences.rb`):
```ruby
def resolve(session_id:)
  raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]

  contract = UpdateSessionDetailsContract.new.call(session_id: session_id, ...)
  raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

  session = NightSession.find_by(id: contract[:session_id])
  raise GraphQL::ExecutionError, "Session not found" unless session

  unless session.host_id == context[:current_user].id
    raise GraphQL::ExecutionError, "You must be the session host to update details"
  end

  unless %w[draft invited picking].include?(session.state)
    raise GraphQL::ExecutionError, "Session details cannot be updated from #{session.state}"
  end

  # ... update
  { session: session }
end
```

**Datetime parsing helper** (lines 78-85 from `schedule_session.rb`):
```ruby
def parse_datetime(value)
  return nil if value.nil?
  return value.to_datetime if value.respond_to?(:to_datetime)

  Time.parse(value).to_datetime
end
```

**Update pattern** (lines 32-35 from `update_session_preferences.rb`, adapted):
```ruby
updates = {}
updates[:title] = contract[:title] if contract[:title]
updates[:description] = contract[:description] if contract.key?(:description)
updates[:scheduled_at] = contract[:scheduled_at] if contract.key?(:scheduled_at)
updates[:location] = contract[:location] if contract.key?(:location)
updates[:capacity] = contract[:capacity] if contract.key?(:capacity)
session.update!(updates)
```

---

### `app/contracts/update_session_details_contract.rb` (utility / validation, transform)

**Analogs:** `app/contracts/schedule_session_contract.rb`, `app/contracts/update_session_preferences_contract.rb`, `app/contracts/application_contract.rb`

**Base class pattern** (lines 1-5 from `application_contract.rb`):
```ruby
# frozen_string_literal: true

class ApplicationContract < Dry::Validation::Contract
  config.messages.backend = :i18n
end
```

**Optional detail fields with limits** (lines 4-11 from `schedule_session_contract.rb`):
```ruby
class ScheduleSessionContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:scheduled_at).maybe(:date_time)
    optional(:location).maybe(:string, max_size?: 200)
    optional(:capacity).maybe(:integer, gt?: 0)
  end
end
```

**Required title + optional description** (add from `create_night_session_contract.rb` style):
```ruby
optional(:title).filled(:string, max_size?: 200)
optional(:description).maybe(:string, max_size?: 2000)
```

**Explicitly exclude preference keys** (no contract analog; document here):
```ruby
# Do NOT accept time_budget_minutes or complexity_preference.
# Those are locked by UpdateSessionPreferencesContract semantics and ADR-012.
```

---

### `spec/graphql/update_session_details_mutation_spec.rb` (test, request-response)

**Analogs:** `spec/graphql/update_session_preferences_mutation_spec.rb`, `spec/graphql/schedule_session_mutation_spec.rb`, `spec/graphql/pick_game_mutation_spec.rb`

**Mutation string + setup** (lines 1-37 from `update_session_preferences_mutation_spec.rb`):
```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "updateSessionDetails mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation UpdateSessionDetails($sessionId: ID!, $title: String, $description: String, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int) {
        updateSessionDetails(sessionId: $sessionId, title: $title, description: $description, scheduledAt: $scheduledAt, location: $location, capacity: $capacity) {
          session {
            id
            title
            description
            state
            scheduledAt
            location
            capacity
          }
        }
      }
    GRAPHQL
  end

  let(:owner) { User.create!(username: "alice", email: "alice@example.com", password: "password") }
  let(:member) { User.create!(username: "bob", email: "bob@example.com", password: "password") }
  let(:group) { Group.create!(name: "Night Owls", owner: owner) }
  let(:context) { { current_user: owner } }

  before do
    GroupMembership.create!(user: owner, group: group, role: "owner")
    GroupMembership.create!(user: member, group: group, role: "member")
  end
```

**Happy path + state matrix** (combine lines 31-58 from `update_session_preferences_mutation_spec.rb` and lines 37-59 from `schedule_session_mutation_spec.rb`):
```ruby
it "updates ordinary details during picking without changing state" do
  session = NightSession.create!(title: "Picking", group: group, host: owner, state: "picking")

  result = BoardgameNightSchema.execute(
    mutation,
    variables: {
      sessionId: session.id.to_s,
      title: "Updated Picking",
      location: "Bob's place",
      capacity: 4
    },
    context: context
  )
  expect(result["errors"]).to be_nil
  data = result.dig("data", "updateSessionDetails", "session")
  expect(data["title"]).to eq("Updated Picking")
  expect(data["location"]).to eq("Bob's place")
  expect(data["capacity"]).to eq(4)
  expect(data["state"]).to eq("PICKING")
  expect(session.reload.state).to eq("picking")
end
```

**Authorization tests** (lines 74-98 from `update_session_preferences_mutation_spec.rb`):
```ruby
it "requires authentication" do
  # execute with context: {}
end

it "requires caller to be the session host" do
  # execute with context: { current_user: member }
end
```

**Rejection of preference keys** (new; no analog):
```ruby
it "rejects time budget and complexity preference arguments" do
  # contract should fail with unknown keys or mutation should omit them
end
```

---

### `app/graphql/types/night_session_type.rb` (model / type, transform)

**Analog:** `app/graphql/types/night_session_type.rb` (self)

**Suggestion fields already present** (lines 17-20):
```ruby
field :time_budget_minutes, Int, null: false
field :complexity_preference, String, null: false
field :suggestions, [ Types::SuggestionType ], null: true
```

**Suggestion resolver** (lines 38-62):
```ruby
def suggestions
  require_authentication!
  raise GraphQL::ExecutionError, "Unauthorized" unless group_member?(context[:current_user])
  return nil unless object.state == "picking"

  attendee_ids = object.attendances.where(response: "going").pluck(:user_id).uniq
  return [] if attendee_ids.empty?

  things = BggThing.merged_for_users(attendee_ids).to_a
  return [] if things.empty?

  thing_ids = things.map(&:id)
  polls = dataloader.with(Loaders::PollsLoader).load_all(thing_ids)
  owners = dataloader.with(Loaders::OwnersLoader).load_all(thing_ids)

  Suggestions::Engine.call(
    session: object,
    things: things,
    attendee_user_ids: attendee_ids,
    attendee_count: attendee_ids.size,
    polls_by_thing: thing_ids.zip(polls).to_h,
    owners_by_thing: thing_ids.zip(owners).to_h
  )
end
```

**No type change needed** unless the planner wants to expose `description` on `NightSessionType` (already exposed at line 7). Suggestions already return `null` outside picking and `[]` when no attendees/games.

---

### `app/frontend/apollo/queries/night_session.graphql` (query, request-response)

**Analog:** `app/frontend/apollo/queries/night_session.graphql` (self)

**Extend with suggestions and preferences** (insert after `pickedGame` block, before `previousState`):
```graphql
timeBudgetMinutes
complexityPreference
suggestions {
  score
  confidence
  reasons
  thing {
    id
    objectid
    name
    thumbnail
    yearPublished
    minPlayers
    maxPlayers
    minPlaytime
    maxPlaytime
    average
    averageWeight
    description
    owners {
      bggUsername
      avatar
    }
  }
}
```

**Note:** `previousState` currently follows `pickedGame`; keep it at the end.

---

### `app/frontend/apollo/mutations/update_session_details.graphql` (mutation, request-response)

**Analog:** `app/frontend/apollo/mutations/schedule_session.graphql`

**Mutation document pattern** (from `schedule_session.graphql` lines 1-24):
```graphql
mutation UpdateSessionDetails($sessionId: ID!, $title: String, $description: String, $scheduledAt: ISO8601DateTime, $location: String, $capacity: Int) {
  updateSessionDetails(sessionId: $sessionId, title: $title, description: $description, scheduledAt: $scheduledAt, location: $location, capacity: $capacity) {
    session {
      id
      title
      description
      state
      scheduledAt
      location
      capacity
      attendeeCount
      host {
        id
        displayName
      }
      group {
        id
        name
      }
      attendances {
        id
        response
        user {
          id
          displayName
        }
      }
      timeBudgetMinutes
      complexityPreference
      suggestions {
        score
        confidence
        reasons
        thing {
          id
          objectid
          name
          thumbnail
          yearPublished
          minPlayers
          maxPlayers
          minPlaytime
          maxPlaytime
          average
          averageWeight
          description
          owners {
            bggUsername
            avatar
          }
        }
      }
    }
  }
}
```

---

### `app/frontend/views/NightSessionView.vue` (view, request-response)

**Analog:** `app/frontend/views/NightSessionView.vue` (self)

**Import new mutation** (line 4 pattern):
```typescript
import { useNightSessionQuery, useScheduleSessionMutation, useStartPickingMutation, useCancelSessionMutation, useReopenSessionMutation, useCurrentUserQuery, useUpdateSessionDetailsMutation } from '@/generated/operations'
```

**Mutation hook pattern** (lines 20-23):
```typescript
const { mutate: updateDetails, loading: updatingDetails, error: updateDetailsError, onDone: onUpdateDetailsDone } = useUpdateSessionDetailsMutation()
```

**Picking branch composition** (lines 212-217):
```vue
<div v-else-if="session.state === 'PICKING'" class="rounded-lg bg-white p-4 shadow-sm">
  <PickingSessionHeader
    :session="session"
    :is-host="isHost"
    @edit-details="showDetailsEditor = true"
  />
  <GamePicker
    :session="session"
    :is-host="isHost"
    @picked="handlePicked"
  />
</div>
```

**Error display pattern** (lines 147-153):
```vue
<div
  v-if="updateDetailsError"
  class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
  role="alert"
>
  {{ updateDetailsError.message }}
</div>
```

---

### `app/frontend/components/session/PickingSessionHeader.vue` (component, display)

**Analogs:** `app/frontend/components/session/SessionSummary.vue` (attendee filtering), `app/frontend/components/common/MemberAvatar.vue` (avatar pattern)

**Going attendee filtering** (lines 17-18 from `SessionSummary.vue`):
```typescript
const goingAttendees = computed(() =>
  props.session.attendances.filter(a => a.response === 'going')
)
```

**Date display pattern** (lines 25-28 from `SessionSummary.vue`):
```typescript
const dateDisplay = computed(() => {
  if (!props.session.scheduledAt) return 'Date TBD'
  return new Date(props.session.scheduledAt as string).toLocaleString()
})
```

**Avatar group with overflow cap** (UI-SPEC D-02: up to 5 at md+, up to 4 below):
```typescript
const MAX_VISIBLE = 5
const visibleAttendees = computed(() => goingAttendees.value.slice(0, MAX_VISIBLE))
const overflowCount = computed(() => Math.max(0, goingAttendees.value.length - MAX_VISIBLE))
```

**Host-only Edit Details trigger** (pattern from `NightSessionView.vue` lines 113-122):
```vue
<button
  v-if="isHost"
  type="button"
  variant="outline"
  @click="emit('edit-details')"
>
  Edit Details
</button>
```

---

### `app/frontend/components/session/GamePicker.vue` (component, event-driven)

**Analog:** `app/frontend/components/session/GamePicker.vue` (self, rewrite)

**What to remove:**
- `useGroupCollectionQuery` and `useCollectionFilters`
- `useFilterStore` / search input
- `isInRange` client filter
- Browse All / empty collection fallback

**What to keep:**
- `usePickGameMutation` import and call (lines 35-48)
- Per-card pending disabled state (lines 112-119)
- `@click.stop` action isolation (line 116)

**Suggested new prop shape**:
```typescript
interface Props {
  session: NightSession
  isHost: boolean
}
```

**Suggestion-driven rendering**:
```typescript
const suggestions = computed(() => session.value.suggestions ?? [])
```

**Pick handler with error-per-card** (adapt lines 43-48):
```typescript
async function handlePick(gameId: string) {
  if (picking.value) return
  await pickGame({ sessionId: props.session.id, gameId })
  emit('picked')
}
```

---

### `app/frontend/components/session/SessionDetailsEditor.vue` (component, form)

**Analog:** `app/frontend/components/session/SessionEditor.vue`

**Form field binding pattern** (lines 42-85 from `SessionEditor.vue`):
```vue
<input id="session-title" v-model="draft.title" type="text" required />
<input id="session-datetime" v-model="draft.scheduledAt" type="datetime-local" />
<input id="session-location" v-model="draft.location" type="text" />
<input id="session-capacity" v-model.number="draft.capacity" type="number" min="1" />
```

**Add description field** (new, after title):
```vue
<div>
  <label for="session-description">Description</label>
  <textarea id="session-description" v-model="draft.description" rows="3" />
</div>
```

**Submit/emit payload** (lines 24-33 from `SessionEditor.vue`):
```typescript
function submit() {
  if (!canSubmit.value) return

  emit('save', {
    sessionId: props.sessionId,
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    scheduledAt: draft.scheduledAt || null,
    location: draft.location.trim() || null,
    capacity: draft.capacity || null
  })
}
```

**Dialog wrapper** (from `Dialog.vue` + `DialogContent.vue`):
```vue
<Dialog v-model:open="open">
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit session details</DialogTitle>
      <DialogDescription>Update the session information. Game preferences stay locked while picking.</DialogDescription>
    </DialogHeader>
    <!-- form -->
    <DialogFooter>
      <Button variant="outline" @click="open = false">Cancel</Button>
      <Button type="submit" :disabled="!canSubmit || loading" :aria-busy="loading">{{ loading ? 'Saving…' : 'Save details' }}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### `app/frontend/components/collection/GameCard.vue` (component, display)

**Analog:** `app/frontend/components/collection/GameCard.vue` (self, extend)

**Optional suggestion prop extension** (add to `Props` at lines 14-28):
```typescript
interface Props {
  // ... existing fields
  score?: number | null
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | null
  reasons?: string[] | null
}
```

**Score/confidence row** (insert after description, before owner avatars):
```vue
<div class="flex items-center gap-2">
  <span class="rounded-full bg-surface-container-high px-2 py-0.5 text-sm font-semibold text-primary">Score {{ score.toFixed(0) }}</span>
  <Badge :variant="confidenceVariant">{{ confidenceLabel }}</Badge>
</div>
```

**Reason chips** (first 3 + disclosure):
```vue
<div class="flex flex-wrap gap-2">
  <span
    v-for="reason in visibleReasons"
    :key="reason"
    class="inline-flex items-center rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant"
  >
    {{ reason }}
  </span>
  <button
    v-if="hasMoreReasons"
    type="button"
    aria-expanded="showAllReasons"
    @click.stop="showAllReasons = !showAllReasons"
  >
    Show more reasons
  </button>
</div>
```

**Preserve existing action slot** (lines 228-230):
```vue
<div v-if="$slots.action" data-slot="game-card-action" class="mt-3" @click.stop>
  <slot name="action" />
</div>
```

**Important:** All existing props must remain optional and default-off so collection usage is unchanged when suggestion props are absent.

---

### `tests/e2e/session_lifecycle.spec.ts` (test, end-to-end)

**Analog:** `tests/e2e/session_lifecycle.spec.ts` (self, extend)

**Existing picking assertion pattern** (lines 49-58):
```typescript
await hostPage.reload()
await expect(hostPage.getByText('1', { exact: true })).toBeVisible({ timeout: 10_000 })
await hostPage.getByRole('button', { name: 'Start picking' }).click()
await expect(hostPage.getByText('PICKING')).toBeVisible({ timeout: 10_000 })
await expect(hostPage.getByText('Pick a game')).toBeVisible()

const wingspanCard = hostPage.locator('article', { has: hostPage.getByRole('heading', { name: 'Wingspan' }) })
await expect(wingspanCard).toBeVisible({ timeout: 10_000 })
await wingspanCard.getByRole('button', { name: 'Pick this game' }).click()
```

**New assertions to add** (after entering PICKING):
```typescript
// Header shows attendee-filtered heading
await expect(hostPage.getByRole('heading', { name: /Game Suggestions \(Filtered for \d+ Players\)/ })).toBeVisible()
await expect(hostPage.getByText('Up to 120 min')).toBeVisible()
await expect(hostPage.getByText('Any complexity')).toBeVisible()
await expect(hostPage.getByRole('button', { name: 'Edit Details' })).toBeVisible()

// Card shows reason chips and score/confidence
await expect(wingspanCard.getByText(/Score \d+/)).toBeVisible()
await expect(wingspanCard.getByText(/Best at \d+ players/)).toBeVisible()

// Host edits details without changing state
await hostPage.getByRole('button', { name: 'Edit Details' }).click()
await hostPage.getByLabel('Session title').fill('Updated Picking Night')
await hostPage.getByRole('button', { name: 'Save details' }).click()
await expect(hostPage.getByRole('heading', { name: 'Updated Picking Night' })).toBeVisible()
await expect(hostPage.getByText('PICKING')).toBeVisible()

// Pick transitions to completed summary
await wingspanCard.getByRole('button', { name: 'Pick this game' }).click()
await expect(hostPage.getByText('COMPLETED')).toBeVisible({ timeout: 10_000 })
await expect(hostPage.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
```

**Non-host guidance assertion** (optional new guest-flow block):
```typescript
await expect(guestPage.getByText('The host will choose the game.')).toBeVisible()
await expect(guestPage.getByRole('button', { name: 'Edit Details' })).not.toBeVisible()
await expect(guestPage.getByRole('button', { name: 'Pick this game' })).not.toBeVisible()
```

---

### Generated schema / client artifacts

**Analogs:** `schema.graphql`, `schema.json`, `app/frontend/generated/types.ts`, `app/frontend/generated/operations.ts`

**Publication command chain** (from `package.json` line 6 and prior phase plans):
```bash
bin/rails graphql:schema:dump
npm run codegen
npm run build
```

**Generated type shapes already present** (from `app/frontend/generated/types.ts`):
```typescript
export type Suggestion = {
  __typename?: 'Suggestion';
  breakdown: SuggestionBreakdown;
  confidence: ConfidenceLevel;
  reasons: Array<Scalars['String']['output']>;
  score: Scalars['Float']['output'];
  thing: MergedThing;
};

export type NightSession = {
  // ...
  timeBudgetMinutes: Scalars['Int']['output'];
  complexityPreference: Scalars['String']['output'];
  suggestions?: Maybe<Array<Suggestion>>;
};
```

After adding `updateSessionDetails` mutation, codegen will produce:
```typescript
export function useUpdateSessionDetailsMutation(options: ...) { ... }
```
matching the pattern at `app/frontend/generated/operations.ts` lines 656-658.

---

## Shared Patterns

### Authentication
**Source:** `app/graphql/mutations/update_session_preferences.rb` lines 11-12, `app/graphql/types/night_session_type.rb` lines 66-70
**Apply to:** All backend mutations and suggestion resolver
```ruby
raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]
```

### Host-Only Authorization
**Source:** `app/graphql/mutations/pick_game.rb` lines 19-21, `app/graphql/mutations/update_session_preferences.rb` lines 24-26
**Apply to:** `updateSessionDetails`, `pickGame`, and any host-only UI controls
```ruby
unless session.host_id == context[:current_user].id
  raise GraphQL::ExecutionError, "You must be the session host to ..."
end
```

### State Guard Pattern
**Source:** `app/graphql/mutations/update_session_preferences.rb` lines 28-30, `app/models/night_session.rb` lines 20-38
**Apply to:** `updateSessionDetails` and any session-transition mutation
```ruby
unless %w[draft invited picking].include?(session.state)
  raise GraphQL::ExecutionError, "Session details cannot be updated from #{session.state}"
end
```

### Contract Validation
**Source:** `app/contracts/update_session_preferences_contract.rb` lines 1-15, `app/contracts/application_contract.rb` lines 1-5
**Apply to:** `UpdateSessionDetailsContract`
```ruby
class UpdateSessionDetailsContract < ApplicationContract
  params do
    required(:session_id).filled(:string)
    optional(:title).filled(:string, max_size?: 200)
    # ...
  end
end
```

### GraphQL Error Handling
**Source:** `app/graphql/mutations/pick_game.rb` lines 14, 17, 20, 23-25, 30-33
**Apply to:** All new mutations
```ruby
raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?
raise GraphQL::ExecutionError, "Session not found" unless session
raise GraphQL::ExecutionError, "..." unless condition
```

### Apollo Mutation Hook Pattern
**Source:** `app/frontend/views/NightSessionView.vue` lines 20-23, `app/frontend/generated/operations.ts` lines 656-658
**Apply to:** `useUpdateSessionDetailsMutation`, `usePickGameMutation`
```typescript
const { mutate, loading, error, onDone } = useXxxMutation()
```

### Apollo-as-Source-of-Truth State Transition
**Source:** `app/frontend/views/NightSessionView.vue` lines 78-80
**Apply to:** Picking flow
```typescript
function handlePicked() {
  // Apollo cache updates via mutation result; no manual refetch needed
}
```

### Dialog / Sheet Pattern
**Source:** `app/frontend/components/ui/dialog/Dialog.vue` and `DialogContent.vue`
**Apply to:** Edit Details dialog
```vue
<Dialog v-model:open="open">
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    <DialogFooter>...</DialogFooter>
  </DialogContent>
</Dialog>
```

### M3 Button / Badge Variants
**Source:** `app/frontend/components/ui/button/index.ts` lines 6-29, `app/frontend/components/ui/badge/index.ts` lines 6-22
**Apply to:** Pick action, Edit Details, confidence badges, status badges
- Primary CTA: `variant="primary"`
- Edit Details: `variant="outline"`
- Confidence High: `variant="completed"`
- Confidence Medium: `variant="invited"`
- Confidence Low: `variant="draft"`
- Picking status: `variant="picking"`

### Card Action Isolation
**Source:** `app/frontend/components/collection/GameCard.vue` lines 92-96, 228-230
**Apply to:** Suggestion card pick button
```typescript
function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-slot="game-card-action"]')) return
  openBgg()
}
```

### E2E Fixture Backup / Restore
**Source:** `tests/e2e/playwright.config.ts` (global-setup points to `bin/e2e-seed`), `lib/tasks/e2e.rake` (rewrites JSON), Phase 09 plans
**Apply to:** Every `npm run e2e` invocation during this phase
```bash
tmp="/var/folders/yr/v0ygzpgd79b5pr9vlt83fswc0000gn/T/phase10-e2e-fixtures"
mkdir -p "$tmp"
cp tests/e2e/fixtures/e2e_group.json "$tmp/e2e_group.json"
cp tests/e2e/fixtures/e2e_session.json "$tmp/e2e_session.json"
trap 'cp "$tmp/e2e_group.json" tests/e2e/fixtures/e2e_group.json; cp "$tmp/e2e_session.json" tests/e2e/fixtures/e2e_session.json' EXIT
npm run e2e -- tests/e2e/session_lifecycle.spec.ts
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/frontend/components/session/PickingSessionHeader.vue` (new) | component | display | No dedicated picking header exists; compose from `SessionSummary`, `MemberAvatar`, and `Badge` |
| `app/frontend/components/session/SessionDetailsEditor.vue` (new) | component | form | No separate details-only editor exists; `SessionEditor.vue` is the closest analog |

## Metadata

**Analog search scope:**
- `app/graphql/mutations/*.rb`
- `app/graphql/types/*.rb`
- `app/contracts/*.rb`
- `app/frontend/views/*.vue`
- `app/frontend/components/session/*.vue`
- `app/frontend/components/collection/*.vue`
- `app/frontend/components/common/*.vue`
- `app/frontend/apollo/queries/*.graphql`
- `app/frontend/apollo/mutations/*.graphql`
- `app/frontend/stores/*.ts`
- `app/frontend/composables/*.ts`
- `app/frontend/components/ui/**`
- `tests/e2e/*.ts`
- `lib/tasks/e2e.rake`

**Files scanned:** 40+
**Pattern extraction date:** 2026-07-18
