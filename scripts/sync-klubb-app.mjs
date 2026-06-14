// Drift-detektor mellom kilde-repoet (herreklubben) og det offentlige
// template-repoet (klubb-app).
//
// BAKGRUNN: klubb-app er en sanitert downstream-speiling av denne kodebasen.
// De fleste delte filene SKAL være byte-identiske. Et lite, kjent sett avviker
// med vilje — enten ren identitets-skrubbing (klubbnavn, bucket, domene) eller
// redaksjonelle valg (generiske defaults, omskrevne kommentarer, migrasjons-
// seeds nøytralisert). Faren er at en ekte kodeendring lander i ett repo og
// glemmes i det andre = stille drift.
//
// FILOSOFI: skriptet overskriver ALDRI klubb-app som standard. Det leser begge,
// kjører skrubbe-mappingen på kilde-versjonen i minnet, og sammenligner. Slik
// kan en ufullstendig mapping aldri korrumpere klubb-app — den gir på det verste
// en falsk drift-rapport, ikke tap av data.
//
// Tre klasser:
//   MÅ MATCHE   — alt delt som ikke er listet under. Byte-identisk forventes;
//                 enhver diff = ekte drift-alarm (exit 1).
//   SKRUBBES    — ren identitets-erstatning. Etter skrub skal residual være 0;
//                 gjenstående diff flagges som «trenger review».
//   DIVERGERER  — bevisst ulikt av ikke-mekaniske grunner. Vises som «forventet
//                 ulik», teller ikke som drift.
//
// Bruk:
//   node scripts/sync-klubb-app.mjs                 # dry-run drift-rapport
//   node scripts/sync-klubb-app.mjs --apply         # skriv skrubbet kilde→klubb-app for SKRUBBES-filer med residual
//   node scripts/sync-klubb-app.mjs --klubb <sti>   # overstyr klubb-app-sti

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'

// ---------------------------------------------------------------------------
// Stier
// ---------------------------------------------------------------------------
const KILDE = process.cwd() // kjøres fra herreklubben-rota
const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const klubbIdx = argv.indexOf('--klubb')
const KLUBB =
  klubbIdx !== -1 && argv[klubbIdx + 1]
    ? argv[klubbIdx + 1]
    : join(KILDE, '..', 'klubb-app')

if (!existsSync(KLUBB)) {
  console.error(`Fant ikke klubb-app på «${KLUBB}». Bruk --klubb <sti>.`)
  process.exit(2)
}

// ---------------------------------------------------------------------------
// Hvilke deler av treet sammenlignes (manifestets «Kopieres»-scope)
// ---------------------------------------------------------------------------
const SCAN_DIRS = ['app', 'components', 'lib', 'types', '__tests__', 'public', 'e2e']
const SCAN_ROOT_FILES = [
  'middleware.ts',
  'next.config.ts',
  'tailwind.config.ts',
  'tsconfig.json',
  'postcss.config.mjs',
  'eslint.config.mjs',
  'vitest.config.ts',
  'playwright.config.ts',
  'vercel.json',
]

// Mapper/filer som aldri finnes i klubb-app eller som er instans-spesifikke —
// utelates helt fra sammenligningen (Class-3 i analysen).
const IGNORER = new Set([
  // e2e-spesifikt som bevisst ikke ble publisert (krever designreferanser / ekte navn)
  join('e2e', 'visuell.spec.ts'),
  join('e2e', 'readme-skjermbilder.spec.ts'),
  // generert per Supabase-instans
  join('lib', 'supabase', 'database.types.ts'),
])

// ---------------------------------------------------------------------------
// SKRUBBES: ren identitets-mapping. Rekkefølge = lengst/mest spesifikk først,
// fordi erstatningene kjøres sekvensielt og en kort streng kan ligge inni en
// lengre (f.eks. «herreklubben» inni «herreklubben-bilder»).
// ---------------------------------------------------------------------------
const SKRUBBES = new Set([
  join('lib', 'r2.ts'),
  join('lib', 'config.ts'),
  join('lib', 'epost.ts'),
  join('lib', 'innspill.ts'),
  'next.config.ts',
  join('app', '(app)', 'chat', 'page.tsx'),
  join('app', '(app)', 'om-appen', 'page.tsx'),
  join('__tests__', 'mention.test.ts'),
  join('__tests__', 'mention-regex.test.ts'),
  join('public', 'sw.js'),
  // Disse avviker KUN ved en omskrevet kommentar (medlemsnavn). Holdt i SKRUBBES
  // (ikke DIVERGERER) med vilje: da fanges enhver ANNEN endring i filen som drift.
  join('lib', 'konstanter.ts'),
  join('components', 'TopHeader.tsx'),
  join('components', 'profil', 'VarslerListe.tsx'),
])

