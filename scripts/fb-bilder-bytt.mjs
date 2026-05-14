// Bytt bilde-tildeling mellom to par i fb-bilder-pairing.json.
//
// Bruk:  node scripts/fb-bilder-bytt.mjs <bilde_nr_A> <screenshot_nr_X>
//
// Tolkning: "bilde A skal pares med screenshot X". Skriptet finner raden
// der bilde A ligger nå, raden der screenshot X ligger, og bytter bilde-
// tildelingen mellom dem. Hvis screenshot X i dag har bilde B, ender bilde B
// opp på det stedet bilde A pleide å være. (Slik holder vi alle bilder paret
// så langt det går — ingen blir utilsiktet droppet.)
//
// Etterpå: kjør node scripts/fb-bilder-render.mjs for å oppdatere HTML.

import { readFileSync, writeFileSync } from 'node:fs'

const JSON_FIL = 'scripts/fb-bilder-pairing.json'

const [, , bildeArg, screenshotArg] = process.argv
if (!bildeArg || !screenshotArg) {
  console.error('Bruk: node scripts/fb-bilder-bytt.mjs <bilde_nr> <screenshot_nr>')
  process.exit(1)
}
const bildeNr = Number(bildeArg)
const ssNr = Number(screenshotArg)

const data = JSON.parse(readFileSync(JSON_FIL, 'utf8'))
const par = data.par

// Finn raden der bilde A ligger
const radA = par.findIndex(p => p.bilde_nr === bildeNr)
// Finn raden der screenshot X ligger
const radX = par.findIndex(p => p.screenshot_nr === ssNr)

if (radX === -1) {
  console.error(`Fant ikke screenshot ${ssNr}`)
  process.exit(1)
}

if (radA === radX) {
  console.log(`Bilde ${bildeNr} er allerede paret med screenshot ${ssNr} — ingen endring.`)
  process.exit(0)
}

// Hent bilde-objektet i hver rad
const bildeAFelter = radA !== -1
  ? { bilde_nr: par[radA].bilde_nr, bilde: par[radA].bilde, bilde_mtime: par[radA].bilde_mtime }
  : null
const bildeXFelter = {
  bilde_nr: par[radX].bilde_nr,
  bilde: par[radX].bilde,
  bilde_mtime: par[radX].bilde_mtime,
}

// Bytt
if (radA !== -1) {
  Object.assign(par[radA], bildeXFelter)
  par[radA].diff_sek = par[radA].bilde_mtime
    ? Math.round((new Date(par[radA].screenshot_mtime) - new Date(par[radA].bilde_mtime)) / 1000)
    : null
}

if (bildeAFelter) {
  Object.assign(par[radX], bildeAFelter)
} else {
  par[radX].bilde_nr = bildeNr
  // Filnavnet må slås opp — men skriptet kan ikke uten å kjenne mappingen.
  // I praksis bruker vi alltid bilder som allerede ligger i par-listen.
  console.warn(`Advarsel: bilde ${bildeNr} fantes ikke i noen rad fra før — kopierer kun bilde_nr.`)
}
par[radX].diff_sek = par[radX].bilde_mtime
  ? Math.round((new Date(par[radX].screenshot_mtime) - new Date(par[radX].bilde_mtime)) / 1000)
  : null

writeFileSync(JSON_FIL, JSON.stringify(data, null, 2), 'utf8')

console.log(`✓ Byttet: bilde ${bildeNr} ↔ screenshot ${ssNr}`)
if (radA !== -1) {
  console.log(`  Rad ${radA + 1} (screenshot ${par[radA].screenshot_nr}) har nå bilde ${par[radA].bilde_nr ?? '—'}`)
}
console.log(`  Rad ${radX + 1} (screenshot ${par[radX].screenshot_nr}) har nå bilde ${par[radX].bilde_nr}`)
console.log(`\nKjør: node scripts/fb-bilder-render.mjs for å oppdatere HTML.`)
