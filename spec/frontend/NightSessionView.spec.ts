import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { defineComponent, ref, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import NightSessionView from '@/views/NightSessionView.vue'
import type { NightSession } from '@/generated/operations'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router') as any
  return {
    ...actual,
    useRoute: vi.fn(() => ({ params: { id: '1' } }))
  }
})

vi.mock('@/stores/sessionDraft', () => ({
  useSessionDraftStore: vi.fn(() => ({
    title: '',
    description: '',
    scheduledAt: null,
    location: '',
    capacity: null,
    reset: vi.fn()
  }))
}))

vi.mock('@/generated/operations', async () => {
  const actual = await vi.importActual('@/generated/operations') as any
  return {
    ...actual,
    useNightSessionQuery: vi.fn(),
    useScheduleSessionMutation: vi.fn(),
    useStartPickingMutation: vi.fn(),
    useCancelSessionMutation: vi.fn(),
    useReopenSessionMutation: vi.fn(),
    useUpdateSessionDetailsMutation: vi.fn(),
    useCurrentUserQuery: vi.fn()
  }
})

import {
  useNightSessionQuery,
  useStartPickingMutation,
  useUpdateSessionDetailsMutation,
  useScheduleSessionMutation,
  useCancelSessionMutation,
  useReopenSessionMutation,
  useCurrentUserQuery
} from '@/generated/operations'

const AppShellStub = defineComponent({ template: '<div><slot /></div>' })
const SessionEditorStub = defineComponent({
  props: ['sessionId', 'loading', 'error'],
  emits: ['schedule'],
  template: '<div data-testid="session-editor-stub" />'
})
const RsvpDashboardStub = defineComponent({
  props: ['attendances', 'isHost'],
  template: '<div data-testid="rsvp-dashboard-stub" />'
})
const SessionSummaryStub = defineComponent({
  props: ['session'],
  emits: ['reopen'],
  template: '<div data-testid="session-summary-stub">{{ session.state }}</div>'
})
const EmptyStateStub = defineComponent({
  props: ['heading', 'body'],
  template: '<div data-testid="empty-state-stub">{{ heading }}</div>'
})

const focusEditButtonSpy = vi.fn()
const PickingSessionHeaderStub = defineComponent({
  props: ['session', 'isHost'],
  emits: ['edit-details'],
  setup() {
    return { focusEditButton: focusEditButtonSpy }
  },
  template: `
    <div data-testid="picking-header-stub">
      <h1 data-testid="picking-title">{{ session.title }}</h1>
      <button v-if="isHost" data-testid="edit-details" @click="$emit('edit-details')">Edit Details</button>
    </div>
  `
})

const SessionDetailsEditorStub = defineComponent({
  props: ['open', 'session', 'loading', 'error'],
  emits: ['update:open', 'save'],
  template: `
    <div v-if="open" data-testid="details-editor-stub">
      <span data-testid="editor-error">{{ error }}</span>
      <button data-testid="editor-save" @click="$emit('save', { sessionId: session.id, title: 'Updated', description: null, scheduledAt: null, location: null, capacity: null })">Save</button>
    </div>
  `
})

const GamePickerStub = defineComponent({
  props: ['session', 'isHost', 'loading', 'error'],
  emits: ['retry', 'picked'],
  template: `
    <div data-testid="game-picker-stub">
      <span data-testid="picker-is-host">{{ isHost }}</span>
      <span data-testid="picker-loading">{{ loading }}</span>
      <span data-testid="picker-error">{{ error?.message }}</span>
      <button data-testid="picker-retry" @click="$emit('retry')">Try again</button>
      <button data-testid="picker-pick" @click="$emit('picked', 'Wingspan')">Pick</button>
    </div>
  `
})

function buildSession(overrides: Partial<NightSession> = {}): NightSession {
  return {
    id: '1',
    title: 'Friday Game Night',
    description: 'Bring snacks',
    state: 'PICKING',
    scheduledAt: '2026-07-18T19:00:00Z',
    location: "Alice's place",
    capacity: 6,
    attendeeCount: 1,
    timeBudgetMinutes: 120,
    complexityPreference: 'Any',
    previousState: null,
    host: { id: '1', username: 'alice', displayName: 'Alice' },
    group: {
      id: '1',
      name: 'Night Owls',
      inviteCode: null,
      myRole: 'member',
      members: []
    },
    attendances: [
      { id: '2', response: 'going', respondedAt: null, user: { id: '2', username: 'bob', displayName: 'Bob' } }
    ],
    pickedGame: null,
    suggestions: [
      {
        score: 85,
        confidence: 'HIGH',
        reasons: ['Fits player count', 'Owned by host'],
        thing: {
          id: '10',
          objectid: '266524',
          name: 'Wingspan',
          thumbnail: null,
          image: null,
          yearPublished: 2019,
          minPlayers: 1,
          maxPlayers: 5,
          minPlaytime: 40,
          maxPlaytime: 70,
          average: 8.1,
          averageWeight: 2.4,
          description: 'A relaxing bird-themed engine builder.',
          owners: [{ bggUsername: 'bob', avatar: null }]
        }
      }
    ],
    ...overrides
  } as NightSession
}