const SKRUB_MAP = [
  ['herreklubben-bilder', 'klubb-bilder'],
  ['herreklubben-static', 'klubb-static'],
  ['herreklubben-pages-', 'klubb-pages-'],
  ['reidarei/Herreklubben', 'reidarei/klubb-app'],
  ['Herreklubben <onboarding@resend.dev>', 'Klubben <onboarding@resend.dev>'],
  ['Herreklubben <noreply@dittdomene.no>', 'Klubben <noreply@dittdomene.no>'],
  ['Herreklubb-preg', 'klubb-preg'],
  ['bilder.mortensrudherreklubb.no', 'bilder.klubb.example.com'],
  ['hele herreklubben', 'hele klubben'],
  ['herreklubbens', 'klubbens'],
  ['privatsamtale med Michael', 'privatsamtale med et annet medlem'],
  // mention-test-fixtures: medlemsnavn byttet til nøytralt «Per»
  ['@Espen', '@Per'],
  ['@esp', '@per'],
  ["'Espen'", "'Per'"],
  ["'espen'", "'per'"],
  ["'esp'", "'per'"],
  // Omskrevne kommentarer: kildens kommentarer navngir Reidar/medlemmer.
  // klubb-app nøytraliserer dem. Holdt som identitets-mapping (ikke
  // DIVERGERER) så all ANNEN endring i disse filene fanges som drift.
  [
    // Windows-checkout = CRLF; matchen må inkludere \r for å treffe linjeskiftet.
    '// Tilgangsvinduet etter en pass-godkjenning. Reidar har eksplisitt sagt\r\n// 1 dag —',
    '// Tilgangsvinduet etter en pass-godkjenning. Bevisst satt til 1 dag —\r\n//',
  ],
  ['Se #205 — Reidar ba om mer tydelig versjon.', 'Se #205 — bevisst gjort mer tydelig etter brukertilbakemelding.'],
  ['uten den ville Reidar med 116', 'uten den ville en bruker med 116'],
]

// Linjer som er versjons-stempel (stamp-versjon.mjs) og driver fritt per repo.
// Normaliseres bort på BEGGE sider før sammenligning, så et versjonsavvik aldri
// rapporteres som identitets-residual.
const VERSJON_STOEY = [/const CACHE_VERSION = 'V[\d.]+'/g]

// ---------------------------------------------------------------------------
// DIVERGERER: bevisst ulikt av ikke-mekaniske grunner. Vises som «forventet
// ulik» (én linje), teller ikke som drift. Grunnen står for sporbarhet.
// ---------------------------------------------------------------------------
const DIVERGERER = new Map([
  [join('lib', 'klubb-config.ts'), 'generiske defaults vs Mortensrud-defaults'],
  [join('lib', 'versjon.json'), 'versjons-stempel per repo'],
  [join('e2e', 'README.md'), 'skrubbet for designreferanser'],
])

