import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GameCard from '@/components/collection/GameCard.vue'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

function buildGame(overrides: Record<string, any> = {}) {
  return {
    id: '100',
    objectid: '174430',
    name: 'Gloomhaven',
    thumbnail: null,
    yearPublished: 2017,
    minPlayers: 1,
    maxPlayers: 4,
    minPlaytime: 60,
    maxPlaytime: 120,
    average: 8.8,
    averageWeight: 3.8,
    description: '<p>A <b>cooperative</b> game of tactical combat in a unique fantasy world.</p>',
    owners: [
      { bggUsername: 'alice', avatar: null },
      { bggUsername: 'bob', avatar: null },
      { bggUsername: 'carol', avatar: null },
      { bggUsername: 'dave', avatar: null }
    ],
    ...overrides
  }
}

function mountCard(props: Record<string, any> = {}) {
  const game = props.game ?? buildGame()
  const { game: _, slots, ...rest } = props
  return mount(GameCard, {
    props: {
      id: game.id,
      objectid: game.objectid,
      name: game.name,
      thumbnail: game.thumbnail,
      yearPublished: game.yearPublished,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      minPlaytime: game.minPlaytime,
      maxPlaytime: game.maxPlaytime,
      average: game.average,
      averageWeight: game.averageWeight,
      description: game.description,
      owners: game.owners,
      ...rest
    },
    ...(slots ? { slots } : {})
  })
}

function mountSuggestionCard(suggestionProps: Record<string, any> = {}, slots?: Record<string, any>) {
  return mountCard({
    score: 87.5,
    confidence: 'HIGH',
    reasons: ['Fits the player count', 'Owned by the host', 'Within time budget'],
    ...suggestionProps,
    slots
  })
}

