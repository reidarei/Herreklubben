// Validerer miljøvariabler for Herreklubben-appen.
// Sjekker format og tilstedeværelse, og rapporterer mangler per nivå.
//
// Kjøres: npm run sjekk-miljo  (alias for node --env-file=.env.local scripts/sjekk-miljo.mjs)
//
// Exit-kode 0 = OK (evt. advarsler), 1 = kritisk feil.

// ─── ANSI-farger (kun i TTY) ────────────────────────────────────────────────

const tty = process.stdout.isTTY
const r = (s) => tty ? `\x1b[31m${s}\x1b[0m` : s   // rød
const g = (s) => tty ? `\x1b[32m${s}\x1b[0m` : s   // grønn
const y = (s) => tty ? `\x1b[33m${s}\x1b[0m` : s   // gul
const b = (s) => tty ? `\x1b[1m${s}\x1b[0m` : s    // fet

// ─── TYPVALIDATORER ──────────────────────────────────────────────────────────

const typer = {
  // Gyldig URL med https eller http
  url: (v) => {
    try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:' }
    catch { return false }
  },
  // JWT: tre punktum-separerte deler, første starter med eyJ (base64url for {"...)
  jwt: (v) => {
    const deler = v.split('.')
    return deler.length === 3 && deler[0].startsWith('eyJ')
  },
  // VAPID-nøkler er base64url-kodet, 43 tegn (256-bit uten padding) eller 88 tegn (512-bit)
  base64url: (v) => /^[A-Za-z0-9_-]{43,}$/.test(v),
  // E-postadresse
  epost: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  // Hostnavn (domene uten protokoll)
  hostname: (v) => /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(v),
  // GitHub-token med kjente prefikser
  'github-token': (v) => v.startsWith('ghp_') || v.startsWith('github_pat_') || v.startsWith('gho_'),
  // Resend API-nøkkel
  'resend-key': (v) => v.startsWith('re_'),
  // R2 jurisdiksjon
  'r2-jurisdiction': (v) => ['default', 'eu', 'fedramp'].includes(v.toLowerCase()),
  // Ikke-tom streng
  streng: (v) => v.trim().length > 0,
  // Positivt heltall
  'pos-int': (v) => /^\d+$/.test(v) && parseInt(v, 10) > 0,
}

function valider(type, verdi) {
  const fn = typer[type]
  if (!fn) return true // ukjent type = ingen formatsjekk
  return fn(verdi)
}

// ─── VARIABELDEFINISJON ──────────────────────────────────────────────────────
//
// nivaa: 'kritisk' → ✖ + exit 1 ved feil/mangler
//        'anbefalt' → ⚠ ved mangler, ✖ ved satt-men-feil-format
//        'valgfri'  → ✓ kun hvis satt, ellers stille

