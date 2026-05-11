import { test, expect, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Reproduserer dock-regresjon (#147): bottom-nav følger med scroll på
 * iOS Safari/PWA istedenfor å være ankret til viewport-bunnen.
 *
 * Strategi:
 *  1. Logg inn, naviger til agendaen
 *  2. Mål nav.getBoundingClientRect().bottom før scroll
 *  3. Scroll vinduet 800 px ned
 *  4. Mål bottom igjen
 *  5. Forventning: bottom-verdien er omtrent uendret (ankret til viewport)
 *
 * Logger samtidig ancestor-kjeden for å avdekke hvilken stamfar som
 * etablerer ny "containing block" for position:fixed (transform/filter/
 * backdrop-filter/perspective/will-change/contain).
 */

const UT_DIR = path.join('.screenshots', 'dock-147')
const TEST_EPOST = process.env.TEST_EPOST ?? 'reidar.aasheim@gmail.com'
const TEST_PASSORD = process.env.TEST_PASSORD ?? ''

async function loggInn(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_EPOST)
  await page.fill('input[type="password"]', TEST_PASSORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 15_000 })
}

test.describe('Dock-scroll regresjon #147', () => {
  // Hopp over hele suiten hvis TEST_PASSORD ikke er satt — i stedet for å
  // kaste på toppnivå, som ville knust hele Playwright-kjøringen (også
  // andre spec-er via --grep).
  test.skip(!TEST_PASSORD, 'TEST_PASSORD ikke satt — hopper over dock-scroll-suiten.')

  test.beforeAll(() => {
    fs.mkdirSync(UT_DIR, { recursive: true })
  })

  test('dock skal være ankret til viewport-bunn ved scroll', async ({ page }) => {
    test.setTimeout(60_000)

    await loggInn(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const navSelector = 'nav[aria-label="Hovednavigasjon"]'
    await page.waitForSelector(navSelector)

    // Diagnose: Logg containing-block-relevante egenskaper i ancestor-kjeden.
    const ancestors = await page.evaluate((sel) => {
      const nav = document.querySelector(sel) as HTMLElement | null
      if (!nav) return []
      const out: Array<Record<string, string>> = []
      let el: HTMLElement | null = nav.parentElement
      while (el) {
        const cs = window.getComputedStyle(el)
        out.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
          transform: cs.transform,
          filter: cs.filter,
          backdropFilter: cs.backdropFilter || (cs as unknown as Record<string, string>).webkitBackdropFilter || '',
          perspective: cs.perspective,
          willChange: cs.willChange,
          contain: cs.contain,
          position: cs.position,
          backgroundAttachment: cs.backgroundAttachment,
          overflow: cs.overflow,
        })
        el = el.parentElement
      }
      return out
    }, navSelector)

    console.log('--- Ancestor-kjede for nav (#147 diagnose) ---')
    for (const a of ancestors) {
      const flagg = []
      if (a.transform !== 'none') flagg.push(`transform=${a.transform}`)
      if (a.filter !== 'none') flagg.push(`filter=${a.filter}`)
      if (a.backdropFilter && a.backdropFilter !== 'none') flagg.push(`backdrop-filter=${a.backdropFilter}`)
      if (a.perspective !== 'none') flagg.push(`perspective=${a.perspective}`)
      if (a.willChange !== 'auto') flagg.push(`will-change=${a.willChange}`)
      if (a.contain !== 'none') flagg.push(`contain=${a.contain}`)
      if (a.backgroundAttachment === 'fixed') flagg.push(`bg-attachment=fixed`)
      const tag = `${a.tag}${a.id ? '#' + a.id : ''}${a.className ? '.' + a.className.replace(/\s+/g, '.') : ''}`
      console.log(`  ${tag} :: pos=${a.position} ${flagg.join(' ') || '(ingen)'}`)
    }

    const foer = await page.evaluate((sel) => {
      const nav = document.querySelector(sel) as HTMLElement | null
      if (!nav) return null
      const r = nav.getBoundingClientRect()
      return { bottom: r.bottom, top: r.top, scrollY: window.scrollY }
    }, navSelector)

    await page.screenshot({ path: path.join(UT_DIR, '01-foer-scroll.png'), fullPage: false })

    // Scroll dokument-roten 800 px ned
    await page.evaluate(() => window.scrollTo(0, 800))
    await page.waitForTimeout(300)

    const etter = await page.evaluate((sel) => {
      const nav = document.querySelector(sel) as HTMLElement | null
      if (!nav) return null
      const r = nav.getBoundingClientRect()
      return { bottom: r.bottom, top: r.top, scrollY: window.scrollY }
    }, navSelector)

    await page.screenshot({ path: path.join(UT_DIR, '02-etter-scroll.png'), fullPage: false })

    console.log('Foer scroll:', foer)
    console.log('Etter scroll:', etter)

    expect(foer).not.toBeNull()
    expect(etter).not.toBeNull()
    // Hvis dock er ankret til viewport, skal bottom være tilnærmet identisk
    // før og etter scroll (innenfor 2 px slack).
    const diff = Math.abs((etter!.bottom) - (foer!.bottom))
    console.log('Diff bottom (px):', diff, 'scrollY:', etter!.scrollY)
    expect(diff).toBeLessThan(2)
  })
})
