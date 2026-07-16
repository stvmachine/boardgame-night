import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayerRangeSlider from '@/components/collection/PlayerRangeSlider.vue'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

describe('PlayerRangeSlider', () => {
  function mountSlider(modelValue: { min: number; max: number } | null = null) {
    return mount(PlayerRangeSlider, {
      props: {
        modelValue,
        'onUpdate:modelValue': vi.fn()
      }
    })
  }

  it('renders two thumbs with minimum and maximum aria labels', () => {
    const wrapper = mountSlider(null)
    const thumbs = wrapper.findAll('[data-slot="slider-thumb"]')
    expect(thumbs.length).toBe(2)
    expect(thumbs[0].attributes('aria-label')).toBe('Minimum players')
    expect(thumbs[1].attributes('aria-label')).toBe('Maximum players')
  })

  it('displays the full 1–10+ label when modelValue is null', () => {
    const wrapper = mountSlider(null)
    expect(wrapper.text()).toContain('1–10+ players')
  })

  it('displays a single-count range as "N players"', () => {
    const wrapper = mountSlider({ min: 4, max: 4 })
    expect(wrapper.text()).toContain('4 players')
  })

  it('displays a regular range as "N–M players"', () => {
    const wrapper = mountSlider({ min: 3, max: 7 })
    expect(wrapper.text()).toContain('3–7 players')
  })

  it('renders 10+ when the maximum is capped at 10', () => {
    const wrapper = mountSlider({ min: 8, max: 10 })
    expect(wrapper.text()).toContain('8–10+ players')
  })

  it('exposes a 44 px or larger touch target via the expanded pseudo-element', () => {
    const wrapper = mountSlider(null)
    const thumb = wrapper.find('[data-slot="slider-thumb"]')
    expect(thumb.classes().join(' ')).toContain('after:-inset-4')
  })

  it('emits null when the reset button is clicked', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(PlayerRangeSlider, {
      props: {
        modelValue: { min: 3, max: 6 },
        'onUpdate:modelValue': onUpdate
      }
    })
    await wrapper.find('button[aria-label="Clear player range"]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(null)
  })

  it('hides the reset button when the range is null', () => {
    const wrapper = mountSlider(null)
    expect(wrapper.find('button[aria-label="Clear player range"]').exists()).toBe(false)
  })
})
