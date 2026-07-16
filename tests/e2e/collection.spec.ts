import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures', 'e2e_group.json'), 'utf-8')
)

function collectorCheckbox(page: Page, username: string) {
  return page.getByRole('checkbox', { name: username })
}

async function selectSortOption(page: Page, label: string) {
  await page.getByRole('combobox', { name: 'Sort' }).click()
  await page.getByRole('option', { name: label }).click()
}

async function selectGroupByOption(page: Page, label: string) {
  await page.getByRole('combobox', { name: 'Group by' }).click()
  await page.getByRole('option', { name: label }).click()
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 })
}

function firstGameHeading(page: Page) {
  return page.locator('[data-slot="card"] h3').first()
}

async function setViewMode(page: Page, mode: 'Grid view' | 'List view') {
  await page.getByRole('button', { name: mode }).click()
}

async function waitForUrlParam(page: Page, key: string, value: string) {
  await page.waitForURL((url) => url.searchParams.get(key) === value)
}

async function setPlayerRange(page: Page, min: number, max: number) {
  const minimum = page.getByRole('slider', { name: 'Minimum players' })
  const maximum = page.getByRole('slider', { name: 'Maximum players' })

  await minimum.focus()
  await minimum.press('Home')
  for (let value = 1; value < min; value += 1) await minimum.press('ArrowRight')

  await maximum.focus()
  await maximum.press('End')
  for (let value = 10; value > max; value -= 1) await maximum.press('ArrowLeft')
}

test('loads merged collection from seed data', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Wingspan' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Azul' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gloomhaven' })).toBeVisible()
})

test('sidebar reflects collectors from URL', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await expect(collectorCheckbox(page, 'e2e_alice')).toBeChecked()
  await expect(collectorCheckbox(page, 'e2e_bob')).toBeChecked()
})

test('deselecting a collector filters the game list', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')
  await expect(page.getByRole('heading', { name: 'Gloomhaven' })).toBeVisible()

  await collectorCheckbox(page, 'e2e_bob').uncheck()

  await expect(page.getByRole('heading', { name: 'Gloomhaven' })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Azul' })).toBeVisible()
})

test('filters by player count', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await setPlayerRange(page, 4, 4)

  await expect(page.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Azul' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gloomhaven' })).toBeVisible()

  await setPlayerRange(page, 1, 1)

  await expect(page.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Azul' })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gloomhaven' })).toBeVisible()
})

test('sorts by rating descending', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await selectSortOption(page, 'Rating High–Low')

  // Game cards are h3 headings inside Card primitives, not the sidebar "Collectors" h3
  await expect(firstGameHeading(page)).toHaveText('Gloomhaven')
})

test('groups by number of players', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await selectGroupByOption(page, 'Number of Players')

  await expect(page.getByRole('heading', { name: /players/i }).first()).toBeVisible()
})

test('preserves filter state via permalink on reload', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')
  await page.getByLabel('Search').fill('Wingspan')
  await setPlayerRange(page, 4, 4)
  await collectorCheckbox(page, 'e2e_bob').uncheck()

  // Wait for URL serialization to settle
  await page.waitForURL(/q=Wingspan/)
  await page.waitForURL(/players=4/)
  await page.waitForURL(/owners=e2e_alice/)

  const url = page.url()

  await page.goto(url)

  await expect(page.getByLabel('Search')).toHaveValue('Wingspan')
  await expect(page.getByRole('slider', { name: 'Minimum players' })).toHaveAttribute('aria-valuenow', '4')
  await expect(page.getByRole('slider', { name: 'Maximum players' })).toHaveAttribute('aria-valuenow', '4')
  await expect(collectorCheckbox(page, 'e2e_alice')).toBeChecked()
  await expect(collectorCheckbox(page, 'e2e_bob')).not.toBeChecked()
  await expect(page.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Azul' })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gloomhaven' })).not.toBeVisible()
})

test('exposes exactly four sort options', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await page.getByRole('combobox', { name: 'Sort' }).click()

  await expect(page.getByRole('option', { name: 'Name A–Z' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Rating High–Low' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Weight Light–Heavy' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Recently Played' })).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(4)
})

test('sorts Recently Played from authorized session history', async ({ page }) => {
  await signIn(page, fixture.owner_email, 'password')
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await selectSortOption(page, 'Recently Played')

  await expect(firstGameHeading(page)).toHaveText('Wingspan', { timeout: 10_000 })
})

test('group mode sorts Recently Played by group history', async ({ page }) => {
  await signIn(page, fixture.owner_email, 'password')
  await page.goto(`/collection?group=${fixture.invite_code}`)

  await selectSortOption(page, 'Recently Played')

  await expect(firstGameHeading(page)).toHaveText('Wingspan', { timeout: 10_000 })
})

test('anonymous users see deterministic Recently Played with no history', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await selectSortOption(page, 'Recently Played')

  await expect(firstGameHeading(page)).toHaveText('Azul', { timeout: 10_000 })
})

test('legacy sort URL migrates to a valid sort', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob&sort=year_desc')

  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Wingspan' })).toBeVisible({ timeout: 30_000 })
  expect(page.url()).not.toContain('sort=year_desc')
})

test('shares a rich list collection permalink', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')
  await page.waitForLoadState('networkidle')

  await setViewMode(page, 'List view')
  await waitForUrlParam(page, 'view', 'list')

  const wingspanCard = page.getByTestId('game-card').filter({ hasText: 'Wingspan' })
  await expect(wingspanCard).toBeVisible()
  await expect(wingspanCard.locator('img')).toBeVisible()
  await expect(wingspanCard.getByTestId('game-description')).toBeVisible()
  await expect(wingspanCard.getByTestId('game-card-footer')).toBeVisible()

  // BGG activation uses objectid with opener isolation
  const bggPromise = page.waitForEvent('popup')
  await wingspanCard.click()
  const popup = await bggPromise
  await expect(popup).toHaveURL(/boardgamegeek\.com\/boardgame\/\d+/)
  await popup.close()

  // Reproduce the shared URL in a fresh session
  const sharedUrl = page.url()
  await page.goto(sharedUrl)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('game-card').filter({ hasText: 'Wingspan' }).locator('img')).toBeVisible()

  // Switch back to grid
  await setViewMode(page, 'Grid view')
  await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('game-card').filter({ hasText: 'Wingspan' }).locator('img')).toBeVisible()
})