function createMockQuery({ result = null, loading = false, error = null as Error | null } = {}) {
  return {
    result: ref({ nightSession: result }),
    loading: ref(loading),
    error: ref<Error | null>(error),
    refetch: vi.fn()
  }
}

function createMockUser(user: any) {
  return { result: ref({ currentUser: user }) }
}

function createMockMutation() {
  return {
    mutate: vi.fn(() => Promise.resolve({ data: {} })),
    loading: ref(false),
    error: ref<Error | null>(null),
    onDone: vi.fn(() => () => {})
  }
}

function createMockUpdateMutation() {
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const callbacks: Array<(result: any) => void> = []
  return {
    mutate: vi.fn(() => Promise.resolve({ data: {} })),
    loading,
    error,
    onDone: vi.fn((cb: (result: any) => void) => { callbacks.push(cb); return () => {} }),
    triggerDone: (result: any) => callbacks.forEach(cb => cb(result))
  }
}

function mountView({ query = createMockQuery(), user = { id: '1', username: 'alice', displayName: 'Alice' } } = {}) {
  vi.mocked(useNightSessionQuery).mockReturnValue(query as any)
  vi.mocked(useCurrentUserQuery).mockReturnValue(createMockUser(user) as any)
  vi.mocked(useScheduleSessionMutation).mockReturnValue(createMockMutation() as any)
  vi.mocked(useStartPickingMutation).mockReturnValue(createMockMutation() as any)
  vi.mocked(useCancelSessionMutation).mockReturnValue(createMockMutation() as any)
  vi.mocked(useReopenSessionMutation).mockReturnValue(createMockMutation() as any)
  vi.mocked(useUpdateSessionDetailsMutation).mockReturnValue(createMockUpdateMutation() as any)

  return mount(NightSessionView, {
    global: {
      plugins: [createPinia()],
      stubs: {
        AppShell: AppShellStub,
        SessionEditor: SessionEditorStub,
        RsvpDashboard: RsvpDashboardStub,
        GamePicker: GamePickerStub,
        SessionSummary: SessionSummaryStub,
        EmptyState: EmptyStateStub,
        PickingSessionHeader: PickingSessionHeaderStub,
        SessionDetailsEditor: SessionDetailsEditorStub,
        Skeleton: { template: '<div data-testid="skeleton-stub" />' }
      }
    }
  })
}

async function flush() {
  await flushPromises()
  await nextTick()
}

