import { test, expect, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const UT_DIR = path.join('.screenshots', 'edit-kommentar')
const TEST_EPOST = process.env.TEST_EPOST ?? 'reidar.aasheim@gmail.com'
const TEST_PASSORD = process.env.TEST_PASSORD ?? 'test123'

async function loggInn(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EPOST)
  await page.fill('input[type="password"]', TEST_PASSORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 10_000 })
}

test.describe('Redigere egne meldinger inline', () => {
  test.beforeAll(() => {
    fs.mkdirSync(UT_DIR, { recursive: true })
  })

  test('redigerer egen kommentar via picker', async ({ page }) => {
    test.setTimeout(120_000)

    await loggInn(page)

    // Opprett en poll og poste en kommentar som vi kan redigere
    await page.goto('/poll/ny')
    await page.waitForLoadState('networkidle')

    const ts = Date.now()
    await page.fill('input[placeholder="Hva lurer du på?"]', `Edit-test ${ts}`)
    const alts = page.locator('input[placeholder="Alternativ"]')
    await alts.nth(0).fill('A')
    await alts.nth(1).fill('B')
    await page.getByRole('button', { name: 'Publiser' }).click()
    await page.waitForURL(/\/poll\/[0-9a-f-]+$/, { timeout: 10_000 })
    const pollUrl = page.url()

    const original = `Opprinnelig tekst ${ts}`
    await page.fill('input[placeholder="Skriv en melding…"]', original)
    await page.getByRole('button', { name: 'Send melding' }).click()
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(UT_DIR, '01-posted.png'), fullPage: true })
    await expect(page.getByText(original)).toBeVisible()

    // Trigger picker via høyreklikk (desktop-ekvivalent til long-press)
    const boble = page.getByText(original).first()
    await boble.click({ button: 'right' })
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(UT_DIR, '02-picker.png'), fullPage: true })

    // Klikk Rediger
    await page.getByRole('button', { name: 'Rediger melding' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(UT_DIR, '03-edit-mode.png'), fullPage: true })

    // Endre tekst og lagre
    const endret = `Endret tekst ${ts}`
    const textarea = page.locator('textarea').first()
    await textarea.fill(endret)
    await page.getByRole('button', { name: /^Lagre/ }).click()
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(UT_DIR, '04-etter-lagre.png'), fullPage: true })

    await expect(page.getByText(endret)).toBeVisible()
    await expect(page.getByText(original)).not.toBeVisible()

    // Rydd opp
    page.on('dialog', d => d.accept())
    await page.goto(pollUrl)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Slett avstemming' }).click()
    await page.waitForURL('**/', { timeout: 10_000 })
  })
})
