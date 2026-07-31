import { MockedProvider } from '@apollo/client/testing'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  DashboardStatsDocument,
  HotItemsDocument,
} from '@/generated/operations'
import { LandingPage } from '@/pages/LandingPage'

const hotItems = Array.from({ length: 8 }, (_, index) => ({
  id: String(100 + index),
  rank: index + 1,
  name: `Trending Game ${index + 1}`,
  yearPublished: 2020 + index,
  thumbnail: `/covers/trending-${index + 1}.png`,
  average: 7.1 + index / 10,
  averageWeight: 2.1 + index / 10,
  minPlayers: 2,
  maxPlayers: 4,
  minPlaytime: 30,
  maxPlaytime: 60,
}))

const mocks = [
  {
    request: { query: DashboardStatsDocument },
    result: {
      data: {
        dashboardStats: {
          collectionCount: 42,
          groupCount: 3,
          sessionCount: 7,
        },
      },
    },
  },
  {
    request: { query: HotItemsDocument },
    result: { data: { hotItems } },
  },
]

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

function LocationProbe() {
  const location = useLocation()
  return <output>{`${location.pathname}${location.search}`}</output>
}

function renderHome() {
  return render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/collection" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </MockedProvider>,
  )
}

describe('LandingPage', () => {
  it('keeps merge and anonymous quick-start journeys together', async () => {
    const user = userEvent.setup()
    renderHome()

    const input = screen.getByPlaceholderText('Add a BGG username')
    await user.type(input, ' e2e_alice ')
    await user.keyboard('{Enter}')

    expect(screen.getByText('e2e_alice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create group instantly' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Merge collections' }))

    expect(await screen.findByText('/collection?usernames=e2e_alice')).toBeInTheDocument()
  })

  it('renders live dashboard statistics and a six-card hot preview', async () => {
    renderHome()

    const stats = await screen.findByLabelText('Dashboard statistics')
    expect(within(stats).getByText('42')).toBeInTheDocument()
    expect(within(stats).getByText('3')).toBeInTheDocument()
    expect(within(stats).getByText('7')).toBeInTheDocument()
    expect(within(stats).getByText('Games')).toBeInTheDocument()
    expect(within(stats).getByText('Groups')).toBeInTheDocument()
    expect(within(stats).getByText('Nights')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Trending on BGG' })).toBeInTheDocument()
    expect(screen.getAllByTestId('trending-card')).toHaveLength(6)
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/hot')
  })
})
