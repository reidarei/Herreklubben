// Genererer SQL-inserts for FB-bilde-import basert på pairing + metadata + navn-mapping.
//
// Output:
//   scripts/fb-bilder-import.sql — kjøres i Supabase SQL Editor etter at:
//     1. Migrasjon 081 er kjørt
//     2. Bilder er lastet opp til R2 under "meldinger/"
//
// Bruk: node scripts/fb-bilder-generer-sql.mjs

import { readFileSync, writeFileSync } from 'node:fs'

const PAIRING = JSON.parse(readFileSync('scripts/fb-bilder-pairing.json', 'utf8'))
const METADATA = JSON.parse(readFileSync('scripts/fb-bilder-metadata.json', 'utf8'))
const NAVN_MAPPING = JSON.parse(readFileSync('scripts/fb-bilder-navn-mapping.json', 'utf8'))

// R2 public URL — matcher fb-import.mjs (samme bucket)
const R2_PUBLIC_URL = 'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev'

// Norske månedsnavn → tall (for å parse "2. april 2016")
const MND = { januar:1, februar:2, mars:3, april:4, mai:5, juni:6, juli:7, august:8, september:9, oktober:10, november:11, desember:12 }

function parseNorskDato(s) {
  // Format: "DD. mnd YYYY" — eks "2. april 2016", "31. mai 2022"
  const m = s.match(/^(\d{1,2})\.\s*([a-zæøå]+)\s+(\d{4})$/i)
  if (!m) throw new Error(`Kan ikke parse dato: ${s}`)
  const dag = parseInt(m[1], 10)
  const mnd = MND[m[2].toLowerCase()]
  if (!mnd) throw new Error(`Ukjent måned: ${m[2]}`)
  const aar = parseInt(m[3], 10)
  // Bruk 12:34:56 norsk lokaltid (Reidars kode for "konstruert tid")
  // Konverter til UTC: norsk sommer UTC+2, vinter UTC+1. Vi bruker UTC+1 for
  // enkelhet — sortering blir fortsatt riktig innen samme dag.
  // Format: YYYY-MM-DDTHH:MM:SS+01:00
  const dd = String(dag).padStart(2, '0')
  const mm = String(mnd).padStart(2, '0')
  return `${aar}-${mm}-${dd}T12:34:56+01:00`
}

