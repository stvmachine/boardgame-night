import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createRouter, createWebHistory } from 'vue-router'
import { ref, nextTick, type Ref } from 'vue'
import { useCollectorsStore } from '@/stores/collectors'
import { useFilterStore } from '@/stores/filters'
import * as operations from '@/generated/operations'
import { sortGames } from '@/utils/sorting'
import CollectionView from '@/views/CollectionView.vue'

vi.mock('@/generated/operations')

const mergedResult: Ref<any> = ref({ mergedCollection: { items: [], syncStatuses: [] } })
const mergedLoading: Ref<boolean> = ref(false)
const mergedError: Ref<any> = ref(null)

const groupResult: Ref<any> = ref({ group: null })
const groupLoading: Ref<boolean> = ref(false)
const groupError: Ref<any> = ref(null)

const mockMutate = vi.fn()

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
      { path: '/collection', component: CollectionView, name: 'collection' },
      { path: '/s/:id', component: { template: '<div />' } }
    ]
  })
}

function buildGroupCollectionItem(id: string, name: string, overrides: Record<string, any> = {}) {
  return {
    id,
    objectid: id,
    name,
    thumbnail: null,
    yearPublished: 2020,
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 60,
    maxPlaytime: 120,
    average: 7.5,
    averageWeight: 2.5,
    description: 'Plain text description.',
    lastPlayedAt: null,
    owners: [{ bggUsername: 'alice_bgg', avatar: null }],
    ...overrides
  }
}

async function mountCollection(initialRoute: string = '/collection') {
  setActivePinia(createPinia())
  provideApolloClient(createMockClient())

  const router = createTestRouter()
  await router.push(initialRoute)
  await router.isReady()

  return mount(CollectionView, { global: { plugins: [router] } })
}

function getLastOption(mockFn: any) {
  const lastCall = mockFn.mock.lastCall
  if (!lastCall) return null
  const options = lastCall[1]
  return typeof options === 'function' ? options() : options
}

