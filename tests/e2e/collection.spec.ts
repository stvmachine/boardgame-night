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

  await page.getByLabel('Players').selectOption('4')

  await expect(page.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Azul' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gloomhaven' })).toBeVisible()

  await page.getByLabel('Players').selectOption('1')

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
  await page.getByLabel('Players').selectOption('4')
  await collectorCheckbox(page, 'e2e_bob').uncheck()

  // Wait for URL serialization to settle
  await page.waitForURL(/q=Wingspan/)
  await page.waitForURL(/players=4/)
  await page.waitForURL(/owners=e2e_alice/)

  const url = page.url()

  await page.goto(url)

  await expect(page.getByLabel('Search')).toHaveValue('Wingspan')
  await expect(page.getByLabel('Players')).toHaveValue('4')
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
