// Kjører en spesifikk migrasjons-fil mot prod-Supabase
import pg from 'pg'
import { readFile } from 'node:fs/promises'

const fil = process.argv[2]
if (!fil) {
  console.error('Bruk: node scripts/kjor-migrasjon.mjs supabase/migrations/XXX.sql')
  process.exit(1)
}

const client = new pg.Client({
  host: 'db.tdlfswmxezjdnxcbbiwn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'd2F3j$G!-@j!i94',
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log(`Kjører ${fil}…`)
const sql = await readFile(fil, 'utf8')
await client.query(sql)
console.log('✓ Migrasjon kjørt')
await client.end()
