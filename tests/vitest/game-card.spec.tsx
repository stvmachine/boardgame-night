import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GameCard } from '@/components/game-card'
import { games } from './fixtures/sample-data'
import type { Suggestion } from '@/lib/data'

const game = {
  ...games[0],
  description: 'Build a thriving preserve with cards & clever combos.',
  lastPlayedAt: '2026-07-18T18:00:00Z',
}

const baseSuggestion: Suggestion = {
  gameId: game.id,
  match: 87,
  votes: 4,
  confidence: 'HIGH',
  reasons: [
    { ok: true, label: 'Fits player count' },
    { ok: true, label: 'Fits time budget' },
    { ok: true, label: 'Best at 1 player' },
    { ok: true, label: 'Owned by group' },
  ],
}

describe('GameCard', () => {
  it.each(['grid', 'list'] as const)(
    'renders complete rich-card anatomy in the %s variant',
    (variant) => {
      render(<GameCard game={game} variant={variant} />)

      const card = screen.getByTestId('game-card')
      expect(card).toHaveAttribute('data-variant', variant)
      expect(card.tagName).toBe('ARTICLE')
      expect(within(card).getByRole('img')).toHaveAttribute('src', game.cover)
      expect(within(card).getByRole('img')).toHaveAttribute(
        'alt',
        'Feathered Realms box cover',
      )
      expect(within(card).getByTestId('game-description')).toHaveTextContent(game.description)
      expect(within(card).getByLabelText('Owned by alex, sam, jordan')).toBeInTheDocument()

      const footer = within(card).getByTestId('game-card-footer')
      expect(within(footer).getByText('1–5')).toBeInTheDocument()
      expect(within(footer).getByText('60m')).toBeInTheDocument()
      expect(within(footer).getByText('2.4')).toBeInTheDocument()
    },
  )

  it('uses one isolated overlay link with the real BGG identity', () => {
    render(<GameCard game={game} />)

    const card = screen.getByTestId('game-card')
    const link = within(card).getByRole('link', {
      name: 'View Feathered Realms on BoardGameGeek',
    })

    expect(card).not.toHaveAttribute('role', 'button')
    expect(card).not.toHaveAttribute('tabindex')
    expect(within(card).getAllByRole('link')).toHaveLength(1)
    expect(link).toHaveAttribute(
      'href',
      `https://boardgamegeek.com/boardgame/${encodeURIComponent(game.id)}`,
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('keeps nested controls independently keyboard operable', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <GameCard
        game={game}
        actions={
          <button type="button" onClick={onAction}>
            Save game
          </button>
        }
      />,
    )

    const card = screen.getByTestId('game-card')
    const link = within(card).getByRole('link')
    const button = within(card).getByRole('button', { name: 'Save game' })

    expect(link.contains(button)).toBe(false)
    await user.tab()
    expect(link).toHaveFocus()
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('renders description as escaped plain text', () => {
    const { container } = render(
      <GameCard game={{ ...game, description: '<strong>Not markup</strong>' }} />,
    )

    expect(screen.getByTestId('game-description')).toHaveTextContent(
      '<strong>Not markup</strong>',
    )
    expect(container.querySelector('strong')).toBeNull()
  })

  it('renders a visible image fallback without changing its accessible name', () => {
    render(<GameCard game={{ ...game, cover: '' }} />)

    expect(screen.getByRole('img', { name: 'Feathered Realms box cover' })).toHaveAttribute(
      'src',
      '/placeholder.svg',
    )
  })

  it('caps the visible owner stack and announces overflow', () => {
    render(
      <GameCard
        game={{ ...game, owners: ['alex', 'sam', 'jordan', 'riley', 'casey'] }}
      />,
    )

    const owners = screen.getByLabelText('Owned by alex, sam, jordan, riley, casey')
    expect(within(owners).getByText('+2')).toBeInTheDocument()
  })

  it('accepts className and style props on the article', () => {
    render(<GameCard game={game} className="custom-class" style={{ opacity: 0.5 }} />)

    const card = screen.getByTestId('game-card')
    expect(card).toHaveClass('custom-class')
    expect(card).toHaveStyle({ opacity: 0.5 })
  })

  describe('suggestion context', () => {
    it('renders score, confidence, and reasons between description and stats', () => {
      render(<GameCard game={game} suggestion={baseSuggestion} />)

      const card = screen.getByTestId('game-card')
      expect(within(card).getByText('Score 87')).toBeInTheDocument()
      expect(within(card).getByText('High confidence')).toBeInTheDocument()
      expect(within(card).getByText('Fits player count')).toBeInTheDocument()
      expect(within(card).getByText('Fits time budget')).toBeInTheDocument()
      expect(within(card).getByText('Best at 1 player')).toBeInTheDocument()
      expect(within(card).queryByText('Owned by group')).not.toBeInTheDocument()
    })

    it('exposes remaining reasons through a keyboard-operable disclosure', async () => {
      const user = userEvent.setup()
      render(<GameCard game={game} suggestion={baseSuggestion} />)

      const card = screen.getByTestId('game-card')
      const button = within(card).getByRole('button', { name: 'Show more reasons' })
      expect(button).toHaveAttribute('aria-expanded', 'false')

      await user.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(within(card).getByText('Owned by group')).toBeInTheDocument()

      await user.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(within(card).queryByText('Owned by group')).not.toBeInTheDocument()
    })

    it('shows a host-only pick button that calls onPick without navigating', async () => {
      const user = userEvent.setup()
      const onPick = vi.fn()
      render(<GameCard game={game} suggestion={baseSuggestion} isHost onPick={onPick} />)

      const card = screen.getByTestId('game-card')
      const pickButton = within(card).getByRole('button', { name: 'Pick this game' })

      await user.click(pickButton)
      expect(onPick).toHaveBeenCalledOnce()
    })

    it('disables the pick button and surfaces an error while picking', () => {
      render(
        <GameCard
          game={game}
          suggestion={baseSuggestion}
          isHost
          onPick={vi.fn()}
          picking
          pickError="Could not save pick"
        />,
      )

      const button = screen.getByRole('button', { name: /Picking/i })
      expect(button).toBeDisabled()
      expect(screen.getByRole('alert')).toHaveTextContent('Could not save pick')
    })

    it('tells members the host will choose and hides the pick button', () => {
      render(<GameCard game={game} suggestion={baseSuggestion} isHost={false} onPick={vi.fn()} />)

      const card = screen.getByTestId('game-card')
      expect(within(card).getByText('The host will choose the game.')).toBeInTheDocument()
      expect(within(card).queryByRole('button', { name: 'Pick this game' })).not.toBeInTheDocument()
    })

    it('does not add suggestion controls when suggestion is absent', () => {
      render(<GameCard game={game} />)

      const card = screen.getByTestId('game-card')
      expect(within(card).queryByText(/Score/)).not.toBeInTheDocument()
      expect(within(card).queryByRole('button', { name: 'Pick this game' })).not.toBeInTheDocument()
      expect(within(card).queryByText('The host will choose the game.')).not.toBeInTheDocument()
    })
  })
})