function main() {
  const filer = samleFiler()
  const drift = []
  const skrubResidual = []
  let iSync = 0
  let skrubbetRent = 0
  const divergerer = []
  const manglerIKlubb = []

  for (const rel of filer) {
    const kildeSti = join(KILDE, rel)
    const klubbSti = join(KLUBB, rel)

    // DIVERGERER røres aldri av --apply — selv om kilde mangler i klubb.
    if (DIVERGERER.has(rel)) {
      if (existsSync(klubbSti) && readFileSync(kildeSti, 'utf8') !== readFileSync(klubbSti, 'utf8')) {
        divergerer.push({ rel, grunn: DIVERGERER.get(rel) })
      }
      continue
    }

    const kilde = readFileSync(kildeSti, 'utf8')

    if (!existsSync(klubbSti)) {
      manglerIKlubb.push(rel)
      // Ny delt fil → speil til klubb-app (skrubbet for sikkerhets skyld).
      if (APPLY) skrivKlubb(klubbSti, skrub(kilde), null)
      continue
    }

    const klubb = readFileSync(klubbSti, 'utf8')

    if (kilde === klubb) {
      iSync++
      continue
    }

    // Filen avviker. SKRUBBES = ren identitet forventes.
    if (SKRUBBES.has(rel)) {
      const forventet = normaliser(skrub(kilde))
      const faktisk = normaliser(klubb)
      if (forventet === faktisk) {
        skrubbetRent++
      } else {
        skrubResidual.push(rel)
        if (APPLY) skrivKlubb(klubbSti, skrub(kilde), klubb)
      }
      continue
    }

    // Ikke i noen kjent liste = ekte drift. Speiles skrubbet ved --apply
    // (skrub er no-op på rene filer, men fanger identitet som har sneket seg inn).
    drift.push(rel)
    if (APPLY) skrivKlubb(klubbSti, skrub(kilde), klubb)
  }

  const lekkasjer = sjekkLekkasje()

  rapporter({ iSync, skrubbetRent, divergerer, skrubResidual, drift, manglerIKlubb, lekkasjer })

  // Exit 1 hvis ekte drift, uforklart residual, eller lekkasje. Lekkasje
  // overstyrer alt — det er den farligste tilstanden (persondata i offentlig repo).
  if (lekkasjer.length > 0) process.exit(1)
  if (drift.length > 0 || skrubResidual.length > 0) process.exit(APPLY ? 0 : 1)
}

// Skriver innhold til klubb-app, oppretter mappe ved behov, og bevarer
// klubb-apps eget versjons-stempel hvis filen allerede fantes.
function skrivKlubb(klubbSti, innhold, klubbOrig) {
  mkdirSync(dirname(klubbSti), { recursive: true })
  writeFileSync(klubbSti, klubbOrig ? bevarVersjon(innhold, klubbOrig) : innhold, 'utf8')
}

// Samler alle relative filstier i scope fra KILDE-treet.
function samleFiler() {
  const ut = []
  for (const d of SCAN_DIRS) {
    const abs = join(KILDE, d)
    if (existsSync(abs)) gaaIgjennom(abs, ut)
  }
  for (const f of SCAN_ROOT_FILES) {
    if (existsSync(join(KILDE, f))) ut.push(f)
  }
  return ut.filter(rel => !IGNORER.has(rel))
}

function gaaIgjennom(dir, ut) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      gaaIgjennom(abs, ut)
    } else if (e.isFile()) {
      ut.push(relative(KILDE, abs))
    }
  }
}

// Lekkasje-sjekk: klubb-app er OFFENTLIG. Greper hele scope-treet i klubb-app
// for klubbnavn og fulle medlemsnavn. Dette er backstoppet bak skrubbingen —
// fanger identitet som har sneket seg inn i en MÅ-MATCHE-fil (som byte-kopieres
// uten skrub) eller et skrubbe-hull. Persondata i offentlig repo er den
// farligste tilstanden, så et treff her gir alltid exit 1.
const LEKKASJE_REGEX = /mortensrud|herreklubb/i
const TEKST_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html', '.txt', '.md', '.sql'])

function sjekkLekkasje() {
  const navn = medlemsnavn()
  const treff = []
  for (const d of SCAN_DIRS) {
    const abs = join(KLUBB, d)
    if (existsSync(abs)) skannLekkasje(abs, navn, treff)
  }
  for (const f of SCAN_ROOT_FILES) {
    const abs = join(KLUBB, f)
    if (existsSync(abs)) sjekkFilLekkasje(abs, navn, treff)
  }
  return treff
}

function skannLekkasje(dir, navn, treff) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      skannLekkasje(abs, navn, treff)
    } else if (e.isFile()) {
      sjekkFilLekkasje(abs, navn, treff)
    }
  }
}

function sjekkFilLekkasje(abs, navn, treff) {
  const rel = relative(KLUBB, abs)
  if (IGNORER.has(rel)) return
  const dot = abs.lastIndexOf('.')
  if (dot === -1 || !TEKST_EXT.has(abs.slice(dot))) return // hopp binærfiler (ikoner o.l.)
  const innhold = readFileSync(abs, 'utf8')
  const funn = []
  if (LEKKASJE_REGEX.test(innhold)) funn.push('klubbnavn')
  for (const n of navn) {
    if (innhold.includes(n)) funn.push(n)
  }
  if (funn.length) treff.push({ rel, funn })
}

