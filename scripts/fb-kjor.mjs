// Kjører FB-import-flyten:
//   1. Migrasjon 062
//   2. Last opp alle bilder fra scripts/fb-crops/ til R2 (hvis credentials)
//   3. Kjør scripts/fb-import.sql mot Supabase
//
//   node --env-file=.env.local scripts/fb-kjor.mjs

import pg from 'pg'
import { readFile, readdir } from 'node:fs/promises'
import { AwsClient } from 'aws4fetch'

const PROJECT_REF = 'tdlfswmxezjdnxcbbiwn'
const DB_PASSWORD = 'd2F3j$G!-@j!i94'
// Direkte tilkobling til Supabase Postgres (ikke pooler)
const DB_HOST = `db.${PROJECT_REF}.supabase.co`

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET ?? 'herreklubben-bilder'
const R2_JURISDICTION = (process.env.R2_JURISDICTION ?? 'default').toLowerCase()
const HAR_R2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)

const aws = HAR_R2
  ? new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      region: 'auto',
      service: 's3',
    })
  : null

const r2Segment = R2_JURISDICTION === 'default' ? '' : `.${R2_JURISDICTION}`
const r2Endpoint = `https://${R2_ACCOUNT_ID}${r2Segment}.r2.cloudflarestorage.com`

const client = new pg.Client({
  host: DB_HOST,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

async function kjor() {
  await client.connect()
  console.log('✓ Tilkoblet Supabase')

  // 1. Migrasjon
  console.log('\n[1/3] Kjører migrasjon 062_fra_facebook_flagg.sql…')
  const migr = await readFile('supabase/migrations/062_fra_facebook_flagg.sql', 'utf8')
  await client.query(migr)
  console.log('✓ Migrasjon kjørt')

  // 2. Last opp bilder (hopper over hvis ingen R2-credentials)
  if (!HAR_R2) {
    console.log('\n[2/3] R2-credentials mangler — hopper over upload')
    console.log('     Du må laste opp scripts/fb-crops/ → R2 manuelt etterpå')
  } else {
    console.log('\n[2/3] Laster opp covers til R2…')
    const filer = await readdir('scripts/fb-crops')
    const jpg = filer.filter(f => f.endsWith('.jpg'))
    let antall = 0
    for (const f of jpg) {
      const data = await readFile(`scripts/fb-crops/${f}`)
      const url = `${r2Endpoint}/${R2_BUCKET}/arrangementer/${f}`
      const res = await aws.fetch(url, {
        method: 'PUT',
        body: data,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': String(data.byteLength),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
      if (!res.ok) {
        const tekst = await res.text().catch(() => '')
        throw new Error(`R2 upload feilet for ${f} (${res.status}): ${tekst}`)
      }
      antall++
      if (antall % 10 === 0) console.log(`  ${antall}/${jpg.length}…`)
    }
    console.log(`✓ Lastet opp ${antall} covers til R2`)
  }

  // 3. Kjør import-SQL
  console.log('\n[3/3] Kjører fb-import.sql…')
  const sql = await readFile('scripts/fb-import.sql', 'utf8')
  await client.query(sql)
  console.log('✓ Import-SQL kjørt')

  // Verifiser
  const { rows: stats } = await client.query(
    'select count(*) as antall from arrangementer where fra_facebook = true',
  )
  console.log(`\n→ Totalt ${stats[0].antall} FB-arrangementer i DB`)

  // Sjekk navn-mapping (fallback til admin = ukjent navn)
  const { rows: ukjente } = await client.query(`
    select a.tittel, a.start_tidspunkt::date as dato, p.navn
    from arrangementer a
    join profiles p on p.id = a.opprettet_av
    where a.fra_facebook = true
    order by a.start_tidspunkt
  `)
  console.log('\n=== Navn-mapping (verifiser) ===')
  for (const r of ukjente) {
    console.log(`  ${r.dato.toISOString().slice(0, 10)} ${r.tittel} → ${r.navn}`)
  }

  await client.end()
}

kjor().catch(err => {
  console.error('Feil:', err)
  client.end().catch(() => {})
  process.exit(1)
})
