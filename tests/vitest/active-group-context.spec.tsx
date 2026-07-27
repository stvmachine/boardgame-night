import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ActiveGroupProvider, useActiveGroup } from '@/contexts/ActiveGroupContext'
import { useState } from 'react'

const STORAGE_KEY = 'bgg-night-active-group'

function TestConsumer() {
  const ctx = useActiveGroup()
  return (
    <div>
      <div data-testid="token">{ctx.token ?? '(null)'}</div>
      <div data-testid="name">{ctx.name ?? '(null)'}</div>
      <div data-testid="usernames">{ctx.bggUsernames.join(',') || '(empty)'}</div>
    </div>
  )
}

function SetController() {
  const { setActiveGroup } = useActiveGroup()
  const [clicked, setClicked] = useState(false)

  if (!clicked) {
    return <button data-testid="set-btn" onClick={() => { setActiveGroup('tok', 'My Group', ['a', 'b']); setClicked(true) }}>Set</button>
  }

  return (
    <div>
      <button data-testid="set-btn" disabled>Set</button>
      <TestConsumer />
    </div>
  )
}

function ClearController() {
  const { clearActiveGroup } = useActiveGroup()
  const [clicked, setClicked] = useState(false)

  return (
    <div>
      <button
        data-testid="clear-btn"
        disabled={clicked}
        onClick={() => { clearActiveGroup(); setClicked(true) }}
      >
        Clear
      </button>
      <TestConsumer />
    </div>
  )
}

describe('ActiveGroupProvider + useActiveGroup', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
  })

  it('initializes with default state', () => {
    render(
      <ActiveGroupProvider>
        <TestConsumer />
      </ActiveGroupProvider>,
    )
    expect(screen.getByTestId('token')).toHaveTextContent('(null)')
    expect(screen.getByTestId('name')).toHaveTextContent('(null)')
    expect(screen.getByTestId('usernames')).toHaveTextContent('(empty)')
  })

  it('initializes from localStorage data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 't', name: 'G', bggUsernames: ['u'] }))
    render(
      <ActiveGroupProvider>
        <TestConsumer />
      </ActiveGroupProvider>,
    )
    expect(screen.getByTestId('token')).toHaveTextContent('t')
    expect(screen.getByTestId('name')).toHaveTextContent('G')
    expect(screen.getByTestId('usernames')).toHaveTextContent('u')
  })

  it('handles corrupted localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{')
    render(
      <ActiveGroupProvider>
        <TestConsumer />
      </ActiveGroupProvider>,
    )
    expect(screen.getByTestId('token')).toHaveTextContent('(null)')
  })

  it('setActiveGroup updates state and persists', async () => {
    render(
      <ActiveGroupProvider>
        <SetController />
      </ActiveGroupProvider>,
    )

    await act(async () => {
      screen.getByTestId('set-btn').click()
    })

    expect(screen.getByTestId('token')).toHaveTextContent('tok')
    expect(screen.getByTestId('name')).toHaveTextContent('My Group')
    expect(screen.getByTestId('usernames')).toHaveTextContent('a,b')

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toEqual({ token: 'tok', name: 'My Group', bggUsernames: ['a', 'b'] })
  })

  it('clearActiveGroup resets to defaults', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 't', name: 'G', bggUsernames: ['u'] }))

    render(
      <ActiveGroupProvider>
        <ClearController />
      </ActiveGroupProvider>,
    )

    expect(screen.getByTestId('token')).toHaveTextContent('t')

    await act(async () => {
      screen.getByTestId('clear-btn').click()
    })

    expect(screen.getByTestId('token')).toHaveTextContent('(null)')
    expect(screen.getByTestId('name')).toHaveTextContent('(null)')
    expect(screen.getByTestId('usernames')).toHaveTextContent('(empty)')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
