import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures', 'e2e_session.json'), 'utf-8')
)

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 })
}

test('session lifecycle: guest RSVPs, host picks game, summary shows result', async ({ browser }) => {
  const { session_id: sessionId, invite_token: inviteToken } = fixture

  const hostContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()

  try {
    // Host signs in and views the invited session
    await signIn(hostPage, 'e2e_alice@example.com', 'password')
    await hostPage.goto(`/s/${sessionId}`)
    await expect(hostPage.getByText('INVITED')).toBeVisible({ timeout: 10_000 })
    await expect(hostPage.getByRole('button', { name: 'Start picking' })).toBeVisible({ timeout: 10_000 })
    await expect(hostPage.getByText('Attendee count')).toBeVisible()
    await expect(hostPage.getByText('0', { exact: true })).toBeVisible()

    // Guest opens the magic invite link and RSVPs "Going"
    await guestPage.goto(`/invite/${inviteToken}`)
    await expect(guestPage.getByText("e2e Friday Games")).toBeVisible({ timeout: 10_000 })
    await guestPage.getByLabel('Name your nickname (optional)').fill('Guest')
    await guestPage.getByRole('button', { name: 'Going', exact: true }).click()
    await expect(guestPage.getByText('Thanks! Your response is Going')).toBeVisible({ timeout: 10_000 })
    await expect(guestPage.getByText('Attendee count: 1')).toBeVisible()

    // Host sees the updated attendee count and starts picking
    await hostPage.reload()
    await expect(hostPage.getByText('1', { exact: true })).toBeVisible({ timeout: 10_000 })
    await hostPage.getByRole('button', { name: 'Start picking' }).click()
    await expect(hostPage.getByText('PICKING')).toBeVisible({ timeout: 10_000 })
    await expect(hostPage.getByText('Pick a game')).toBeVisible()

    // Host picks a game from the group collection
    const wingspanCard = hostPage.locator('article', { has: hostPage.getByRole('heading', { name: 'Wingspan' }) })
    await expect(wingspanCard).toBeVisible({ timeout: 10_000 })
    await wingspanCard.getByRole('button', { name: 'Pick this game' }).click()

    // Completed summary shows the picked game and the attending guest
    await expect(hostPage.getByText('COMPLETED')).toBeVisible({ timeout: 10_000 })
    await expect(hostPage.getByRole('heading', { name: 'Wingspan' })).toBeVisible()
    await expect(hostPage.getByText('Picked game')).toBeVisible()
    await expect(hostPage.getByText('Guest')).toBeVisible()
    await expect(hostPage.getByRole('listitem').getByText('Going')).toBeVisible()
  } finally {
    await hostContext.close()
    await guestContext.close()
  }
})
