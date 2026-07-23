import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick, ref } from 'vue'
import NavSidebarContent from '@/components/layout/NavSidebarContent.vue'
import { useCollectorsStore } from '@/stores/collectors'

const currentUser = ref({ bggUsername: 'alice' })
const validateUsername = vi.fn()

vi.mock('@/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    currentUser,
    isAuthenticated: ref(true),
    signOut: vi.fn()
  }))
}))

vi.mock('@/composables/useRefreshCollection', () => ({
  useRefreshCollection: vi.fn(() => ({
    refresh: vi.fn(),
    isRefreshing: ref(false),
    cooldownFor: vi.fn(() => 0),
    initFromSyncStatuses: vi.fn()
  }))
}))

vi.mock('@/generated/operations', () => ({
  useMergedCollectionQuery: vi.fn(() => ({
    result: ref({ mergedCollection: { items: [], syncStatuses: [] } })
  })),
  useValidateBggUsernameMutation: vi.fn(() => ({ mutate: validateUsername }))
}))

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/collection', component: { template: '<div />' } },
      { path: '/groups', component: { template: '<div />' } },
      { path: '/account', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/signup', component: { template: '<div />' } },
      { path: '/hot', component: { template: '<div />' } }
    ]
  })
}

async function mountSidebar() {
  const router = createTestRouter()
  await router.push('/')
  await router.isReady()

  return mount(NavSidebarContent, {
    global: { plugins: [router] }
  })
}

describe('NavSidebarContent collectors', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    currentUser.value = { bggUsername: 'alice' }
    validateUsername.mockReset()
  })

  it('does not offer to remove the bound BGG username', async () => {
    useCollectorsStore().set(['alice', 'bob'])

    const wrapper = await mountSidebar()
    const removeButtons = wrapper.findAll('button').filter(button => button.text() === 'Remove')

    expect(removeButtons).toHaveLength(1)
    expect(removeButtons[0].element.closest('li')?.textContent).toContain('bob')
  })

  it('shows validation loading and a toast without adding an unknown BGG user', async () => {
    let resolveValidation: (value: any) => void = () => {}
    validateUsername.mockReturnValue(new Promise(resolve => {
      resolveValidation = resolve
    }))

    const wrapper = await mountSidebar()
    await wrapper.get('#drawer-username').setValue('missing-user')
    await wrapper.findAll('button').find(button => button.text() === 'Add')!.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Validating…')
    expect(wrapper.findAll('button').find(button => button.text().includes('Validating'))?.attributes('disabled')).toBeDefined()

    resolveValidation({
      data: {
        validateBggUsername: {
          validationResult: { valid: true, exists: false, username: 'missing-user', avatar: null }
        }
      }
    })
    await flushPromises()

    expect(useCollectorsStore().usernames).not.toContain('missing-user')
    expect(wrapper.get('[role="alert"]').text()).toContain('BGG user not found')
  })
})
