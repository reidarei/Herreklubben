import { test, expect, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Verifiserer inline-stemming på agenda-kortet for poll med ≤ MAKS_INLINE_VALG
 * alternativer. Oppretter 2-valgs poll, tar screenshot av agenda før og etter
 * stemming, rydder opp til slutt.
 */

const UT_DIR = path.join('.screenshots', 'poll-inline')
const TEST_EPOST = process.env.TEST_EPOST ?? 'reidar.aasheim@gmail.com'
const TEST_PASSORD = process.env.TEST_PASSORD ?? 'test123'

async function loggInn(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EPOST)
  await page.fill('input[type="password"]', TEST_PASSORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 10_000 })
}

test.describe('Inline-stemming på agenda', () => {
  test.beforeAll(() => {
    fs.mkdirSync(UT_DIR, { recursive: true })
  })

  test('2-valgs poll vises med inline stemmeknapper', async ({ page }) => {
    test.setTimeout(120_000)

    await loggInn(page)

    // Opprett en 2-valgs enkelpoll (faller innenfor MAKS_INLINE_VALG=2)
    await page.goto('/poll/ny')
    await page.waitForLoadState('networkidle')

    const tidsstempel = Date.now()
    const spoersmaal = `Inline-test ${tidsstempel}`
    await page.fill('input[placeholder="Hva lurer du på?"]', spoersmaal)

    const altInputs = page.locator('input[placeholder="Alternativ"]')
    await altInputs.nth(0).fill('Ja')
    await altInputs.nth(1).fill('Nei')

    await page.getByRole('button', { name: 'Publiser' }).click()
    await page.waitForURL(/\/poll\/[0-9a-f-]+$/, { timeout: 10_000 })
    const pollUrl = page.url()

    // Gå til agenda og verifiser inline-kortet
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(UT_DIR, '01-agenda-inline-ustemt.png'), fullPage: true })

    // Begge knappene skal være synlige inline (rolle: button i kortet)
    const kort = page.locator(`a[href="${new URL(pollUrl).pathname}"]`)
    await expect(kort).toBeVisible()
    const jaBtn = kort.getByRole('button', { name: 'Ja' })
    const neiBtn = kort.getByRole('button', { name: 'Nei' })
    await expect(jaBtn).toBeVisible()
    await expect(neiBtn).toBeVisible()

    // Stem inline — klikk Ja
    await jaBtn.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(UT_DIR, '02-agenda-inline-stemt-ja.png'), fullPage: true })

    // Skift stemme — klikk Nei
    await neiBtn.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(UT_DIR, '03-agenda-inline-byttet-nei.png'), fullPage: true })

    // Rydd opp
    await page.goto(pollUrl)
    await page.waitForLoadState('networkidle')
    page.on('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Slett avstemming' }).click()
    await page.waitForURL('**/', { timeout: 10_000 })
  })
})
