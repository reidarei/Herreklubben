// Merger inn metadata-oppdateringer for én eller flere screenshots.
// Bruk: node scripts/fb-bilder-metadata-patch.mjs '<JSON_array>'
//
// Hvert objekt i array har screenshot_nr + felter som skal oppdateres.

import { readFileSync, writeFileSync } from 'node:fs'

const JSON_FIL = 'scripts/fb-bilder-metadata.json'
const input = process.argv[2]
if (!input) { console.error('Mangler JSON-argument'); process.exit(1) }

const oppdateringer = JSON.parse(input)
const data = JSON.parse(readFileSync(JSON_FIL, 'utf8'))

let n = 0
for (const u of oppdateringer) {
  const idx = data.findIndex(d => d.screenshot_nr === u.screenshot_nr)
  if (idx === -1) { console.error(`screenshot ${u.screenshot_nr} ikke funnet`); continue }
  Object.assign(data[idx], u, { ocr_status: 'lest' })
  n++
}

writeFileSync(JSON_FIL, JSON.stringify(data, null, 2))
console.log(`✓ Oppdatert ${n} screenshots`)
