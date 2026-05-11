import { test, expect, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Vakthund mot dock-skjul-regresjoner (#99, #104, #147, #151).
 *
 * Policy (CLAUDE.md → Policy: Dock-synlighet): docken skal aldri skjules
 * av imperative DOM-events. Denne spec-en verifiserer at docken er synlig
 * og ankret til viewport-bunnen etter scroll, focus og blur.
 *
 * Filnavn beholdt for git-blame-kontinuitet med opprinnelig regresjon #147.
 */

const UT_DIR = path.join('.screenshots', 'dock-147')
const TEST_EPOST = process.env.TEST_EPOST ?? 'reidar.aasheim@gmail.com'
const TEST_PASSORD = process.env.TEST_PASSORD ?? ''
const NAV_SELECTOR = 'nav[aria-label="Hovednavigasjon"]'

async function loggInn(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EPOST)
  await page.fill('input[type="password"]', TEST_PASSORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 15_000 })
}

type DockState = {
  display: string
  bottom: number
  viewportHeight: number
}

async function dockState(page: Page): Promise<DockState | null> {
  return page.evaluate((sel) => {
    const nav = document.querySelector(sel) as HTMLElement | null
    if (!nav) return null
    const cs = window.getComputedStyle(nav)
    const r = nav.getBoundingClientRect()
    return {
      display: cs.display,
      bottom: r.bottom,
      viewportHeight: window.innerHeight,
    }
  }, NAV_SELECTOR)
}

function forventDockSynlig(state: DockState | null, kontekst: string) {
  expect(state, `dock-state etter ${kontekst}`).not.toBeNull()
  expect(state!.display, `display etter ${kontekst}`).not.toBe('none')
  // Dock er ankret nær viewport-bunn. Slack på 30 px dekker bottom-offset
  // (14 px) + safe-area i Chromium-runner. En "flytende" dock som tidligere
  // har vært en bug-kilde, vil bryte denne grensen — i begge retninger:
  //  - For langt opp (>30 px over bunn) = flytende dock
  //  - Under viewport (bottom > viewportHeight) = dock skjult under skjerm
  const avstandFraBunn = state!.viewportHeight - state!.bottom
  expect(
    state!.bottom,
    `dock skal ikke være under viewport etter ${kontekst} (bottom=${state!.bottom}, viewportH=${state!.viewportHeight})`,
  ).toBeLessThanOrEqual(state!.viewportHeight)
  expect(
    avstandFraBunn,
    `dock skal være ankret til viewport-bunnen etter ${kontekst} (avstand=${avstandFraBunn})`,
  ).toBeLessThan(30)
}

test.describe('Dock-synlighet — vakthund mot regresjon #99/#104/#147/#151', () => {
  test.skip(!TEST_PASSORD, 'TEST_PASSORD ikke satt — hopper over dock-vakthund-suiten.')

  test.beforeAll(() => {
    fs.mkdirSync(UT_DIR, { recursive: true })
  })

  test('dock forblir synlig etter scroll, focus og blur', async ({ page }) => {
    test.setTimeout(60_000)

    await loggInn(page)
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.waitForSelector(NAV_SELECTOR)

    // Etter sideinnlasting
    forventDockSynlig(await dockState(page), 'sideinnlasting')
    await page.screenshot({ path: path.join(UT_DIR, '01-init.png'), fullPage: false })

    // Scroll i dokumentet
    await page.evaluate(() => window.scrollTo(0, 800))
    await page.waitForTimeout(200)
    forventDockSynlig(await dockState(page), 'scroll 800 px')
    await page.screenshot({ path: path.join(UT_DIR, '02-etter-scroll.png'), fullPage: false })

    // Fokus på chat-input. Hard assert — hvis selectoren brytes (placeholder
    // endret, markup endret) skal vakthund-effekten ikke forsvinne i stillhet.
    const chatInput = page.locator('input[placeholder*="Skriv en melding"]').first()
    await expect(chatInput, 'chat-input må finnes for å verifisere focus/blur-oppførsel').toBeVisible()

    await chatInput.focus()
    await page.waitForTimeout(200)
    forventDockSynlig(await dockState(page), 'input.focus()')
    await page.screenshot({ path: path.join(UT_DIR, '03-etter-focus.png'), fullPage: false })

    // Scroll mens input har fokus
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(200)
    forventDockSynlig(await dockState(page), 'scroll med input fokusert')

    // Blur
    await chatInput.evaluate((el: HTMLInputElement) => el.blur())
    await page.waitForTimeout(200)
    forventDockSynlig(await dockState(page), 'input.blur()')
    await page.screenshot({ path: path.join(UT_DIR, '04-etter-blur.png'), fullPage: false })
  })
})
