// Henter profiles fra Supabase og auto-matcher mot FB-navn fra metadata.
// Produserer scripts/fb-bilder-navn-mapping.json som Reidar verifiserer/retter.
//
// Bruk: node --env-file=.env.local scripts/fb-bilder-navn-mapping.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) { console.error('Mangler env-vars'); process.exit(1) }

const supabase = createClient(URL, KEY)

const metadata = JSON.parse(readFileSync('scripts/fb-bilder-metadata.json', 'utf8'))
const navn = new Set()
for (const m of metadata) {
  if (m.postet_av) navn.add(m.postet_av)
  for (const k of (m.kommentarer ?? [])) if (k.navn) navn.add(k.navn)
}

const { data: profiler, error } = await supabase
  .from('profiles')
  .select('id, navn, aktiv')
  .order('navn')

if (error) { console.error(error); process.exit(1) }

function normaliser(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

const mapping = {}
for (const fbNavn of [...navn].sort()) {
  const norm = normaliser(fbNavn)
  // 1) Eksakt match
  let traff = profiler.find(p => normaliser(p.navn ?? '') === norm)
  // 2) Inneholder begge fornavn + etternavn
  if (!traff) {
    const deler = norm.split(' ')
    traff = profiler.find(p => {
      const pn = normaliser(p.navn ?? '')
      return deler.every(d => pn.includes(d))
    })
  }
  mapping[fbNavn] = traff
    ? { profil_id: traff.id, profil_navn: traff.navn, aktiv: traff.aktiv, match: 'auto' }
    : { profil_id: null, profil_navn: null, match: 'INGEN — fyll inn manuelt' }
}

writeFileSync('scripts/fb-bilder-navn-mapping.json', JSON.stringify(mapping, null, 2))
console.log(`✓ Skrev scripts/fb-bilder-navn-mapping.json`)
console.log(`\nMapping (${Object.keys(mapping).length} navn):`)
for (const [fb, m] of Object.entries(mapping)) {
  console.log(`  ${fb.padEnd(28)} → ${m.profil_navn ?? '???'}  ${m.profil_id ? '✓' : '✗'}`)
}
