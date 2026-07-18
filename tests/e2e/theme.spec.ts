import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const groupFixture = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures', 'e2e_group.json'), 'utf-8')
)

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 })
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.goto('/account', { waitUntil: 'networkidle' })
  await expect(page.getByText('Appearance')).toBeVisible({ timeout: 15_000 })
  const choice = page.locator('[data-slot="toggle-group-item"]', { hasText: theme === 'light' ? /^Light$/ : /^Dark$/ })
  await choice.click()
  await expect(choice).toHaveAttribute('data-state', 'on')
}

async function assertThemeRoot(page: Page, expected: 'light' | 'dark') {
  if (expected === 'dark') {
    await expect(page.locator('html')).toHaveClass(/dark/)
  } else {
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  }
  const colorScheme = await page.locator('html').evaluate(el => el.style.colorScheme)
  expect(colorScheme).toBe(expected)
}

async function assertSemanticSurface(page: Page) {
  const surface = await page.locator('body').evaluate(el =>
    getComputedStyle(el).getPropertyValue('--md-sys-color-surface').trim()
  )
  expect(surface).toBeTruthy()
  const onSurface = await page.locator('body').evaluate(el =>
    getComputedStyle(el).getPropertyValue('--md-sys-color-on-surface').trim()
  )
  expect(onSurface).toBeTruthy()
}

async function assertNoOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
  expect(hasOverflow, `horizontal overflow at ${page.viewportSize()?.width}px`).toBe(false)
}

async function assertRouteThemeOverflow(page: Page, theme: 'light' | 'dark') {
  await assertThemeRoot(page, theme)
  await assertSemanticSurface(page)
  await assertNoOverflow(page)
}

// ── Existing test ────────────────────────────────────────────

test('persists an accessible appearance choice before mount', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('boardgame-night:theme'))
  await page.goto('/')

  await expect(page.locator('html')).not.toHaveClass(/dark/)

  await signIn(page, 'e2e_alice@example.com', 'password')

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL('/account')

  await expect(page.getByText('Appearance')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Choose how the app looks.')).toBeVisible()

  await expect(page.getByText('Light', { exact: true })).toBeVisible()
  await expect(page.getByText('Dark', { exact: true })).toBeVisible()
  await expect(page.getByText('System', { exact: true })).toBeVisible()

  const lightItem = page.locator('[data-slot="toggle-group-item"][data-state="on"]')
  await expect(lightItem).toContainText('Light')

  const darkGroup = page.locator('[data-slot="toggle-group-item"]', { hasText: 'Dark' })
  await darkGroup.focus()
  await page.keyboard.press('Space')
  await expect(darkGroup).toHaveAttribute('data-state', 'on')

  await expect(page.locator('html')).toHaveClass(/dark/)
  const colorScheme = await page.locator('html').evaluate(el => el.style.colorScheme)
  expect(colorScheme).toBe('dark')

  await page.goto('/')
  await expect(page).toHaveURL('/')
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL('/account')

  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('[data-slot="toggle-group-item"][data-state="on"]')).toContainText('Dark')

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('[data-slot="toggle-group-item"][data-state="on"]')).toContainText('Dark', { timeout: 15_000 })

  const systemGroup = page.locator('[data-slot="toggle-group-item"]', { hasText: 'System' })
  await systemGroup.click()
  await expect(systemGroup).toHaveAttribute('data-state', 'on')

  const lightGroup = page.locator('[data-slot="toggle-group-item"]', { hasText: 'Light' })
  await lightGroup.click()
  await expect(lightGroup).toHaveAttribute('data-state', 'on')
})

// ── D-13/D-14: Responsive and dark acceptance matrix ─────────

