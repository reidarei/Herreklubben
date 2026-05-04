// FB-arrangementer import: cropper cover-bilder fra skjermbilder og
// genererer SQL-inserts. Trenger ingen secrets.
//
// Bruk:
//   node scripts/fb-import.mjs
//
// Produserer:
//   scripts/fb-crops/<filnavn>.jpg     — cover-bilder klare for upload til R2
//   scripts/fb-import.sql              — INSERT-setninger for Supabase
//
// Etterpå:
//   1. Last opp innholdet av scripts/fb-crops/ til R2-bucket under
//      "arrangementer/" via Cloudflare web UI (drag og slipp)
//   2. Kjør scripts/fb-import.sql i Supabase SQL Editor

import sharp from 'sharp'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fromZonedTime } from 'date-fns-tz'

const SCREENSHOTS = 'C:/Users/reida/Pictures/Screenshots'
const CROPS = 'scripts/fb-crops'
const SQL_OUT = 'scripts/fb-import.sql'
const JSON_IN = 'scripts/fb-arrangementer.json'

// R2 public URL — må matche env-var i Vercel. Hardkodet her fordi denne
// er public og ufarlig å committe.
const R2_PUBLIC_URL = 'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev'

// Cover-bildet er ca 150 px bredt. Vi croper 170 px for å være trygge
// mot et par px drift på begge sider.
const COVER_W = 170
const COVER_H = 165
const COVER_Y_OFF = 4

// Finner x-koordinaten der cover-bildet starter. Strategi: telle ikke-hvite
// pixler per kolonne, finn første kolonne der majoritet (>30%) av høyden er
// ikke-hvit. Det filtrerer bort tynne fb-separator-linjer og finner det
// faktiske cover-rektangelet.
async function finnCoverX(fil, radHoyde) {
  const { data, info } = await sharp(fil)
    .extract({ left: 0, top: 0, width: 400, height: radHoyde })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const ch = info.channels
  // Lavt terskel (10%) for å fange rounded-corner-edge der bare sentrum av
  // kolonnen er fargete. KREV_KONSEKUTIVE filtrerer bort tynne UI-linjer.
  const terskel = Math.floor(info.height * 0.1)
  const KREV_KONSEKUTIVE = 50

  // Bygg array med "har dette søylen ≥40% farge?"
  const farget = new Array(info.width).fill(false)
  for (let x = 0; x < info.width; x++) {
    let n = 0
    for (let y = 0; y < info.height; y++) {
      const i = (y * info.width + x) * ch
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const avg = (r + g + b) / 3
      if (avg < 230 || Math.abs(r - g) > 30 || Math.abs(g - b) > 30) n++
    }
    farget[x] = n >= terskel
  }

  // Finn første start på et run med ≥KREV_KONSEKUTIVE fargete kolonner.
  // Trekk fra større margin (-12) for å inkludere coverets rundete hjørne
  // som har for få fargete pixler til å bli detektert direkte.
  let runStart = -1
  for (let x = 0; x < farget.length; x++) {
    if (farget[x]) {
      if (runStart === -1) runStart = x
      if (x - runStart + 1 >= KREV_KONSEKUTIVE) {
        return Math.max(0, runStart - 12)
      }
    } else {
      runStart = -1
    }
  }
  return 8
}

// JPEG-kvalitet for komprimering — matcher policy i bilde-utils.ts
const JPEG_KVALITET = 85

// Slugify til filnavn-vennlig format
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[æå]/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

