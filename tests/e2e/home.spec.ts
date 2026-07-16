import { test, expect } from '@playwright/test'

test('merges usernames from the redesigned Home hero', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('Add a BGG username').fill('e2e_alice')
  await page.getByPlaceholder('Add a BGG username').press('Enter')

  await page.getByRole('button', { name: 'Merge collections' }).click()

  await expect(page).toHaveURL(/\/collection.*usernames=e2e_alice/, { timeout: 10000 })
})
