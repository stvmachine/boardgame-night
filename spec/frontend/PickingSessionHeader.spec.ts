import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PickingSessionHeader from '@/components/session/PickingSessionHeader.vue'
import type { NightSession } from '@/generated/operations'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

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
    group: {
      id: '1',
      name: 'Night Owls',
      inviteCode: null,
      myRole: 'member',
      members: []
    },
    attendances: [
      { id: '1', response: 'going', respondedAt: null, user: { id: '1', username: 'alice', displayName: 'Alice' } },
      { id: '2', response: 'going', respondedAt: null, user: { id: '2', username: 'bob', displayName: 'Bob' } },
      { id: '3', response: 'going', respondedAt: null, user: { id: '3', username: 'carol', displayName: 'Carol' } },
      { id: '4', response: 'not_going', respondedAt: null, user: { id: '4', username: 'dave', displayName: 'Dave' } }
    ],
    pickedGame: null,
    suggestions: null,
    ...overrides
  } as NightSession
}

describe('PickingSessionHeader', () => {
  it('renders the session title as the page h1', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Friday Game Night')
  })

  it('shows the Picking status badge', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    const badge = wrapper.find('[data-slot="badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Picking')
  })

  it('renders scheduled date/time when available', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    expect(wrapper.text()).not.toContain('Date TBD')
  })

  it('renders Date TBD when scheduledAt is missing', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession({ scheduledAt: null }), isHost: true }
    })

    expect(wrapper.text()).toContain('Date TBD')
  })

  it('renders Location TBD when location is missing', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession({ location: null }), isHost: true }
    })

    expect(wrapper.text()).toContain('Location TBD')
  })

  it('shows only confirmed-going attendees', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    const avatars = wrapper.findAll('[data-slot="avatar"]')
    expect(avatars.length).toBe(3)
    expect(wrapper.text()).toContain('3 going')
    expect(wrapper.text()).not.toContain('Dave')
  })

  it('shows up to four avatars below md and five at md+ with overflow counts', () => {
    const attendees = Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1),
      response: 'going' as const,
      respondedAt: null,
      user: { id: String(i + 1), username: `player${i + 1}`, displayName: `Player ${i + 1}` }
    }))

    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession({ attendances: attendees, attendeeCount: 7 }), isHost: true }
    })

    const avatars = wrapper.findAll('[data-slot="avatar"]')
    expect(avatars.length).toBe(5)

    const wrappers = wrapper.findAll('[data-slot="avatar-group"] > span[aria-hidden="true"]')
    expect(wrappers[4].classes()).toContain('hidden')
    expect(wrappers[4].classes()).toContain('md:inline-flex')

    const counts = wrapper.findAll('[data-slot="avatar-group-count"]')
    expect(counts.length).toBe(2)
    expect(wrapper.text()).toContain('+3')
    expect(wrapper.text()).toContain('+2')
  })

  it('announces the avatar group with one label containing count and names', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    const group = wrapper.find('[data-slot="avatar-group"]')
    expect(group.attributes('aria-label')).toBe('3 confirmed players: Alice, Bob, Carol')

    const hiddenWrappers = wrapper.findAll('[data-slot="avatar-group"] > span[aria-hidden="true"]')
    expect(hiddenWrappers.length).toBeGreaterThan(0)
  })

  it('renders Edit Details for the host', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    const button = wrapper.find('[data-slot="button"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Edit Details')
  })

  it('does not render Edit Details for non-hosts', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: false }
    })

    expect(wrapper.find('[data-slot="button"]').exists()).toBe(false)
  })

  it('emits edit-details when Edit Details is clicked', async () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    await wrapper.find('[data-slot="button"]').trigger('click')
    expect(wrapper.emitted('edit-details')).toHaveLength(1)
  })

  it('exposes focusEditButton to focus the Edit Details button', async () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true },
      attachTo: document.body
    })

    const button = wrapper.find('[data-slot="button"]').element as HTMLButtonElement
    button.focus = vi.fn()

    ;(wrapper.vm as any).focusEditButton()
    await flushPromises()

    expect(button.focus).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('uses the approved container classes', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    const container = wrapper.find('[data-testid="picking-header"]')
    expect(container.classes()).toContain('rounded-xl')
    expect(container.classes()).toContain('border')
    expect(container.classes()).toContain('border-outline')
    expect(container.classes()).toContain('bg-surface-container')
    expect(container.classes()).toContain('p-4')
    expect(container.classes()).toContain('md:p-6')
  })

  it('renders Edit Details as a full-width button below sm and intrinsic above', () => {
    const wrapper = mount(PickingSessionHeader, {
      props: { session: buildSession(), isHost: true }
    })

    const button = wrapper.find('[data-slot="button"]')
    expect(button.classes()).toContain('w-full')
    expect(button.classes()).toContain('sm:w-auto')
  })
})
