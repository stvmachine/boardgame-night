import { test, expect, type Page } from '@playwright/test'

function collectorCheckbox(page: Page, username: string) {
  return page.getByRole('checkbox', { name: username })
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

  await page.getByLabel('Sort').selectOption('rating_desc')

  // Game cards are h3 headings inside the grid, not the sidebar "Collectors" h3
  const gameHeadings = page.locator('[data-testid="game-grid"] h3, article h3')
  await expect(gameHeadings.first()).toHaveText('Gloomhaven')
})

test('groups by number of players', async ({ page }) => {
  await page.goto('/collection?usernames=e2e_alice,e2e_bob')

  await page.getByLabel('Group by').selectOption('players')

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