describe('GameCard', () => {
  it('renders grid variant by default with vertical layout', () => {
    const wrapper = mountCard()

    const card = wrapper.find('[data-slot="card"]')
    expect(card.exists()).toBe(true)
    const fallback = wrapper.find('.aspect-\\[4\\/3\\]')
    expect(fallback.exists()).toBe(true)
  })

  it('renders list variant with horizontal layout and 96px media', () => {
    const wrapper = mountCard({ variant: 'list' })

    const card = wrapper.find('[data-slot="card"]')
    expect(card.exists()).toBe(true)
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.classes()).toContain('w-24')
  })

  it('renders plain-text description without HTML tags', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('A cooperative game of tactical combat in a unique fantasy world.')
    expect(wrapper.html()).not.toContain('<b>')
    expect(wrapper.html()).not.toContain('<p>')
  })

  it('clamps grid description to two lines', () => {
    const wrapper = mountCard({ variant: 'grid' })
    const desc = wrapper.find('[data-testid="game-description"]')
    expect(desc.exists()).toBe(true)
    expect(desc.classes()).toContain('line-clamp-2')
  })

  it('clamps list description to three lines', () => {
    const wrapper = mountCard({ variant: 'list' })
    const desc = wrapper.find('[data-testid="game-description"]')
    expect(desc.exists()).toBe(true)
    expect(desc.classes()).toContain('line-clamp-3')
  })

  it('shows at most three owner avatars and a +N overflow count', () => {
    const wrapper = mountCard({ variant: 'grid' })

    const avatars = wrapper.findAll('[data-slot="avatar"]')
    expect(avatars.length).toBeLessThanOrEqual(3)
    expect(wrapper.text()).toContain('+1')
  })

  it('renders rating and weight badges', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('8.8')
    expect(wrapper.text()).toContain('3.8')
  })

  it('renders three stat columns in the footer', () => {
    const wrapper = mountCard()

    const footer = wrapper.find('[data-testid="game-card-footer"]')
    expect(footer.exists()).toBe(true)
    expect(footer.text()).toContain('1–4')
    expect(footer.text()).toContain('60–120')
    expect(footer.text()).toContain('3.8')
  })

  it('uses em dash fallbacks for missing stats', () => {
    const wrapper = mountCard({
      game: buildGame({
        minPlayers: null,
        maxPlayers: null,
        minPlaytime: null,
        maxPlaytime: null,
        averageWeight: null
      })
    })

    const footer = wrapper.find('[data-testid="game-card-footer"]')
    expect(footer.text()).toContain('—')
  })

  // ── D-15 ARIA and external link ───────────────────────────────

  it('card container has role="article" with accessible name and no button role/tabindex', () => {
    const wrapper = mountCard()
    const card = wrapper.find('[data-slot="card"]')

    expect(card.attributes('role')).toBe('article')
    expect(card.attributes('aria-label')).toMatch(/Game card:/)
    expect(card.attributes('tabindex')).toBeUndefined()
  })

  it('renders a single labelled external BGG link with opener isolation', () => {
    const wrapper = mountCard({ objectid: '174430' })

    const link = wrapper.find('[data-testid="game-card-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://boardgamegeek.com/boardgame/174430')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.attributes('aria-label')).toBe('View Gloomhaven on BoardGameGeek')
  })

  it('does not render a BGG link when objectid is absent', () => {
    const wrapper = mountCard({ objectid: null })

    expect(wrapper.find('[data-testid="game-card-link"]').exists()).toBe(false)
  })

  it('link is a native anchor covering the full card (Enter opens via browser)', () => {
    const wrapper = mountCard({ objectid: '174430' })
    const link = wrapper.find('[data-testid="game-card-link"]')
    expect(link.attributes('href')).toBeTruthy()
    expect(link.element.tagName).toBe('A')
  })

  // ── Structural stacking guards ─────────────────────────────

  it('link overlay has absolute/inset-0/z-10 coverage for full-card click target', () => {
    const wrapper = mountCard({ objectid: '174430' })
    const link = wrapper.find('[data-testid="game-card-link"]')
    const classes = link.classes()
    expect(classes).toContain('absolute')
    expect(classes).toContain('inset-0')
    expect(classes).toContain('z-10')
  })

  it('non-control content wrapper has pointer-events-none so clicks pass through to link', () => {
    const wrapper = mountCard({ objectid: '174430' })
    const contentWrapper = wrapper.find('[data-testid="game-card-content"]')
    expect(contentWrapper.classes()).toContain('pointer-events-none')
  })

  it('disclosure button has pointer-events-auto and z-20 to sit above the overlay link', () => {
    const wrapper = mountSuggestionCard({
      reasons: ['One', 'Two', 'Three', 'Four']
    })
    const disclosure = wrapper.find('[data-testid="show-more-reasons"]')
    expect(disclosure.classes()).toContain('pointer-events-auto')
    expect(disclosure.classes()).toContain('z-20')
  })

  it('action slot container has pointer-events-auto and z-20 to sit above the overlay link', () => {
    const wrapper = mountCard({
      objectid: '174430',
      slots: {
        action: '<button data-testid="nested-action" type="button">Pick</button>'
      }
    })
    const actionContainer = wrapper.find('[data-slot="game-card-action"]')
    expect(actionContainer.classes()).toContain('pointer-events-auto')
    expect(actionContainer.classes()).toContain('z-20')
  })

  // ── Behavior: disclosure toggles, action slot click handlers execute ──

  it('disclosure click toggles aria-expanded', async () => {
    const wrapper = mountSuggestionCard({
      reasons: ['One', 'Two', 'Three', 'Four']
    })
    const disclosure = wrapper.find('[data-testid="show-more-reasons"]')
    await disclosure.trigger('click')
    await flushPromises()
    expect(disclosure.attributes('aria-expanded')).toBe('true')
  })

  it('action slot button click handler executes', async () => {
    const clickHandler = vi.fn()
    const wrapper = mountCard({
      slots: {
        action: '<button data-testid="nested-action" type="button" @click.stop="() => {}">Pick</button>'
      }
    })
    const action = wrapper.find('[data-testid="nested-action"]')
    expect(action.exists()).toBe(true)
    action.element.addEventListener('click', clickHandler)
    await action.trigger('click')
    expect(clickHandler).toHaveBeenCalledOnce()
  })

  // ── Suggestion context ────────────────────────────────────────

  describe('suggestion context', () => {
    it('renders no suggestion-only DOM when score, confidence, and reasons are absent', () => {
      const wrapper = mountCard()

      expect(wrapper.find('[data-testid="suggestion-score"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('High confidence')
      expect(wrapper.text()).not.toContain('Medium confidence')
      expect(wrapper.text()).not.toContain('Low confidence')
      expect(wrapper.find('[data-testid="reason-chip"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="show-more-reasons"]').exists()).toBe(false)
    })

    it('renders rounded score and explicit confidence label', () => {
      const wrapper = mountSuggestionCard()

      const score = wrapper.find('[data-testid="suggestion-score"]')
      expect(score.exists()).toBe(true)
      expect(score.text()).toBe('Score 88')
      expect(score.classes()).toContain('tabular-nums')

      expect(wrapper.text()).toContain('High confidence')
    })

    it.each([
      ['HIGH', 'High confidence', 'completed'],
      ['MEDIUM', 'Medium confidence', 'invited'],
      ['LOW', 'Low confidence', 'draft']
    ])('maps %s confidence to the %s label and %s badge', (confidence, label, variant) => {
      const wrapper = mountSuggestionCard({ confidence })

      expect(wrapper.text()).toContain(label)
      const badge = wrapper.find(`[data-variant="${variant}"]`)
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe(label)
    })

    it('renders the first three backend reasons as neutral chips', () => {
      const wrapper = mountSuggestionCard({
        reasons: ['First reason', 'Second reason', 'Third reason', 'Fourth reason']
      })

      const chips = wrapper.findAll('[data-testid="reason-chip"]')
      expect(chips.length).toBe(3)
      expect(chips[0].text()).toBe('First reason')
      expect(chips[1].text()).toBe('Second reason')
      expect(chips[2].text()).toBe('Third reason')
      expect(wrapper.text()).not.toContain('Fourth reason')
    })

    it('exposes remaining reasons through a labelled Show more reasons disclosure', async () => {
      const wrapper = mountSuggestionCard({
        reasons: ['One', 'Two', 'Three', 'Four', 'Five']
      })

      const disclosure = wrapper.find('[data-testid="show-more-reasons"]')
      expect(disclosure.exists()).toBe(true)
      expect(disclosure.text()).toBe('Show more reasons')
      expect(disclosure.attributes('aria-expanded')).toBe('false')
      expect(disclosure.attributes('aria-controls')).toBeTruthy()

      await disclosure.trigger('click')
      await flushPromises()

      expect(disclosure.attributes('aria-expanded')).toBe('true')
      const chips = wrapper.findAll('[data-testid="reason-chip"]')
      expect(chips.length).toBe(5)
      expect(chips[3].text()).toBe('Four')
      expect(chips[4].text()).toBe('Five')
    })

    it('does not render a disclosure when there are three or fewer reasons', () => {
      const wrapper = mountSuggestionCard({
        reasons: ['One', 'Two', 'Three']
      })

      expect(wrapper.find('[data-testid="show-more-reasons"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-testid="reason-chip"]').length).toBe(3)
    })

    it('does not render the five numeric breakdown factors', () => {
      const wrapper = mountSuggestionCard()

      expect(wrapper.text()).not.toContain('communityRating')
      expect(wrapper.text()).not.toContain('complexityFit')
      expect(wrapper.text()).not.toContain('ownershipBonus')
      expect(wrapper.text()).not.toContain('playerCountFit')
      expect(wrapper.text()).not.toContain('timeFit')
    })
  })
})
