import { test, expect } from '@playwright/test'

test('health query round-trips Rails ↔ Vue end-to-end', async ({ page }) => {
  const corsErrors: string[] = []
  const graphqlResponses: any[] = []

  // Collect CORS-related console messages and page errors
  page.on('console', (msg) => {
    if (/Access-Control|CORS/i.test(msg.text())) {
      corsErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    if (/Access-Control|CORS/i.test(err.message)) {
      corsErrors.push(err.message)
    }
  })

  // Collect successful GraphQL responses
  page.on('response', async (response) => {
    if (response.url().includes('/graphql') && response.status() === 200) {
      try {
        const json = await response.json()
        graphqlResponses.push(json)
      } catch {
        // Non-JSON response — ignore
      }
    }
  })

  // Navigate to the health check route (baseURL is http://localhost:5173 from playwright.config)
  await page.goto('/health')

  // Wait for the success state to render (proves Apollo query completed)
  await expect(page.getByText('Server Health')).toBeVisible({ timeout: 10_000 })

  // Verify the health badge shows 'ok'
  await expect(page.getByText('ok', { exact: true })).toBeVisible()

  // Assert zero CORS errors in the dev console
  expect(corsErrors).toEqual([])

  // Assert at least one /graphql response was captured
  expect(graphqlResponses.length).toBeGreaterThan(0)

  // Assert at least one response contains health: 'ok' (handle both single and batch shapes)
  const healthValue = graphqlResponses.reduce<string | null>((found, response) => {
    if (found) return found
    if (response?.data?.health) return response.data.health
    if (Array.isArray(response)) {
      return response.find((r) => r?.data?.health)?.data?.health ?? null
    }
    return null
  }, null)
  expect(healthValue).toBe('ok')
})
