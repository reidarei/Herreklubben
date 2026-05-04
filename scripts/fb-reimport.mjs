// Re-importer FB-arrangementer med korrekt navn-mapping.
// Forutsetter: scripts/fb-fix.mjs er kjørt (alle FB-rader slettet).

import pg from 'pg'
import { readFile } from 'node:fs/promises'
import { fromZonedTime } from 'date-fns-tz'

const PROJECT_REF = 'tdlfswmxezjdnxcbbiwn'
const DB_PASSWORD = 'd2F3j$G!-@j!i94'
const R2_PUBLIC_URL = 'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev'

// FB-navn → DB-navn (fra profiles-tabellen). Trailing space er bevisst der
// DB faktisk har trailing space.
const NAVN_MAPPING = {
  'Reidar Haavik': 'Reidar Eik Haavik',
  'Jon Erik Dahl': 'Jon Erik Dahl ',
  'Michael Johansen': 'Michael Johansen',
  'Espen Waldem': 'Espen Waldem',
  'Øyvind Verket': 'Øyvind Verket',
  'Espen Sørum Hagen': 'Espen Hagen',
  'Øyvind Rekve': 'Øyvind Rekve',
  'Kristoffer Benco Arntzen': 'Kristoffer Benco Arntzen ',
  'Andreas Eriksen': 'Andreas Eriksen',
  'Klas Kristoffer Liland': 'Klas Kristoffer Liland',
  'Chris Reitan': 'Christopher Reitan',
  'Thomas Formo Riise': 'Thomas Formo Riise',
  'Alexander Svensen': 'Alexander Svensen',
  'André Heede': 'André Heede',
  'Kristian Andresen': 'Kristian Blichfeldt Andresen',
  'Richard Andresen': 'Richard Andresen',
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[æå]/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

const client = new pg.Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

// Hent profil-ID-er for alle DB-navn
const dbNavn = [...new Set(Object.values(NAVN_MAPPING))]
const { rows: profiler } = await client.query(
  `select id, navn from profiles where navn = any($1::text[])`,
  [dbNavn],
)
const navnTilId = new Map(profiler.map(p => [p.navn, p.id]))

// Sjekk at alle navn ble funnet
for (const fb in NAVN_MAPPING) {
  const db = NAVN_MAPPING[fb]
  if (!navnTilId.has(db)) {
    console.error(`✗ Fant ikke profil for ${fb} → ${db}`)
    process.exit(1)
  }
}
console.log(`✓ Mapped ${Object.keys(NAVN_MAPPING).length} FB-navn → profil-IDer`)

// Last JSON
const data = JSON.parse(await readFile('scripts/fb-arrangementer.json', 'utf8'))

// Insert hver
let antall = 0
for (const e of data.arrangementer) {
  const dbNavn2 = NAVN_MAPPING[e.opprettet_av_navn]
  const id = navnTilId.get(dbNavn2)
  if (!id) {
    console.warn(`Hopper over (mangler mapping): ${e.opprettet_av_navn}`)
    continue
  }
  const startIso = fromZonedTime(`${e.dato}T17:00:00`, 'Europe/Oslo').toISOString()
  const r2Url = `${R2_PUBLIC_URL}/arrangementer/${e.dato}-${slugify(e.tittel)}.jpg`
  await client.query(
    `insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook)
     values ('moete', $1, $2, $3, $4, true)`,
    [e.tittel, startIso, r2Url, id],
  )
  antall++
}

console.log(`✓ Importerte ${antall} FB-arrangementer`)

// Verifiser
const { rows: stats } = await client.query(`
  select extract(year from start_tidspunkt at time zone 'Europe/Oslo')::int as ar, count(*) as n
  from arrangementer
  where fra_facebook = true
  group by ar
  order by ar
`)
console.log('\nPer år:')
for (const r of stats) console.log(`  ${r.ar}: ${r.n}`)

await client.end()
