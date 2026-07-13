import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultsSkeleton from '@/components/collection/ResultsSkeleton.vue'

describe('ResultsSkeleton', () => {
  it('renders Skeleton components with pulse and surface-variant tokens', () => {
    const wrapper = mount(ResultsSkeleton)
    const skeletons = wrapper.findAll('[data-slot="skeleton"]')

    expect(skeletons.length).toBeGreaterThan(0)

    for (const skeleton of skeletons) {
      const classes = skeleton.classes().join(' ')
      expect(classes).toContain('animate-pulse')
      expect(classes).toContain('bg-surface-variant')
      expect(classes).not.toContain('bg-neutral-200')
    }
  })
})
