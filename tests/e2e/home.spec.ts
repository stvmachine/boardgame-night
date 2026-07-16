import { test, expect } from '@playwright/test'

test('merges usernames from the redesigned Home hero', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('Add a BGG username').fill('e2e_alice')
  await page.getByPlaceholder('Add a BGG username').press('Enter')

  await page.getByRole('button', { name: 'Merge collections' }).click()

  await expect(page).toHaveURL(/\/collection.*usernames=e2e_alice/, { timeout: 10000 })
})

test('keeps a six-card Home preview and standalone Hot route', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Trending on BGG' })).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-testid="trending-card"]')).toHaveCount(6)

  await page.getByRole('link', { name: 'View all' }).click()

  await expect(page).toHaveURL(/\/(hot|#)/, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Trending/i })).toBeVisible()
})
