# Phase 04: Auth + Friend Groups + Session Lifecycle — Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 63
**Analogs found:** 58 / 63

## File Classification

### Models & Backend Services

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/models/user.rb` | model | CRUD | `app/models/user.rb` (extend) | exact |
| `app/models/session.rb` (auth) | model | CRUD | `app/models/user.rb` | role-match |
| `app/models/current.rb` | model/provider | request-response | `app/controllers/graphql_controller.rb` | partial |
| `app/models/concerns/authentication.rb` | concern | request-response | `app/models/user.rb` | partial |
| `app/models/group.rb` | model | CRUD | `app/models/user.rb` | role-match |
| `app/models/group_membership.rb` | model | CRUD | `app/models/bgg_collection.rb` | role-match |
| `app/models/night_session.rb` | model | CRUD | `app/models/user.rb` | role-match |
| `app/models/attendance.rb` | model | CRUD | `app/models/bgg_collection.rb` | role-match |
| `app/models/invite_token.rb` | model | CRUD | `app/models/user.rb` | role-match |
| `app/controllers/graphql_controller.rb` | controller | request-response | `app/controllers/graphql_controller.rb` | exact |
| `app/controllers/sessions_controller.rb` | controller | request-response | `app/controllers/graphql_controller.rb` | role-match |
| `app/mailers/invite_mailer.rb` | mailer | event-driven | `app/mailers/application_mailer.rb` | role-match |
| `app/jobs/invite_mailer_job.rb` | job | event-driven | `app/jobs/bgg/import_collection_job.rb` | role-match |
| `app/views/invite_mailer/*` | view | event-driven | `app/mailers/application_mailer.rb` | partial |
| `config/initializers/rack_attack.rb` | middleware/config | request-response | `config/initializers/cors.rb` (if exists) | none |
| `config/initializers/dry_rails.rb` | config | bootstrap | `app/contracts/application_contract.rb` | partial |

### GraphQL Layer

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/graphql/types/user_type.rb` | type | request-response | `app/graphql/types/user_type.rb` | exact |
| `app/graphql/types/group_type.rb` | type | request-response | `app/graphql/types/merged_collection_type.rb` | role-match |
| `app/graphql/types/night_session_type.rb` | type | request-response | `app/graphql/types/user_type.rb` | role-match |
| `app/graphql/types/session_invite_type.rb` | type | request-response | `app/graphql/types/validation_result_type.rb` | role-match |
| `app/graphql/types/session_state_enum.rb` | enum | request-response | `app/graphql/types/sync_status_enum.rb` | exact |
| `app/graphql/types/group_role_enum.rb` | enum | request-response | `app/graphql/types/sync_status_enum.rb` | exact |
| `app/graphql/types/attendance_type.rb` | type | request-response | `app/graphql/types/owner_type.rb` | role-match |
| `app/graphql/types/query_type.rb` | type | request-response | `app/graphql/types/query_type.rb` | exact |
| `app/graphql/types/mutation_type.rb` | type | request-response | `app/graphql/types/mutation_type.rb` | exact |
| `app/graphql/boardgame_night_schema.rb` | schema | request-response | `app/graphql/boardgame_night_schema.rb` | exact |
| `app/graphql/mutations/sign_up.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/sign_in.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/sign_out.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/bind_bgg_username.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/create_group.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/invite_to_group.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/accept_group_invite.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/create_night_session.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/schedule_session.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/start_picking.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/pick_game.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/cancel_session.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/reopen_session.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/rsvp.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |
| `app/graphql/mutations/upgrade_to_account.rb` | mutation | request-response | `app/graphql/mutations/import_collection.rb` | role-match |

### Validation Contracts

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/contracts/sign_up_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |
| `app/contracts/sign_in_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |
| `app/contracts/bind_bgg_username_contract.rb` | contract | validation | `app/contracts/validate_bgg_username_contract.rb` | exact |
| `app/contracts/create_group_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |
| `app/contracts/invite_to_group_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |
| `app/contracts/accept_group_invite_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |
| `app/contracts/session_state_transition_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |
| `app/contracts/rsvp_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |
| `app/contracts/upgrade_to_account_contract.rb` | contract | validation | `app/contracts/import_collection_contract.rb` | role-match |

### Frontend — Views

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/frontend/views/LoginView.vue` | view | request-response | `app/frontend/views/HomeView.vue` | role-match |
| `app/frontend/views/SignupView.vue` | view | request-response | `app/frontend/views/HomeView.vue` | role-match |
| `app/frontend/views/GroupsView.vue` | view | request-response | `app/frontend/views/CollectionView.vue` | role-match |
| `app/frontend/views/GroupView.vue` | view | request-response | `app/frontend/views/CollectionView.vue` | role-match |
| `app/frontend/views/NightSessionView.vue` | view | request-response | `app/frontend/views/CollectionView.vue` | role-match |
| `app/frontend/views/AccountView.vue` | view | request-response | `app/frontend/views/HomeView.vue` | role-match |
| `app/frontend/views/InviteView.vue` | view | request-response | `app/frontend/views/HomeView.vue` | role-match |

### Frontend — Components

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/frontend/components/auth/LoginForm.vue` | component | request-response | `app/frontend/components/landing/UsernameForm.vue` | role-match |
| `app/frontend/components/auth/SignupForm.vue` | component | request-response | `app/frontend/components/landing/UsernameForm.vue` | role-match |
| `app/frontend/components/group/GroupList.vue` | component | request-response | `app/frontend/components/collection/GameGrid.vue` | role-match |
| `app/frontend/components/group/GroupDetail.vue` | component | request-response | `app/frontend/components/collection/GameGrid.vue` | role-match |
| `app/frontend/components/session/SessionEditor.vue` | component | request-response | `app/frontend/components/landing/UsernameForm.vue` | role-match |
| `app/frontend/components/session/RsvpDashboard.vue` | component | request-response | `app/frontend/components/collection/CollectionFilters.vue` | role-match |
| `app/frontend/components/session/GamePicker.vue` | component | request-response | `app/frontend/views/CollectionView.vue` | role-match |
| `app/frontend/components/session/SessionSummary.vue` | component | request-response | `app/frontend/components/collection/GameCard.vue` | role-match |
| `app/frontend/components/layout/AppShell.vue` | component | request-response | `app/frontend/components/layout/AppShell.vue` | exact |
| `app/frontend/components/layout/AppHeader.vue` | component | request-response | `app/frontend/components/layout/AppHeader.vue` | exact |

### Frontend — State & Composables

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/frontend/stores/auth.ts` | store | request-response | `app/frontend/stores/collectors.ts` | role-match |
| `app/frontend/stores/sessionDraft.ts` | store | request-response | `app/frontend/stores/filters.ts` | role-match |
| `app/frontend/stores/groupDraft.ts` | store | request-response | `app/frontend/stores/filters.ts` | role-match |
| `app/frontend/composables/useAuth.ts` | composable | request-response | `app/frontend/composables/useRefreshCollection.ts` | role-match |
| `app/frontend/composables/useGroupCollection.ts` | composable | request-response | `app/frontend/composables/useCollectionFilters.ts` | role-match |
| `app/frontend/apollo/client.ts` | client | request-response | `app/frontend/apollo/client.ts` | exact |
| `app/frontend/router/index.ts` | router | request-response | `app/frontend/router/index.ts` | exact |

### Frontend — GraphQL Operations

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/frontend/apollo/mutations/sign_up.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/sign_in.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/sign_out.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/bind_bgg_username.graphql` | operation | request-response | `app/frontend/apollo/mutations/validate_bgg_username.graphql` | role-match |
| `app/frontend/apollo/mutations/create_group.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/invite_to_group.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/accept_group_invite.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/create_night_session.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/schedule_session.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/start_picking.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/pick_game.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/cancel_session.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/reopen_session.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/rsvp.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/mutations/upgrade_to_account.graphql` | operation | request-response | `app/frontend/apollo/mutations/import_collection.graphql` | role-match |
| `app/frontend/apollo/queries/current_user.graphql` | operation | request-response | `app/frontend/apollo/queries/user.graphql` | role-match |
| `app/frontend/apollo/queries/my_groups.graphql` | operation | request-response | `app/frontend/apollo/queries/merged_collection.graphql` | role-match |
| `app/frontend/apollo/queries/group.graphql` | operation | request-response | `app/frontend/apollo/queries/merged_collection.graphql` | role-match |
| `app/frontend/apollo/queries/night_session.graphql` | operation | request-response | `app/frontend/apollo/queries/merged_collection.graphql` | role-match |

### Database Migrations

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `db/migrate/*_create_sessions.rb` (auth) | migration | schema | `db/migrate/20260703000000_create_users.rb` | role-match |
| `db/migrate/*_add_provisional_and_invite_token_to_users.rb` | migration | schema | `db/migrate/20260707000002_add_bgg_avatar_url_to_users.rb` | role-match |
| `db/migrate/*_create_groups.rb` | migration | schema | `db/migrate/20260703000000_create_users.rb` | role-match |
| `db/migrate/*_create_group_memberships.rb` | migration | schema | `db/migrate/20260703000002_create_bgg_collections.rb` | role-match |
| `db/migrate/*_create_night_sessions.rb` | migration | schema | `db/migrate/20260703000000_create_users.rb` | role-match |
| `db/migrate/*_create_attendances.rb` | migration | schema | `db/migrate/20260703000002_create_bgg_collections.rb` | role-match |
| `db/migrate/*_create_invite_tokens.rb` | migration | schema | `db/migrate/20260703000000_create_users.rb` | role-match |

### Tests

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `spec/models/user_spec.rb` | test | test | `spec/models/user_spec.rb` | exact |
| `spec/models/session_spec.rb` | test | test | `spec/models/user_spec.rb` | role-match |
| `spec/models/group_spec.rb` | test | test | `spec/models/user_spec.rb` | role-match |
| `spec/models/group_membership_spec.rb` | test | test | `spec/models/bgg_collection_spec.rb` | role-match |
| `spec/models/night_session_spec.rb` | test | test | `spec/models/user_spec.rb` | role-match |
| `spec/models/attendance_spec.rb` | test | test | `spec/models/bgg_collection_spec.rb` | role-match |
| `spec/models/invite_token_spec.rb` | test | test | `spec/models/user_spec.rb` | role-match |
| `spec/graphql/sign_up_mutation_spec.rb` | test | test | `spec/graphql/import_collection_mutation_spec.rb` | role-match |
| `spec/graphql/sign_in_mutation_spec.rb` | test | test | `spec/graphql/import_collection_mutation_spec.rb` | role-match |
| `spec/graphql/create_group_mutation_spec.rb` | test | test | `spec/graphql/import_collection_mutation_spec.rb` | role-match |
| `spec/graphql/create_night_session_mutation_spec.rb` | test | test | `spec/graphql/import_collection_mutation_spec.rb` | role-match |
| `spec/graphql/group_query_spec.rb` | test | test | `spec/graphql/merged_collection_query_spec.rb` | role-match |
| `spec/frontend/LoginView.spec.ts` | test | test | `spec/frontend/Sidebar.spec.ts` | role-match |
| `spec/frontend/authStore.spec.ts` | test | test | `spec/frontend/collectorsStore.spec.ts` | role-match |

## Pattern Assignments

### `app/models/user.rb` (model, CRUD) — **MODIFY**

**Analog:** `app/models/user.rb` (same file)

**Existing pattern** (lines 1-10):
```ruby
# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
end
```

**What to copy for extension:**
- `has_secure_password` already present; keep it.
- Add `provisional` boolean and `invite_token` string via migration, then model validation:
  ```ruby
  validates :provisional, inclusion: { in: [true, false] }
  validates :invite_token, uniqueness: true, allow_nil: true
  ```
- Add group associations alongside existing collection associations:
  ```ruby
  has_many :group_memberships, dependent: :destroy
  has_many :groups, through: :group_memberships
  has_many :owned_groups, class_name: 'Group', foreign_key: :owner_id, dependent: :destroy
  has_many :attendances, dependent: :destroy
  has_many :night_sessions, through: :attendances
  ```
- Add `display_name` method (no-argument) for `UserType.displayName`.

---

### `app/models/session.rb` (auth Session) (model, CRUD) — **NEW**

**Analog:** `app/models/user.rb`

**Existing pattern** (lines 1-10):
```ruby
# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
end
```

**What to copy:**
- Use `has_secure_token :token` (Rails 8 generator style) or `has_secure_token` for bearer token.
- Add `belongs_to :user` and expiration scopes:
  ```ruby
  belongs_to :user
  has_secure_token :token
  validates :user, presence: true
  scope :active, -> { where('expires_at > ?', Time.current) }
  ```

---

### `app/models/current.rb` (model/provider, request-response) — **NEW**

**Analog:** `app/controllers/graphql_controller.rb` (partial — it currently builds an empty context)

**Existing pattern** (lines 9-19, 22-30):
```ruby
def execute
  if params[:_json]
    queries = params[:_json].map do |param|
      {
        query: param[:query],
        operation_name: param[:operationName],
        variables: ensure_hash(param[:variables]),
        context: {}
      }
    end
    result = BoardgameNightSchema.multiplex(queries)
  else
    variables = ensure_hash(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]
    context = {}
    result = BoardgameNightSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
  end
```

**What to copy:**
- `Current` is a thread-local attribute container. Pattern from Rails generator:
  ```ruby
  class Current < ActiveSupport::CurrentAttributes
    attribute :session, :user
  end
  ```
- Set `Current.user` from the Authentication concern before `BoardgameNightSchema.execute` and reset after.

---

### `app/models/concerns/authentication.rb` (concern, request-response) — **NEW**

**Analog:** `app/controllers/graphql_controller.rb` + `app/models/user.rb`

**Existing pattern** for controller context (lines 9-19, 22-30):
```ruby
context = {}
result = BoardgameNightSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
```

**What to copy:**
- Concern to include in `ApplicationController`/`GraphqlController`:
  ```ruby
  module Authentication
    extend ActiveSupport::Concern

    included do
      before_action :authenticate
    end

    private

    def authenticate
      token = request.headers['Authorization']&.remove(/\ABearer\s+/i)
      session = Session.active.find_by(token: token)
      Current.session = session
      Current.user = session&.user
    end
  end
  ```

---

### `app/models/group.rb` (model, CRUD) — **NEW**

**Analog:** `app/models/user.rb`

**Existing pattern** (lines 1-10):
```ruby
class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
end
```

**What to copy:**
- Owner/belonging pattern:
  ```ruby
  belongs_to :owner, class_name: 'User'
  has_many :group_memberships, dependent: :destroy
  has_many :members, through: :group_memberships, source: :user
  has_many :night_sessions, dependent: :destroy
  has_many :invite_tokens, dependent: :destroy

  validates :name, presence: true
  validates :invite_code, uniqueness: true, allow_nil: true
  ```

---

### `app/models/group_membership.rb` (model, CRUD) — **NEW**

**Analog:** `app/models/bgg_collection.rb`

**Existing pattern** (lines 1-9):
```ruby
class BggCollection < ApplicationRecord
  belongs_to :user
  belongs_to :bgg_thing

  validates :user_id, uniqueness: { scope: :bgg_thing_id }
  validates :quantity, numericality: { greater_than_or_equal_to: 1 }
end
```

**What to copy:**
- Join-table uniqueness validation:
  ```ruby
  class GroupMembership < ApplicationRecord
    belongs_to :user
    belongs_to :group

    validates :user_id, uniqueness: { scope: :group_id }
    validates :role, presence: true
    validate :user_must_not_be_provisional
  end
  ```

---

### `app/models/night_session.rb` (model, CRUD) — **NEW**

**Naming note:** CONTEXT.md says "New models: Group, GroupMembership, Session, Attendance, InviteToken." The Rails 8 auth generator also produces a `Session` model. To avoid a class-name collision, the boardgame-night session should be implemented as `app/models/night_session.rb` with class `NightSession` and GraphQL type `SessionType` (mapped explicitly). The planner should confirm this rename.

**Analog:** `app/models/user.rb`

**Existing pattern** (lines 1-10):
```ruby
class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
end
```

**What to copy:**
- State-machine + host associations:
  ```ruby
  class NightSession < ApplicationRecord
    belongs_to :group
    belongs_to :host, class_name: 'User'
    has_many :attendances, dependent: :destroy
    has_many :attendees, through: :attendances, source: :user

    validates :state, presence: true, inclusion: { in: %w[draft invited picking completed] }
    validates :group, presence: true
    validates :host, presence: true
  end
  ```

---

### `app/models/attendance.rb` (model, CRUD) — **NEW**

**Analog:** `app/models/bgg_collection.rb`

**Existing pattern** (lines 1-9):
```ruby
class BggCollection < ApplicationRecord
  belongs_to :user
  belongs_to :bgg_thing

  validates :user_id, uniqueness: { scope: :bgg_thing_id }
  validates :quantity, numericality: { greater_than_or_equal_to: 1 }
end
```

**What to copy:**
- Join-table with enum-ish string:
  ```ruby
  class Attendance < ApplicationRecord
    belongs_to :night_session
    belongs_to :user

    validates :user_id, uniqueness: { scope: :night_session_id }
    validates :response, presence: true, inclusion: { in: %w[going not_going] }
  end
  ```

---

### `app/models/invite_token.rb` (model, CRUD) — **NEW**

**Analog:** `app/models/user.rb`

**Existing pattern** (lines 1-10):
```ruby
class User < ApplicationRecord
  has_secure_password
  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
end
```

**What to copy:**
- Token digest + status pattern:
  ```ruby
  class InviteToken < ApplicationRecord
    belongs_to :group
    belongs_to :inviter, class_name: 'User'
    belongs_to :accepted_by, class_name: 'User', optional: true
    belongs_to :night_session, optional: true

    validates :email, presence: true
    validates :token_digest, presence: true, uniqueness: true
    validates :status, presence: true, inclusion: { in: %w[pending accepted rsvped expired] }
    validates :role, inclusion: { in: %w[member admin] }, allow_nil: true
  end
  ```

---

### `app/controllers/graphql_controller.rb` (controller, request-response) — **MODIFY**

**Analog:** `app/controllers/graphql_controller.rb`

**Existing pattern** (lines 9-30):
```ruby
def execute
  if params[:_json]
    queries = params[:_json].map do |param|
      {
        query: param[:query],
        operation_name: param[:operationName],
        variables: ensure_hash(param[:variables]),
        context: {}
      }
    end
    result = BoardgameNightSchema.multiplex(queries)
    render json: result
  else
    variables = ensure_hash(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]
    context = {}
    result = BoardgameNightSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
    render json: result
  end
```

**What to copy for auth context:**
- Replace `context: {}` with:
  ```ruby
  context: {
    current_user: Current.user,
    current_session: Current.session
  }
  ```
- Add `include Authentication` at the top of the class.

---

### `app/controllers/sessions_controller.rb` (controller, request-response) — **NEW**

**Analog:** `app/controllers/graphql_controller.rb`

**Existing pattern** for JSON response (lines 34-37):
```ruby
rescue StandardError => e
  logger.error "[GraphqlController] #{e.message}"
  render json: {
    errors: [{ message: "Internal server error" }],
    data: {}
  }, status: 500
end
```

**What to copy:**
- JSON-only API controller inheriting from `ApplicationController`:
  ```ruby
  class SessionsController < ApplicationController
    include Authentication
    skip_before_action :authenticate, only: [:create]

    def create
      user = User.find_by(email: params[:email])
      if user&.authenticate(params[:password])
        session = user.sessions.create!(expires_at: 30.days.from_now)
        render json: { token: session.token, user: { ... } }
      else
        render json: { errors: [{ message: 'Invalid credentials' }] }, status: :unauthorized
      end
    end

    def destroy
      Current.session&.destroy
      head :no_content
    end
  end
  ```

---

### `app/graphql/types/user_type.rb` (type, request-response) — **MODIFY**

**Analog:** `app/graphql/types/user_type.rb`

**Existing pattern** (lines 1-34):
```ruby
module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :username, String, null: false
    field :avatar, String, null: true
    field :sync_status, Types::UserSyncStatusType, null: false

    def avatar
      object.bgg_avatar_url
    end

    def sync_status
      status = if context[:sync_status_for_username] == object.bgg_username
                 "QUEUED"
               elsif object.bgg_collections.any?
                 "READY"
               else
                 "QUEUED"
               end

      SyncStatus.new(
        username: object.bgg_username,
        status: status,
        last_synced_at: object.last_synced_at,
        error: nil,
        game_count: object.bgg_collections.count
      )
    end

    SyncStatus = Struct.new(:username, :status, :last_synced_at, :error, :game_count, keyword_init: true)
  end
end
```

**What to copy for extension:**
- Add `isProvisional` and `displayName` fields using resolver methods:
  ```ruby
  field :is_provisional, Boolean, null: false
  field :display_name, String, null: false
  field :email, String, null: true
  field :bgg_username, String, null: true

  def is_provisional
    object.provisional?
  end

  def display_name
    object.display_name
  end
  ```

---

### `app/graphql/types/group_type.rb` (type, request-response) — **NEW**

**Analog:** `app/graphql/types/merged_collection_type.rb`

**Existing pattern** (lines 1-8):
```ruby
module Types
  class MergedCollectionType < Types::BaseObject
    field :items, [Types::MergedThingType], null: false
    field :sync_statuses, [Types::UserSyncStatusType], null: false
  end
end
```

**What to copy:**
- Composite type with Dataloader-backed fields:
  ```ruby
  module Types
    class GroupType < Types::BaseObject
      field :id, ID, null: false
      field :name, String, null: false
      field :invite_code, String, null: true
      field :owner, Types::UserType, null: false
      field :members, [Types::UserType], null: false
      field :collection, Types::MergedCollectionType, null: false

      def collection
        {
          items: BggThing.merged_for_users(object.member_ids),
          sync_statuses: object.members.map { |u| ... }
        }
      end
    end
  end
  ```

---

### `app/graphql/types/night_session_type.rb` (type, request-response) — **NEW**

**Analog:** `app/graphql/types/user_type.rb`

**Existing pattern** (lines 1-34):
```ruby
module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :username, String, null: false
    field :avatar, String, null: true
    field :sync_status, Types::UserSyncStatusType, null: false
  end
end
```

**What to copy:**
- State-machine type with enum:
  ```ruby
  module Types
    class NightSessionType < Types::BaseObject
      field :id, ID, null: false
      field :state, Types::SessionStateEnum, null: false
      field :host, Types::UserType, null: false
      field :group, Types::GroupType, null: false
      field :scheduled_at, GraphQL::Types::ISO8601DateTime, null: true
      field :attendances, [Types::AttendanceType], null: false
      field :picked_game, Types::MergedThingType, null: true
    end
  end
  ```

---

### `app/graphql/types/session_state_enum.rb` (enum, request-response) — **NEW**

**Analog:** `app/graphql/types/sync_status_enum.rb`

**Existing pattern** (lines 1-12):
```ruby
module Types
  class SyncStatusEnum < Types::BaseEnum
    graphql_name "SyncStatus"

    value "QUEUED", "Import is queued and waiting to start"
    value "SYNCING", "Import is in progress"
    value "READY", "Import completed successfully"
    value "ERROR", "Import failed"
  end
end
```

**What to copy:**
```ruby
module Types
  class SessionStateEnum < Types::BaseEnum
    graphql_name "SessionState"

    value "DRAFT", "Session is being edited"
    value "INVITED", "Invitations sent, RSVPs open"
    value "PICKING", "Host is picking a game"
    value "COMPLETED", "Game picked and session finalized"
  end
end
```

---

### `app/graphql/types/group_role_enum.rb` (enum, request-response) — **NEW**

**Analog:** `app/graphql/types/sync_status_enum.rb`

**Existing pattern** (lines 1-12):
```ruby
module Types
  class SyncStatusEnum < Types::BaseEnum
    graphql_name "SyncStatus"

    value "QUEUED", "Import is queued and waiting to start"
    value "SYNCING", "Import is in progress"
    value "READY", "Import completed successfully"
    value "ERROR", "Import failed"
  end
end
```

**What to copy:**
```ruby
module Types
  class GroupRoleEnum < Types::BaseEnum
    graphql_name "GroupRole"

    value "MEMBER", "Regular group member"
    value "ADMIN", "Group administrator"
  end
end
```

---

### `app/graphql/types/attendance_type.rb` (type, request-response) — **NEW**

**Analog:** `app/graphql/types/owner_type.rb`

**Existing pattern** (lines 1-16):
```ruby
module Types
  class OwnerType < Types::BaseObject
    field :bgg_username, String, null: false
    field :avatar, String, null: true

    def bgg_username
      object.user.bgg_username
    end

    def avatar
      object.user.bgg_avatar_url
    end
  end
end
```

**What to copy:**
```ruby
module Types
  class AttendanceType < Types::BaseObject
    field :user, Types::UserType, null: false
    field :response, String, null: false
    field :responded_at, GraphQL::Types::ISO8601DateTime, null: true

    def response
      object.response
    end
  end
end
```

---

### `app/graphql/types/session_invite_type.rb` (type, request-response) — **NEW**

**Analog:** `app/graphql/types/validation_result_type.rb`

**Existing pattern** (lines 1-10):
```ruby
module Types
  class ValidationResultType < Types::BaseObject
    field :valid, Boolean, null: false, description: "Whether the input passed the format contract."
    field :username, String, null: false, description: "The normalized username that was validated."
    field :exists, Boolean, null: false, description: "Whether the username exists on BoardGameGeek."
    field :avatar, String, null: true, description: "Avatar URL for the BGG user, if present."
  end
end
```

**What to copy:**
```ruby
module Types
  class SessionInviteType < Types::BaseObject
    field :token, String, null: false, description: "Public token fragment for the magic link."
    field :status, String, null: false
    field :email, String, null: true
    field :expires_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

---

### `app/graphql/types/query_type.rb` (type, request-response) — **MODIFY**

**Analog:** `app/graphql/types/query_type.rb`

**Existing pattern** (lines 10-38):
```ruby
field :merged_collection, Types::MergedCollectionType, null: false, description: "Merge and deduplicate the BGG collections for the given usernames." do
  argument :usernames, [String], required: true, description: "BGG usernames whose collections should be merged."
end

field :user, Types::UserType, null: true, description: "Look up a local user by their BGG username." do
  argument :username, String, required: true, description: "BGG username to look up."
end

def merged_collection(usernames:)
  users = User.where(bgg_username: usernames)
  {
    items: BggThing.merged_for_bgg_usernames(usernames),
    sync_statuses: usernames.map { |username| sync_status_for(username, users) }
  }
end

def user(username:)
  User.find_by(bgg_username: username)
end
```

**What to copy for new fields:**
- Add authenticated root fields and reuse existing `MergedCollection` pattern for group collection:
  ```ruby
  field :current_user, Types::UserType, null: true
  field :my_groups, [Types::GroupType], null: false
  field :group, Types::GroupType, null: true do
    argument :token, String, required: true
  end
  field :night_session, Types::NightSessionType, null: true do
    argument :id, ID, required: true
  end

  def current_user
    context[:current_user]
  end

  def my_groups
    context[:current_user]&.groups || []
  end

  def group(token:)
    Group.find_by(invite_code: token) || context[:current_user]&.groups&.find_by(token: token)
  end
  ```

---

### `app/graphql/types/mutation_type.rb` (type, request-response) — **MODIFY**

**Analog:** `app/graphql/types/mutation_type.rb`

**Existing pattern** (lines 1-8):
```ruby
module Types
  class MutationType < Types::BaseObject
    field :import_collection, mutation: Mutations::ImportCollection, description: "Enqueue a BGG collection import for a username and return the user with initial sync status."
    field :validate_bgg_username, mutation: Mutations::ValidateBggUsername, description: "Validate a BGG username format and existence."
  end
end
```

**What to copy:**
- Add one `field` per new mutation class:
  ```ruby
  field :sign_up, mutation: Mutations::SignUp
  field :sign_in, mutation: Mutations::SignIn
  field :sign_out, mutation: Mutations::SignOut
  field :bind_bgg_username, mutation: Mutations::BindBggUsername
  field :create_group, mutation: Mutations::CreateGroup
  field :invite_to_group, mutation: Mutations::InviteToGroup
  field :accept_group_invite, mutation: Mutations::AcceptGroupInvite
  field :create_night_session, mutation: Mutations::CreateNightSession
  field :schedule_session, mutation: Mutations::ScheduleSession
  field :start_picking, mutation: Mutations::StartPicking
  field :pick_game, mutation: Mutations::PickGame
  field :cancel_session, mutation: Mutations::CancelSession
  field :reopen_session, mutation: Mutations::ReopenSession
  field :rsvp, mutation: Mutations::Rsvp
  field :upgrade_to_account, mutation: Mutations::UpgradeToAccount
  ```

---

### `app/graphql/boardgame_night_schema.rb` (schema, request-response) — **MODIFY**

**Analog:** `app/graphql/boardgame_night_schema.rb`

**Existing pattern** (lines 10-20):
```ruby
orphan_types(
  Types::ThingType,
  Types::MergedThingType,
  Types::MergedCollectionType,
  Types::OwnerType,
  Types::UserType,
  Types::UserSyncStatusType,
  Types::HotItemType,
  Types::SearchResultType,
  Types::ValidationResultType
)
```

**What to copy:**
- Register new types as orphan types so codegen picks them up:
  ```ruby
  orphan_types(
    Types::ThingType,
    Types::MergedThingType,
    Types::MergedCollectionType,
    Types::OwnerType,
    Types::UserType,
    Types::UserSyncStatusType,
    Types::HotItemType,
    Types::SearchResultType,
    Types::ValidationResultType,
    Types::GroupType,
    Types::NightSessionType,
    Types::SessionInviteType,
    Types::AttendanceType
  )
  ```
- Enums are reachable via fields and do not need orphan registration.

---

### `app/graphql/mutations/import_collection.rb` (mutation, request-response) — **ANALOG FOR ALL NEW MUTATIONS**

**Analog:** `app/graphql/mutations/import_collection.rb`

**Existing pattern** (lines 1-33):
```ruby
module Mutations
  class ImportCollection < BaseMutation
    argument :username, String, required: true, description: "BGG username whose collection should be imported"

    field :user, Types::UserType, null: false, description: "The local user record for the requested BGG username"

    def resolve(username:)
      contract = ImportCollectionContract.new.call(username: username)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      bgg_username = contract[:username]
      user = User.find_or_initialize_by(bgg_username: bgg_username) do |u|
        u.username = bgg_username
      end
      user.password = SecureRandom.hex(16) if user.new_record?
      user.save!

      if user.last_synced_at.present? && 15.minutes.ago < user.last_synced_at
        remaining_seconds = (user.last_synced_at + 15.minutes - Time.current).to_i
        raise GraphQL::ExecutionError,
              "Collection for '#{bgg_username}' was synced recently. " \
              "Cooldown active: #{remaining_seconds} seconds remaining."
      end

      Bgg::ImportCollectionJob.perform_later(bgg_username)
      context[:sync_status_for_username] = bgg_username

      { user: user }
    end
  end
end
```

**What to copy for every new mutation:**
1. Inherit from `BaseMutation`.
2. Declare `argument` and `field` explicitly.
3. Instantiate a dry-validation contract and raise `GraphQL::ExecutionError` on failure.
4. Read `context[:current_user]` for authorization when needed.
5. Return a hash matching the declared `field` shape.

Example for `SignUp`:
```ruby
module Mutations
  class SignUp < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true
    argument :username, String, required: true

    field :token, String, null: false
    field :user, Types::UserType, null: false

    def resolve(email:, password:, username:)
      contract = SignUpContract.new.call(email: email, password: password, username: username)
      raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?

      user = User.create!(
        email: contract[:email],
        username: contract[:username],
        password: contract[:password]
      )
      session = user.sessions.create!(expires_at: 30.days.from_now)

      { token: session.token, user: user }
    end
  end
end
```

---

### `app/contracts/import_collection_contract.rb` (contract, validation) — **ANALOG FOR ALL NEW CONTRACTS**

**Analog:** `app/contracts/import_collection_contract.rb`

**Existing pattern** (lines 1-9):
```ruby
# frozen_string_literal: true

class ImportCollectionContract < ApplicationContract
  BGG_USERNAME_FORMAT = /\A[a-zA-Z0-9_\-]+\z/.freeze

  params do
    required(:username).filled(:string, max_size?: 50, format?: BGG_USERNAME_FORMAT)
  end
end
```

**What to copy for every new contract:**
- Inherit from `ApplicationContract`.
- Define `params` block with dry-validation predicates.
- Use custom error messages via `config.messages` (I18n backend already configured in `ApplicationContract`).

Example for `SignUpContract`:
```ruby
class SignUpContract < ApplicationContract
  EMAIL_FORMAT = /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/.freeze

  params do
    required(:email).filled(:string, max_size?: 254, format?: EMAIL_FORMAT)
    required(:password).filled(:string, min_size?: 8, max_size?: 128)
    required(:username).filled(:string, max_size?: 50)
  end

  rule(:username) do
    key.failure('is already taken') if User.exists?(username: value)
  end
end
```

---

### `app/mailers/invite_mailer.rb` (mailer, event-driven) — **NEW**

**Analog:** `app/mailers/application_mailer.rb`

**Existing pattern** (lines 1-4):
```ruby
class ApplicationMailer < ActionMailer::Base
  default from: "from@example.com"
  layout "mailer"
end
```

**What to copy:**
```ruby
class InviteMailer < ApplicationMailer
  def group_invite(invite_token)
    @token = invite_token.raw_token
    @group = invite_token.group
    mail(to: invite_token.email, subject: "You've been invited to #{@group.name}")
  end

  def session_invite(invite_token)
    @token = invite_token.raw_token
    @session = invite_token.night_session
    mail(to: invite_token.email, subject: "You're invited to a board game night")
  end
end
```

---

### `app/jobs/invite_mailer_job.rb` (job, event-driven) — **NEW**

**Analog:** `app/jobs/bgg/import_collection_job.rb`

**Existing pattern** for retry and discard (lines 20-36):
```ruby
limits_concurrency to: 1, key: "bgg_api", duration: 5.minutes
retry_on Bgg::NetworkError, wait: :polynomially_longer, attempts: 5
retry_on Bgg::ServerError, wait: :polynomially_longer, attempts: 5
retry_on Bgg::CollectionNotReadyError, wait: 30.seconds, attempts: 3
discard_on Bgg::ResourceNotFound
discard_on Bgg::InvalidUsernameError
discard_on ActiveJob::DeserializationError
```

**What to copy:**
- For mailer jobs, simpler retry is appropriate:
  ```ruby
  class InviteMailerJob < ApplicationJob
    queue_as :mailers

    retry_on StandardError, wait: :polynomially_longer, attempts: 3
    discard_on ActiveJob::DeserializationError

    def perform(invite_token_id)
      invite_token = InviteToken.find(invite_token_id)
      InviteMailer.group_invite(invite_token).deliver_now
    end
  end
  ```

---

### `app/frontend/apollo/client.ts` (client, request-response) — **MODIFY**

**Analog:** `app/frontend/apollo/client.ts`

**Existing pattern** (lines 1-26):
```typescript
import { ApolloClient, InMemoryCache, split } from '@apollo/client/core'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { createConsumer } from '@rails/actioncable'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 50,
  batchMax: 25,
})

const cable = createConsumer('/cable')
const actionCableLink = new ActionCableLink({ cable })

const isSubscription = ({ query }: { query: any }) =>
  query.definitions.some(
    (def: any) => def.kind === 'OperationDefinition' && def.operation === 'subscription'
  )

const link = split(isSubscription, actionCableLink, batchLink)

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
```

**What to copy for auth link:**
- Add `setContext` link between `split` and `batchLink`:
  ```typescript
  import { setContext } from '@apollo/client/link/context'
  import { useAuthStore } from '@/stores/auth'

  const authLink = setContext((_, { headers }) => {
    const token = useAuthStore().token
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    }
  })

  const link = split(isSubscription, actionCableLink, authLink.concat(batchLink))
  ```

---

### `app/frontend/stores/auth.ts` (store, request-response) — **NEW**

**Analog:** `app/frontend/stores/collectors.ts`

**Existing pattern** (lines 1-70):
```typescript
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

export const useCollectorsStore = defineStore('collectors', () => {
  const usernames = ref<string[]>([])

  function add(username: string) { ... }
  function remove(username: string) { ... }
  function set(rawUsernames: string[]) { ... }

  return { usernames, add, remove, set, syncWithRoute }
})
```

**What to copy:**
- Setup store with reactive token (memory-only per ADR-008):
  ```typescript
  import { ref, computed } from 'vue'
  import { defineStore } from 'pinia'

  export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(null)
    const userId = ref<string | null>(null)

    const isAuthenticated = computed(() => token.value !== null)

    function setSession(newToken: string, id: string) {
      token.value = newToken
      userId.value = id
    }

    function clearSession() {
      token.value = null
      userId.value = null
    }

    return { token, userId, isAuthenticated, setSession, clearSession }
  })
  ```

---

### `app/frontend/stores/sessionDraft.ts` (store, request-response) — **NEW**

**Analog:** `app/frontend/stores/filters.ts`

**Existing pattern** (lines 1-62):
```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useFilterStore = defineStore('filters', () => {
  const query = ref('')
  const playerCount = ref<number | null>(null)
  ...

  function clearFilters() { ... }

  return { query, playerCount, ..., clearFilters }
})
```

**What to copy:**
- UI-only draft state for the session editor:
  ```typescript
  import { ref } from 'vue'
  import { defineStore } from 'pinia'

  export type SessionState = 'draft' | 'invited' | 'picking' | 'completed'

  export const useSessionDraftStore = defineStore('sessionDraft', () => {
    const groupId = ref<string | null>(null)
    const scheduledAt = ref<string | null>(null)
    const notes = ref('')

    function reset() {
      groupId.value = null
      scheduledAt.value = null
      notes.value = ''
    }

    return { groupId, scheduledAt, notes, reset }
  })
  ```

---

### `app/frontend/components/auth/LoginForm.vue` (component, request-response) — **NEW**

**Analog:** `app/frontend/components/landing/UsernameForm.vue`

**Existing pattern** for form + mutation (lines 1-70):
```typescript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useValidateBggUsernameMutation } from '../../generated/operations'

const router = useRouter()
const usernameInput = ref('')
const { mutate: validate } = useValidateBggUsernameMutation()

function addUsername(username: string) { ... }
```

**What to copy:**
- Form state, submit handler, and generated mutation:
  ```typescript
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useSignInMutation } from '@/generated/operations'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()
  const { mutate: signIn, loading, error } = useSignInMutation()

  const email = ref('')
  const password = ref('')

  async function submit() {
    const result = await signIn({ email: email.value, password: password.value })
    const data = result?.data?.signIn
    if (data?.token) {
      authStore.setSession(data.token, data.user.id)
      router.push('/')
    }
  }
  ```

---

### `app/frontend/views/CollectionView.vue` (view, request-response) — **ANALOG FOR GROUP/SRS VIEWS**

**Analog:** `app/frontend/views/CollectionView.vue`

**Existing pattern** for query + filters + grid (lines 1-49):
```typescript
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMergedCollectionQuery } from '../generated/operations'
import { useCollectionFilters } from '../composables/useCollectionFilters'
import { useFilterStore } from '../stores/filters'
import { useCollectorsStore } from '../stores/collectors'

const collectorsStore = useCollectorsStore()
const filterStore = useFilterStore()
const { query, playerCount, timeBucket, complexityBucket, ratingMin, selectedOwners, sort, groupBy } = storeToRefs(filterStore)
const { usernames } = storeToRefs(collectorsStore)

const { result, loading } = useMergedCollectionQuery(
  () => ({ usernames: collectorsStore.usernames }),
  () => ({ fetchPolicy: 'cache-and-network' })
)

const allGames = computed(() => result.value?.mergedCollection.items ?? [])
const { filteredGames } = useCollectionFilters(allGames, { ... })
```

**What to copy for `GroupView` / `GamePicker`:**
- Use a generated query that returns a merged collection, then pipe through `useCollectionFilters`:
  ```typescript
  const route = useRoute()
  const { result, loading } = useGroupQuery(
    () => ({ token: route.params.token as string }),
    () => ({ fetchPolicy: 'cache-and-network' })
  )
  const allGames = computed(() => result.value?.group?.collection.items ?? [])
  const { filteredGames } = useCollectionFilters(allGames, { ... })
  ```

---

### `app/frontend/router/index.ts` (router, request-response) — **MODIFY**

**Analog:** `app/frontend/router/index.ts`

**Existing pattern** (lines 1-27):
```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/hot',
      name: 'hot',
      component: () => import('../views/HotView.vue')
    },
    {
      path: '/health',
      name: 'health',
      component: () => import('../views/HealthView.vue')
    },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('../views/CollectionView.vue')
    }
  ]
})

export default router
```

**What to copy:**
- Add new routes and a navigation guard:
  ```typescript
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SignupView.vue')
  },
  {
    path: '/groups',
    name: 'groups',
    component: () => import('../views/GroupsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/g/:token',
    name: 'group',
    component: () => import('../views/GroupView.vue')
  },
  {
    path: '/s/:id',
    name: 'session',
    component: () => import('../views/NightSessionView.vue')
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('../views/AccountView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/invite/:token',
    name: 'invite',
    component: () => import('../views/InviteView.vue')
  }
  ```

---

### `db/migrate/20260703000000_create_users.rb` (migration, schema) — **ANALOG FOR ALL MIGRATIONS**

**Analog:** `db/migrate/20260703000000_create_users.rb`

**Existing pattern** (lines 1-15):
```ruby
# frozen_string_literal: true

class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :username, null: false
      t.string :email
      t.string :password_digest
      t.string :bgg_username
      t.timestamps
    end
    add_index :users, :username, unique: true
    add_index :users, :email, unique: true
  end
end
```

**What to copy for `CreateSessions` (auth):**
```ruby
class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :sessions, :token, unique: true
  end
end
```

**What to copy for `CreateGroups`:**
```ruby
class CreateGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :groups do |t|
      t.string :name, null: false
      t.string :invite_code
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :groups, :invite_code, unique: true
  end
end
```

**What to copy for `CreateGroupMemberships` (join table):**
```ruby
class CreateGroupMemberships < ActiveRecord::Migration[8.1]
  def change
    create_table :group_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :group, null: false, foreign_key: true
      t.string :role, null: false, default: 'member'
      t.timestamps
    end
    add_index :group_memberships, [:user_id, :group_id], unique: true
  end
end
```

**What to copy for `CreateNightSessions`:**
```ruby
class CreateNightSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :night_sessions do |t|
      t.string :name
      t.string :state, null: false, default: 'draft'
      t.references :group, null: false, foreign_key: true
      t.references :host, null: false, foreign_key: { to_table: :users }
      t.references :picked_game, foreign_key: { to_table: :bgg_things }
      t.datetime :scheduled_at
      t.timestamps
    end
    add_index :night_sessions, :state
  end
end
```

**What to copy for `CreateAttendances` (join table):**
```ruby
class CreateAttendances < ActiveRecord::Migration[8.1]
  def change
    create_table :attendances do |t|
      t.references :night_session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :response, null: false
      t.datetime :responded_at
      t.timestamps
    end
    add_index :attendances, [:night_session_id, :user_id], unique: true
  end
end
```

**What to copy for `CreateInviteTokens`:**
```ruby
class CreateInviteTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :invite_tokens do |t|
      t.references :group, null: false, foreign_key: true
      t.references :inviter, null: false, foreign_key: { to_table: :users }
      t.references :accepted_by, foreign_key: { to_table: :users }
      t.references :night_session, foreign_key: true
      t.string :email, null: false
      t.string :role, default: 'member'
      t.string :token_digest, null: false
      t.string :status, null: false, default: 'pending'
      t.datetime :expires_at, null: false
      t.datetime :accepted_at
      t.timestamps
    end
    add_index :invite_tokens, :token_digest, unique: true
  end
end
```

**What to copy for `AddProvisionalAndInviteTokenToUsers`:**
```ruby
class AddProvisionalAndInviteTokenToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :provisional, :boolean, null: false, default: false
    add_column :users, :invite_token, :string
    add_index :users, :invite_token, unique: true
  end
end
```

---

### `spec/models/user_spec.rb` (test, test) — **ANALOG FOR ALL MODEL SPECS**

**Analog:** `spec/models/user_spec.rb`

**Existing pattern** (lines 1-22):
```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    subject { User.new(username: "alice") }
    it { should validate_presence_of(:username) }
    it { should validate_uniqueness_of(:username) }
    it { should validate_uniqueness_of(:email).allow_nil }
  end

  describe "database columns" do
    it { should have_db_column(:bgg_avatar_url).of_type(:string) }
    it { should have_db_index(:bgg_username) }
  end

  describe "associations" do
    it { should have_many(:bgg_collections).dependent(:destroy) }
    it { should have_many(:bgg_things).through(:bgg_collections) }
  end
end
```

**What to copy:**
- Use `shoulda-matchers` one-liners.
- Create records inline with `User.create!(username: ..., password: ...)` (no FactoryBot).
- Add new association/validation tests following the same structure.

---

### `spec/graphql/import_collection_mutation_spec.rb` (test, test) — **ANALOG FOR ALL GRAPHQL SPECS**

**Analog:** `spec/graphql/import_collection_mutation_spec.rb`

**Existing pattern** (lines 1-24, 26-34):
```ruby
require "rails_helper"

RSpec.describe "importCollection mutation" do
  let(:mutation) do
    <<~GRAPHQL
      mutation ImportCollection($username: String!) {
        importCollection(username: $username) {
          user {
            id
            username
            syncStatus {
              username
              status
              lastSyncedAt
              error
              gameCount
            }
          }
        }
      }
    GRAPHQL
  end

  it "creates a user and returns QUEUED sync status" do
    expect {
      BoardgameNightSchema.execute(mutation, variables: { username: "stevmachine" })
    }.to change(User, :count).by(1)
  end
end
```

**What to copy:**
- Define GraphQL string in `let(:mutation)`.
- Execute via `BoardgameNightSchema.execute(...)`.
- Assert on `result["errors"]`, `result.dig("data", ...)` and database changes.
- For authenticated mutations, set `context: { current_user: user }`.

---

### `spec/frontend/Sidebar.spec.ts` (test, test) — **ANALOG FOR ALL VUE COMPONENT SPECS**

**Analog:** `spec/frontend/Sidebar.spec.ts`

**Existing pattern** (lines 1-44):
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'

function createMockClient() {
  return new ApolloClient({
    link: { request: vi.fn() } as any,
    cache: new InMemoryCache()
  })
}

async function mountSidebar(routeQuery = {}) {
  const router = createTestRouter()
  await router.push({ path: '/collection', query: routeQuery })
  await router.isReady()
  provideApolloClient(createMockClient())
  return mount(Sidebar, { global: { plugins: [router], stubs: { MemberAvatar: true } } })
}
```

**What to copy:**
- Use `createPinia`/`setActivePinia` in `beforeEach`.
- Create a test router with `createWebHistory` and dummy components.
- Provide a mock Apollo client with `provideApolloClient` before mounting.
- Stub child components that are not under test.

---

### `spec/frontend/collectorsStore.spec.ts` (test, test) — **ANALOG FOR ALL PINIA STORE SPECS**

**Analog:** `spec/frontend/collectorsStore.spec.ts`

**Existing pattern** (lines 1-36):
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

const TestComponent = defineComponent({
  setup() { return { store: useCollectorsStore() } },
  template: '<div />'
})

function createTestRouter() { ... }

async function createStoreWithRoute(query: Record<string, string> = {}) { ... }
```

**What to copy:**
- Mount a test component that exposes the store.
- Provide `createPinia()` and `router` as global plugins.
- Assert store state and router URL changes.

---

## Shared Patterns

### Authentication
**Source:** `app/controllers/graphql_controller.rb` (lines 9-30) and `app/models/user.rb` (lines 1-10)
**Apply to:** `GraphqlController`, new `SessionsController`, every authenticated mutation

```ruby
# In controller / concern
context = {
  current_user: Current.user,
  current_session: Current.session
}

# In mutation
raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user]
```

### GraphQL Error Handling
**Source:** `app/graphql/mutations/import_collection.rb` (lines 10-12, 21-25)
**Apply to:** All new mutations

```ruby
contract = SignUpContract.new.call(email: email, password: password, username: username)
raise GraphQL::ExecutionError, contract.errors.to_h.to_json if contract.failure?
```

### Dry-Validation Contract Base
**Source:** `app/contracts/application_contract.rb` (lines 1-5)
**Apply to:** All new contracts

```ruby
class ApplicationContract < Dry::Validation::Contract
  config.messages.backend = :i18n
end
```

### Dataloader for N+1
**Source:** `app/graphql/loaders/owners_loader.rb` (lines 1-14)
**Apply to:** `GroupType.members`, `NightSessionType.attendances`, `GroupType.collection.owners`

```ruby
module Loaders
  class OwnersLoader < GraphQL::Dataloader::Source
    def fetch(thing_ids)
      collections = BggCollection
        .where(bgg_thing_id: thing_ids)
        .includes(:user)
        .group_by(&:bgg_thing_id)

      thing_ids.map { |id| collections[id] || [] }
    end
  end
end
```

### Vue Apollo Composable Pattern
**Source:** `app/frontend/views/CollectionView.vue` (lines 23-26)
**Apply to:** All new Vue views/components

```typescript
const { result, loading } = useMergedCollectionQuery(
  () => ({ usernames: collectorsStore.usernames }),
  () => ({ fetchPolicy: 'cache-and-network' })
)
```

### Pinia Setup Store
**Source:** `app/frontend/stores/filters.ts` (lines 1-62)
**Apply to:** `auth.ts`, `sessionDraft.ts`, `groupDraft.ts`

```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useFilterStore = defineStore('filters', () => {
  const query = ref('')
  ...
  return { query, ... }
})
```

### Vue Router Lazy Loading
**Source:** `app/frontend/router/index.ts` (lines 6-10)
**Apply to:** All new routes

```typescript
{
  path: '/',
  name: 'home',
  component: () => import('../views/HomeView.vue')
}
```

### Model Validations with Shoulda-Matchers
**Source:** `spec/models/user_spec.rb` (lines 1-22)
**Apply to:** All model specs

```ruby
RSpec.describe User, type: :model do
  describe "validations" do
    it { should validate_presence_of(:username) }
  end
end
```

### GraphQL Mutation Spec Pattern
**Source:** `spec/graphql/import_collection_mutation_spec.rb` (lines 1-34)
**Apply to:** All new mutation specs

```ruby
let(:mutation) do
  <<~GRAPHQL
    mutation SignUp($input: SignUpInput!) { ... }
  GRAPHQL
end

it "creates a user" do
  expect {
    BoardgameNightSchema.execute(mutation, variables: { ... })
  }.to change(User, :count).by(1)
end
```

### Apollo Auth Link
**Source:** `app/frontend/apollo/client.ts` (lines 1-26)
**Apply to:** `client.ts` modification

```typescript
import { setContext } from '@apollo/client/link/context'

const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    Authorization: token ? `Bearer ${token}` : '',
  },
}))
```

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns and the Rails 8 generator docs instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/models/concerns/authentication.rb` | concern | request-response | No existing authentication concern; must be created from Rails 8 generator pattern adapted for Bearer tokens. |
| `app/models/current.rb` | model/provider | request-response | No `CurrentAttributes` usage in the codebase yet. |
| `app/controllers/sessions_controller.rb` | controller | request-response | No non-GraphQL API controller exists; SPA routes are all handled by `SpaController`. |
| `config/initializers/rack_attack.rb` | middleware | request-response | No Rack::Attack initializer exists yet. |
| `app/frontend/views/InviteView.vue` | view | request-response | No RSVP/invite landing page exists in v1. |
| `app/frontend/components/session/GamePicker.vue` | component | request-response | No session-specific game picker component exists. |

## Naming Conflict Notes

The requirements state both an authentication `Session` model (from the Rails 8 generator) and a boardgame-night `Session` model. Rails cannot load two classes named `Session`. The planner should:
- Use `app/models/session.rb` for the **authentication Session** model.
- Use `app/models/night_session.rb` with class `NightSession` for the **boardgame-night Session** model, and expose it as `SessionType` / `createSession` in GraphQL via explicit `graphql_name` or field naming.

## Metadata

**Analog search scope:**
- `app/models/`
- `app/graphql/`
- `app/controllers/`
- `app/contracts/`
- `app/jobs/`
- `app/mailers/`
- `app/frontend/`
- `db/migrate/`
- `spec/`

**Files scanned:** 58
**Pattern extraction date:** 2026-07-09