describe('NightSessionView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    focusEditButtonSpy.mockClear()
  })

  it('renders the dedicated PICKING header and picker, not the generic lifecycle header', async () => {
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'PICKING' }) }) })
    await flush()

    expect(wrapper.find('[data-testid="picking-header-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="game-picker-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="session-editor-stub"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="rsvp-dashboard-stub"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="session-summary-stub"]').exists()).toBe(false)
  })

  it('shows a header skeleton and passes loading to the picker while PICKING data is loading', async () => {
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'PICKING' }), loading: true }) })
    await flush()

    expect(wrapper.find('[data-testid="picking-header-stub"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="skeleton-stub"]').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-testid="picker-loading"]').text()).toBe('true')
  })

  it('preserves the real header and passes a partial query error to the picker', async () => {
    const query = createMockQuery({ result: buildSession({ state: 'PICKING' }), error: new Error('Suggestions failed') })
    const wrapper = mountView({ query })
    await flush()

    expect(wrapper.find('[data-testid="picking-header-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="game-picker-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="picker-error"]').text()).toBe('Suggestions failed')
  })

  it('lets the host open the details editor, save, and restores focus with an announcement on success', async () => {
    const updateMock = createMockUpdateMutation()
    vi.mocked(useUpdateSessionDetailsMutation).mockReturnValue(updateMock as any)
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'PICKING' }) }) })
    await flush()

    await wrapper.find('[data-testid="edit-details"]').trigger('click')
    await flush()
    expect(wrapper.find('[data-testid="details-editor-stub"]').exists()).toBe(true)

    await wrapper.find('[data-testid="editor-save"]').trigger('click')
    await flush()
    expect(updateMock.mutate).toHaveBeenCalledTimes(1)
    expect(updateMock.mutate).toHaveBeenCalledWith({
      sessionId: '1',
      title: 'Updated',
      description: null,
      scheduledAt: null,
      location: null,
      capacity: null
    })

    updateMock.triggerDone({ data: { updateSessionDetails: { session: buildSession({ title: 'Updated' }) } } })
    await flush()

    expect(wrapper.find('[data-testid="details-editor-stub"]').exists()).toBe(false)
    expect(focusEditButtonSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="live-region"]').text()).toContain('Session details updated.')
  })

  it('keeps the details editor open and passes an error when the mutation fails', async () => {
    const updateMock = createMockUpdateMutation()
    vi.mocked(useUpdateSessionDetailsMutation).mockReturnValue(updateMock as any)
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'PICKING' }) }) })
    await flush()

    await wrapper.find('[data-testid="edit-details"]').trigger('click')
    await flush()

    await wrapper.find('[data-testid="editor-save"]').trigger('click')
    await flush()

    updateMock.error.value = new Error('Backend failure')
    await flush()

    expect(wrapper.find('[data-testid="details-editor-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="editor-error"]').text()).toBe('Backend failure')
  })

  it('refetches the main query after starting picking', async () => {
    const startMock = createMockMutation()
    const query = createMockQuery({ result: buildSession({ state: 'INVITED' }) })
    vi.mocked(useStartPickingMutation).mockReturnValue(startMock as any)
    vi.mocked(useNightSessionQuery).mockReturnValue(query as any)
    vi.mocked(useCurrentUserQuery).mockReturnValue(createMockUser({ id: '1', username: 'alice', displayName: 'Alice' }) as any)
    vi.mocked(useScheduleSessionMutation).mockReturnValue(createMockMutation() as any)
    vi.mocked(useCancelSessionMutation).mockReturnValue(createMockMutation() as any)
    vi.mocked(useReopenSessionMutation).mockReturnValue(createMockMutation() as any)
    vi.mocked(useUpdateSessionDetailsMutation).mockReturnValue(createMockUpdateMutation() as any)

    const wrapper = mount(NightSessionView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppShell: AppShellStub,
          SessionEditor: SessionEditorStub,
          RsvpDashboard: RsvpDashboardStub,
          GamePicker: GamePickerStub,
          SessionSummary: SessionSummaryStub,
          EmptyState: EmptyStateStub,
          PickingSessionHeader: PickingSessionHeaderStub,
          SessionDetailsEditor: SessionDetailsEditorStub,
          Skeleton: { template: '<div data-testid="skeleton-stub" />' }
        }
      }
    })
    await flush()

    await wrapper.find('[data-testid="start-picking"]').trigger('click')
    await flush()

    expect(startMock.mutate).toHaveBeenCalledWith({ sessionId: '1' })
    expect(query.refetch).toHaveBeenCalledTimes(1)
  })

  it('announces the picked game and transitions to SessionSummary when the session completes', async () => {
    const query = createMockQuery({ result: buildSession({ state: 'PICKING' }) })
    const wrapper = mountView({ query })
    await flush()

    await wrapper.find('[data-testid="picker-pick"]').trigger('click')
    await flush()

    expect(wrapper.find('[data-testid="live-region"]').text()).toContain('Wingspan selected for this night.')

    query.result.value = { nightSession: buildSession({ state: 'COMPLETED', pickedGame: { id: '10', name: 'Wingspan', thumbnail: null } }) }
    await flush()

    expect(wrapper.find('[data-testid="session-summary-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="game-picker-stub"]').exists()).toBe(false)
  })

  it('does not render Edit Details for non-hosts and passes isHost=false to the picker', async () => {
    const wrapper = mountView({
      query: createMockQuery({ result: buildSession({ state: 'PICKING' }) }),
      user: { id: '2', username: 'bob', displayName: 'Bob' }
    })
    await flush()

    expect(wrapper.find('[data-testid="edit-details"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="details-editor-stub"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="picker-is-host"]').text()).toBe('false')
  })

  it('keeps the DRAFT editor branch intact', async () => {
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'DRAFT' }) }) })
    await flush()

    expect(wrapper.find('[data-testid="session-editor-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="picking-header-stub"]').exists()).toBe(false)
  })

  it('keeps the INVITED RSVP branch intact', async () => {
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'INVITED' }) }) })
    await flush()

    expect(wrapper.find('[data-testid="rsvp-dashboard-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="picking-header-stub"]').exists()).toBe(false)
  })

  it('keeps the COMPLETED summary branch intact', async () => {
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'COMPLETED' }) }) })
    await flush()

    expect(wrapper.find('[data-testid="session-summary-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="picking-header-stub"]').exists()).toBe(false)
  })

  it('keeps the CANCELLED branch with a reopen option for the host', async () => {
    const wrapper = mountView({ query: createMockQuery({ result: buildSession({ state: 'CANCELLED' }) }) })
    await flush()

    expect(wrapper.find('[data-testid="session-summary-stub"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="picking-header-stub"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('This session was cancelled')
    expect(wrapper.find('[data-testid="reopen-session"]').exists()).toBe(true)
  })

  it('renders a not-found empty state when the session is missing', async () => {
    const wrapper = mountView({ query: createMockQuery({ result: null }) })
    await flush()

    expect(wrapper.find('[data-testid="empty-state-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty-state-stub"]').text()).toContain('Session not found')
  })
})
