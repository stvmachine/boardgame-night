import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CollectionFilters from '@/components/collection/CollectionFilters.vue'

describe('CollectionFilters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountFilters() {
    return mount(CollectionFilters, {
      props: {
        query: '',
        playerCount: null,
        timeBucket: null,
        complexityBucket: null,
        ratingMin: null
      }
    })
  }

  it('renders search input', () => {
    const wrapper = mountFilters()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('renders player count select with 10 options', () => {
    const wrapper = mountFilters()
    const options = wrapper.find('select#filter-players').findAll('option')
    expect(options.length).toBe(11) // Any + 10
  })

  it('renders time bucket options', () => {
    const wrapper = mountFilters()
    const options = wrapper.find('select#filter-time').findAll('option')
    expect(options.length).toBe(7) // Any + 6 buckets
  })

  it('renders complexity bucket options', () => {
    const wrapper = mountFilters()
    const options = wrapper.find('select#filter-complexity').findAll('option')
    expect(options.length).toBe(5) // Any + 4 buckets
  })

  it('renders rating min options', () => {
    const wrapper = mountFilters()
    const options = wrapper.find('select#filter-rating').findAll('option')
    expect(options.length).toBe(6) // Any + 5
  })
})
