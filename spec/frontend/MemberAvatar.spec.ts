import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MemberAvatar from '@/components/common/MemberAvatar.vue'

describe('MemberAvatar', () => {
  it('renders the first initial of the username', () => {
    const wrapper = mount(MemberAvatar, { props: { username: 'alice' } })
    expect(wrapper.text()).toContain('A')
  })

  it('shows the username when showUsername is true', () => {
    const wrapper = mount(MemberAvatar, { props: { username: 'alice', showUsername: true } })
    expect(wrapper.text()).toContain('alice')
  })

  it('uses a deterministic color for the same username', () => {
    const wrapperA = mount(MemberAvatar, { props: { username: 'alice' } })
    const wrapperB = mount(MemberAvatar, { props: { username: 'alice' } })
    const classA = wrapperA.find('span[title="alice"]').classes()
    const classB = wrapperB.find('span[title="alice"]').classes()
    expect(classA).toEqual(classB)
  })
})