// SQL-escape (single-quote)
function sql(s) {
  return s.replace(/'/g, "''")
}

// Konverter "2018-04-14" + "17:00" Oslo-tid til ISO UTC
function osloKlokkeslett17(dato) {
  // dato = 'YYYY-MM-DD'
  const lokal = `${dato}T17:00:00`
  return fromZonedTime(lokal, 'Europe/Oslo').toISOString()
}

async function main() {
  const data = JSON.parse(await readFile(JSON_IN, 'utf8'))
  const arrangementer = data.arrangementer

  // Rens crop-mappa
  if (existsSync(CROPS)) await rm(CROPS, { recursive: true, force: true })
  await mkdir(CROPS, { recursive: true })

  // Grupper på kilde_bilde, sorter desc innen hver gruppe (FB viser nyest først)
  const grupper = new Map()
  for (const a of arrangementer) {
    if (!grupper.has(a.kilde_bilde)) grupper.set(a.kilde_bilde, [])
    grupper.get(a.kilde_bilde).push(a)
  }
  for (const [, arr] of grupper) {
    arr.sort((a, b) => b.dato.localeCompare(a.dato))
  }

  // Crop hver event
  const sqlLinjer = []
  sqlLinjer.push('-- FB-arrangementer import — generert av scripts/fb-import.mjs')
  sqlLinjer.push('-- Forutsetter at migrasjon 062_fra_facebook_flagg.sql er kjørt')
  sqlLinjer.push('-- og at cover-bilder er lastet opp til R2 under "arrangementer/"')
  sqlLinjer.push('')
  sqlLinjer.push('begin;')
  sqlLinjer.push('')

  let antallCroppet = 0
  let antallUkjenteNavn = new Set()

  for (const [skjermbilde, arr] of grupper) {
    const fil = `${SCREENSHOTS}/${skjermbilde}`
    const meta = await sharp(fil).metadata()
    const radHoyde = Math.floor(meta.height / arr.length)
    const coverX = await finnCoverX(fil, radHoyde)
    console.log(`  ${skjermbilde}: ${meta.width}x${meta.height}, ${arr.length} events, coverX=${coverX}`)

    for (let i = 0; i < arr.length; i++) {
      const event = arr[i]
      const yOff = i * radHoyde
      const top = yOff + COVER_Y_OFF
      const height = Math.min(COVER_H, meta.height - top)
      if (height < 50) continue

      const filnavn = `${event.dato}-${slugify(event.tittel)}.jpg`
      const r2Sti = `arrangementer/${filnavn}`
      const r2Url = `${R2_PUBLIC_URL}/${r2Sti}`

      await sharp(fil)
        .extract({ left: coverX, top, width: COVER_W, height })
        .jpeg({ quality: JPEG_KVALITET })
        .toFile(`${CROPS}/${filnavn}`)
      antallCroppet++

      // SQL — opprettet_av matches via subquery på navn (LIMIT 1).
      // Hvis ingen treff faller vi tilbake til den eldste admin-en så
      // INSERT ikke bryter NOT NULL-constraint. Brukeren kan rette etterpå.
      const navn = event.opprettet_av_navn
      const startIso = osloKlokkeslett17(event.dato)

      sqlLinjer.push(`-- ${event.dato} ${event.tittel} (av ${navn})`)
      sqlLinjer.push(
        `insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (`,
      )
      sqlLinjer.push(`  'moete',`)
      sqlLinjer.push(`  '${sql(event.tittel)}',`)
      sqlLinjer.push(`  '${startIso}',`)
      sqlLinjer.push(`  '${r2Url}',`)
      sqlLinjer.push(
        `  coalesce((select id from profiles where lower(navn) = lower('${sql(navn)}') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),`,
      )
      sqlLinjer.push(`  true,`)
      sqlLinjer.push(`  null`)
      sqlLinjer.push(`);`)
      sqlLinjer.push('')
      antallUkjenteNavn.add(navn)
    }
  }

  sqlLinjer.push('commit;')
  sqlLinjer.push('')
  sqlLinjer.push('-- Verifiser: antall FB-arrangementer importert')
  sqlLinjer.push('-- select count(*) from arrangementer where fra_facebook = true;')
  sqlLinjer.push('')
  sqlLinjer.push('-- Sjekk fallback (rader som ble tilordnet admin pga ukjent navn):')
  sqlLinjer.push(
    "-- select tittel, start_tidspunkt, (select navn from profiles where id = arrangementer.opprettet_av) as opprettet_av_navn from arrangementer where fra_facebook = true order by start_tidspunkt;",
  )

  await writeFile(SQL_OUT, sqlLinjer.join('\n'), 'utf8')

  console.log(`✓ Croppet ${antallCroppet} cover-bilder til ${CROPS}/`)
  console.log(`✓ Skrev ${SQL_OUT}`)
  console.log(`\nNavn som vil prøves matchet (${antallUkjenteNavn.size} unike):`)
  for (const n of [...antallUkjenteNavn].sort()) {
    console.log(`  - ${n}`)
  }
  console.log(`\nNeste steg:`)
  console.log(`  1. Last opp ${CROPS}/-mappa til R2 under "arrangementer/" via Cloudflare web UI`)
  console.log(`  2. Kjør migrasjonen 062_fra_facebook_flagg.sql i Supabase`)
  console.log(`  3. Kjør ${SQL_OUT} i Supabase SQL Editor`)
}

main().catch(err => {
  console.error('Feil:', err)
  process.exit(1)
})
