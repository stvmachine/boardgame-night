import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { ActiveGroupProvider } from '@/contexts/ActiveGroupContext'

function renderTabBar() {
  return render(
    <MemoryRouter>
      <ActiveGroupProvider>
        <MobileTabBar />
      </ActiveGroupProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('MobileTabBar quick actions', () => {
  it('offers known application routes without an active group', async () => {
    const user = userEvent.setup()
    renderTabBar()

    await user.click(screen.getByRole('button', { name: 'New' }))

    expect(screen.getByRole('link', { name: 'Create a group' })).toHaveAttribute('href', '/groups')
    expect(screen.getByRole('link', { name: 'Browse library' })).toHaveAttribute('href', '/collection')
  })

  it('derives schedule and library routes from the active group token', async () => {
    localStorage.setItem(
      'bgg-night-active-group',
      JSON.stringify({ token: 'NIGHTOWLS', name: 'Night Owls', bggUsernames: ['alex'] }),
    )
    const user = userEvent.setup()
    renderTabBar()

    await user.click(screen.getByRole('button', { name: 'New' }))

    expect(screen.getByRole('link', { name: 'Schedule a game night' })).toHaveAttribute(
      'href',
      '/g/NIGHTOWLS',
    )
    expect(screen.getByRole('link', { name: 'Browse library' })).toHaveAttribute(
      'href',
      '/collection?group=NIGHTOWLS',
    )
  })
})
