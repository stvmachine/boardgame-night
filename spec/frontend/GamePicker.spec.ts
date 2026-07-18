import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import GamePicker from '@/components/session/GamePicker.vue'
import type { NightSession, Suggestion } from '@/generated/operations'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

vi.mock('@/generated/operations', async () => {
  const actual = await vi.importActual('@/generated/operations') as any
  return {
    ...actual,
    usePickGameMutation: vi.fn()
  }
})

import { usePickGameMutation } from '@/generated/operations'

function buildThing(overrides: any = {}) {
  return {
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
    owners: [{ bggUsername: 'alice', avatar: null }],
    ...overrides
  }
}

function buildSuggestion(overrides: any = {}): Suggestion {
  return {
    score: 85,
    confidence: 'HIGH',
    reasons: ['Fits player count', 'Owned by host'],
    thing: buildThing(),
    breakdown: { communityRating: 0, complexityFit: 0, ownershipBonus: 0, playerCountFit: 0, timeFit: 0 },
    ...overrides
  } as Suggestion
}

function buildSession(overrides: Partial<NightSession> = {}): NightSession {
  return {
    id: '1',
    title: 'Friday Game Night',
    description: null,
    state: 'PICKING',
    scheduledAt: '2026-07-18T19:00:00Z',
    location: "Alice's place",
    capacity: 6,
    attendeeCount: 3,
    timeBudgetMinutes: 120,
    complexityPreference: 'Any',
    previousState: null,
    host: { id: '1', username: 'alice', displayName: 'Alice' },
    group: { id: '1', name: 'Night Owls', inviteCode: null, myRole: 'member', members: [] },
    attendances: [],
    pickedGame: null,
    suggestions: [
      buildSuggestion({ thing: buildThing({ name: 'Wingspan', id: '10', objectid: '266524' }) }),
      buildSuggestion({
        score: 72,
        confidence: 'MEDIUM',
        reasons: ['Fits player count'],
        thing: buildThing({ name: 'Gloomhaven', id: '11', objectid: '174430' })
      })
    ],
    ...overrides
  } as NightSession
}

function createMockMutation() {
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const callbacks: Array<(result: any) => void> = []
  let resolveCurrent: (() => void) | null = null
  let failCurrent = false

  return {
    mutate: vi.fn(async (vars: any) => {
      loading.value = true
      error.value = null
      await new Promise<void>(resolve => { resolveCurrent = resolve })
      loading.value = false
      if (failCurrent) {
        error.value = new Error('Pick failed')
        throw error.value
      }
      const result = { data: { pickGame: { session: { id: '1', state: 'COMPLETED' } } } }
      callbacks.forEach(cb => cb(result))
      return result
    }),
    loading,
    error,
    onDone: (cb: any) => {
      callbacks.push(cb)
      return () => { const i = callbacks.indexOf(cb); if (i > -1) callbacks.splice(i, 1) }
    },
    resolve: () => { failCurrent = false; resolveCurrent?.() },
    reject: () => { failCurrent = true; resolveCurrent?.() }
  }
}

function mountPicker(props: any = {}) {
  const mockMutation = props.mockMutation ?? createMockMutation()
  vi.mocked(usePickGameMutation).mockReturnValue(mockMutation as any)
  return {
    wrapper: mount(GamePicker, {
      props: {
        session: buildSession(),
        isHost: true,
        loading: false,
        error: null,
        ...props
      }
    }),
    mockMutation
  }
}

async function clickPickButton(wrapper: any, gameName: string) {
  const card = wrapper.findAllComponents({ name: 'GameCard' }).find((c: any) => c.props('name') === gameName)
  expect(card).toBeTruthy()
  const button = card!.find('[data-slot="button"]')
  expect(button.exists()).toBe(true)
  const promise = button.trigger('click')
  await flushPromises()
  return { card, button, promise }
}

