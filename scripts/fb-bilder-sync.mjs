// Synker nye bilder og screenshots inn i preview-mappa, og legger nye filer
// (som ikke er paret enda) inn i ikke_parede-listene med korrekt nr.
// Kjør etter at du har lastet ned flere bilder/screenshots.
//
// Bruk: node scripts/fb-bilder-sync.mjs

import { readdirSync, statSync, copyFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BILDER_DIR = 'C:/Users/reida/Pictures'
const SCREENSHOTS_DIR = 'C:/Users/reida/Pictures/Screenshots'
const PREVIEW_DIR = 'scripts/fb-bilder-preview'
const JSON_FIL = 'scripts/fb-bilder-pairing.json'
const EKSKLUDER = ['icon-192.png', 'icon-192n.png']

if (!existsSync(PREVIEW_DIR)) mkdirSync(PREVIEW_DIR, { recursive: true })

const bilder = readdirSync(BILDER_DIR)
  .filter(f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('Skjermbilde') && !f.startsWith('_crop'))
  .filter(f => !EKSKLUDER.includes(f))
  .map(f => ({ navn: f, mtime: statSync(join(BILDER_DIR, f)).mtime }))
  .sort((a, b) => a.mtime - b.mtime)

const screenshots = readdirSync(SCREENSHOTS_DIR)
  .filter(f => /^Skjermbilde.*\.png$/i.test(f))
  .map(f => ({ navn: f, mtime: statSync(join(SCREENSHOTS_DIR, f)).mtime }))
  .sort((a, b) => a.mtime - b.mtime)

let kopiert = 0
for (const b of bilder) {
  const dst = join(PREVIEW_DIR, b.navn)
  if (!existsSync(dst)) { copyFileSync(join(BILDER_DIR, b.navn), dst); kopiert++ }
}
for (const s of screenshots) {
  const dst = join(PREVIEW_DIR, s.navn)
  if (!existsSync(dst)) { copyFileSync(join(SCREENSHOTS_DIR, s.navn), dst); kopiert++ }
}

const data = JSON.parse(readFileSync(JSON_FIL, 'utf8'))
data.ikke_parede_bilder = (data.ikke_parede_bilder ?? []).map(o => typeof o === 'string' ? { navn: o, bilde_nr: null, bilde_mtime: null } : o)
data.ikke_parede_screenshots = data.ikke_parede_screenshots ?? []

// Sett av kjente filnavn
const bilderIData = new Set([
  ...data.par.filter(p => p.bilde).map(p => p.bilde),
  ...data.ikke_parede_bilder.map(o => o.navn),
])
const screenshotsIData = new Set([
  ...data.par.map(p => p.screenshot),
  ...data.ikke_parede_screenshots.map(o => o.screenshot),
])

// Tildel nye nr basert på mtime-rekkefølge på master-lista
const bildeNrFraNavn = new Map(bilder.map((b, i) => [b.navn, i + 1]))
const screenshotNrFraNavn = new Map(screenshots.map((s, i) => [s.navn, i + 1]))

// Re-tildel nr på alle eksisterende rader så numrene reflekterer dagens master-rekkefølge.
// (Eldre filer får uendret nr siden mtime-rekkefølgen ikke endret seg — nye havner på slutten.)
for (const p of data.par) {
  if (p.bilde) p.bilde_nr = bildeNrFraNavn.get(p.bilde) ?? p.bilde_nr
  p.screenshot_nr = screenshotNrFraNavn.get(p.screenshot) ?? p.screenshot_nr
}
for (const o of data.ikke_parede_bilder) o.bilde_nr = bildeNrFraNavn.get(o.navn) ?? o.bilde_nr
for (const o of data.ikke_parede_screenshots) o.screenshot_nr = screenshotNrFraNavn.get(o.screenshot) ?? o.screenshot_nr

let nyeBilder = 0
for (const b of bilder) {
  if (bilderIData.has(b.navn)) continue
  data.ikke_parede_bilder.push({ navn: b.navn, bilde_nr: bildeNrFraNavn.get(b.navn), bilde_mtime: b.mtime.toISOString() })
  nyeBilder++
}
let nyeScreenshots = 0
for (const s of screenshots) {
  if (screenshotsIData.has(s.navn)) continue
  data.ikke_parede_screenshots.push({ screenshot_nr: screenshotNrFraNavn.get(s.navn), screenshot: s.navn, screenshot_mtime: s.mtime.toISOString() })
  nyeScreenshots++
}

data.ikke_parede_bilder.sort((a, b) => (a.bilde_nr ?? 999) - (b.bilde_nr ?? 999))
data.ikke_parede_screenshots.sort((a, b) => a.screenshot_nr - b.screenshot_nr)

// Auto-par nye bilder/screenshots med nærhets-algoritmen.
// For hver løs screenshot, ta nyeste løse bilde med mtime < screenshot.mtime
// (innen rimelig vindu, f.eks. <300 sek). Reidar retter bytter/uparede manuelt.
const VINDU_SEK = 300
let autoParet = 0
const screenshotsToProcess = [...data.ikke_parede_screenshots].sort((a, b) => new Date(a.screenshot_mtime) - new Date(b.screenshot_mtime))
for (const ss of screenshotsToProcess) {
  const ssTid = new Date(ss.screenshot_mtime)
  const kandidater = data.ikke_parede_bilder
    .filter(b => b.bilde_mtime && new Date(b.bilde_mtime) < ssTid && (ssTid - new Date(b.bilde_mtime)) / 1000 <= VINDU_SEK)
    .sort((a, b) => new Date(b.bilde_mtime) - new Date(a.bilde_mtime))
  const valgt = kandidater[0]
  if (!valgt) continue
  // Flytt valgt fra ikke_parede_bilder til ny rad i par
  const bIdx = data.ikke_parede_bilder.findIndex(o => o.navn === valgt.navn)
  data.ikke_parede_bilder.splice(bIdx, 1)
  const sIdx = data.ikke_parede_screenshots.findIndex(o => o.screenshot_nr === ss.screenshot_nr)
  data.ikke_parede_screenshots.splice(sIdx, 1)
  data.par.push({
    screenshot_nr: ss.screenshot_nr,
    screenshot: ss.screenshot,
    screenshot_mtime: ss.screenshot_mtime,
    bilde_nr: valgt.bilde_nr,
    bilde: valgt.navn,
    bilde_mtime: valgt.bilde_mtime,
    diff_sek: Math.round((ssTid - new Date(valgt.bilde_mtime)) / 1000),
  })
  autoParet++
}

data.par.sort((a, b) => a.screenshot_nr - b.screenshot_nr || (a.bilde_nr ?? 0) - (b.bilde_nr ?? 0))

writeFileSync(JSON_FIL, JSON.stringify(data, null, 2), 'utf8')

console.log(`✓ Kopiert ${kopiert} nye filer til preview`)
console.log(`✓ Lagt til ${nyeBilder} nye bilder, ${nyeScreenshots} nye screenshots`)
console.log(`✓ Auto-paret ${autoParet} nye par (vindu ${VINDU_SEK} sek)`)
console.log(`  Total: ${bilder.length} bilder, ${screenshots.length} screenshots på filsystem`)
console.log(`  par: ${data.par.length}, løse bilder: ${data.ikke_parede_bilder.length}, løse screenshots: ${data.ikke_parede_screenshots.length}`)
