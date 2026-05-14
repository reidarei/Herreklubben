// Engangs-fix: gi bilde_nr til ikke_parede_bilder som mangler det.
// Numrene følger samme kronologiske mtime-orden som første pairing brukte.

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BILDER_DIR = 'C:/Users/reida/Pictures'
const JSON_FIL = 'scripts/fb-bilder-pairing.json'
const EKSKLUDER = ['icon-192.png', 'icon-192n.png']

const bilder = readdirSync(BILDER_DIR)
  .filter(f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('Skjermbilde') && !f.startsWith('_crop'))
  .filter(f => !EKSKLUDER.includes(f))
  .map(f => ({ navn: f, mtime: statSync(join(BILDER_DIR, f)).mtime }))
  .sort((a, b) => a.mtime - b.mtime)

const nrFraNavn = new Map(bilder.map((b, i) => [b.navn, i + 1]))
const mtimeFraNavn = new Map(bilder.map(b => [b.navn, b.mtime.toISOString()]))

const data = JSON.parse(readFileSync(JSON_FIL, 'utf8'))

let fikset = 0
data.ikke_parede_bilder = data.ikke_parede_bilder.map(o => {
  const obj = typeof o === 'string' ? { navn: o } : o
  if (obj.bilde_nr == null) {
    obj.bilde_nr = nrFraNavn.get(obj.navn) ?? null
    obj.bilde_mtime = obj.bilde_mtime ?? mtimeFraNavn.get(obj.navn) ?? null
    if (obj.bilde_nr != null) fikset++
  }
  return obj
})

data.ikke_parede_bilder.sort((a, b) => (a.bilde_nr ?? 999) - (b.bilde_nr ?? 999))

writeFileSync(JSON_FIL, JSON.stringify(data, null, 2), 'utf8')
console.log(`✓ Fylte inn bilde_nr på ${fikset} løse bilder`)
