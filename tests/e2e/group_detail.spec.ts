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

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 })
}

test.describe('group detail', () => {
  test('owner sees header, ordered sessions, and can create a night', async ({ page }) => {
    const { invite_code: inviteCode, owner_email: ownerEmail, session_ids: sessionIds } = fixture

    await signIn(page, ownerEmail, 'password')
    await page.goto(`/g/${inviteCode}`)

    await expect(page.getByRole('heading', { name: 'e2e Night Owls' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('End-to-end test group for the Night Owls')).toBeVisible()
    await expect(page.getByText('2 members')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create a night' })).toBeVisible()

    const rows = page.getByRole('listitem')
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(0).getByText('e2e Picking Night')).toBeVisible()
    await expect(rows.nth(0).getByRole('button', { name: 'Choose a game' })).toBeVisible()
    await expect(rows.nth(1).getByText('e2e Friday Games')).toBeVisible()
    await expect(rows.nth(1).getByRole('button', { name: 'View details' })).toBeVisible()
    await expect(rows.nth(2).getByText('e2e Draft Night')).toBeVisible()
    await expect(rows.nth(2).getByText('Date TBD')).toBeVisible()
    await expect(rows.nth(2).getByRole('button', { name: 'View details' })).toBeVisible()

    await expect(page.getByText('e2e Completed Night')).not.toBeVisible()
    await expect(page.getByText('e2e Cancelled Night')).not.toBeVisible()

    await rows.nth(0).getByRole('button', { name: 'Choose a game' }).click()
    await page.waitForURL(`/s/${sessionIds.picking}`, { timeout: 10_000 })
  })

  test('member sees sessions but cannot create a night or see drafts', async ({ page }) => {
    const { invite_code: inviteCode, member_email: memberEmail } = fixture

    await signIn(page, memberEmail, 'password')
    await page.goto(`/g/${inviteCode}`)

    await expect(page.getByRole('heading', { name: 'e2e Night Owls' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Create a night' })).not.toBeVisible()

    const rows = page.getByRole('listitem')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0).getByText('e2e Picking Night')).toBeVisible()
    await expect(rows.nth(1).getByText('e2e Friday Games')).toBeVisible()
    await expect(page.getByText('e2e Draft Night')).not.toBeVisible()
  })
})
