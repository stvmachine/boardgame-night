import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'fixtures', 'stevmachine-merged-collection.json'), 'utf-8')
)

test('stevmachine collection renders from mocked GraphQL', async ({ page }) => {
  await page.route('**/graphql', async (route, request) => {
    const body = request.postDataJSON()
    if (body?.query?.includes('MergedCollection')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixture)
      })
    } else {
      await route.continue()
    }
  })

  await page.goto('/collection?usernames=stevmachine')

  // Wait for the first known game card heading
  await expect(page.getByRole('heading', { name: '7 Wonders (Second Edition)' })).toBeVisible()

  // Verify the expected number of games is rendered
  const cards = page.locator('[data-testid="game-card"]').or(page.locator('article'))
  await expect(cards).toHaveCount(75)
})