// Henter fulle medlemsnavn fra fb-bilder-navn-mapping.json (herreklubben-privat).
// Fulle navn gir høy presisjon; bare fornavn ville gitt falske treff mot de
// nøytrale fixture-navnene (Per/Ola) vi bruker i klubb-app.
function medlemsnavn() {
  const sti = join(KILDE, 'scripts', 'fb-bilder-navn-mapping.json')
  if (!existsSync(sti)) return []
  const m = JSON.parse(readFileSync(sti, 'utf8'))
  const sett = new Set()
  for (const [nokkel, v] of Object.entries(m)) {
    if (nokkel?.includes(' ')) sett.add(nokkel)
    if (v?.profil_navn?.includes(' ')) sett.add(v.profil_navn)
  }
  return [...sett]
}

function skrub(tekst) {
  let ut = tekst
  for (const [fra, til] of SKRUB_MAP) ut = ut.split(fra).join(til)
  return ut
}

function normaliser(tekst) {
  let ut = tekst
  for (const re of VERSJON_STOEY) ut = ut.replace(re, 'const CACHE_VERSION = «NORM»')
  return ut
}

// Beholder klubb-apps eksisterende CACHE_VERSION-linje når vi --apply skriver
// skrubbet kilde, så vi ikke trår på klubb-apps eget versjons-stempel.
function bevarVersjon(skrubbet, klubbOrig) {
  const m = klubbOrig.match(/const CACHE_VERSION = 'V[\d.]+'/)
  if (!m) return skrubbet
  return skrubbet.replace(/const CACHE_VERSION = 'V[\d.]+'/, m[0])
}

function rapporter({ iSync, skrubbetRent, divergerer, skrubResidual, drift, manglerIKlubb, lekkasjer }) {
  console.log('')
  console.log(`  ✓  ${iSync} filer byte-identiske (i sync)`)
  console.log(`  🔧 ${skrubbetRent} filer rene etter identitets-skrubbing`)

  if (divergerer.length) {
    console.log('')
    console.log(`  📋 ${divergerer.length} filer divergerer bevisst:`)
    for (const { rel, grunn } of divergerer) console.log(`       ${rel}  — ${grunn}`)
  }

  if (manglerIKlubb.length) {
    console.log('')
    console.log(`  ⚠  ${manglerIKlubb.length} filer finnes i kilde, mangler i klubb-app:`)
    for (const rel of manglerIKlubb) console.log(`       ${rel}`)
  }

  if (skrubResidual.length) {
    console.log('')
    console.log(`  ⚠  ${skrubResidual.length} SKRUBBES-filer har residual utover identitets-mappingen:`)
    for (const rel of skrubResidual) console.log(`       ${rel}`)
    console.log(APPLY
      ? '       → skrev skrubbet kilde til klubb-app (review «git diff» i klubb-app).'
      : '       → enten ny logikk-endring (skal speiles) eller manglende skrubbe-regel. Kjør --apply for å speile, eller utvid SKRUB_MAP.')
  }

  if (drift.length) {
    console.log('')
    console.log(`  ❌ ${drift.length} filer DRIFTER (uventet — endring i ett repo, ikke det andre):`)
    for (const rel of drift) console.log(`       ${rel}`)
    console.log('       → speil endringen til klubb-app (husk skrubbing om identitet er involvert).')
  }

  if (lekkasjer.length) {
    console.log('')
    console.log(`  🚨 LEKKASJE — ${lekkasjer.length} filer i klubb-app inneholder klubbnavn/medlemsnavn:`)
    for (const { rel, funn } of lekkasjer) console.log(`       ${rel}  → ${funn.join(', ')}`)
    console.log('       → MÅ rettes før push. Identitet har sneket seg inn i en delt fil; legg til en skrubbe-regel eller flytt verdien til env-config.')
  }

  console.log('')
  if (!drift.length && !skrubResidual.length && !lekkasjer.length) {
    console.log('  Ingen drift. Repoene er i sync. ✔')
  }
  console.log('')
}

main()
