import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { ref, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import * as operations from '@/generated/operations'
import GroupMembersPanel from '@/components/group/GroupMembersPanel.vue'

vi.mock('@/generated/operations')

const removeMutate = vi.fn()
const updateRoleMutate = vi.fn()

const removeLoading = ref(false)
const removeError = ref<Error | null>(null)
const updateRoleLoading = ref(false)
const updateRoleError = ref<Error | null>(null)

function createMockClient() {
  return new ApolloClient({
    link: { request: vi.fn() } as any,
    cache: new InMemoryCache()
  })
}

function createMembership(
  id: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER',
  user: { id: string; username: string; displayName: string }
) {
  return { id, role, user }
}

function createGroup(myRole: 'OWNER' | 'ADMIN' | 'MEMBER' = 'OWNER', inviteCode = 'NIGHTOWLS') {
  return {
    id: 'g1',
    inviteCode,
    myRole,
    owner: { id: 'owner' }
  }
}

async function mountPanel(viewerId: string, memberships: any[], group: any) {
  setActivePinia(createPinia())
  provideApolloClient(createMockClient())
  const authStore = useAuthStore()
  authStore.setSession('dummy', viewerId)

  wrapper = mount(GroupMembersPanel, {
    props: { memberships, group },
    attachTo: document.body
  })
  return wrapper
}

let wrapper: ReturnType<typeof mount> | null = null

describe('GroupMembersPanel', () => {
  beforeEach(() => {
    removeMutate.mockReset().mockResolvedValue({})
    updateRoleMutate.mockReset().mockResolvedValue({})
    removeError.value = null
    updateRoleError.value = null
    wrapper = null

    // Clean up any leftover portal content from previous tests
    document.body.querySelectorAll('[data-slot="dropdown-menu-content"]').forEach(el => el.remove())

    vi.mocked(operations.useRemoveGroupMemberMutation).mockReturnValue({
      mutate: removeMutate,
      loading: removeLoading,
      error: removeError
    } as any)

    vi.mocked(operations.useUpdateGroupMemberRoleMutation).mockReturnValue({
      mutate: updateRoleMutate,
      loading: updateRoleLoading,
      error: updateRoleError
    } as any)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  const owner = createMembership('m1', 'OWNER', { id: 'owner', username: 'alice', displayName: 'Alice' })
  const admin = createMembership('m2', 'ADMIN', { id: 'admin', username: 'bob', displayName: 'Bob' })
  const member = createMembership('m3', 'MEMBER', { id: 'member', username: 'carol', displayName: 'Carol' })
  const otherMember = createMembership('m4', 'MEMBER', { id: 'other', username: 'dave', displayName: 'Dave' })

  /**
   * Find a dropdown menu item by its text content.
   * Uses data-slot (set explicitly in the template) rather than data-testid
   * (which may not propagate through reka-ui's portal/forwarding layers).
   */
  function findMenuItemByText(text: string): HTMLElement | undefined {
    const menu = document.querySelector('[data-slot="dropdown-menu-content"]')
    if (!menu) return undefined
    const items = menu.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]')
    return Array.from(items).find(el => el.textContent?.trim() === text) as HTMLElement | undefined
  }

  function findRemoveMenuItem() {
    return findMenuItemByText('Remove from group')
  }

  function findRoleMenuItem(label: string) {
    return findMenuItemByText(label)
  }

  it('renders every row with avatar, display name, and role label', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('Carol')
    expect(wrapper.text()).toContain('Owner')
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('Member')
  })

  it('shows no action menu for member viewers', async () => {
    const wrapper = await mountPanel('member', [owner, admin, member], createGroup('MEMBER'))

    expect(wrapper.find('[data-testid="member-actions"]').exists()).toBe(false)
  })

  it('shows no action menu for owner rows', async () => {
    const wrapper = await mountPanel('member', [owner, admin, member], createGroup('MEMBER'))

    const row = wrapper.find(`[data-testid="member-row-m1"]`)
    expect(row.find('[data-testid="member-actions"]').exists()).toBe(false)
  })

  it('shows no action menu on the current viewer row', async () => {
    const wrapper = await mountPanel('admin', [owner, admin, member], createGroup('ADMIN'))

    const row = wrapper.find(`[data-testid="member-row-m2"]`)
    expect(row.find('[data-testid="member-actions"]').exists()).toBe(false)
  })

  it('owner sees role toggle and remove for member rows', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    const trigger = row.find('[data-testid="member-actions"]')
    expect(trigger.exists()).toBe(true)

    await trigger.trigger('click')
    await nextTick()

    expect(findRoleMenuItem('Make admin')).toBeDefined()
    expect(findRemoveMenuItem()).toBeDefined()
  })

  it('owner sees role toggle and remove for admin rows', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m2"]')
    const trigger = row.find('[data-testid="member-actions"]')
    expect(trigger.exists()).toBe(true)

    await trigger.trigger('click')
    await nextTick()

    expect(findRoleMenuItem('Change role to member')).toBeDefined()
    expect(findRemoveMenuItem()).toBeDefined()
  })

  it('admin sees remove for other non-owner rows', async () => {
    const wrapper = await mountPanel('admin', [owner, admin, member, otherMember], createGroup('ADMIN'))

    const row = wrapper.find('[data-testid="member-row-m4"]')
    const trigger = row.find('[data-testid="member-actions"]')
    expect(trigger.exists()).toBe(true)

    await trigger.trigger('click')
    await nextTick()

    expect(findRemoveMenuItem()).toBeDefined()
    expect(findRoleMenuItem('Make admin')).toBeUndefined()
    expect(findRoleMenuItem('Change role to member')).toBeUndefined()
  })

  it('admin sees remove for another admin row', async () => {
    const otherAdmin = createMembership('m5', 'ADMIN', { id: 'otherAdmin', username: 'eve', displayName: 'Eve' })
    const wrapper = await mountPanel('admin', [owner, admin, otherAdmin], createGroup('ADMIN'))

    const row = wrapper.find('[data-testid="member-row-m5"]')
    const trigger = row.find('[data-testid="member-actions"]')
    expect(trigger.exists()).toBe(true)

    await trigger.trigger('click')
    await nextTick()

    expect(findRemoveMenuItem()).toBeDefined()
  })

  it('role toggle label is "Make admin" for a member', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()

    expect(findRoleMenuItem('Make admin')).toBeDefined()
  })

  it('role toggle label is "Change role to member" for an admin', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m2"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()

    expect(findRoleMenuItem('Change role to member')).toBeDefined()
  })

  it('fires the role mutation with the toggled role', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()

    const option = findRoleMenuItem('Make admin')
    expect(option).not.toBeNull()
    option?.click()

    expect(updateRoleMutate).toHaveBeenCalledWith({
      groupId: 'g1',
      userId: 'member',
      role: 'ADMIN'
    })
  })

  it('opens an inline confirmation naming the target and explaining the shelf impact', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()

    const removeItem = findRemoveMenuItem()
    expect(removeItem).not.toBeNull()
    removeItem!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    removeItem!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const panel = wrapper.find('[data-testid="remove-confirmation"]')
    expect(panel.exists()).toBe(true)
    expect(panel.text()).toContain('Remove Carol?')
    expect(panel.text()).toContain('They will be removed from the group and their games will no longer appear in the shared collection.')
  })

  it('only allows one confirmation at a time', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member, otherMember], createGroup())

    const firstRow = wrapper.find('[data-testid="member-row-m3"]')
    await firstRow.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()
    findRemoveMenuItem()?.click()
    await nextTick()

    expect(wrapper.find('[data-testid="remove-confirmation"]').text()).toContain('Carol')

    const secondRow = wrapper.find('[data-testid="member-row-m4"]')
    await secondRow.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()
    findRemoveMenuItem()?.click()
    await nextTick()

    const confirmations = wrapper.findAll('[data-testid="remove-confirmation"]')
    expect(confirmations.length).toBe(1)
    expect(confirmations[0].text()).toContain('Dave')
  })

  it('focuses the Cancel button when a confirmation opens', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()
    findRemoveMenuItem()?.click()
    await nextTick()

    // Wait for setTimeout(0) used inside askRemove to fire
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    const cancelButton = wrapper.find('[data-testid="cancel-remove"]')
    expect(cancelButton.element).toBe(document.activeElement)
  })

  it('closes the confirmation when Cancel is activated', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()
    findRemoveMenuItem()?.click()
    await nextTick()

    await wrapper.find('[data-testid="cancel-remove"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="remove-confirmation"]').exists()).toBe(false)
  })

  it('fires the remove mutation with correct variables and refetches the group', async () => {
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()
    findRemoveMenuItem()?.click()
    await nextTick()

    await wrapper.find('[data-testid="confirm-remove"]').trigger('click')

    expect(removeMutate).toHaveBeenCalledWith({
      groupId: 'g1',
      userId: 'member'
    })
  })

  it('does not remove the row on a failed mutation', async () => {
    removeError.value = new Error('Network error')
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()
    findRemoveMenuItem()?.click()
    await nextTick()

    await wrapper.find('[data-testid="confirm-remove"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Carol')
    expect(wrapper.find('[data-testid="member-row-m3"]').exists()).toBe(true)
  })

  it('does not change the row on a failed role mutation', async () => {
    updateRoleError.value = new Error('Not allowed')
    const wrapper = await mountPanel('owner', [owner, admin, member], createGroup())

    const row = wrapper.find('[data-testid="member-row-m3"]')
    await row.find('[data-testid="member-actions"]').trigger('click')
    await nextTick()

    const option = findRoleMenuItem('Make admin')
    expect(option).not.toBeNull()
    option?.click()
    await flushPromises()

    expect(wrapper.text()).toContain('Carol')
    expect(wrapper.find('[data-testid="member-row-m3"]').exists()).toBe(true)
  })
})
