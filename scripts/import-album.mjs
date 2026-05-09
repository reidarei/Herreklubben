// Importer en mappe med bilder som et album i DB + R2.
// Brukes f.eks. til å importere Facebook-album fra nedlastet eksport.
//
// Forberedelse:
//   1. Pakk ut zip-filen så bilder ligger som JPG-filer i én mappe
//   2. Sett R2-secrets i .env.local (verdier hentes manuelt fra Vercel-
//      dashbord siden de er markert som Sensitive og ikke kan pull-es)
//
// Bruk (Node 20.6+ med native --env-file):
//   node --env-file=.env.local scripts/import-album.mjs \
//     <bilder-mappe> <arrangement-id> "<album-tittel>"

import { readdir, readFile } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import sharp from 'sharp'
import pg from 'pg'
import { AwsClient } from 'aws4fetch'

const [, , bilderMappe, arrangementId, albumTittel] = process.argv
if (!bilderMappe || !arrangementId || !albumTittel) {
  console.error('Bruk: node scripts/import-album.mjs <mappe> <arrangement-id> "<tittel>"')
  process.exit(1)
}

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'tdlfswmxezjdnxcbbiwn'
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET ?? 'herreklubben-bilder'
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
const R2_JURISDICTION = (process.env.R2_JURISDICTION ?? 'default').toLowerCase()

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
  console.error('Mangler R2-env. Kjør `vercel env pull .env.local` først.')
  process.exit(1)
}

if (!DB_PASSWORD) {
  console.error('Mangler SUPABASE_DB_PASSWORD. Kjør med `node --env-file=.env.local …`')
  process.exit(1)
}

const r2Segment = R2_JURISDICTION === 'default' ? '' : `.${R2_JURISDICTION}`
const aws = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: 'auto',
  service: 's3',
})

async function lastOppR2(sti, data, contentType) {
  const url = `https://${R2_ACCOUNT_ID}${r2Segment}.r2.cloudflarestorage.com/${R2_BUCKET}/${sti}`
  const res = await aws.fetch(url, {
    method: 'PUT',
    body: data,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`R2 upload feilet (${res.status}): ${t}`)
  }
  return `${R2_PUBLIC_URL}/${sti}`
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

// Sjekk at arrangementet finnes
const { rows: arrRader } = await client.query(
  'select id, tittel from arrangementer where id = $1',
  [arrangementId],
)
if (arrRader.length === 0) {
  console.error(`Fant ikke arrangement ${arrangementId}`)
  process.exit(1)
}
console.log(`Arrangement: ${arrRader[0].tittel}`)

// Bruk en eksisterende profil som "opprettet_av" — første admin
const { rows: adminRader } = await client.query(
  "select id, navn from profiles where rolle in ('admin','generalsekretaer') and aktiv = true order by navn limit 1",
)
if (adminRader.length === 0) {
  console.error('Fant ingen admin-profil')
  process.exit(1)
}
const opprettetAv = adminRader[0].id
console.log(`Lagrer som opprettet av: ${adminRader[0].navn}`)

// Opprett album
const { rows: albumRader } = await client.query(
  `insert into album (tittel, arrangement_id, opprettet_av)
   values ($1, $2, $3)
   returning id`,
  [albumTittel, arrangementId, opprettetAv],
)
const albumId = albumRader[0].id
console.log(`Album opprettet: ${albumId}`)

// Finn alle bildefiler
const filer = (await readdir(bilderMappe))
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  .sort()

console.log(`Fant ${filer.length} bildefiler`)

let i = 0
for (const fil of filer) {
  i++
  const stiInn = join(bilderMappe, fil)
  const buffer = await readFile(stiInn)

  // Komprimer hovedbilde til 1600px / q85
  const meta = await sharp(buffer).metadata()
  const hovedBuffer = await sharp(buffer)
    .rotate() // EXIF-orientering
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  const hovedMeta = await sharp(hovedBuffer).metadata()

  // Thumbnail 400px / q85
  const thumbBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  const baseNavn = basename(fil, extname(fil))
  const filnavn = `${Date.now()}-${i}-${baseNavn}.jpg`
  const stiHoved = `album/${albumId}/${filnavn}`
  const stiThumb = `album/${albumId}/thumb_${filnavn}`

  const urlHoved = await lastOppR2(stiHoved, hovedBuffer, 'image/jpeg')
  const urlThumb = await lastOppR2(stiThumb, thumbBuffer, 'image/jpeg')

  await client.query(
    `insert into album_bilde (album_id, bilde_url, thumb_url, bredde, hoyde, lastet_opp_av, rekkefolge)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [albumId, urlHoved, urlThumb, hovedMeta.width ?? null, hovedMeta.height ?? null, opprettetAv, i],
  )

  console.log(`  [${i}/${filer.length}] ${fil} → ${urlHoved}`)
}

console.log(`\nFerdig. Album: https://mortensrudherreklubb.no/album/${albumId}`)
await client.end()
