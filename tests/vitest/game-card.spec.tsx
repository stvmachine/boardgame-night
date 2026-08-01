import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GameCard } from '@/components/game-card'
import { games } from './fixtures/sample-data'

const game = {
  ...games[0],
  description: 'Build a thriving preserve with cards & clever combos.',
  lastPlayedAt: '2026-07-18T18:00:00Z',
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
})
