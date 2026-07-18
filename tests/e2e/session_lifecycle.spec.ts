import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sessionFixture = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures', 'e2e_session.json'), 'utf-8')
)

const groupFixture = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures', 'e2e_group.json'), 'utf-8')
)

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 })
}

test('picking lifecycle: host edits, member views, host picks, completed summary', async ({ browser }) => {
  const { session_id: sessionId, invite_token: inviteToken } = sessionFixture
  const { owner_email: ownerEmail, member_email: memberEmail } = groupFixture

  const hostContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const memberContext = await browser.newContext()
  const memberPage = await memberContext.newPage()

  try {
    // Host signs in and views the invited session
    await signIn(hostPage, ownerEmail, 'password')
    await hostPage.goto(`/s/${sessionId}`)
    await expect(hostPage.getByText('INVITED')).toBeVisible({ timeout: 10_000 })
    await expect(hostPage.getByRole('button', { name: 'Start picking' })).toBeVisible()

    // Member signs in and RSVPs Going via the invite link
    await signIn(memberPage, memberEmail, 'password')
    await memberPage.goto(`/invite/${inviteToken}`)
    await expect(memberPage.getByText('e2e Friday Games')).toBeVisible({ timeout: 10_000 })
    await memberPage.getByRole('button', { name: 'Going', exact: true }).click()
    await expect(memberPage.getByText('Thanks! Your response is Going')).toBeVisible({ timeout: 10_000 })

    // Host sees the updated attendee count and starts picking
    await hostPage.reload()
    await expect(hostPage.getByText('1', { exact: true })).toBeVisible({ timeout: 10_000 })
    await hostPage.getByRole('button', { name: 'Start picking' }).click()
    await expect(hostPage.getByText('Picking', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(hostPage.getByRole('heading', { name: /Game Suggestions \(Filtered for \d+ Players\)/ })).toBeVisible()
    await expect(hostPage.getByText('Up to 120 min', { exact: true })).toBeVisible()
    await expect(hostPage.getByText('Any complexity', { exact: true })).toBeVisible()
    await expect(hostPage.getByRole('button', { name: 'Edit Details' })).toBeVisible()

    // Member sees the redesigned picking view without host controls
    await memberPage.goto(`/s/${sessionId}`)
    await expect(memberPage.getByRole('heading', { name: /Game Suggestions \(Filtered for \d+ Players\)/ })).toBeVisible({ timeout: 10_000 })
    await expect(memberPage.getByRole('button', { name: 'Edit Details' })).not.toBeVisible()
    await expect(memberPage.getByRole('button', { name: 'Pick this game' })).not.toBeVisible()
    await expect(memberPage.getByText('The host will choose the game.')).toBeVisible()

    // Responsive layout checks at all approved widths
    const widths = [320, 375, 414, 768, 1024, 1280]
    for (const width of widths) {
      await hostPage.setViewportSize({ width, height: 800 })
      await hostPage.reload()
      await expect(hostPage.getByRole('heading', { name: /Game Suggestions \(Filtered for \d+ Players\)/ })).toBeVisible({ timeout: 10_000 })

      const hasHorizontalOverflow = await hostPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
      expect(hasHorizontalOverflow, `horizontal overflow at ${width}px`).toBe(false)

      const grid = hostPage.locator('[data-testid="suggestion-grid"]')
      const gridStyle = await grid.evaluate((el: HTMLElement) => window.getComputedStyle(el).gridTemplateColumns)
      const columnCount = gridStyle.split(' ').length
      if (width < 768) {
        expect(columnCount, `expected 1 column at ${width}px`).toBe(1)
      } else if (width < 1280) {
        expect(columnCount, `expected 2 columns at ${width}px`).toBe(2)
      } else {
        expect(columnCount, `expected 3 columns at ${width}px`).toBe(3)
      }
    }

    // Host edits ordinary details while picking; preferences stay locked
    await hostPage.setViewportSize({ width: 1280, height: 800 })
    await hostPage.getByRole('button', { name: 'Edit Details' }).click()
    await expect(hostPage.getByRole('dialog', { name: 'Edit session details' })).toBeVisible()
    await expect(hostPage.getByText('Game preferences stay locked while picking.')).toBeVisible()
    await hostPage.getByLabel('Title').fill('Updated Picking Night')
    await hostPage.getByRole('button', { name: 'Save details' }).click()
    await expect(hostPage.getByRole('dialog', { name: 'Edit session details' })).not.toBeVisible()
    await expect(hostPage.getByRole('heading', { name: 'Updated Picking Night' })).toBeVisible()
    await expect(hostPage.getByText('Picking', { exact: true })).toBeVisible()

    // Host opens the reason disclosure with the keyboard
    const wingspanCard = hostPage.locator('[data-testid="game-card"]', { has: hostPage.getByRole('heading', { name: 'Wingspan' }) })
    await expect(wingspanCard).toBeVisible({ timeout: 10_000 })
    await expect(wingspanCard.getByText(/Score \d+/)).toBeVisible()
    await expect(wingspanCard.getByText(/Best at 1 players?/)).toBeVisible()
    const showMoreReasons = wingspanCard.getByRole('button', { name: 'Show more reasons' })
    await expect(showMoreReasons).toBeVisible({ timeout: 10_000 })
    await showMoreReasons.focus()
    await showMoreReasons.press('Enter')
    await expect(showMoreReasons).toHaveAttribute('aria-expanded', 'true')

    // Host picks the game
    await wingspanCard.getByRole('button', { name: 'Pick this game' }).click()
    await expect(hostPage.getByText('COMPLETED')).toBeVisible({ timeout: 10_000 })
    await expect(hostPage.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
    await expect(hostPage.getByText('Picked game')).toBeVisible()
  } finally {
    await hostContext.close()
    await memberContext.close()
  }
})
