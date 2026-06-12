import { test, expect, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { loggInn, harTestCreds } from './helpers/auth'

/**
 * Genererer ANONYMISERTE skjermbilder til README-en i det åpne klubb-app-
 * repoet. Kjøres mot lokal dev-server med generiske NEXT_PUBLIC_KLUBB_*-
 * env-vars satt (se kommando nederst). Før hvert skjermbilde byttes ekte
 * medlemsnavn/kallenavn ut med fiktive navn i DOM-en, og alle innholds-
 * bilder (avatarer, arrangementbilder) blurres.
 *
 * Denne spec-en hører KUN hjemme i kilde-repoet — navnemappingen under
 * inneholder ekte medlemsnavn og skal aldri kopieres til klubb-app.
 *
 * Kjøring:
 *   $env:NEXT_PUBLIC_KLUBB_NAVN='Min Klubb'; ... npm run dev   (egen prosess)
 *   npx playwright test e2e/readme-skjermbilder.spec.ts
 */

const UT_DIR = path.join('.screenshots', 'readme')

// Komplett mapping bygget fra profiles-tabellen (navn + visningsnavn) +
// adresser fra kommende arrangementer. Erstattes i ÉN regex-pass med lengste
// nøkkel først — innsatte fiktive navn kan dermed aldri bli re-erstattet
// («Chris»→«Christian» inni «Christopher» ga «Christiantopher» med naiv loop).
const NAVNEMAP: [string, string][] = [
  // Fulle navn
  ['Klas Kristoffer Liland', 'Kjetil Foss'],
  ['Kristian Blichfeldt Andresen', 'Karl Voll'],
  ['Kristoffer Benco Arntzen', 'Kasper Nygård'],
  ['Thomas Formo Riise', 'Tore Vang'],
  ['Reidar Eik Haavik', 'Rune Bakke'],
  ['Alexander Svensen', 'Anders Berg'],
  ['Christopher Reitan', 'Christian Moe'],
  ['Andreas Eriksen', 'Arne Lie'],
  ['Michael Johansen', 'Magnus Dale'],
  ['Richard Andresen', 'Robert Voll'],
  ['Kenneth Lunde', 'Knut Berge'],
  ['Jon Erik Dahl', 'Jonas Vik'],
  ['Espen Waldem', 'Even Strand'],
  ['Espen Hagen', 'Erik Lund'],
  ['Øyvind Rekve', 'Ola Eng'],
  ['Øyvind Verket', 'Otto Haug'],
  ['André Heede', 'Bjørn Holm'],
  ['Pål Erik', 'Petter Aas'],
  // Kallenavn / visningsnavn
  ['Thomas the Tank', 'Tore'],
  ['Værkern', 'Otto'],
  ['Duubie', 'Knut'],
  ['Benco', 'Kasper'],
  ['Jonna', 'Jonas'],
  ['Reka', 'Ola'],
  ['Andy', 'Arne'],
  // Fornavn alene
  ['Christopher', 'Christian'],
  ['Alexander', 'Anders'],
  ['Kristoffer', 'Kasper'],
  ['Kristian', 'Karl'],
  ['Michael', 'Magnus'],
  ['Kenneth', 'Knut'],
  ['Andreas', 'Arne'],
  ['Richard', 'Robert'],
  ['Reidar', 'Rune'],
  ['Øyvind', 'Otto'],
  ['Thomas', 'Tore'],
  ['André', 'Bjørn'],
  ['Espen', 'Erik'],
  ['Chris', 'Christian'],
  ['Klas', 'Kjetil'],
  ['Alex', 'Anders'],
  ['Pål', 'Petter'],
  // Etternavn alene
  ['Blichfeldt', 'Voll'],
  ['Andresen', 'Voll'],
  ['Johansen', 'Dale'],
  ['Arntzen', 'Nygård'],
  ['Eriksen', 'Lie'],
  ['Svensen', 'Berg'],
  ['Waldem', 'Strand'],
  ['Liland', 'Foss'],
  ['Haavik', 'Bakke'],
  ['Reitan', 'Moe'],
  ['Verket', 'Haug'],
  ['Rekve', 'Eng'],
  ['Heede', 'Holm'],
  ['Lunde', 'Berge'],
  ['Riise', 'Vang'],
  ['Formo', 'Vang'],
  ['Hagen', 'Lund'],
  ['Dahl', 'Vik'],
  // Adresser/steder fra kommende arrangementer
  ['Schweigaards gate 34e', 'Eksempelveien 12'],
  ['Schweigaards gate', 'Eksempelveien'],
  ['Digerud', 'Fjellstrand'],
  // Klubbidentitet i DB-innhold (vedtekter, historikk, titler)
  ['Mortensrud Herreklubb', 'Min Klubb'],
  ['Herreklubben', 'Klubben'],
  ['herreklubben', 'klubben'],
  ['Mortensrud', 'Min Klubb'],
]

/** Bytter navn i alle tekstnoder og blurrer alle innholdsbilder. */
async function anonymiser(page: Page): Promise<void> {
  await page.evaluate((navnemap: [string, string][]) => {
    // Én-pass-erstatning: alternation med lengste nøkkel først.
    const oppslag = new Map(navnemap)
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(navnemap.map(([k]) => esc(k)).join('|'), 'g')
    const erstatt = (t: string) => t.replace(re, m => oppslag.get(m) ?? m)
    // 1. Tekstnoder
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const noder: Text[] = []
    while (walker.nextNode()) noder.push(walker.currentNode as Text)
    for (const node of noder) {
      const t = erstatt(node.textContent ?? '')
      if (t !== node.textContent) node.textContent = t
    }
    // 1b. Initial-avatarer: tekstnoder som KUN består av ekte initialer
    // byttes til de fiktive navnenes initialer (eksakt match, ikke substring).
    const initialMap: Record<string, string> = {
      AS: 'AB', AH: 'BH', AE: 'AL', CR: 'CM', EH: 'EL', EW: 'ES',
      JD: 'JV', JED: 'JV', KL: 'KB', KKL: 'KF', KA: 'KV', KBA: 'KV',
      MJ: 'MD', ØR: 'OE', ØV: 'OH', PE: 'PA', RH: 'RB', REH: 'RB',
      RA: 'RV', TR: 'TV', TFR: 'TV',
    }
    for (const node of noder) {
      const trimmet = (node.textContent ?? '').trim()
      if (trimmet in initialMap) node.textContent = initialMap[trimmet]
    }
    // 2. Attributter som kan vise navn (alt, title, aria-label)
    for (const el of Array.from(document.querySelectorAll('[alt], [title], [aria-label]'))) {
      for (const attr of ['alt', 'title', 'aria-label']) {
        const v = el.getAttribute(attr)
        if (!v) continue
        const t = erstatt(v)
        if (t !== v) el.setAttribute(attr, t)
      }
    }
    // 3. Blur alle innholdsbilder (avatarer, arrangement-/profilbilder).
    // App-ikoner og statiske assets fra /public beholdes skarpe.
    for (const img of Array.from(document.querySelectorAll('img'))) {
      const src = img.getAttribute('src') ?? ''
      const erStatisk = /\/(icon-|favicon|bakgrunn)/.test(src)
      if (!erStatisk) (img as HTMLImageElement).style.filter = 'blur(10px)'
    }
    // 4. Fjern Next.js dev-indikatoren (svart «N»-sirkel nederst til venstre)
    document.querySelector('nextjs-portal')?.remove()
    // 5. Blur CSS-bakgrunnsbilder (f.eks. hero-/kortbilder satt via style)
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[style*="background-image"]'))) {
      if (el.style.backgroundImage.includes('url(')) el.style.filter = 'blur(10px)'
    }
  }, NAVNEMAP)
}

