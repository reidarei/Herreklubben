// Foreslår mapping fra Messenger-deltakernavn → profiles.id basert på fuzzy-match.
// Leser scripts/data/herreklubben_chat.json (Facebook Messenger-eksport),
// kobler til Supabase Postgres, og skriver scripts/data/messenger-mapping.json
// med {profile_id, profile_navn, confidence} per Messenger-navn.
//
// Forutsetter manuell review av low-confidence treff før import (#115).
//
// Forutsetninger:
//   - scripts/data/herreklubben_chat.json må hentes fra Facebook-eksport-zipen
//     før skriptet kjøres. Filen ligger i zipen på stien:
//       your_facebook_activity/messages/inbox/herreklubben_8095345443874168/message_1.json
//     Kopier den til scripts/data/herreklubben_chat.json.
//     Fila er gitignorert (rådata) — kun den ferdige messenger-mapping.json committes.
//
// Kjøring:
//   node --env-file=.env.local scripts/foreslaa-messenger-mapping.mjs
//
// Exit-koder:
//   0 = alle rader fikk match (high eller low)
//   1 = én eller flere rader fikk confidence: 'none' og må fylles inn manuelt

import pg from 'pg'
import { readFile, writeFile } from 'node:fs/promises'

const PROJECT_REF = 'tdlfswmxezjdnxcbbiwn'
const DB_PASSWORD = 'd2F3j$G!-@j!i94'
const DB_HOST = `db.${PROJECT_REF}.supabase.co`

const KILDE = 'scripts/data/herreklubben_chat.json'
const UTFIL = 'scripts/data/messenger-mapping.json'

// Antall fra herreklubbens chat ved eksport 2026-05
const FORVENTET_DELTAKERE = 18

// Levenshtein-avstander over denne grensen regnes som «ingen rimelig match»
// — confidence settes til 'none' og krever manuell avklaring før import.
// Satt slik at dagens kjente low-treff (maks ~13: «Pål Erik Biseth Kind» → «Pål Erik»)
// fortsatt klassifiseres som low, men reelle ikke-treff fanges.
const MAKS_AVSTAND_FOR_LOW = 13

// Facebook eksporterer JSON med UTF-8 byte-sekvenser tolket som latin1 — typisk mojibake.
// Hvis vi ser disse markørene, gjør vi en latin1→utf8 round-trip.
function fiksEncoding(s) {
  if (typeof s !== 'string') return s
  if (/[ÃÂ]|â\x80\x99|â\x80\x9c|â\x80\x9d/.test(s)) {
    return Buffer.from(s, 'latin1').toString('utf8')
  }
  return s
}

function normaliser(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Klassisk Levenshtein DP. O(n·m) — n,m ~ 30, så fint.
function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const m = a.length
  const n = b.length
  const dp = new Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      const kost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(
        dp[j] + 1,        // deletion
        dp[j - 1] + 1,    // insertion
        prev + kost,      // substitution
      )
      prev = tmp
    }
  }
  return dp[n]
}

