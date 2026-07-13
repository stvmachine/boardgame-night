import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

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
})