test('keeps redesigned surfaces usable in both themes', async ({ browser }) => {
  test.setTimeout(120_000)

  const context = await browser.newContext()
  const page = await context.newPage()

  // Route BGG URLs to a deterministic local fulfillment so we can
  // prove the overlay link activates without contacting live BGG.
  await context.route('https://boardgamegeek.com/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body><h1>Mock BGG</h1></body></html>'
    })
  })

  try {
    await signIn(page, 'e2e_alice@example.com', 'password')

    const { session_ids: sessionIds } = groupFixture
    const pickingRoute = `/s/${sessionIds.picking}`
    const groupRoute = `/g/E2ENIGHTOWLS`
    const collectionRoute = '/collection?usernames=e2e_alice,e2e_bob'

    for (const theme of ['light', 'dark'] as const) {
      await setTheme(page, theme)

      for (const vp of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
        await page.setViewportSize({ width: vp.width, height: vp.height })

        // ── Home ──
        await page.goto('/')
        await expect(page.getByText('Merge collections').first()).toBeVisible({ timeout: 10_000 })
        await assertRouteThemeOverflow(page, theme)
        if (vp.width < 768) {
          await expect(page.getByRole('button', { name: 'Open navigation' }).first()).toBeVisible()
        } else {
          await expect(page.getByRole('link', { name: 'Collection' })).toBeVisible()
          await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
        }

        // ── Collection ──
        await page.goto(collectionRoute)
        await expect(page.getByText('Wingspan').first()).toBeVisible({ timeout: 10_000 })
        await assertRouteThemeOverflow(page, theme)

        // ── Group Detail ──
        await page.goto(groupRoute)
        await expect(page.getByText('e2e Night Owls').first()).toBeVisible({ timeout: 10_000 })
        await assertRouteThemeOverflow(page, theme)

        // ── Picking session ──
        await page.goto(pickingRoute)
        const heading = page.getByText(/e2e Picking Night|Game Suggestions \(Filtered for/)
        await expect(heading.first()).toBeVisible({ timeout: 10_000 })
        await assertRouteThemeOverflow(page, theme)
      }
    }

    // — Theme persists after route changes and reload —
    await setTheme(page, 'dark')
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.goto(collectionRoute)
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)

    // — Navigation: mobile drawer open/close —
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).first().click()
    await expect(page.getByRole('link', { name: 'Account' })).toBeVisible()
    await page.getByRole('button', { name: 'Close navigation' }).click()

    // — Full-card BGG overlay click via non-control card area —
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(collectionRoute)

    const gameCard = page.locator('[data-testid="game-card"]').first()
    await expect(gameCard).toBeVisible({ timeout: 10_000 })

    // Click the heading's screen coordinates so browser hit-testing—not
    // Playwright locator actionability—proves the pointer-events-none
    // content passes the click through to the overlay link.
    const headingBox = await gameCard.locator('h3').first().boundingBox()
    if (!headingBox) throw new Error('Game-card heading has no click target')
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 10_000 }),
      page.mouse.click(
        headingBox.x + headingBox.width / 2,
        headingBox.y + headingBox.height / 2
      )
    ])

    const popupUrl = popup.url()
    expect(popupUrl).toMatch(/boardgamegeek\.com\/boardgame\//)
    await popup.close()

    // Verify safe link attributes on the overlay
    const bggLink = gameCard.locator('[data-testid="game-card-link"]')
    await expect(bggLink).toHaveAttribute('target', '_blank')
    await expect(bggLink).toHaveAttribute('rel', 'noopener noreferrer')

    // Verify card has article semantics
    await expect(gameCard).toHaveAttribute('role', 'article')

    // — Picking: nested disclosure click does NOT create a popup —
    await page.goto(pickingRoute)
    await expect(page.getByText('e2e Picking Night')).toBeVisible({ timeout: 10_000 })

    // Look for a disclosure or the pick button as a non-mutating nested control.
    // Deterministic suggestions may or may not have a disclosure; use whichever exists.
    const disclosure = page.locator('[data-testid="show-more-reasons"]').first()
    // Attach a popup listener around the interaction and assert zero unexpected popups.
    let unexpectedPopup = false
    const popupGuard = (p: Page) => { unexpectedPopup = true; p.close() }
    context.on('page', popupGuard)

    await expect(disclosure).toBeVisible()
    await disclosure.click()
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true')

    context.removeListener('page', popupGuard)
    expect(unexpectedPopup).toBe(false)

  } finally {
    await context.close()
  }
})