const variablar = [
  // Supabase
  { navn: 'NEXT_PUBLIC_SUPABASE_URL',   nivaa: 'kritisk',   type: 'url',      beskrivelse: 'Supabase prosjekt-URL' },
  { navn: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', nivaa: 'kritisk', type: 'jwt',     beskrivelse: 'Supabase anon-nøkkel (JWT)' },
  { navn: 'SUPABASE_SERVICE_ROLE_KEY',  nivaa: 'kritisk',   type: 'jwt',      beskrivelse: 'Supabase service-role-nøkkel (JWT, SECRET)' },

  // R2
  { navn: 'R2_ACCOUNT_ID',             nivaa: 'kritisk',   type: 'streng',   beskrivelse: 'Cloudflare konto-ID' },
  { navn: 'R2_ACCESS_KEY_ID',          nivaa: 'kritisk',   type: 'streng',   beskrivelse: 'R2 access key ID (SECRET)' },
  { navn: 'R2_SECRET_ACCESS_KEY',      nivaa: 'kritisk',   type: 'streng',   beskrivelse: 'R2 secret access key (SECRET)' },
  { navn: 'R2_BUCKET',                 nivaa: 'valgfri',   type: 'streng',   beskrivelse: 'R2 bucket-navn (default: herreklubben-bilder)' },
  { navn: 'R2_JURISDICTION',           nivaa: 'valgfri',   type: 'r2-jurisdiction', beskrivelse: 'R2 jurisdiksjon: default|eu|fedramp' },
  // R2_PUBLIC_URL og NEXT_PUBLIC_R2_PUBLIC_URL håndteres som spesialsjekk under

  // VAPID
  { navn: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', nivaa: 'kritisk', type: 'base64url', beskrivelse: 'VAPID offentlig nøkkel (base64url)' },
  { navn: 'VAPID_PRIVATE_KEY',          nivaa: 'kritisk',   type: 'base64url', beskrivelse: 'VAPID privat nøkkel (base64url, SECRET)' },
  { navn: 'VAPID_CONTACT_EMAIL',        nivaa: 'valgfri',   type: 'epost',    beskrivelse: 'Kontakt-epost for push-tjenester' },

  // Resend
  { navn: 'RESEND_API_KEY',            nivaa: 'anbefalt',  type: 'resend-key', beskrivelse: 'Resend API-nøkkel (re_...) — e-postvarsler mangler uten' },
  { navn: 'RESEND_FROM',               nivaa: 'valgfri',   type: 'streng',   beskrivelse: 'Avsendernavn i utgående e-post' },

  // Cron
  { navn: 'CRON_SECRET',               nivaa: 'anbefalt',  type: 'streng',   beskrivelse: 'Delt hemmelighet for cron-endepunkt — påminnelsesvarsler mangler uten' },

  // GitHub
  { navn: 'GITHUB_TOKEN',              nivaa: 'anbefalt',  type: 'github-token', beskrivelse: 'GitHub PAT (ghp_/github_pat_) — innspill-funksjon mangler uten' },
  { navn: 'GITHUB_WEBHOOK_SECRET',     nivaa: 'anbefalt',  type: 'streng',   beskrivelse: 'GitHub webhook-hemmelighet — innkommende webhook-validering mangler uten' },
  { navn: 'NEXT_PUBLIC_GITHUB_REPO',   nivaa: 'valgfri',   type: 'streng',   beskrivelse: 'GitHub-repo for innspill (default: reidarei/Herreklubben)' },
  { navn: 'NEXT_PUBLIC_GITHUB_ONSKE_LABEL', nivaa: 'valgfri', type: 'streng', beskrivelse: 'GitHub Issues-label for ønsker (default: ønske)' },

  // Base-URL
  { navn: 'NEXT_PUBLIC_BASE_URL',      nivaa: 'valgfri',   type: 'url',      beskrivelse: 'Base-URL override (trengs normalt ikke — utledes fra KLUBB_DOMENE/VERCEL_URL)' },

  // Klubbidentitet
  { navn: 'NEXT_PUBLIC_KLUBB_NAVN',              nivaa: 'valgfri', type: 'streng', beskrivelse: 'Klubbnavn (default: Mortensrud Herreklubb)' },
  { navn: 'NEXT_PUBLIC_KLUBB_KORTNAVN',          nivaa: 'valgfri', type: 'streng', beskrivelse: 'Kortnavn (default: Herreklubben)' },
  { navn: 'NEXT_PUBLIC_KLUBB_NAVN_LINJE_1',      nivaa: 'valgfri', type: 'streng', beskrivelse: 'Visningsnavn linje 1' },
  { navn: 'NEXT_PUBLIC_KLUBB_NAVN_LINJE_2',      nivaa: 'valgfri', type: 'streng', beskrivelse: 'Visningsnavn linje 2' },
  { navn: 'NEXT_PUBLIC_KLUBB_BESKRIVELSE',       nivaa: 'valgfri', type: 'streng', beskrivelse: 'Beskrivelse av appen' },
  { navn: 'NEXT_PUBLIC_KLUBB_DOMENE',            nivaa: 'valgfri', type: 'hostname', beskrivelse: 'Domenenavn (default: mortensrudherreklubb.no)' },
  { navn: 'NEXT_PUBLIC_KLUBB_STIFTET_AAR',       nivaa: 'valgfri', type: 'pos-int', beskrivelse: 'Stiftelsesår' },
  { navn: 'NEXT_PUBLIC_KLUBB_STIFTET_MAANED',    nivaa: 'valgfri', type: 'pos-int', beskrivelse: 'Stiftelsesmåned (1–12)' },
  { navn: 'NEXT_PUBLIC_KLUBB_STIFTET_DAG',       nivaa: 'valgfri', type: 'pos-int', beskrivelse: 'Stiftelsesdag (1–31)' },
  { navn: 'NEXT_PUBLIC_KLUBB_STED',              nivaa: 'valgfri', type: 'streng', beskrivelse: 'Sted/bydel' },
  { navn: 'NEXT_PUBLIC_ROLLE_TITTEL_GENERALSEKRETAER', nivaa: 'valgfri', type: 'streng', beskrivelse: 'Tittel for generalsekretær-rollen' },
  { navn: 'NEXT_PUBLIC_R2_CUSTOM_DOMAIN',        nivaa: 'valgfri', type: 'hostname', beskrivelse: 'Custom domain for R2-bilder (kun ved eget domene)' },

  // Dev-only
  { navn: 'ALLOW_LOCAL_NOTIFICATIONS',  nivaa: 'valgfri', type: 'streng', beskrivelse: 'Aktiver ekte varsler i dev (sett true)' },
]

// ─── INNSAMLING OG SJEKK ─────────────────────────────────────────────────────

let kritiskFeil = 0
let advarslar = 0
const meldingar = { kritisk: [], anbefalt: [], valgfri: [] }

for (const { navn, nivaa, type, beskrivelse } of variablar) {
  const verdi = process.env[navn]
  const satt = verdi !== undefined && verdi !== ''

  if (nivaa === 'valgfri') {
    if (satt) {
      const ok = valider(type, verdi)
      if (ok) {
        meldingar.valgfri.push(`  ${g('✓')} ${navn}`)
      } else {
        // Satt, men feil format — alltid feil uansett nivå
        meldingar.valgfri.push(`  ${r('✖')} ${navn} — satt, men ugyldig format (${type})`)
        kritiskFeil++
      }
    }
    // Ikke satt og valgfri → stille
    continue
  }

  if (!satt) {
    if (nivaa === 'kritisk') {
      meldingar.kritisk.push(`  ${r('✖')} ${navn} — mangler  (${beskrivelse})`)
      kritiskFeil++
    } else {
      meldingar.anbefalt.push(`  ${y('⚠')} ${navn} — ikke satt  (${beskrivelse})`)
      advarslar++
    }
    continue
  }

  // Satt — formatkontroll
  const ok = valider(type, verdi)
  if (!ok) {
    // Satt, men feil format — alltid kritisk feil
    const linje = `  ${r('✖')} ${navn} — ugyldig format (forventet: ${type})  (${beskrivelse})`
    if (nivaa === 'kritisk') {
      meldingar.kritisk.push(linje)
    } else {
      meldingar.anbefalt.push(linje)
    }
    kritiskFeil++
    continue
  }

  if (nivaa === 'kritisk') {
    meldingar.kritisk.push(`  ${g('✓')} ${navn}`)
  } else {
    meldingar.anbefalt.push(`  ${g('✓')} ${navn}`)
  }
}

// ─── SPESIALSJEKK 1: R2 public URL ──────────────────────────────────────────
// Minst én av R2_PUBLIC_URL eller NEXT_PUBLIC_R2_PUBLIC_URL må være satt.

const r2PubServer = process.env.R2_PUBLIC_URL
const r2PubKlient = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
const r2PubSatt = (r2PubServer && r2PubServer !== '') || (r2PubKlient && r2PubKlient !== '')

if (!r2PubSatt) {
  meldingar.kritisk.push(`  ${r('✖')} R2_PUBLIC_URL / NEXT_PUBLIC_R2_PUBLIC_URL — minst én må settes (bilder kan ikke vises uten)`)
  kritiskFeil++
} else {
  // Valider format på de som er satt
  if (r2PubServer && r2PubServer !== '') {
    if (!typer.url(r2PubServer)) {
      meldingar.kritisk.push(`  ${r('✖')} R2_PUBLIC_URL — ugyldig URL-format`)
      kritiskFeil++
    } else {
      meldingar.kritisk.push(`  ${g('✓')} R2_PUBLIC_URL`)
    }
  }
  if (r2PubKlient && r2PubKlient !== '') {
    if (!typer.url(r2PubKlient)) {
      meldingar.kritisk.push(`  ${r('✖')} NEXT_PUBLIC_R2_PUBLIC_URL — ugyldig URL-format`)
      kritiskFeil++
    } else {
      meldingar.kritisk.push(`  ${g('✓')} NEXT_PUBLIC_R2_PUBLIC_URL`)
    }
  }
}

// ─── SPESIALSJEKK 2: VAPID-nøkler i par ─────────────────────────────────────
// Begge må settes — advarsel hvis kun én er satt (fanges også av kritisk-sjekk,
// men her gir vi en spesifikk parforklaring).

const vapidPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPriv = process.env.VAPID_PRIVATE_KEY
const vapidPubSatt = vapidPub && vapidPub !== ''
const vapidPrivSatt = vapidPriv && vapidPriv !== ''
if (vapidPubSatt !== vapidPrivSatt) {
  meldingar.kritisk.push(
    `  ${y('⚠')} VAPID-nøkler er ikke i par — begge må genereres og settes sammen (npx web-push generate-vapid-keys)`
  )
}

// ─── SPESIALSJEKK 3: BASE_URL vs KLUBB_DOMENE drift ─────────────────────────
// Hvis begge er satt og BASE_URL ikke stemmer med KLUBB_DOMENE, er det
// to sannhetskilder som kan gi forskjellige URL-er i varsler og ICS.

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
const klubbDomene = process.env.NEXT_PUBLIC_KLUBB_DOMENE
if (baseUrl && baseUrl !== '' && klubbDomene && klubbDomene !== '') {
  const forventet = `https://${klubbDomene}`
  if (baseUrl !== forventet) {
    meldingar.anbefalt.push(
      `  ${y('⚠')} NEXT_PUBLIC_BASE_URL (${baseUrl}) stemmer ikke med NEXT_PUBLIC_KLUBB_DOMENE (${forventet}) — mulig drift mellom to sannhetskilder`
    )
    advarslar++
  }
}

// ─── SPESIALSJEKK 4: Secret-lekkasje i NEXT_PUBLIC_ ─────────────────────────
// Heuristikk: hvis verdien til en NEXT_PUBLIC_-variabel ligner et kjent
// secret-format, er det sannsynligvis en feilkonfigurasjon.
// VIKTIG: vi printer ALDRI verdien — kun variabelnavnet.

for (const [key, val] of Object.entries(process.env)) {
  if (!key.startsWith('NEXT_PUBLIC_') || !val) continue

  let lekkasje = false

  // Kjente token-prefikser
  if (val.startsWith('ghp_') || val.startsWith('github_pat_') || val.startsWith('re_')) {
    lekkasje = true
  }

  // JWT med service_role i payload (base64-dekod midtdel, let etter "role":"service_role")
  if (!lekkasje && val.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(val.split('.')[1], 'base64url').toString('utf8'))
      if (payload?.role === 'service_role') lekkasje = true
    } catch { /* ugyldig base64 eller JSON — ikke en JWT */ }
  }

  if (lekkasje) {
    meldingar.kritisk.push(
      `  ${r('✖')} ${key} — verdien ser ut som et secret (token/nøkkel) og skal IKKE ha NEXT_PUBLIC_-prefiks (inlines i browser-bundle)`
    )
    kritiskFeil++
  }
}