async function kjor() {
  // 1. Les Messenger-deltakere
  const raa = await readFile(KILDE, 'utf8')
  const data = JSON.parse(raa)
  if (!data.participants) {
    throw new Error(`Mangler 'participants' i ${KILDE} — verifiser at filen er en gyldig Messenger-eksport`)
  }
  const navnSet = new Set()
  for (const p of data.participants) {
    if (p?.name) navnSet.add(fiksEncoding(p.name))
  }
  const messengerNavn = [...navnSet].sort((a, b) => a.localeCompare(b, 'nb'))
  console.log(`✓ Leste ${messengerNavn.length} Messenger-deltakere fra ${KILDE}`)
  if (messengerNavn.length !== FORVENTET_DELTAKERE) {
    console.warn(`⚠  Forventet ${FORVENTET_DELTAKERE} deltakere, fant ${messengerNavn.length} — verifiser eksport`)
  }

  // 2. Hent profiler
  const client = new pg.Client({
    host: DB_HOST,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  console.log('✓ Tilkoblet Supabase')

  let profiler
  try {
    const res = await client.query(
      'select id, navn, visningsnavn from profiles where aktiv = true',
    )
    profiler = res.rows
    console.log(`✓ Hentet ${profiler.length} aktive profiler`)
  } finally {
    await client.end()
  }

  // 3. Forhåndsnormaliser profil-navn
  const profilerNorm = profiler.map(p => ({
    id: p.id,
    navn: p.navn,
    visningsnavn: p.visningsnavn,
    navnNorm: normaliser(p.navn ?? ''),
    visningsnavnNorm: p.visningsnavn ? normaliser(p.visningsnavn) : null,
  }))

  // 4. Match
  const resultat = {}
  const lowTreff = []

  for (const msg of messengerNavn) {
    const msgNorm = normaliser(msg)
    let beste = null
    let besteAvstand = Infinity
    let besteFelt = null // 'navn' | 'visningsnavn' — hvilket felt ga den minste avstanden
    const scoreliste = [] // for unik-sjekk

    for (const p of profilerNorm) {
      const dNavn = levenshtein(msgNorm, p.navnNorm)
      const dVis = p.visningsnavnNorm != null
        ? levenshtein(msgNorm, p.visningsnavnNorm)
        : Infinity
      const d = Math.min(dNavn, dVis)
      const felt = dVis < dNavn ? 'visningsnavn' : 'navn'
      scoreliste.push({ p, d, felt })
      if (d < besteAvstand) {
        besteAvstand = d
        beste = p
        besteFelt = felt
      }
    }

    const sammeScore = scoreliste.filter(x => x.d === besteAvstand)
    const unik = sammeScore.length === 1

    let confidence
    if (besteAvstand === 0) confidence = 'high'
    else if (besteAvstand === 1 && unik) confidence = 'high'
    else if (besteAvstand > MAKS_AVSTAND_FOR_LOW) confidence = 'none'
    else confidence = 'low'

    resultat[msg] = {
      profile_id: confidence === 'none' ? null : beste.id,
      profile_navn: confidence === 'none' ? null : beste.navn,
      confidence,
    }

    if (confidence === 'low' || confidence === 'none') {
      // Vis topp-3 kandidater for review, med hvilket felt som ga matchen
      const topp = [...scoreliste]
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
        .map(x => `${x.p.navn} (${x.d}, via ${x.felt})`)
        .join(', ')
      lowTreff.push({
        msg,
        beste: beste?.navn ?? '(ingen)',
        avstand: besteAvstand,
        felt: besteFelt,
        topp,
        confidence,
      })
    }
  }

  // 5. Duplikat-detektering: samme profile_id tildelt flere Messenger-navn
  // demoter ALLE rader som kolliderer til 'low' slik at Reidar må fikse manuelt.
  const idTilNavn = new Map() // profile_id → [messengerNavn, ...]
  for (const [msg, r] of Object.entries(resultat)) {
    if (r.profile_id == null) continue
    const liste = idTilNavn.get(r.profile_id) ?? []
    liste.push(msg)
    idTilNavn.set(r.profile_id, liste)
  }
  const duplikater = [] // { profile_id, profile_navn, kolliderende: [msg, ...] }
  for (const [id, navnListe] of idTilNavn) {
    if (navnListe.length > 1) {
      const profilNavn = resultat[navnListe[0]].profile_navn
      for (const msg of navnListe) {
        // Demote til low — behold profile_id slik at det er synlig hvilken kollisjon
        if (resultat[msg].confidence === 'high') {
          resultat[msg].confidence = 'low'
        }
      }
      duplikater.push({ profile_id: id, profile_navn: profilNavn, kolliderende: navnListe })
    }
  }

  // 6. Skriv ut sortert
  const sortert = {}
  for (const navn of messengerNavn) sortert[navn] = resultat[navn]
  await writeFile(UTFIL, JSON.stringify(sortert, null, 2) + '\n', 'utf8')
  console.log(`✓ Skrev ${UTFIL}`)

  // 7. Oppsummering
  const high = Object.values(resultat).filter(r => r.confidence === 'high').length
  const low = Object.values(resultat).filter(r => r.confidence === 'low').length
  const none = Object.values(resultat).filter(r => r.confidence === 'none').length
  console.log(`\n=== Resultat: ${high} high-confidence, ${low} low-confidence, ${none} ingen match ===`)
  if (lowTreff.length > 0) {
    console.log('\nKrever manuell review:')
    for (const t of lowTreff) {
      const merke = t.confidence === 'none' ? '[INGEN MATCH]' : '[low]'
      console.log(`  ${merke} "${t.msg}" → "${t.beste}" (avstand ${t.avstand}, via ${t.felt ?? '-'})`)
      console.log(`    kandidater: ${t.topp}`)
    }
  }

  if (duplikater.length > 0) {
    console.log('\n⚠  Duplikat-tilordning oppdaget — flere Messenger-navn peker på samme profil:')
    for (const d of duplikater) {
      console.log(`  → "${d.profile_navn}" (${d.profile_id}) tildelt fra: ${d.kolliderende.map(n => `"${n}"`).join(', ')}`)
    }
    console.log('  Disse er demotet til confidence: low — fiks manuelt før import.')
  }

  if (none > 0) {
    console.error(`\n✗ ${none} rader mangler match (confidence: none) — fyll inn manuelt før import.`)
    process.exit(1)
  }
}

kjor().catch(err => {
  console.error('Feil:', err)
  process.exit(1)
})
