import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createRouter, createWebHistory } from 'vue-router'
import GroupHeader from '@/components/group/GroupHeader.vue'
import GroupSessionsList from '@/components/group/GroupSessionsList.vue'
import GroupDetail from '@/components/group/GroupDetail.vue'
import GroupView from '@/views/GroupView.vue'
import type { Group, GroupMembership, NightSession } from '@/generated/types'

function createMockClient() {
  return new ApolloClient({
    link: { request: vi.fn() } as any,
    cache: new InMemoryCache()
  })
}

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/g/:token', component: GroupView },
      { path: '/s/:id', name: 'session', component: { template: '<div>Session</div>' } }
    ]
  })
}

const baseSessions: NightSession[] = [
  {
    id: '20',
    title: 'Draft Night',
    state: 'DRAFT',
    scheduledAt: null,
    attendeeCount: 0,
    attendances: []
  },
  {
    id: '10',
    title: 'Picking Night',
    state: 'PICKING',
    scheduledAt: '2026-07-18T19:00:00Z',
    attendeeCount: 2,
    attendances: [
      { id: '1', response: 'going', user: { id: '2', username: 'bob', displayName: 'Bob' } }
    ]
  },
  {
    id: '11',
    title: 'Friday Games',
    state: 'INVITED',
    scheduledAt: '2026-07-17T19:00:00Z',
    attendeeCount: 1,
    attendances: []
  }
] as NightSession[]

function buildGroup(role: 'OWNER' | 'ADMIN' | 'MEMBER', sessions: NightSession[] = baseSessions): Group {
  const memberships: GroupMembership[] = [
    {
      id: 'm1',
      role: 'OWNER',
      user: { id: '1', username: 'alice', displayName: 'Alice', email: null, isProvisional: false, bggUsername: 'alice_bgg', avatar: null, syncStatus: { username: 'alice_bgg', status: 'READY', lastSyncedAt: null, error: null, gameCount: 0 } }
    },
    {
      id: 'm2',
      role: 'MEMBER',
      user: { id: '2', username: 'bob', displayName: 'Bob', email: null, isProvisional: false, bggUsername: 'bob_bgg', avatar: null, syncStatus: { username: 'bob_bgg', status: 'READY', lastSyncedAt: null, error: null, gameCount: 0 } }
    }
  ] as GroupMembership[]

  return {
    id: '1',
    name: 'Night Owls',
    description: 'A group for night owls',
    inviteCode: 'NIGHTOWLS',
    myRole: role,
    owner: { id: '1', username: 'alice', displayName: 'Alice', email: null, isProvisional: false, bggUsername: 'alice_bgg', avatar: null, syncStatus: { username: 'alice_bgg', status: 'READY', lastSyncedAt: null, error: null, gameCount: 0 } },
    members: memberships.map(m => m.user),
    memberships,
    sessions,
    collection: { items: [], syncStatuses: [] }
  } as Group
}

function findButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const buttons = wrapper.findAll('button')
  return buttons.find(b => b.text() === text)
}

describe('GroupHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    provideApolloClient(createMockClient())
  })

  it('renders group name, member count, and description', () => {
    const wrapper = mount(GroupHeader, {
      props: { group: buildGroup('OWNER') }
    })

    expect(wrapper.find('h1').text()).toBe('Night Owls')
    expect(wrapper.text()).toContain('2 members')
    expect(wrapper.text()).toContain('A group for night owls')
  })

  it('shows Create a night for owner and admin', () => {
    const ownerWrapper = mount(GroupHeader, { props: { group: buildGroup('OWNER') } })
    expect(findButtonByText(ownerWrapper, 'Create a night')).toBeDefined()

    const adminWrapper = mount(GroupHeader, { props: { group: buildGroup('ADMIN') } })
    expect(findButtonByText(adminWrapper, 'Create a night')).toBeDefined()

    const memberWrapper = mount(GroupHeader, { props: { group: buildGroup('MEMBER') } })
    expect(findButtonByText(memberWrapper, 'Create a night')).toBeUndefined()
  })

  it('renders two Create a night buttons for responsive layout', () => {
    const wrapper = mount(GroupHeader, { props: { group: buildGroup('OWNER') } })
    const createButtons = wrapper.findAll('button').filter(b => b.text() === 'Create a night')
    expect(createButtons.length).toBe(2)
  })
})

