import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppShell from '@/components/layout/AppShell.vue'

describe('AppShell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders header, sidebar slot, and main content area', () => {
    const wrapper = mount(AppShell, {
      slots: {
        sidebar: '<div data-testid="sidebar-slot">Sidebar</div>',
        default: '<div data-testid="main-content">Main</div>'
      }
    })

    expect(wrapper.text()).toContain('BoardGame Night')
    expect(wrapper.find('[data-testid="sidebar-slot"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="main-content"]').exists()).toBe(true)
  })

  it('shows mobile drawer toggle on narrow viewports', () => {
    const wrapper = mount(AppShell, {
      slots: {
        sidebar: '<div>Sidebar</div>',
        default: '<div>Main</div>'
      }
    })

    expect(wrapper.find('[data-testid="mobile-menu-toggle"]').exists()).toBe(true)
  })
})