describe('CollectionView', () => {
  beforeEach(() => {
    mergedResult.value = { mergedCollection: { items: [], syncStatuses: [] } }
    mergedLoading.value = false
    mergedError.value = null

    groupResult.value = { group: null }
    groupLoading.value = false
    groupError.value = null

    mockMutate.mockReset().mockResolvedValue({})

    vi.mocked(operations.useMergedCollectionQuery).mockReturnValue({
      result: mergedResult,
      loading: mergedLoading,
      error: mergedError
    } as any)

    vi.mocked(operations.useGroupCollectionQuery).mockReturnValue({
      result: groupResult,
      loading: groupLoading,
      error: groupError
    } as any)

    vi.mocked(operations.useImportCollectionMutation).mockReturnValue({
      mutate: mockMutate
    } as any)
  })

  it('enables merged query and disables group query in usernames mode', async () => {
    await mountCollection('/collection?usernames=alice_bgg,bob_bgg')

    const mergedOptions = getLastOption(operations.useMergedCollectionQuery)
    const groupOptions = getLastOption(operations.useGroupCollectionQuery)

    expect(mergedOptions?.enabled).not.toBe(false)
    expect(groupOptions?.enabled).toBe(false)
  })

  it('enables group query and disables merged query in group mode', async () => {
    await mountCollection('/collection?group=NIGHTOWLS')

    const mergedOptions = getLastOption(operations.useMergedCollectionQuery)
    const groupOptions = getLastOption(operations.useGroupCollectionQuery)

    expect(mergedOptions?.enabled).toBe(false)
    expect(groupOptions?.enabled).not.toBe(false)
  })

  it('treats legacy grouping values as usernames mode', async () => {
    await mountCollection('/collection?group=players')

    const mergedOptions = getLastOption(operations.useMergedCollectionQuery)
    const groupOptions = getLastOption(operations.useGroupCollectionQuery)

    expect(mergedOptions?.enabled).not.toBe(false)
    expect(groupOptions?.enabled).toBe(false)
  })

  it('renders group collection items through the shared grid', async () => {
    groupResult.value = {
      group: {
        id: '1',
        inviteCode: 'NIGHTOWLS',
        members: [
          { id: '1', username: 'alice', displayName: 'Alice', bggUsername: 'alice_bgg' },
          { id: '2', username: 'bob', displayName: 'Bob', bggUsername: 'bob_bgg' }
        ],
        collection: {
          items: [
            buildGroupCollectionItem('100', 'Shared Game'),
            buildGroupCollectionItem('101', 'Second Game')
          ],
          syncStatuses: []
        }
      }
    }

    const wrapper = await mountCollection('/collection?group=NIGHTOWLS')
    await nextTick()

    expect(wrapper.text()).toContain('Shared Game')
    expect(wrapper.text()).toContain('Second Game')
  })

  it('hydrates collectors from non-empty member bggUsernames in group mode', async () => {
    groupResult.value = {
      group: {
        id: '1',
        inviteCode: 'NIGHTOWLS',
        members: [
          { id: '1', username: 'alice', displayName: 'Alice', bggUsername: 'alice_bgg' },
          { id: '2', username: 'bob', displayName: 'Bob', bggUsername: null },
          { id: '3', username: 'carol', displayName: 'Carol', bggUsername: 'carol_bgg' }
        ],
        collection: { items: [], syncStatuses: [] }
      }
    }

    await mountCollection('/collection?group=NIGHTOWLS')
    await nextTick()

    const collectorsStore = useCollectorsStore()
    expect(collectorsStore.usernames).toEqual(['alice_bgg', 'carol_bgg'])
  })

  it('shows loading skeleton in group mode while fetching', async () => {
    groupResult.value = {
      group: {
        id: '1',
        inviteCode: 'NIGHTOWLS',
        members: [
          { id: '1', username: 'alice', displayName: 'Alice', bggUsername: 'alice_bgg' }
        ],
        collection: { items: [], syncStatuses: [] }
      }
    }
    groupLoading.value = true

    const wrapper = await mountCollection('/collection?group=NIGHTOWLS')
    await nextTick()

    expect(wrapper.find('[data-slot="skeleton"]').exists()).toBe(true)
  })

  it('shows an empty state when group collection has no games', async () => {
    groupResult.value = {
      group: {
        id: '1',
        inviteCode: 'NIGHTOWLS',
        members: [
          { id: '1', username: 'alice', displayName: 'Alice', bggUsername: 'alice_bgg' }
        ],
        collection: { items: [], syncStatuses: [] }
      }
    }

    const wrapper = await mountCollection('/collection?group=NIGHTOWLS')
    await nextTick()

    expect(wrapper.text()).toContain('No games found')
  })

  it('shows an error state when the group query fails', async () => {
    groupResult.value = {
      group: {
        id: '1',
        inviteCode: 'NIGHTOWLS',
        members: [
          { id: '1', username: 'alice', displayName: 'Alice', bggUsername: 'alice_bgg' }
        ],
        collection: { items: [], syncStatuses: [] }
      }
    }
    groupError.value = new Error('Group not found') as any

    const wrapper = await mountCollection('/collection?group=NIGHTOWLS')
    await nextTick()

    expect(wrapper.text()).toContain('Group not found')
  })

  it('queues imports from group collection sync statuses', async () => {
    groupResult.value = {
      group: {
        id: '1',
        inviteCode: 'NIGHTOWLS',
        members: [
          { id: '1', username: 'alice', displayName: 'Alice', bggUsername: 'alice_bgg' }
        ],
        collection: {
          items: [],
          syncStatuses: [
            { username: 'alice_bgg', status: 'QUEUED', lastSyncedAt: null, gameCount: 0 }
          ]
        }
      }
    }

    await mountCollection('/collection?group=NIGHTOWLS')
    await flushPromises()

    expect(mockMutate).toHaveBeenCalledWith({ username: 'alice_bgg' })
  })

  it('sorts merged collection by scoped lastPlayedAt for Recently Played', async () => {
    mergedResult.value = {
      mergedCollection: {
        items: [
          {
            id: '100',
            objectid: '100',
            name: 'Azul',
            yearPublished: 2017,
            minPlayers: 2,
            maxPlayers: 4,
            minPlaytime: 30,
            maxPlaytime: 45,
            minAge: null,
            image: null,
            thumbnail: null,
            description: null,
            average: 7.7,
            bayesAverage: null,
            usersRated: null,
            averageWeight: 1.8,
            isExpansion: false,
            lastPlayedAt: null,
            owners: [{ bggUsername: 'e2e_alice', avatar: null }]
          },
          {
            id: '101',
            objectid: '101',
            name: 'Wingspan',
            yearPublished: 2019,
            minPlayers: 1,
            maxPlayers: 5,
            minPlaytime: 40,
            maxPlaytime: 70,
            minAge: null,
            image: null,
            thumbnail: null,
            description: null,
            average: 7.9,
            bayesAverage: null,
            usersRated: null,
            averageWeight: 2.4,
            isExpansion: false,
            lastPlayedAt: '2026-01-15T00:00:00Z',
            owners: [{ bggUsername: 'e2e_alice', avatar: null }]
          }
        ],
        syncStatuses: []
      }
    }

    const wrapper = await mountCollection('/collection?usernames=e2e_alice')
    await nextTick()

    const filterStore = useFilterStore()
    filterStore.sort = 'recently_played' as any
    await nextTick()

    const headings = wrapper.findAll('[data-slot="card"] h3')
    expect(headings.length).toBe(2)
    expect(headings[0].text()).toBe('Wingspan')
    expect(headings[1].text()).toBe('Azul')
  })

  it('sorts group collection by scoped lastPlayedAt for Recently Played', async () => {
    groupResult.value = {
      group: {
        id: '1',
        inviteCode: 'NIGHTOWLS',
        members: [
          { id: '1', username: 'alice', displayName: 'Alice', bggUsername: 'alice_bgg' }
        ],
        collection: {
          items: [
            buildGroupCollectionItem('100', 'Azul', { lastPlayedAt: null }),
            buildGroupCollectionItem('101', 'Wingspan', { lastPlayedAt: '2026-01-15T00:00:00Z' })
          ],
          syncStatuses: []
        }
      }
    }

    const wrapper = await mountCollection('/collection?group=NIGHTOWLS')
    await nextTick()

    const filterStore = useFilterStore()
    filterStore.sort = 'recently_played' as any
    await nextTick()

    const headings = wrapper.findAll('[data-slot="card"] h3')
    expect(headings.length).toBe(2)
    expect(headings[0].text()).toBe('Wingspan')
    expect(headings[1].text()).toBe('Azul')
  })
})