async function foersteArrangementLenke(page: Page): Promise<string | null> {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const lenker = await page.$$eval('a[href^="/arrangementer/"]', els =>
    els
      .map(e => e.getAttribute('href'))
      .filter((h): h is string => !!h && !h.includes('/ny') && !h.includes('/rediger') && !h.includes('/tidligere')),
  )
  return lenker[0] ?? null
}

test.describe('README-skjermbilder (anonymisert)', () => {
  test.skip(!harTestCreds(), 'TEST_EPOST/TEST_PASSORD mangler — se e2e/README.md')

  test.beforeAll(() => {
    fs.mkdirSync(UT_DIR, { recursive: true })
  })

  test('fanger anonymiserte skjermbilder', async ({ page }) => {
    test.setTimeout(180_000)

    await loggInn(page)
    const arrLenke = await foersteArrangementLenke(page)

    const ruter: { navn: string; besok: (p: Page) => Promise<void> }[] = [
      { navn: 'agenda', besok: async p => { await p.goto('/') } },
      { navn: 'arrangement', besok: async p => { if (arrLenke) await p.goto(arrLenke) } },
      { navn: 'klubbinfo', besok: async p => { await p.goto('/klubbinfo') } },
      { navn: 'medlemmer', besok: async p => { await p.goto('/klubbinfo/medlemmer') } },
      { navn: 'kaaringer', besok: async p => { await p.goto('/kaaringer') } },
      { navn: 'profil', besok: async p => { await p.goto('/profil') } },
    ]

    for (const rute of ruter) {
      await rute.besok(page)
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
      await page.waitForTimeout(800)
      await anonymiser(page)
      // Viewport-utsnitt (ikke fullPage) — README skal vise app-følelsen,
      // ikke kilometerlange sider.
      await page.screenshot({ path: path.join(UT_DIR, `${rute.navn}.png`), fullPage: false })
    }

    expect(fs.readdirSync(UT_DIR).filter(f => f.endsWith('.png')).length).toBe(ruter.length)
  })
})
