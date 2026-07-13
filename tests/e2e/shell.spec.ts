import { test, expect } from '@playwright/test'

test('desktop sidebar shows 280px nav shell with New Session and nav items', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const sidebar = page.locator('[data-testid="desktop-sidebar"]')
  await expect(sidebar).toBeVisible()
  await expect(sidebar).toHaveCSS('width', '280px')

  await expect(page.getByRole('button', { name: 'New Session' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Collection' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hot' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Groups' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Account' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
})

test('clicking Collection nav item navigates to /collection', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  await page.getByRole('link', { name: 'Collection' }).click()

  await expect(page).toHaveURL('/collection')
})

test('mobile hides sidebar and opens sheet drawer from hamburger toggle', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')

  await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible()

  const toggle = page.getByRole('button', { name: 'Open navigation' })
  await expect(toggle).toBeVisible()

  await toggle.click()

  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Collection' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'New Session' })).toBeVisible()
})

test('active nav item has primary-container background', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/collection')

  const collectionLink = page.getByRole('link', { name: 'Collection' })
  await expect(collectionLink).toHaveClass(/bg-primary-container/)
})
