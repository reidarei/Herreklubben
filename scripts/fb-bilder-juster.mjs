// Justerer fb-bilder-pairing.json basert på Reidars visuelle gjennomgang.
//
// Datamodell etter denne runden:
//   par[]: én rad pr (bilde, screenshot)-par. Screenshot KAN repeteres
//          (samme FB-post kan ha flere bilder). Bilde er alltid unikt.
//   ikke_parede_bilder[]: bilder uten screenshot
//   ikke_parede_screenshots[]: screenshots uten noen bilder
//
// Kommandoer:
//   { type: 'par', bilde_nr, screenshot_nr } — flytter bilde til rad med
//      gitt screenshot. Ny rad opprettes; gammel bilde-rad fjernes (og
//      hvis dens screenshot ble orphaned, går screenshot til ikke_parede).

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BILDER_DIR = 'C:/Users/reida/Pictures'
const SCREENSHOTS_DIR = 'C:/Users/reida/Pictures/Screenshots'
const JSON_FIL = 'scripts/fb-bilder-pairing.json'
const EKSKLUDER = ['icon-192.png', 'icon-192n.png']

// Endringene fra Reidar denne runden:
const KOMMANDOER = [
  // Nytt bilde 26 (lastet ned i ettertid) → screenshot 5
  { type: 'par', bilde_nr: 26, screenshot_nr: 5 },
]

// Master-data fra filsystem — gir oss nr og mtime for alle bilder og screenshots
const bilderListe = readdirSync(BILDER_DIR)
  .filter(f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('Skjermbilde') && !f.startsWith('_crop'))
  .filter(f => !EKSKLUDER.includes(f))
  .map(f => ({ navn: f, mtime: statSync(join(BILDER_DIR, f)).mtime }))
  .sort((a, b) => a.mtime - b.mtime)

const screenshotsListe = readdirSync(SCREENSHOTS_DIR)
  .filter(f => /^Skjermbilde.*\.png$/i.test(f))
  .map(f => ({ navn: f, mtime: statSync(join(SCREENSHOTS_DIR, f)).mtime }))
  .sort((a, b) => a.mtime - b.mtime)

const bildeFraNr = new Map(bilderListe.map((b, i) => [i + 1, { navn: b.navn, bilde_nr: i + 1, bilde_mtime: b.mtime.toISOString() }]))
const screenshotFraNr = new Map(screenshotsListe.map((s, i) => [i + 1, { navn: s.navn, screenshot_nr: i + 1, screenshot_mtime: s.mtime.toISOString() }]))

// Last og normaliser
const data = JSON.parse(readFileSync(JSON_FIL, 'utf8'))
data.ikke_parede_screenshots = data.ikke_parede_screenshots ?? []
data.ikke_parede_bilder = (data.ikke_parede_bilder ?? []).map(o => typeof o === 'string' ? { navn: o, bilde_nr: null, bilde_mtime: null } : o)

// Hjelpere
function diffSek(ssMtime, bildeMtime) {
  if (!ssMtime || !bildeMtime) return null
  return Math.round((new Date(ssMtime) - new Date(bildeMtime)) / 1000)
}

function fjernBildeFraSted(bildeNr) {
  // Fra par
  const idx = data.par.findIndex(p => p.bilde_nr === bildeNr)
  if (idx !== -1) {
    const rad = data.par.splice(idx, 1)[0]
    // Hvis denne radens screenshot ikke finnes i andre par-rader, blir den orphan
    const ssNr = rad.screenshot_nr
    const fortsattBrukt = data.par.some(p => p.screenshot_nr === ssNr)
    if (!fortsattBrukt) {
      const ssData = screenshotFraNr.get(ssNr) ?? { screenshot_nr: ssNr, screenshot: rad.screenshot, screenshot_mtime: rad.screenshot_mtime }
      if (!data.ikke_parede_screenshots.some(s => s.screenshot_nr === ssNr)) {
        data.ikke_parede_screenshots.push({ screenshot_nr: ssData.screenshot_nr, screenshot: ssData.navn ?? ssData.screenshot, screenshot_mtime: ssData.screenshot_mtime })
      }
    }
    return { bilde_nr: rad.bilde_nr, navn: rad.bilde, bilde_mtime: rad.bilde_mtime }
  }
  // Fra ikke_parede_bilder
  const idx2 = data.ikke_parede_bilder.findIndex(o => o.bilde_nr === bildeNr)
  if (idx2 !== -1) return data.ikke_parede_bilder.splice(idx2, 1)[0]
  // Fra masterlista (helt nytt bilde lagt til etter forrige kjøring)
  const fra = bildeFraNr.get(bildeNr)
  if (fra) return { bilde_nr: fra.bilde_nr, navn: fra.navn, bilde_mtime: fra.bilde_mtime }
  return null
}

function leggTilRad(bilde, ssNr) {
  // Finn screenshot-data — først fra eksisterende par-rader (screenshot kan repeteres),
  // så fra ikke_parede_screenshots, så fra masterlista.
  let ssData = data.par.find(p => p.screenshot_nr === ssNr)
  if (ssData) {
    ssData = { screenshot_nr: ssData.screenshot_nr, screenshot: ssData.screenshot, screenshot_mtime: ssData.screenshot_mtime }
  } else {
    const idx = data.ikke_parede_screenshots.findIndex(s => s.screenshot_nr === ssNr)
    if (idx !== -1) {
      ssData = data.ikke_parede_screenshots.splice(idx, 1)[0]
    } else {
      const fra = screenshotFraNr.get(ssNr)
      if (!fra) {
        console.error(`  Ukjent screenshot ${ssNr}`)
        return false
      }
      ssData = { screenshot_nr: fra.screenshot_nr, screenshot: fra.navn, screenshot_mtime: fra.screenshot_mtime }
    }
  }
  data.par.push({
    screenshot_nr: ssData.screenshot_nr,
    screenshot: ssData.screenshot,
    screenshot_mtime: ssData.screenshot_mtime,
    bilde_nr: bilde.bilde_nr,
    bilde: bilde.navn,
    bilde_mtime: bilde.bilde_mtime,
    diff_sek: diffSek(ssData.screenshot_mtime, bilde.bilde_mtime),
  })
  return true
}

for (const cmd of KOMMANDOER) {
  if (cmd.type !== 'par') continue
  const bilde = fjernBildeFraSted(cmd.bilde_nr)
  if (!bilde) {
    console.error(`Skipping: bilde ${cmd.bilde_nr} ikke funnet`)
    continue
  }
  if (leggTilRad(bilde, cmd.screenshot_nr)) {
    console.log(`✓ par: bilde ${cmd.bilde_nr} → screenshot ${cmd.screenshot_nr}`)
  }
}

// Sorter par på screenshot_nr og deretter bilde_nr for stabil visning
data.par.sort((a, b) => a.screenshot_nr - b.screenshot_nr || (a.bilde_nr ?? 0) - (b.bilde_nr ?? 0))
data.ikke_parede_bilder.sort((a, b) => (a.bilde_nr ?? 999) - (b.bilde_nr ?? 999))
data.ikke_parede_screenshots.sort((a, b) => a.screenshot_nr - b.screenshot_nr)

writeFileSync(JSON_FIL, JSON.stringify(data, null, 2), 'utf8')
console.log(`\n✓ par: ${data.par.length}, løse bilder: ${data.ikke_parede_bilder.length}, løse screenshots: ${data.ikke_parede_screenshots.length}`)