describe('GamePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the heading using attendee count and read-only preference chips', () => {
    const { wrapper } = mountPicker({ session: buildSession({ attendeeCount: 4 }) })

    const h2 = wrapper.find('h2')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('Game Suggestions (Filtered for 4 Players)')
    expect(wrapper.text()).toContain('Up to 120 min')
    expect(wrapper.text()).toContain('Any complexity')
  })

  it('renders at most the first eight suggestions in server order without client ranking', () => {
    const suggestions = Array.from({ length: 10 }, (_, i) =>
      buildSuggestion({ thing: buildThing({ name: `Game ${i + 1}`, id: String(i + 1) }) })
    )
    const { wrapper } = mountPicker({ session: buildSession({ suggestions }) })

    const cards = wrapper.findAllComponents({ name: 'GameCard' })
    expect(cards.length).toBe(8)
    cards.forEach((card, i) => {
      expect(card.props('name')).toBe(`Game ${i + 1}`)
    })
  })

  it('shows the no-attendee empty state when attendeeCount is zero', () => {
    const { wrapper } = mountPicker({ session: buildSession({ attendeeCount: 0, suggestions: [] }) })

    expect(wrapper.text()).toContain('No confirmed players yet')
    expect(wrapper.text()).toContain('Once guests RSVP Going, suggestions will appear here.')
  })

  it('shows the no-match empty state when attendees exist but suggestions are empty', () => {
    const { wrapper } = mountPicker({ session: buildSession({ attendeeCount: 3, suggestions: [] }) })

    expect(wrapper.text()).toContain('No games fit this night')
    expect(wrapper.text()).toContain("The confirmed players don't have an eligible game in the shared collection.")
  })

  it('renders eight card-shaped skeletons while loading', () => {
    const { wrapper } = mountPicker({ loading: true })

    const skeletons = wrapper.findAll('[data-testid="suggestion-skeleton"]')
    expect(skeletons.length).toBe(8)
  })

  it('renders a query error state with a Try again action', () => {
    const { wrapper } = mountPicker({ error: new Error('Network error') })

    expect(wrapper.text()).toContain("Couldn't load suggestions")
    expect(wrapper.text()).toContain('Check your connection and try again.')
    expect(wrapper.find('[data-testid="retry-suggestions"]').exists()).toBe(true)
  })

  it('emits retry when Try again is clicked', async () => {
    const { wrapper } = mountPicker({ error: new Error('Network error') })

    await wrapper.find('[data-testid="retry-suggestions"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders a Pick this game button for the host and guidance for non-hosts', () => {
    const hostWrapper = mountPicker({ isHost: true }).wrapper
    expect(hostWrapper.text()).toContain('Pick this game')
    expect(hostWrapper.text()).not.toContain('The host will choose the game.')

    const memberWrapper = mountPicker({ isHost: false }).wrapper
    expect(memberWrapper.text()).toContain('The host will choose the game.')
    expect(memberWrapper.text()).not.toContain('Pick this game')
  })

  it('shows Picking… on the selected card and disables all pick buttons while pending', async () => {
    const { wrapper, mockMutation } = mountPicker()

    const { button: selectedButton } = await clickPickButton(wrapper, 'Wingspan')
    expect(selectedButton.text()).toBe('Picking…')
    expect(selectedButton.attributes('aria-busy')).toBe('true')

    const allButtons = wrapper.findAll('[data-slot="button"]')
    expect(allButtons.every((b: any) => b.element.disabled || b.attributes('disabled'))).toBe(true)
  })

  it('prevents a second pick submission while one is in flight', async () => {
    const { wrapper, mockMutation } = mountPicker()

    await clickPickButton(wrapper, 'Wingspan')
    expect(mockMutation.mutate).toHaveBeenCalledTimes(1)

    // Attempt to click another card while the first mutation is pending.
    const secondCard = wrapper.findAllComponents({ name: 'GameCard' })[1]
    const secondButton = secondCard.find('[data-slot="button"]')
    await secondButton.trigger('click')
    await flushPromises()

    expect(mockMutation.mutate).toHaveBeenCalledTimes(1)
  })

  it('emits picked with the game name after a successful mutation', async () => {
    const { wrapper, mockMutation } = mountPicker()

    await clickPickButton(wrapper, 'Wingspan')
    mockMutation.resolve()
    await flushPromises()

    expect(wrapper.emitted('picked')).toHaveLength(1)
    expect(wrapper.emitted('picked')![0]).toEqual(['Wingspan'])
  })

  it('shows an inline error on the selected card after a failed mutation', async () => {
    const { wrapper, mockMutation } = mountPicker()

    await clickPickButton(wrapper, 'Wingspan')
    mockMutation.reject()
    await flushPromises()

    const card = wrapper.findAllComponents({ name: 'GameCard' }).find((c: any) => c.props('name') === 'Wingspan')
    expect(card!.text()).toContain("Couldn't pick Wingspan")
    expect(card!.text()).toContain('Try again.')
  })

  it('moves the error to a newly selected card when retrying a different game', async () => {
    const { wrapper, mockMutation } = mountPicker()

    await clickPickButton(wrapper, 'Wingspan')
    mockMutation.reject()
    await flushPromises()

    expect(wrapper.findAllComponents({ name: 'GameCard' })[0].text()).toContain("Couldn't pick Wingspan")

    await clickPickButton(wrapper, 'Gloomhaven')
    mockMutation.reject()
    await flushPromises()

    expect(wrapper.findAllComponents({ name: 'GameCard' })[0].text()).not.toContain("Couldn't pick Wingspan")
    expect(wrapper.findAllComponents({ name: 'GameCard' })[1].text()).toContain("Couldn't pick Gloomhaven")
  })

  it('uses the approved responsive grid classes', () => {
    const { wrapper } = mountPicker()
    const grid = wrapper.find('[data-testid="suggestion-grid"]')
    expect(grid.classes()).toContain('grid-cols-1')
    expect(grid.classes()).toContain('md:grid-cols-2')
    expect(grid.classes()).toContain('xl:grid-cols-3')
    expect(grid.classes()).toContain('gap-6')
  })
})
