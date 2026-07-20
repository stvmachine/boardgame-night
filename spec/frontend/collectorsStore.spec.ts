import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollectorsStore } from '@/stores/collectors'

describe('collectors store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('add appends a normalized username', () => {
    const store = useCollectorsStore()

    store.add('Alice')

    expect(store.usernames).toEqual(['alice'])
  })

  it('add does not duplicate usernames', () => {
    const store = useCollectorsStore()

    store.add('Alice')
    store.add('alice')
    store.add('BOB')

    expect(store.usernames).toEqual(['alice', 'bob'])
  })

  it('remove filters out the username', () => {
    const store = useCollectorsStore()
    store.set(['alice', 'bob'])

    store.remove('Alice')

    expect(store.usernames).toEqual(['bob'])
  })

  it('set replaces the list and normalizes values', () => {
    const store = useCollectorsStore()

    store.set([' Alice ', 'BOB', '', 'alice'])

    expect(store.usernames).toEqual(['alice', 'bob'])
  })
})
