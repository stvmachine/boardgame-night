import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

describe('Primitive M3 token styling', () => {
  it('Button primary uses M3 primary tokens', () => {
    const wrapper = mount(Button, { props: { variant: 'primary' }, slots: { default: 'Save' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('bg-primary')
    expect(classes).toContain('text-on-primary')
  })

  it('Badge draft uses M3 semantic alias tokens', () => {
    const wrapper = mount(Badge, { props: { variant: 'draft' }, slots: { default: 'Draft' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('bg-badge-draft')
    expect(classes).toContain('text-badge-draft-foreground')
  })

  it('Badge invited uses M3 semantic alias tokens', () => {
    const wrapper = mount(Badge, { props: { variant: 'invited' }, slots: { default: 'Invited' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('bg-badge-invited')
    expect(classes).toContain('text-badge-invited-foreground')
  })

  it('Badge picking uses M3 semantic alias tokens', () => {
    const wrapper = mount(Badge, { props: { variant: 'picking' }, slots: { default: 'Picking' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('bg-badge-picking')
    expect(classes).toContain('text-badge-picking-foreground')
  })

  it('Badge completed uses M3 semantic alias tokens', () => {
    const wrapper = mount(Badge, { props: { variant: 'completed' }, slots: { default: 'Completed' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('bg-badge-completed')
    expect(classes).toContain('text-badge-completed-foreground')
  })

  it('Card uses M3 Level 1 surface tokens', () => {
    const wrapper = mount(Card, { slots: { default: 'Content' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('rounded-xl')
    expect(classes).toContain('bg-surface-container')
    expect(classes).toContain('border-outline')
  })

  it('CardHeader and CardTitle use M3 typography', () => {
    const header = mount(CardHeader, { slots: { default: 'H' } })
    const title = mount(CardTitle, { slots: { default: 'T' } })
    expect(header.classes().join(' ')).toContain('p-6')
    expect(title.classes().join(' ')).toContain('text-on-surface')
  })

  it('Avatar is circular with size support', () => {
    const wrapper = mount(Avatar, { props: { size: 'sm' }, slots: { default: 'A' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('rounded-full')
  })

  it('AvatarFallback renders white text on a neutral background', () => {
    const wrapper = mount(Avatar, {
      slots: {
        default: () => h(AvatarFallback, null, () => 'AB')
      }
    })
    const fallback = wrapper.find('[data-slot="avatar-fallback"]')
    expect(fallback.exists()).toBe(true)
    expect(fallback.classes().join(' ')).toContain('text-white')
  })

  it('Skeleton uses M3 surface-variant with pulse animation', () => {
    const wrapper = mount(Skeleton, { props: { class: 'h-4 w-20' } })
    const classes = wrapper.classes().join(' ')
    expect(classes).toContain('animate-pulse')
    expect(classes).toContain('bg-surface-variant')
  })

  it('Slider is a source-owned reka-ui wrapper with two-thumb support', async () => {
    const modelValue = ref([2, 7])
    const wrapper = mount(Slider, {
      props: { modelValue: modelValue.value, min: 1, max: 10, step: 1 },
      attrs: { 'onUpdate:modelValue': (v: number[]) => { modelValue.value = v } }
    })

    const thumbs = wrapper.findAll('[data-slot="slider-thumb"]')
    expect(thumbs.length).toBe(2)
  })

  it('Slider uses M3 tokens instead of shadcn default colors', () => {
    const wrapper = mount(Slider, { props: { modelValue: [2, 7], min: 1, max: 10, step: 1 } })
    const html = wrapper.html()
    expect(html).toContain('bg-surface-variant')
    expect(html).toContain('bg-primary')
    expect(html).toContain('bg-surface-container')
  })

  it('Slider passes aria-labels to each thumb', () => {
    const wrapper = mount(Slider, {
      props: { modelValue: [2, 7], min: 1, max: 10, step: 1, thumbLabels: ['Minimum players', 'Maximum players'] }
    })
    const thumbs = wrapper.findAll('[data-slot="slider-thumb"]')
    expect(thumbs[0].attributes('aria-label')).toBe('Minimum players')
    expect(thumbs[1].attributes('aria-label')).toBe('Maximum players')
  })

  it('Slider does not import icons from a second icon library', () => {
    const source = `
import { Slider } from '@/components/ui/slider'
import SliderSource from '@/components/ui/slider/Slider.vue'
`
    expect(source).not.toContain('@lucide/vue')
    // The actual source file must not reference lucide
    const fs = require('fs')
    const path = require('path')
    const sliderPath = path.resolve(__dirname, '../slider/Slider.vue')
    const content = fs.readFileSync(sliderPath, 'utf-8')
    expect(content).not.toContain('@lucide/vue')
    expect(content).not.toContain('lucide')
  })
})
