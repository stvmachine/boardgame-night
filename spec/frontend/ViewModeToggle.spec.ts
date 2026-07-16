import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ViewModeToggle from '@/components/collection/ViewModeToggle.vue'
import type { ViewMode } from '@/stores/filters'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

function mountToggle(modelValue: ViewMode = 'grid') {
  return mount(ViewModeToggle, {
    props: {
      modelValue,
      'onUpdate:modelValue': vi.fn()
    }
  })
}

describe('ViewModeToggle', () => {
  it('renders Grid view and List view buttons with aria-labels', () => {
    const wrapper = mountToggle()
    const buttons = wrapper.findAll('[data-slot="toggle-group-item"]')
    expect(buttons.length).toBe(2)
    expect(buttons[0].attributes('aria-label')).toBe('Grid view')
    expect(buttons[1].attributes('aria-label')).toBe('List view')
  })

  it('selects grid by default', () => {
    const wrapper = mountToggle()
    const grid = wrapper.find('button[aria-label="Grid view"]')
    const list = wrapper.find('button[aria-label="List view"]')
    expect(grid.attributes('aria-pressed')).toBe('true')
    expect(list.attributes('aria-pressed')).toBe('false')
  })

  it('selects list when modelValue is list', () => {
    const wrapper = mountToggle('list')
    const grid = wrapper.find('button[aria-label="Grid view"]')
    const list = wrapper.find('button[aria-label="List view"]')
    expect(grid.attributes('aria-pressed')).toBe('false')
    expect(list.attributes('aria-pressed')).toBe('true')
  })

  it('emits list when the list button is clicked', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(ViewModeToggle, {
      props: { modelValue: 'grid', 'onUpdate:modelValue': onUpdate }
    })

    await wrapper.find('button[aria-label="List view"]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith('list')
  })

  it('emits grid when the grid button is clicked', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(ViewModeToggle, {
      props: { modelValue: 'list', 'onUpdate:modelValue': onUpdate }
    })

    await wrapper.find('button[aria-label="Grid view"]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith('grid')
  })

  it('has a minimum 44px hit area on each button', () => {
    const wrapper = mountToggle()
    const buttons = wrapper.findAll('button')
    for (const button of buttons) {
      const classes = button.classes()
      expect(classes).toContain('min-h-11')
      expect(classes).toContain('min-w-11')
    }
  })
})
