import { test, expect, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Verifiserer kommentar-funksjonalitet på arrangement + poll og at siste
 * kommentarer dukker opp i agenda-widgeten. Rydder opp ved slutt.
 */

const UT_DIR = path.join('.screenshots', 'kommentarer')
const TEST_EPOST = process.env.TEST_EPOST ?? 'reidar.aasheim@gmail.com'
const TEST_PASSORD = process.env.TEST_PASSORD ?? 'test123'

async function loggInn(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EPOST)
  await page.fill('input[type="password"]', TEST_PASSORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 10_000 })
}

test.describe('Kommentarer på arrangement og poll', () => {
  test.beforeAll(() => {
    fs.mkdirSync(UT_DIR, { recursive: true })
  })

  test('poll: opprett, kommenter, verifiser widget på agenda', async ({ page }) => {
    test.setTimeout(120_000)

    await loggInn(page)

    // Opprett en 2-valgs poll (for å også teste inline-variant)
    await page.goto('/poll/ny')
    await page.waitForLoadState('networkidle')

    const tidsstempel = Date.now()
    const spoersmaal = `Komm-test ${tidsstempel}`
    await page.fill('input[placeholder="Hva lurer du på?"]', spoersmaal)
    const altInputs = page.locator('input[placeholder="Alternativ"]')
    await altInputs.nth(0).fill('Ja')
    await altInputs.nth(1).fill('Nei')

    await page.getByRole('button', { name: 'Publiser' }).click()
    await page.waitForURL(/\/poll\/[0-9a-f-]+$/, { timeout: 10_000 })
    const pollUrl = page.url()

    // Detaljsiden skal nå vise Kommentarer-seksjon
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(UT_DIR, '01-poll-detalj.png'), fullPage: true })
    await expect(page.getByText('Kommentarer').first()).toBeVisible()

    // Post en kommentar
    const kommentar = `Dette er en test ${tidsstempel}`
    await page.fill('input[placeholder="Skriv en melding…"]', kommentar)
    await page.getByRole('button', { name: 'Send melding' }).click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(UT_DIR, '02-poll-med-kommentar.png'), fullPage: true })
    await expect(page.getByText(kommentar)).toBeVisible()

    // Sjekk agenda — kommentaren skal vises inline i selve pollkortet
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(UT_DIR, '03-agenda-inline.png'), fullPage: true })
    await expect(page.getByText(kommentar).first()).toBeVisible()

    // Kommenter-knappen på inline poll-kortet skal finnes
    await expect(page.locator('[aria-label="Kommenter"]').first()).toBeVisible()

    // Rydd opp: slett test-pollen (sletter også kommentar via cascade)
    await page.goto(pollUrl)
    await page.waitForLoadState('networkidle')
    page.on('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Slett avstemming' }).click()
    await page.waitForURL('**/', { timeout: 10_000 })
  })
})
