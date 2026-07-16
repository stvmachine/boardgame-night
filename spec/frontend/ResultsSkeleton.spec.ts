import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultsSkeleton from '@/components/collection/ResultsSkeleton.vue'

describe('ResultsSkeleton', () => {
  it('renders a grid variant by default', () => {
    const wrapper = mount(ResultsSkeleton)
    const root = wrapper.find('[data-testid="skeleton-item"]')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('flex-col')
  })

  it('renders a horizontal list variant', () => {
    const wrapper = mount(ResultsSkeleton, { props: { variant: 'list' } })
    const root = wrapper.find('[data-testid="skeleton-item"]')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('flex-row')
  })

  it('renders a 4:3 thumbnail skeleton in both variants', () => {
    const grid = mount(ResultsSkeleton, { props: { variant: 'grid' } })
    const list = mount(ResultsSkeleton, { props: { variant: 'list' } })

    expect(grid.find('[data-testid="skeleton-thumbnail"]').exists()).toBe(true)
    expect(list.find('[data-testid="skeleton-thumbnail"]').exists()).toBe(true)
  })
})
