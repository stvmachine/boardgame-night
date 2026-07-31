import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameCard } from '@/components/game-card'
import { games } from './fixtures/sample-data'

const game = games[0] // Feathered Realms

describe('GameCard', () => {
  it('renders game title', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('Feathered Realms')).toBeInTheDocument()
  })

  it('renders cover image with alt text', () => {
    render(<GameCard game={game} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', game.cover)
    expect(img).toHaveAttribute('alt', 'Feathered Realms box cover')
  })

  it('renders fallback placeholder when cover is empty', () => {
    const noCover = { ...game, cover: '' }
    render(<GameCard game={noCover} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/placeholder.svg')
  })

  it('renders player count range', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('1–5')).toBeInTheDocument()
  })

  it('renders play time', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('60m')).toBeInTheDocument()
  })

  it('renders rating', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('8.1')).toBeInTheDocument()
  })

  it('renders category pills (first two categories)', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('Strategy')).toBeInTheDocument()
    expect(screen.getByText('Engine Building')).toBeInTheDocument()
  })

  it('renders "+N" for extra categories beyond two', () => {
    // Feathered Realms has 3 categories: Strategy, Engine Building, Nature
    render(<GameCard game={game} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('does not render "+N" when 2 or fewer categories', () => {
    const twoCat = games.find((g) => g.categories.length === 2)!
    render(<GameCard game={twoCat} />)
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('renders "Owned" badge when owned is true', () => {
    render(<GameCard game={game} owned={true} />)
    expect(screen.getByText('Owned')).toBeInTheDocument()
  })

  it('does not render "Owned" badge when owned is false', () => {
    render(<GameCard game={game} owned={false} />)
    expect(screen.queryByText('Owned')).not.toBeInTheDocument()
  })

  it('does not render "Owned" badge by default', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('Owned')).toBeInTheDocument() // owned defaults to true
  })

  it('accepts and applies className', () => {
    const { container } = render(
      <GameCard game={game} className="custom-class" />,
    )
    const article = container.querySelector('article')
    expect(article?.className).toContain('custom-class')
  })

  it('accepts and applies style prop', () => {
    const { container } = render(
      <GameCard game={game} style={{ opacity: 0.5 }} />,
    )
    const article = container.querySelector('article')
    expect(article?.style.opacity).toBe('0.5')
  })
})