describe('GroupSessionsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    provideApolloClient(createMockClient())
  })

  it('renders session rows in provided server order', () => {
    const wrapper = mount(GroupSessionsList, {
      props: { sessions: baseSessions, group: buildGroup('OWNER') }
    })

    expect(wrapper.text()).toContain('Upcoming sessions')
    const rows = wrapper.findAll('li')
    expect(rows.length).toBe(3)
    expect(rows[0].text()).toContain('Picking Night')
    expect(rows[1].text()).toContain('Friday Games')
    expect(rows[2].text()).toContain('Draft Night')
  })

  it('renders Date TBD for undated drafts', () => {
    const wrapper = mount(GroupSessionsList, {
      props: { sessions: baseSessions, group: buildGroup('OWNER') }
    })

    expect(wrapper.text()).toContain('Date TBD')
  })

  it('maps state to the correct CTA label', () => {
    const wrapper = mount(GroupSessionsList, {
      props: { sessions: baseSessions, group: buildGroup('OWNER') }
    })

    const rows = wrapper.findAll('li')
    expect(findButtonByText(rows[0], 'Choose a game')).toBeDefined()
    expect(findButtonByText(rows[1], 'View details')).toBeDefined()
    expect(findButtonByText(rows[2], 'View details')).toBeDefined()
  })

  it('shows manager empty state with create action', () => {
    const wrapper = mount(GroupSessionsList, {
      props: { sessions: [], group: buildGroup('OWNER') }
    })

    expect(wrapper.text()).toContain('Plan your first game night')
    expect(wrapper.text()).toContain('Create a night to get everyone on the schedule.')
    expect(findButtonByText(wrapper, 'Create a night')).toBeDefined()
  })

  it('shows member empty state without create action', () => {
    const wrapper = mount(GroupSessionsList, {
      props: { sessions: [], group: buildGroup('MEMBER') }
    })

    expect(wrapper.text()).toContain('No nights planned yet')
    expect(wrapper.text()).toContain('Check back later for upcoming game nights.')
    expect(findButtonByText(wrapper, 'Create a night')).toBeUndefined()
  })

  it('navigates to session route on CTA activation', async () => {
    const router = createTestRouter()
    await router.push('/g/NIGHTOWLS')
    await router.isReady()

    const wrapper = mount(GroupSessionsList, {
      props: { sessions: baseSessions, group: buildGroup('OWNER') },
      global: { plugins: [router] }
    })

    const rows = wrapper.findAll('li')
    const cta = findButtonByText(rows[0], 'Choose a game')
    expect(cta).toBeDefined()
    await cta!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/s/10')
  })
})

describe('GroupDetail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    provideApolloClient(createMockClient())
  })

  it('composes header and sessions list', () => {
    const wrapper = mount(GroupDetail, {
      props: { group: buildGroup('OWNER') }
    })

    expect(wrapper.find('h1').text()).toBe('Night Owls')
    expect(wrapper.text()).toContain('Upcoming sessions')
  })

  it('shows Create a night for owner', () => {
    const wrapper = mount(GroupDetail, { props: { group: buildGroup('OWNER') } })
    expect(findButtonByText(wrapper, 'Create a night')).toBeDefined()
  })
})

describe('GroupView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders skeleton placeholders while loading', async () => {
    vi.doMock('@/generated/operations', () => ({
      useGroupQuery: () => ({ result: { value: null }, loading: true, error: null })
    }))

    const router = createTestRouter()
    await router.push('/g/NIGHTOWLS')
    await router.isReady()

    const { default: GroupViewMocked } = await import('@/views/GroupView.vue')
    const wrapper = mount(GroupViewMocked, { global: { plugins: [router] } })

    expect(wrapper.find('[data-testid="group-skeleton"]').exists()).toBe(true)
    vi.doUnmock('@/generated/operations')
  })
})
