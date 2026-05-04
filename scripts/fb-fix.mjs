// Slett FB-duplikater og fiks navn-mapping
import pg from 'pg'

const PROJECT_REF = 'tdlfswmxezjdnxcbbiwn'
const DB_PASSWORD = 'd2F3j$G!-@j!i94'

const client = new pg.Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

// 1. List alle profiles for å se hva navn faktisk er
console.log('=== Alle profiler ===')
const { rows: profiler } = await client.query(
  'select id, navn, visningsnavn from profiles where aktiv = true order by navn',
)
for (const p of profiler) {
  console.log(`  ${p.navn}  (visningsnavn: ${p.visningsnavn})`)
}

// 2. Slett ALLE FB-arrangementer (vi importerer på nytt med korrekt mapping)
const { rowCount } = await client.query(
  'delete from arrangementer where fra_facebook = true',
)
console.log(`\n✓ Slettet ${rowCount} FB-arrangementer`)

await client.end()
