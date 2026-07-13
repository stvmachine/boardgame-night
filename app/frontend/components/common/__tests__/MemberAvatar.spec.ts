import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

describe('MemberAvatar', () => {
  it('renders AvatarFallback with initial and an M3 token class', () => {
    const wrapper = mount(MemberAvatar, {
      props: { username: 'Alice' }
    })

    const fallback = wrapper.find('[data-slot="avatar-fallback"]')
    expect(fallback.exists()).toBe(true)
    expect(fallback.text()).toBe('A')

    const classes = fallback.classes().join(' ')
    expect(classes).not.toContain('bg-blue-500')
    expect(classes).toMatch(/bg-(primary|secondary|tertiary|error|surface|inverse|warning|success|primary-fixed|secondary-fixed|tertiary-fixed)/)
  })
})
