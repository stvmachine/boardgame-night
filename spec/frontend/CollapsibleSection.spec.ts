import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'

describe('CollapsibleSection', () => {
  it('renders title and chevron, and toggles body visibility on header click', async () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Filters' },
      slots: { default: '<div data-testid="body">Body content</div>' }
    })

    expect(wrapper.text()).toContain('Filters')
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.collapsible-body').attributes('style') || '').not.toContain('display: none')

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.collapsible-body').attributes('style') || '').toContain('display: none')

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('.collapsible-body').attributes('style') || '').not.toContain('display: none')
  })

  it('emits toggle event with the new open state', async () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Test' }
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')![0]).toEqual([false])
  })

  it('starts collapsed when defaultOpen is false', () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Collectors', defaultOpen: false },
      slots: { default: '<div data-testid="body">Body content</div>' }
    })

    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.collapsible-body').attributes('style') || '').toContain('display: none')
  })

  it('renders content provided in the badge slot', () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Filters' },
      slots: { badge: '<span data-testid="badge">3</span>' }
    })

    expect(wrapper.find('[data-testid="badge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="badge"]').text()).toBe('3')
  })
})
