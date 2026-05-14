// Cropper kommentar-kolonnen ut av hver unike screenshot i pairing-JSON.
// FB photo viewer har en konsistent ~380px-bred kommentar-kolonne til høyre,
// uansett vindusstørrelse — vi cropper de siste 400 px for trygghet.
//
// Bruk: node scripts/fb-bilder-crop-kommentarer.mjs

import sharp from 'sharp'
import { readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const SCREENSHOTS_DIR = 'C:/Users/reida/Pictures/Screenshots'
const JSON_FIL = 'scripts/fb-bilder-pairing.json'
const CROPS_DIR = 'scripts/fb-bilder-kommentar-crops'
const KOLONNE_BREDDE = 400

const data = JSON.parse(readFileSync(JSON_FIL, 'utf8'))
const unikeScreenshots = [...new Set(data.par.map(p => p.screenshot))]

if (existsSync(CROPS_DIR)) rmSync(CROPS_DIR, { recursive: true })
mkdirSync(CROPS_DIR, { recursive: true })

let antall = 0
for (const navn of unikeScreenshots) {
  const inn = join(SCREENSHOTS_DIR, navn)
  const ut = join(CROPS_DIR, navn)
  const meta = await sharp(inn).metadata()
  const left = Math.max(0, meta.width - KOLONNE_BREDDE)
  await sharp(inn)
    .extract({ left, top: 0, width: meta.width - left, height: meta.height })
    .png()
    .toFile(ut)
  antall++
}

console.log(`✓ Croppet ${antall} kommentar-kolonner til ${CROPS_DIR}/`)
