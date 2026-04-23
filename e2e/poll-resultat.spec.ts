import { test, expect, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const UT_DIR = path.join('.screenshots', 'poll-resultat')
const TEST_EPOST = process.env.TEST_EPOST ?? 'reidar.aasheim@gmail.com'
const TEST_PASSORD = process.env.TEST_PASSORD ?? 'test123'

async function loggInn(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EPOST)
  await page.fill('input[type="password"]', TEST_PASSORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 10_000 })
}

test.describe('Resultat etter stemme (#88)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(UT_DIR, { recursive: true })
  })

  test('inline agenda: resultat vises etter stemme, Endre svar bringer tilbake knapper', async ({ page }) => {
    test.setTimeout(120_000)

    await loggInn(page)

    // Opprett 2-valgs poll for inline
    await page.goto('/poll/ny')
    await page.waitForLoadState('networkidle')
    const ts = Date.now()
    await page.fill('input[placeholder="Hva lurer du på?"]', `Res-test ${ts}`)
    const alts = page.locator('input[placeholder="Alternativ"]')
    await alts.nth(0).fill('Ja')
    await alts.nth(1).fill('Nei')
    await page.getByRole('button', { name: 'Publiser' }).click()
    await page.waitForURL(/\/poll\/[0-9a-f-]+$/, { timeout: 10_000 })
    const pollUrl = page.url()

    // På detaljsiden: stem «Ja» for å få en stemme
    await page.getByRole('button', { name: 'Ja' }).first().click()
    await page.getByRole('button', { name: /^Stem$/ }).click()
    await page.waitForTimeout(1500)

    // Detaljsiden skal nå vise Resultat primært + Endre svar-knapp
    await page.screenshot({ path: path.join(UT_DIR, '01-detalj-etter-stemme.png'), fullPage: true })
    await expect(page.getByText('Resultat').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Endre svar' })).toBeVisible()

    // Agenda — inline kortet skal nå vise stolper etter stemme
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(UT_DIR, '02-agenda-etter-stemme.png'), fullPage: true })
    // Stolper → 100% synlig på Ja
    await expect(page.getByText('100%').first()).toBeVisible()
    // «Endre svar» finnes på kortet
    await expect(page.getByRole('button', { name: 'Endre svar' }).first()).toBeVisible()

    // Klikk Endre svar på vårt test-pollkort — knappene skal dukke opp igjen.
    // Targeter kortet via link-href for å unngå å treffe andre polls.
    const pollPath = new URL(pollUrl).pathname
    const mittKort = page.locator(`a[href="${pollPath}"]`).first()
    await mittKort.getByRole('button', { name: 'Endre svar' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(UT_DIR, '03-agenda-etter-endre-svar.png'), fullPage: true })
    await expect(mittKort.getByRole('button', { name: 'Ja' })).toBeVisible()

    // Rydd opp
    page.on('dialog', d => d.accept())
    await page.goto(pollUrl)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Slett avstemming' }).click()
    await page.waitForURL('**/', { timeout: 10_000 })
  })
})
