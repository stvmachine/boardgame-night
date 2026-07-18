import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SessionDetailsEditor from '@/components/session/SessionDetailsEditor.vue'
import type { NightSession } from '@/generated/operations'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

afterEach(() => {
  document.body.innerHTML = ''
})

function buildSession(overrides: Partial<NightSession> = {}): NightSession {
  return {
    id: '1',
    title: 'Friday Game Night',
    description: 'Bring snacks',
    state: 'PICKING',
    scheduledAt: '2026-07-18T19:00:00Z',
    location: "Alice's place",
    capacity: 6,
    attendeeCount: 3,
    timeBudgetMinutes: 120,
    complexityPreference: 'Any',
    previousState: null,
    host: { id: '1', username: 'alice', displayName: 'Alice' },
    group: {
      id: '1',
      name: 'Night Owls',
      inviteCode: null,
      myRole: 'member',
      members: []
    },
    attendances: [],
    pickedGame: null,
    suggestions: null,
    ...overrides
  } as NightSession
}

async function mountEditor(props: { open?: boolean; session?: NightSession; loading?: boolean; error?: string | null } = {}) {
  const wrapper = mount(SessionDetailsEditor, {
    props: {
      open: props.open ?? true,
      session: props.session ?? buildSession(),
      loading: props.loading ?? false,
      error: props.error ?? null
    },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

function query(selector: string) {
  return document.body.querySelector(selector)
}

function queryAll(selector: string) {
  return document.body.querySelectorAll(selector)
}

describe('SessionDetailsEditor', () => {
  it('renders the dialog when open is true', async () => {
    await mountEditor({ open: true })

    expect(query('[data-slot="dialog-title"]')?.textContent).toBe('Edit session details')
    expect(query('[data-slot="dialog-description"]')?.textContent).toContain('Game preferences stay locked while picking')
  })

  it('does not render dialog content when open is false', async () => {
    const wrapper = await mountEditor({ open: false })

    expect(wrapper.find('[data-slot="dialog-content"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('initializes form fields from the session', async () => {
    await mountEditor({ open: true, session: buildSession() })

    expect((query('input#session-title') as HTMLInputElement)?.value).toBe('Friday Game Night')
    expect((query('textarea#session-description') as HTMLTextAreaElement)?.value).toBe('Bring snacks')
    expect((query('input#session-location') as HTMLInputElement)?.value).toBe("Alice's place")
    expect((query('input#session-capacity') as HTMLInputElement)?.value).toBe('6')
  })

  it('focuses the title input when opened', async () => {
    const wrapper = await mountEditor({ open: false, session: buildSession() })
    await flushPromises()

    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(document.activeElement).toBe(query('input#session-title'))
    wrapper.unmount()
  })

  it('emits update:open(false) when Cancel is clicked', async () => {
    const wrapper = await mountEditor({ open: true })

    const cancelButton = query('[data-testid="cancel-details"]') as HTMLButtonElement
    cancelButton.click()
    await flushPromises()

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('prevents save when title is empty', async () => {
    const wrapper = await mountEditor({ open: true })

    const titleInput = query('input#session-title') as HTMLInputElement
    titleInput.value = ''
    titleInput.dispatchEvent(new Event('input'))
    await flushPromises()

    const form = query('form') as HTMLFormElement
    form.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(wrapper.emitted('save')).toBeUndefined()
    wrapper.unmount()
  })

  it('prevents save when title exceeds 200 characters', async () => {
    const wrapper = await mountEditor({ open: true })

    const titleInput = query('input#session-title') as HTMLInputElement
    titleInput.value = 'a'.repeat(201)
    titleInput.dispatchEvent(new Event('input'))
    await flushPromises()

    const form = query('form') as HTMLFormElement
    form.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(document.body.textContent).toContain('Title must be 200 characters or less')
    wrapper.unmount()
  })

  it('prevents save when capacity is not positive', async () => {
    const wrapper = await mountEditor({ open: true })

    const capacityInput = query('input#session-capacity') as HTMLInputElement
    capacityInput.value = '0'
    capacityInput.dispatchEvent(new Event('input'))
    await flushPromises()

    const form = query('form') as HTMLFormElement
    form.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(document.body.textContent).toContain('Capacity must be at least 1')
    wrapper.unmount()
  })

  it('emits save with the exact ordinary fields payload', async () => {
    const wrapper = await mountEditor({ open: true })

    const titleInput = query('input#session-title') as HTMLInputElement
    titleInput.value = 'Updated Night'
    titleInput.dispatchEvent(new Event('input'))

    const descriptionInput = query('textarea#session-description') as HTMLTextAreaElement
    descriptionInput.value = 'New description'
    descriptionInput.dispatchEvent(new Event('input'))

    const locationInput = query('input#session-location') as HTMLInputElement
    locationInput.value = "Bob's place"
    locationInput.dispatchEvent(new Event('input'))

    const capacityInput = query('input#session-capacity') as HTMLInputElement
    capacityInput.value = '4'
    capacityInput.dispatchEvent(new Event('input'))

    await flushPromises()

    const form = query('form') as HTMLFormElement
    form.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(wrapper.emitted('save')).toHaveLength(1)
    const payload = wrapper.emitted('save')![0][0] as any
    expect(payload).toMatchObject({
      sessionId: '1',
      title: 'Updated Night',
      description: 'New description',
      location: "Bob's place",
      capacity: 4
    })
    expect(payload).not.toHaveProperty('timeBudgetMinutes')
    expect(payload).not.toHaveProperty('complexityPreference')
    wrapper.unmount()
  })

  it('disables Save and Cancel while loading', async () => {
    await mountEditor({ open: true, loading: true })

    const submitButton = query('[data-testid="save-details"]') as HTMLButtonElement
    const cancelButton = query('[data-testid="cancel-details"]') as HTMLButtonElement

    expect(submitButton.disabled).toBe(true)
    expect(cancelButton.disabled).toBe(true)
  })

  it('shows Saving… and aria-busy while loading', async () => {
    await mountEditor({ open: true, loading: true })

    const submitButton = query('[data-testid="save-details"]') as HTMLButtonElement
    expect(submitButton.textContent).toBe('Saving…')
    expect(submitButton.getAttribute('aria-busy')).toBe('true')
  })

  it('renders the exact error copy and focuses the error summary', async () => {
    const wrapper = await mountEditor({ open: true })
    await wrapper.setProps({ error: 'Backend failure' })
    await flushPromises()

    const errorSummary = query('[data-testid="details-error"]') as HTMLDivElement
    expect(errorSummary).not.toBeNull()
    expect(errorSummary.textContent).toContain("Couldn't save session details")
    expect(errorSummary.getAttribute('role')).toBe('alert')
    expect(document.activeElement).toBe(errorSummary)
    wrapper.unmount()
  })

  it('does not close the dialog on save failure', async () => {
    const wrapper = await mountEditor({ open: true, error: 'Backend failure' })
    await flushPromises()

    expect(query('[data-slot="dialog-content"]')).not.toBeNull()
    expect(wrapper.emitted('update:open')).toBeUndefined()
    wrapper.unmount()
  })

  it('restores server values after cancel and reopen', async () => {
    const wrapper = await mountEditor({ open: true, session: buildSession() })

    const titleInput = query('input#session-title') as HTMLInputElement
    titleInput.value = 'Dirty title'
    titleInput.dispatchEvent(new Event('input'))
    await flushPromises()

    const cancelButton = query('[data-testid="cancel-details"]') as HTMLButtonElement
    cancelButton.click()
    await wrapper.setProps({ open: false })
    await flushPromises()

    await wrapper.setProps({ open: true })
    await flushPromises()

    expect((query('input#session-title') as HTMLInputElement).value).toBe('Friday Game Night')
    wrapper.unmount()
  })

  it('does not expose time budget or complexity preference controls', async () => {
    await mountEditor({ open: true })

    const labels = Array.from(queryAll('label')).map(l => l.textContent?.trim() ?? '')
    expect(labels).not.toContain('Time budget')
    expect(labels).not.toContain('Complexity preference')
    expect(document.body.textContent).toContain('Game preferences stay locked while picking')
  })

  it('renders in the correct field order', async () => {
    await mountEditor({ open: true })

    const inputs = Array.from(queryAll('input, textarea')).map(el => el.getAttribute('id'))
    expect(inputs).toEqual([
      'session-title',
      'session-description',
      'session-datetime',
      'session-location',
      'session-capacity'
    ])
  })
})
