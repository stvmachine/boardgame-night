import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import GameGrid from '@/components/collection/GameGrid.vue'
import GameCard from '@/components/collection/GameCard.vue'
import ResultsSkeleton from '@/components/collection/ResultsSkeleton.vue'
import CollapsibleGroup from '@/components/collection/CollapsibleGroup.vue'
import type { MergedThing } from '@/generated/operations'
import type { GameGroup } from '@/utils/grouping'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

function createMockClient() {
  return new ApolloClient({
    link: { request: vi.fn() } as any,
    cache: new InMemoryCache()
  })
}

function buildGame(id: string, name: string, overrides: Record<string, any> = {}): MergedThing {
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
    owners: [{ bggUsername: 'alice', avatar: null }],
    ...overrides
  } as MergedThing
}

function mountGrid(props: Record<string, any> = {}) {
  setActivePinia(createPinia())
  provideApolloClient(createMockClient())

  return mount(GameGrid, {
    props: {
      games: [],
      groups: [],
      groupBy: 'none',
      view: 'grid',
      loading: false,
      ...props
    }
  })
}

describe('GameGrid', () => {
  it('renders ungrouped games as grid cards by default', () => {
    const games = [buildGame('100', 'Azul'), buildGame('101', 'Wingspan')]
    const wrapper = mountGrid({ games })

    const cards = wrapper.findAllComponents(GameCard)
    expect(cards.length).toBe(2)
    expect(cards[0].props('variant')).toBe('grid')
  })

  it('renders ungrouped games as list cards when view is list', () => {
    const games = [buildGame('100', 'Azul'), buildGame('101', 'Wingspan')]
    const wrapper = mountGrid({ games, view: 'list' })

    const cards = wrapper.findAllComponents(GameCard)
    expect(cards.length).toBe(2)
    expect(cards[0].props('variant')).toBe('list')
  })

  it('renders grouped games with the selected view variant', () => {
    const groups: GameGroup[] = [
      {
        name: '2 players',
        games: [buildGame('100', 'Azul')]
      },
      {
        name: '3 players',
        games: [buildGame('101', 'Wingspan')]
      }
    ]
    const wrapper = mountGrid({ groups, groupBy: 'players', view: 'list' })

    const collapsibles = wrapper.findAllComponents(CollapsibleGroup)
    expect(collapsibles.length).toBe(2)
    const cards = wrapper.findAllComponents(GameCard)
    expect(cards.length).toBe(2)
    expect(cards.every(c => c.props('variant') === 'list')).toBe(true)
  })

  it('preserves item counts in grouped mode', () => {
    const groups: GameGroup[] = [
      { name: 'A', games: [buildGame('100', 'A1'), buildGame('101', 'A2')] },
      { name: 'B', games: [buildGame('102', 'B1')] }
    ]
    const wrapper = mountGrid({ groups, groupBy: 'players' })

    const cards = wrapper.findAllComponents(GameCard)
    expect(cards.length).toBe(3)
  })

  it('renders twelve skeletons matching the grid view while loading', () => {
    const wrapper = mountGrid({ loading: true, view: 'grid' })

    const skeletons = wrapper.findAllComponents(ResultsSkeleton)
    expect(skeletons.length).toBe(12)
    expect(skeletons[0].props('variant')).toBe('grid')
  })

  it('renders twelve skeletons matching the list view while loading', () => {
    const wrapper = mountGrid({ loading: true, view: 'list' })

    const skeletons = wrapper.findAllComponents(ResultsSkeleton)
    expect(skeletons.length).toBe(12)
    expect(skeletons[0].props('variant')).toBe('list')
  })
})
