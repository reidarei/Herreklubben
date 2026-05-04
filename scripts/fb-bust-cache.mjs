// Legger til ?v=2 på alle FB-arrangement bilde_url for å bryte browser-cache
// etter at jeg overskrev R2-filer med bedre crops.
import pg from 'pg'

const client = new pg.Client({
  host: 'db.tdlfswmxezjdnxcbbiwn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'd2F3j$G!-@j!i94',
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const { rowCount } = await client.query(`
  update arrangementer
  set bilde_url = regexp_replace(bilde_url, '\\?v=\\d+$', '') || '?v=3'
  where fra_facebook = true and bilde_url is not null
`)
console.log(`✓ Oppdatert ${rowCount} bilde_url med ?v=3`)

await client.end()
