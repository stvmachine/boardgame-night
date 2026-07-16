import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SortControl from '@/components/collection/SortControl.vue'

function getSelectItemLabels(): string[] {
  return Array.from(document.querySelectorAll('[data-slot="select-item"]'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean)
}

describe('SortControl', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders exactly the four approved sort options', async () => {
    const wrapper = mount(SortControl, {
      props: { modelValue: 'name_asc' },
      attachTo: document.body
    })

    const trigger = wrapper.find('[data-slot="select-trigger"]')
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(getSelectItemLabels()).toEqual([
      'Name A–Z',
      'Rating High–Low',
      'Weight Light–Heavy',
      'Recently Played'
    ])

    wrapper.unmount()
  })

  it('shows the selected label in the trigger', async () => {
    const wrapper = mount(SortControl, {
      props: { modelValue: 'recently_played' as any },
      attachTo: document.body
    })

    await flushPromises()
    expect(wrapper.text()).toContain('Sort by: Recently Played')
    wrapper.unmount()
  })

  it('updates model when a portal item is selected', async () => {
    const wrapper = mount(SortControl, {
      props: { modelValue: 'name_asc' },
      attachTo: document.body
    })

    const trigger = wrapper.find('[data-slot="select-trigger"]')
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const item = Array.from(document.querySelectorAll('[data-slot="select-item"]')).find(
      el => el.textContent?.trim() === 'Rating High–Low'
    )
    expect(item).toBeTruthy()
    await item!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['rating_desc'])
    wrapper.unmount()
  })

  it('supports keyboard navigation to select the last item', async () => {
    const wrapper = mount(SortControl, {
      props: { modelValue: 'name_asc' },
      attachTo: document.body
    })

    const trigger = wrapper.find('[data-slot="select-trigger"]')
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const items = document.querySelectorAll('[data-slot="select-item"]')
    expect(items.length).toBe(4)

    await items[items.length - 1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['recently_played'])
    wrapper.unmount()
  })
})