function sql(s) {
  if (s == null) return 'null'
  return "'" + String(s).replace(/'/g, "''") + "'"
}

function sqlText(s) {
  if (s == null) return 'null'
  return "'" + String(s).replace(/'/g, "''") + "'"
}

// Grupper par på screenshot — én melding pr unik screenshot
const grupper = new Map()
for (const p of PAIRING.par) {
  if (!grupper.has(p.screenshot_nr)) grupper.set(p.screenshot_nr, [])
  grupper.get(p.screenshot_nr).push(p)
}

const linjer = []
linjer.push('-- FB-bilde-import — generert av scripts/fb-bilder-generer-sql.mjs')
linjer.push('-- Forutsetter:')
linjer.push('--   1. Migrasjon 081_meldinger_fra_facebook.sql er kjørt')
linjer.push('--   2. Bildene er lastet opp til R2 under "meldinger/"')
linjer.push('--')
linjer.push('-- Idempotent: bruker kilde_ekstern_id med ON CONFLICT DO NOTHING')
linjer.push('')
linjer.push('begin;')
linjer.push('')

let antallMeldinger = 0
let antallBilder = 0
let antallKommentarer = 0
let advarsler = []

for (const meta of [...METADATA].sort((a, b) => a.screenshot_nr - b.screenshot_nr)) {
  const par = grupper.get(meta.screenshot_nr) ?? []
  if (par.length === 0) continue

  const profilMap = NAVN_MAPPING[meta.postet_av]
  if (!profilMap?.profil_id) {
    advarsler.push(`screenshot ${meta.screenshot_nr}: ukjent forfatter "${meta.postet_av}" — hopper over`)
    continue
  }

  const opprettet = parseNorskDato(meta.postet_dato)
  const kildeExternId = `facebook:bilde:ss${meta.screenshot_nr}`

  // Sorter bilder på bilde_nr så rekkefølgen er deterministisk
  const sortertePar = [...par].sort((a, b) => a.bilde_nr - b.bilde_nr)
  const coverFilnavn = sortertePar[0].bilde
  const coverUrl = `${R2_PUBLIC_URL}/meldinger/${coverFilnavn}`

  linjer.push(`-- screenshot ${meta.screenshot_nr}: ${meta.postet_av}, ${meta.postet_dato} (${sortertePar.length} bilde${sortertePar.length>1?'r':''}, ${meta.kommentarer?.length ?? 0} kommentar${meta.kommentarer?.length===1?'':'er'})`)
  linjer.push('with melding_insert as (')
  linjer.push('  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (')
  linjer.push(`    ${sql(profilMap.profil_id)},`)
  linjer.push(`    ${sqlText(meta.beskrivelse)},`)
  linjer.push(`    ${sql(coverUrl)},`)
  linjer.push(`    ${sql(opprettet)},`)
  linjer.push(`    ${sql(opprettet)},  -- sist_aktivitet = postdato (sortering)`)
  linjer.push('    true,')
  linjer.push(`    ${sql(kildeExternId)}`)
  linjer.push('  )')
  linjer.push('  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing')
  linjer.push('  returning id')
  linjer.push('),')
  linjer.push('melding_id_cte as (')
  linjer.push('  select id from melding_insert')
  linjer.push('  union all')
  linjer.push(`  select id from meldinger where kilde_ekstern_id = ${sql(kildeExternId)} and not exists (select 1 from melding_insert)`)
  linjer.push(')')

  antallMeldinger++

  // Tilleggsbilder (rekkefoelge 1+) — kun hvis flere enn ett bilde
  if (sortertePar.length > 1) {
    const ekstraInserts = sortertePar.slice(1).map((p, i) => {
      const url = `${R2_PUBLIC_URL}/meldinger/${p.bilde}`
      return `  ((select id from melding_id_cte), ${sql(url)}, ${i + 1}, ${sql(opprettet)})`
    }).join(',\n')
    // ingen unique constraint på melding_bilder — vi unngår dupliseringer ved
    // at hele transaksjonen bare opprettes en gang (meldingens kilde_ekstern_id
    // forhindrer dobbel insert), og ekstrabildene henger på den nye meldingen.
    linjer.push('insert into melding_bilder (melding_id, bilde_url, rekkefoelge, opprettet) values')
    linjer.push(ekstraInserts + ';')
    antallBilder += sortertePar.length - 1
  } else {
    linjer.push('select 1;')  // dummy så CTE ikke skal være "unused"
  }

  // Kommentarer
  for (const [idx, k] of (meta.kommentarer ?? []).entries()) {
    const kProfilMap = NAVN_MAPPING[k.navn]
    if (!kProfilMap?.profil_id) {
      advarsler.push(`screenshot ${meta.screenshot_nr} kommentar ${idx}: ukjent forfatter "${k.navn}" — hopper over kommentar`)
      continue
    }
    if (k.har_bilde) {
      // Vi har droppet bildevedlegg per Reidars beslutning, men noterer i tekst
      const tekst = `[bildevedlegg fra Facebook] ${k.tekst.replace(/^\[bildevedlegg.*?\]\s*/i, '')}`.trim()
      linjer.push(`insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values`)
      linjer.push(`  ((select id from meldinger where kilde_ekstern_id = ${sql(kildeExternId)}), ${sql(kProfilMap.profil_id)}, ${sqlText(tekst)}, ${sql(opprettet)}, true, ${sql(kildeExternId + ':c' + idx)})`)
      linjer.push(`on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;`)
    } else {
      linjer.push(`insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values`)
      linjer.push(`  ((select id from meldinger where kilde_ekstern_id = ${sql(kildeExternId)}), ${sql(kProfilMap.profil_id)}, ${sqlText(k.tekst)}, ${sql(opprettet)}, true, ${sql(kildeExternId + ':c' + idx)})`)
      linjer.push(`on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;`)
    }
    antallKommentarer++
  }

  linjer.push('')
}

// Etter alle inserts: re-set sist_aktivitet til postdato på alle FB-meldinger,
// fordi insert-trigger har bumpet det til now() når kommentarer ble lagt til.
linjer.push('-- Reset sist_aktivitet til opprettet for alle FB-meldinger')
linjer.push('-- (triggeren oppdater_melding_sist_aktivitet bumper sist_aktivitet ved')
linjer.push('--  hver kommentar-insert, men for historikk vil vi ha postdato)')
linjer.push('update meldinger set sist_aktivitet = opprettet where fra_facebook = true;')
linjer.push('')
linjer.push('commit;')
linjer.push('')
linjer.push('-- Verifisering:')
linjer.push("-- select count(*) from meldinger where fra_facebook = true;")
linjer.push("-- select count(*) from melding_bilder mb join meldinger m on m.id = mb.melding_id where m.fra_facebook = true;")
linjer.push("-- select count(*) from melding_chat where fra_facebook = true;")

writeFileSync('scripts/fb-bilder-import.sql', linjer.join('\n'), 'utf8')

console.log(`✓ ${antallMeldinger} meldinger, ${antallBilder} tilleggsbilder, ${antallKommentarer} kommentarer`)
console.log(`✓ scripts/fb-bilder-import.sql skrevet`)

if (advarsler.length) {
  console.log(`\n⚠ ${advarsler.length} advarsler:`)
  for (const a of advarsler) console.log('  ' + a)
}
