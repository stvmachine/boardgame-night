import { test, expect, type Page } from '@playwright/test'

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 })
}

test('persists an accessible appearance choice before mount', async ({ page }) => {
  // Clear any stored preference so Light is the unsaved default
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('boardgame-night:theme'))
  await page.goto('/')

  // Light default: no .dark class
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  // Sign in with the deterministic owner
  await signIn(page, 'e2e_alice@example.com', 'password')

  // Navigate to Account
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL('/account')

  // Verify the Appearance heading exists
  await expect(page.getByText('Appearance')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Choose how the app looks.')).toBeVisible()

  // Light, Dark, and System labels are present inside toggle items
  await expect(page.getByText('Light', { exact: true })).toBeVisible()
  await expect(page.getByText('Dark', { exact: true })).toBeVisible()
  await expect(page.getByText('System', { exact: true })).toBeVisible()

  // Light is selected by default — the toggle-group item has data-state="on"
  const lightItem = page.locator('[data-slot="toggle-group-item"][data-state="on"]')
  await expect(lightItem).toContainText('Light')

  // Select Dark by keyboard
  const darkGroup = page.locator('[data-slot="toggle-group-item"]', { hasText: 'Dark' })
  await darkGroup.focus()
  await page.keyboard.press('Space')
  await expect(darkGroup).toHaveAttribute('data-state', 'on')

  // Assert root .dark and color-scheme: dark
  await expect(page.locator('html')).toHaveClass(/dark/)
  const colorScheme = await page.locator('html').evaluate(el => el.style.colorScheme)
  expect(colorScheme).toBe('dark')

  // Navigate away and back
  await page.goto('/')
  await expect(page).toHaveURL('/')
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL('/account')

  // Dark preference is still active after navigation
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('[data-slot="toggle-group-item"][data-state="on"]')).toContainText('Dark')

  // Reload and assert the preference is restored
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('[data-slot="toggle-group-item"][data-state="on"]')).toContainText('Dark', { timeout: 15_000 })

  // Switch to System
  const systemGroup = page.locator('[data-slot="toggle-group-item"]', { hasText: 'System' })
  await systemGroup.click()
  await expect(systemGroup).toHaveAttribute('data-state', 'on')

  // Cleanup: reset to Light
  const lightGroup = page.locator('[data-slot="toggle-group-item"]', { hasText: 'Light' })
  await lightGroup.click()
  await expect(lightGroup).toHaveAttribute('data-state', 'on')
})
