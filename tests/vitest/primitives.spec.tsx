import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Eyebrow,
  Card,
  StateBadge,
  MemberAvatar,
  CategoryPill,
  EmptyState,
  Progress,
} from '@/components/primitives'
import type { Member } from '@/lib/data'

const makeMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'test-1',
  name: 'Alex Rivera',
  bgg: 'alex123',
  color: '#6366f1',
  online: true,
  ...overrides,
})

describe('Eyebrow', () => {
  it('renders children text', () => {
    render(<Eyebrow>Section Label</Eyebrow>)
    expect(screen.getByText('Section Label')).toBeInTheDocument()
  })

  it('accepts and applies className', () => {
    const { container } = render(
      <Eyebrow className="custom-class">Label</Eyebrow>,
    )
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('custom-class')
  })
})

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Hello</p></Card>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('accepts and applies className', () => {
    const { container } = render(
      <Card className="custom-card"><p>Content</p></Card>,
    )
    expect(container.firstChild).toHaveClass('custom-card')
  })
})

describe('StateBadge', () => {
  const cases: Array<[string, string]> = [
    ['DRAFT', 'DRAFT'],
    ['INVITED', 'INVITED'],
    ['PICKING', 'PICKING'],
    ['IN_PROGRESS', 'IN PROGRESS'],
    ['COMPLETED', 'COMPLETED'],
    ['CANCELLED', 'CANCELLED'],
  ]

  it.each(cases)('renders "%s" as "%s"', (state, expectedLabel) => {
    render(<StateBadge state={state as any} />)
    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
  })

  it('accepts and applies className', () => {
    const { container } = render(
      <StateBadge state="DRAFT" className="badge-custom" />,
    )
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('badge-custom')
  })
})

describe('MemberAvatar', () => {
  it('renders initials from member name', () => {
    const member = makeMember({ name: 'Alex Rivera' })
    render(<MemberAvatar member={member} />)
    expect(screen.getByText('AR')).toBeInTheDocument()
  })

  it('renders single-word name initial', () => {
    const member = makeMember({ name: 'Jordan' })
    render(<MemberAvatar member={member} />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders online indicator when member.online is true', () => {
    const member = makeMember({ online: true })
    const { container } = render(<MemberAvatar member={member} />)
    // The online dot is a <span> with bg-success class
    const dots = container.querySelectorAll('.bg-success')
    expect(dots.length).toBeGreaterThanOrEqual(1)
  })

  it('does not render online indicator when member.online is false', () => {
    const member = makeMember({ online: false })
    const { container } = render(<MemberAvatar member={member} />)
    const dots = container.querySelectorAll('.bg-success')
    // The only bg-success might be the ring if showRing is true — check the size-2.5 specific dot
    const onlineDots = container.querySelectorAll('.size-2\\.5')
    expect(onlineDots.length).toBe(0)
  })

  it('renders screen-reader text with member name', () => {
    const member = makeMember({ name: 'Sam Okafor' })
    render(<MemberAvatar member={member} />)
    expect(screen.getByText('Sam Okafor')).toBeInTheDocument()
  })
})

describe('CategoryPill', () => {
  it('renders category text', () => {
    render(<CategoryPill>Strategy</CategoryPill>)
    expect(screen.getByText('Strategy')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={<span>🔍</span>}
        title="No games found"
        description="Try adjusting your filters"
      />,
    )
    expect(screen.getByText('No games found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
  })

  it('renders optional action button when provided', () => {
    render(
      <EmptyState
        icon={<span>🔍</span>}
        title="Empty"
        description="Nothing here"
        action={<button>Add Game</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Add Game' })).toBeInTheDocument()
  })

  it('does not render action when not provided', () => {
    render(
      <EmptyState
        icon={<span>🔍</span>}
        title="Empty"
        description="Nothing here"
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('Progress', () => {
  it('renders with correct width percentage', () => {
    const { container } = render(<Progress value={65} />)
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar).toHaveStyle({ width: '65%' })
  })

  it('clamps value to 0 minimum', () => {
    const { container } = render(<Progress value={-10} />)
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar).toHaveStyle({ width: '0%' })
  })

  it('clamps value to 100 maximum', () => {
    const { container } = render(<Progress value={150} />)
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar).toHaveStyle({ width: '100%' })
  })

  it('has accessible role and aria attributes', () => {
    render(<Progress value={42} label="Loading" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-label', 'Loading')
  })
})