// ─── UTSKRIFT ────────────────────────────────────────────────────────────────

console.log('')
console.log(b('=== Herreklubben — miljøsjekk ==='))
console.log('')

if (meldingar.kritisk.length > 0) {
  console.log(b('Kritiske (app starter ikke uten):'))
  meldingar.kritisk.forEach((m) => console.log(m))
  console.log('')
}

if (meldingar.anbefalt.length > 0) {
  console.log(b('Anbefalte (mangler gir redusert funksjonalitet):'))
  meldingar.anbefalt.forEach((m) => console.log(m))
  console.log('')
}

if (meldingar.valgfri.length > 0) {
  console.log(b('Valgfrie (satt, med defaults):'))
  meldingar.valgfri.forEach((m) => console.log(m))
  console.log('')
}

// Oppsummering
const kritiskOk = meldingar.kritisk.filter((m) => m.includes('✓')).length
const anbefaltOk = meldingar.anbefalt.filter((m) => m.includes('✓')).length

if (kritiskFeil === 0 && advarslar === 0) {
  console.log(g(`✓ Alt OK — ${kritiskOk} kritiske og ${anbefaltOk} anbefalte variabler er satt og gyldige.`))
} else if (kritiskFeil === 0) {
  console.log(y(`⚠ ${advarslar} advarsel(er) — ${kritiskOk} kritiske OK. Appen starter, men noen funksjoner mangler.`))
} else {
  console.log(r(`✖ ${kritiskFeil} kritisk feil — ${advarslar} advarsel(er). Fiks feil markert med ✖ før deploy.`))
}
console.log('')

process.exit(kritiskFeil > 0 ? 1 : 0)
