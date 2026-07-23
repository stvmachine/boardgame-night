import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CollectorsSection from '@/components/layout/CollectorsSection.vue'

describe('CollectorsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountSection(selected = new Set<string>(), currentUsername?: string) {
    return mount(CollectorsSection, {
      props: {
        usernames: ['alice', 'bob'],
        selected,
        currentUsername
      }
    })
  }

  it('marks the bound BGG username as You', () => {
    const wrapper = mountSection(new Set(), 'alice')

    expect(wrapper.text()).toContain('alice')
    expect(wrapper.text()).toContain('You')
  })

  it('renders Select All and Deselect All buttons', () => {
    const wrapper = mountSection()
    expect(wrapper.text()).toContain('Select All')
    expect(wrapper.text()).toContain('Deselect All')
  })

  it('renders a checkbox per owner', () => {
    const wrapper = mountSection()
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(2)
  })

  it('emits toggle when a checkbox changes', async () => {
    const wrapper = mountSection()
    const checkbox = wrapper.findAll('input[type="checkbox"]')[0]
    await checkbox.setValue(true)
    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')![0]).toEqual(['alice'])
  })

  it('emits select-all when Select All is clicked', async () => {
    const wrapper = mountSection()
    const buttons = wrapper.findAll('button')
    const select = buttons.find(b => b.text() === 'Select All')
    await select!.trigger('click')
    expect(wrapper.emitted('select-all')).toBeTruthy()
  })

  it('emits deselect-all when Deselect All is clicked', async () => {
    const wrapper = mountSection()
    const buttons = wrapper.findAll('button')
    const deselect = buttons.find(b => b.text() === 'Deselect All')
    await deselect!.trigger('click')
    expect(wrapper.emitted('deselect-all')).toBeTruthy()
  })
})
