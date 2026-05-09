// Importerer Messenger-historikk fra Facebook-eksport til klubb_chat + chat_reaksjoner.
// Idempotent via klubb_chat.kilde_ekstern_id (format: "messenger:{ts_ms}:{idx}") —
// re-kjøring legger ikke til duplikater, så det er trygt å kjøre flere ganger.
//
// Kjøring (dry-run anbefalt først):
//   DRY_RUN=1 MESSENGER_KILDE_DIR=<path> node --env-file=.env.local scripts/import-messenger-klubbchat.mjs
//   MESSENGER_KILDE_DIR=<path> node --env-file=.env.local scripts/import-messenger-klubbchat.mjs
//
// Krav:
//   - .env.local med R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//     R2_BUCKET, R2_PUBLIC_URL (og evt. R2_JURISDICTION).
//   - MESSENGER_KILDE_DIR peker på inbox-mappen for tråden, f.eks.
//     <fb-export-rot>/your_facebook_activity/messages/inbox/herreklubben_8095345443874168
//     Hvis ikke satt: scripts/data/ — skriptet leter da etter herreklubben_chat.json der
//     og forventer ingen media-filer (bare tekst-meldinger).
//   - scripts/data/messenger-mapping.json med komplett {navn → profile_id}-mapping.
//
// Miljøvariabler:
//   - DRY_RUN=1 — analyser og rapporter, men ikke skriv til DB eller R2.
//
// Skriver scripts/data/import-rapport.json med totaler og advarsler.

import pg from 'pg'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { AwsClient } from 'aws4fetch'

// ───────────────────────────────────────────────────────────────────────
// Konfig
// ───────────────────────────────────────────────────────────────────────

const PROJECT_REF = 'tdlfswmxezjdnxcbbiwn'
const DB_PASSWORD = 'd2F3j$G!-@j!i94'
const DB_HOST = `db.${PROJECT_REF}.supabase.co`

const DRY_RUN = process.env.DRY_RUN === '1'
const KILDE_DIR = process.env.MESSENGER_KILDE_DIR ?? 'scripts/data'

const MAPPING_FIL = 'scripts/data/messenger-mapping.json'
const RAPPORT_FIL = 'scripts/data/import-rapport.json'
const FORVENTET_DELTAKERE = 18
const MAKS_FILSTORRELSE = 50 * 1024 * 1024 // 50 MB

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET ?? 'herreklubben-bilder'
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '')
  .replace(/\/$/, '')
const R2_JURISDICTION = (process.env.R2_JURISDICTION ?? 'default').toLowerCase()
const HAR_R2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL)

const r2Segment = R2_JURISDICTION === 'default' ? '' : `.${R2_JURISDICTION}`
const r2Endpoint = `https://${R2_ACCOUNT_ID}${r2Segment}.r2.cloudflarestorage.com`

const aws = HAR_R2
  ? new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      region: 'auto',
      service: 's3',
    })
  : null

// ───────────────────────────────────────────────────────────────────────
// Hjelpere
// ───────────────────────────────────────────────────────────────────────

// Facebook eksporterer JSON med UTF-8-byte-sekvenser tolket som latin1.
// Kopiert fra scripts/foreslaa-messenger-mapping.mjs.
function fiksEncoding(s) {
  if (typeof s !== 'string') return s
  if (/[ÃÂ]|â\x80\x99|â\x80\x9c|â\x80\x9d/.test(s)) {
    return Buffer.from(s, 'latin1').toString('utf8')
  }
  return s
}

const SYSTEM_RE = /^.+ (har lagt til|har fjernet|har forlatt|har gitt gruppen navnet)/

function ekstensjonTilContentType(filnavn) {
  const ext = path.extname(filnavn).toLowerCase()
  switch (ext) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.png': return 'image/png'
    case '.gif': return 'image/gif'
    case '.webp': return 'image/webp'
    case '.mp4': return 'video/mp4'
    case '.mov': return 'video/quicktime'
    default: throw new Error(`Ukjent ekstensjon: ${filnavn}`)
  }
}

// MESSENGER_KILDE_DIR peker på inbox-mappa for tråden. URI-er i message_1.json er
// relative til eksport-roten (starter med "your_facebook_activity/..."), så vi må
// resolve to nivåer opp før vi joiner.
//
// Stickers ligger i en søsken-mappe (your_facebook_activity/messages/stickers_used/),
// og kan dessuten være i en annen del-zip enn inbox-en (Facebook splitter eksporten i
// part1/part2/...). For robusthet: prøv eksport-roten utledet fra inbox, og hvis filen
// ikke finnes der, gjør et bredere søk i søsken-mapper på samme nivå (part1/, part2/).
async function finnSosken(partRot) {
  // Returner alle søsken-mapper på samme nivå (inkluderer partRot selv) — eksporten kan
  // være splittet i part1/part2/..., og samme melding kan referere media i en annen del.
  try {
    const foreldre = path.resolve(partRot, '..')
    const oppfoeringer = await readdir(foreldre, { withFileTypes: true })
    return oppfoeringer
      .filter(d => d.isDirectory())
      .map(d => path.join(foreldre, d.name))
  } catch {
    return [partRot]
  }
}

async function loesUriTilFil(uri, roter) {
  for (const rot of roter) {
    const full = path.join(rot, uri)
    if (existsSync(full)) return full
  }
  return null
}

// ───────────────────────────────────────────────────────────────────────
// R2-upload (idempotent via HEAD)
// ───────────────────────────────────────────────────────────────────────

async function r2HeadFinnes(sti) {
  const url = `${r2Endpoint}/${R2_BUCKET}/${sti}`
  const res = await aws.fetch(url, { method: 'HEAD' })
  return res.ok
}

async function r2Upload(sti, data, contentType) {
  const url = `${r2Endpoint}/${R2_BUCKET}/${sti}`
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
    const tekst = await res.text().catch(() => '')
    throw new Error(`R2 upload feilet for ${sti} (${res.status}): ${tekst}`)
  }
  return `${R2_PUBLIC_URL}/${sti}`
}

function r2PathFor(uri) {
  // uri eksempel: "your_facebook_activity/messages/inbox/herreklubben_X/photos/foo.jpg"
  // eller        "your_facebook_activity/messages/stickers_used/123.png"
  const filnavn = path.basename(uri)
  const ext = path.extname(filnavn).toLowerCase()
  const erVideo = ext === '.mp4' || ext === '.mov'
  const erSticker = uri.includes('/stickers_used/')
  if (erVideo) return `video/chat/import/${filnavn}`
  if (erSticker) return `chat/import/sticker-${filnavn}`
  return `chat/import/${filnavn}`
}

// ───────────────────────────────────────────────────────────────────────
// Hoved
// ───────────────────────────────────────────────────────────────────────

async function kjor() {
  console.log(`Modus: ${DRY_RUN ? 'DRY_RUN' : 'IMPORT'}`)
  console.log(`Kilde-katalog: ${KILDE_DIR}`)

  // 1. Les mapping
  const mappingRaa = await readFile(MAPPING_FIL, 'utf8')
  const mapping = JSON.parse(mappingRaa)
  const navnTilProfilId = new Map()
  for (const [navn, info] of Object.entries(mapping)) {
    if (!info.profile_id) {
      throw new Error(`Mapping mangler profile_id for "${navn}" — fyll inn ${MAPPING_FIL} før import`)
    }
    navnTilProfilId.set(navn, info.profile_id)
  }
  console.log(`✓ Leste ${navnTilProfilId.size} navn fra ${MAPPING_FIL}`)

  // 2. Les eksport-JSON
  // message_1.json (i inbox-mappa) eller herreklubben_chat.json (i scripts/data)
  let chatFil = path.join(KILDE_DIR, 'message_1.json')
  if (!existsSync(chatFil)) chatFil = path.join(KILDE_DIR, 'herreklubben_chat.json')
  if (!existsSync(chatFil)) {
    throw new Error(`Fant ikke message_1.json eller herreklubben_chat.json i ${KILDE_DIR}`)
  }
  console.log(`✓ Leser ${chatFil}`)
  const data = JSON.parse(await readFile(chatFil, 'utf8'))

  if (!data.messages || !data.participants) {
    throw new Error('Ugyldig Messenger-eksport: mangler messages eller participants')
  }
  if (data.participants.length !== FORVENTET_DELTAKERE) {
    console.warn(`⚠  Forventet ${FORVENTET_DELTAKERE} deltakere, fant ${data.participants.length}`)
  }
  console.log(`✓ ${data.messages.length} meldinger totalt, ${data.participants.length} deltakere`)

  // 3. Bestem søk-roter for media-filer
  const partRot = path.resolve(KILDE_DIR, '..', '..', '..', '..')
  const roter = await finnSosken(partRot)
  console.log(`✓ Søker media i ${roter.length} eksport-rot(er): ${roter.map(r => path.basename(r)).join(', ')}`)

  // 4. Filtrer + bygg rad-kandidater
  const advarsler = []
  let antUnsent = 0
  let antSystem = 0
  let antManglerAvsender = 0

  // En "rad-kandidat" representerer én klubb_chat-rad.
  /** @type {Array<{kilde_ekstern_id: string, profil_id: string, innhold: string|null, bilde_uri: string|null, video_uri: string|null, opprettet: string, ts_ms: number, reactions: Array<{emoji: string, profil_id: string}>}>} */
  const kandidater = []

  for (const m of data.messages) {
    if (m.is_unsent === true) { antUnsent++; continue }
    const senderRaa = fiksEncoding(m.sender_name)
    const innholdRaa = m.content ? fiksEncoding(m.content) : null
    if (innholdRaa && SYSTEM_RE.test(innholdRaa)) { antSystem++; continue }

    const profilId = navnTilProfilId.get(senderRaa)
    if (!profilId) {
      antManglerAvsender++
      advarsler.push(`Ukjent avsender (hopper over): "${senderRaa}" @ ${m.timestamp_ms}`)
      continue
    }

    const tsMs = m.timestamp_ms
    const reaksjoner = (m.reactions ?? []).map(r => {
      const aktorNavn = fiksEncoding(r.actor)
      return {
        emoji: fiksEncoding(r.reaction),
        profil_id: navnTilProfilId.get(aktorNavn) ?? null,
        aktor_navn: aktorNavn,
      }
    })

    // Splitt etter media-type
    if (m.photos && m.photos.length > 0) {
      m.photos.forEach((foto, idx) => {
        kandidater.push({
          kilde_ekstern_id: `messenger:${tsMs}:${idx}`,
          profil_id: profilId,
          innhold: idx === 0 ? innholdRaa : null,
          bilde_uri: foto.uri,
          video_uri: null,
          opprettet: new Date(tsMs + idx).toISOString(),
          ts_ms: tsMs,
          reactions: idx === 0 ? reaksjoner : [],
        })
      })
    } else if (m.videos && m.videos.length > 0) {
      // Vi forventer typisk én video per melding, men håndterer flere defensivt
      m.videos.forEach((v, idx) => {
        kandidater.push({
          kilde_ekstern_id: `messenger:${tsMs}:${idx}`,
          profil_id: profilId,
          innhold: idx === 0 ? innholdRaa : null,
          bilde_uri: null,
          video_uri: v.uri,
          opprettet: new Date(tsMs + idx).toISOString(),
          ts_ms: tsMs,
          reactions: idx === 0 ? reaksjoner : [],
        })
      })
    } else if (m.gifs && m.gifs.length > 0) {
      m.gifs.forEach((g, idx) => {
        kandidater.push({
          kilde_ekstern_id: `messenger:${tsMs}:${idx}`,
          profil_id: profilId,
          innhold: idx === 0 ? innholdRaa : null,
          bilde_uri: g.uri,
          video_uri: null,
          opprettet: new Date(tsMs + idx).toISOString(),
          ts_ms: tsMs,
          reactions: idx === 0 ? reaksjoner : [],
        })
      })
    } else if (m.sticker) {
      kandidater.push({
        kilde_ekstern_id: `messenger:${tsMs}:0`,
        profil_id: profilId,
        innhold: innholdRaa,
        bilde_uri: m.sticker.uri,
        video_uri: null,
        opprettet: new Date(tsMs).toISOString(),
        ts_ms: tsMs,
        reactions: reaksjoner,
      })
    } else {
      // Ren tekst eller share. Dropp hvis ingen tekst (f.eks. share uten content).
      if (!innholdRaa) {
        advarsler.push(`Tom melding uten innhold/media @ ${tsMs} (${senderRaa})`)
        continue
      }
      kandidater.push({
        kilde_ekstern_id: `messenger:${tsMs}:0`,
        profil_id: profilId,
        innhold: innholdRaa,
        bilde_uri: null,
        video_uri: null,
        opprettet: new Date(tsMs).toISOString(),
        ts_ms: tsMs,
        reactions: reaksjoner,
      })
    }
  }

  console.log(`✓ ${kandidater.length} rad-kandidater bygget`)
  console.log(`  hoppet over: ${antUnsent} unsent, ${antSystem} system, ${antManglerAvsender} ukjent avsender`)

  // 5. Resolver media-uri → fs-path. Drop kandidatens media-felt hvis filen mangler;
  //    behold raden hvis det er innhold, ellers drop raden.
  const uriTilSti = new Map() // uri → absolutt fs-path
  const manglendeUriEr = new Set()
  for (const k of kandidater) {
    const uri = k.bilde_uri ?? k.video_uri
    if (!uri) continue
    if (uriTilSti.has(uri) || manglendeUriEr.has(uri)) continue
    const sti = await loesUriTilFil(uri, roter)
    if (sti) uriTilSti.set(uri, sti)
    else manglendeUriEr.add(uri)
  }

  let antMediaFjernet = 0
  let antRaderDroppet = 0
  const finalKandidater = []
  for (const k of kandidater) {
    const uri = k.bilde_uri ?? k.video_uri
    if (uri && manglendeUriEr.has(uri)) {
      antMediaFjernet++
      if (!k.innhold) {
        antRaderDroppet++
        advarsler.push(`Mangler media-fil og innhold — dropper rad ${k.kilde_ekstern_id} (${uri})`)
        continue
      }
      // Behold raden som tekst-only
      k.bilde_uri = null
      k.video_uri = null
    }
    finalKandidater.push(k)
  }
  console.log(`  media-filer manglet: ${manglendeUriEr.size} unike — ${antMediaFjernet} kandidat-rader berørt, ${antRaderDroppet} droppet`)

  // 6. Plan R2-upload (unike URI-er som faktisk er på disk)
  const uniqueUris = [...uriTilSti.keys()]
  console.log(`✓ ${uniqueUris.length} unike media-filer å potensielt laste opp`)

  // 7. DB-tilkobling for å sjekke eksisterende rader (også i DRY_RUN)
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

  let antNyeKlubbChat = 0
  let antEksisterendeKlubbChat = 0
  let antNyeReaksjoner = 0
  let antEksisterendeReaksjoner = 0
  let antR2Lastet = 0
  let antR2Hoppet = 0

  try {
    // Sjekk hvilke kilde_ekstern_id-er som allerede finnes
    const alleIder = finalKandidater.map(k => k.kilde_ekstern_id)
    const eksisterendeRes = await client.query(
      'select id, kilde_ekstern_id from klubb_chat where kilde_ekstern_id = any($1::text[])',
      [alleIder],
    )
    const eksisterendeMap = new Map() // kilde_ekstern_id → id
    for (const r of eksisterendeRes.rows) eksisterendeMap.set(r.kilde_ekstern_id, r.id)
    antEksisterendeKlubbChat = eksisterendeMap.size
    antNyeKlubbChat = finalKandidater.length - antEksisterendeKlubbChat
    console.log(`  klubb_chat: ${antNyeKlubbChat} nye, ${antEksisterendeKlubbChat} finnes allerede`)

    // 8. R2-upload (kun for nye rader hvor media finnes)
    const uriBrukt = new Set()
    for (const k of finalKandidater) {
      if (eksisterendeMap.has(k.kilde_ekstern_id)) continue
      const uri = k.bilde_uri ?? k.video_uri
      if (!uri) continue
      uriBrukt.add(uri)
    }

    /** @type {Map<string, string>} */
    const uriTilPublicUrl = new Map()
    if (DRY_RUN) {
      // I dry-run: bare planlegg, ikke kall R2.
      for (const uri of uriBrukt) {
        const r2sti = r2PathFor(uri)
        uriTilPublicUrl.set(uri, `${R2_PUBLIC_URL || 'https://example/r2'}/${r2sti}`)
      }
      antR2Lastet = uriBrukt.size
    } else {
      if (!HAR_R2 && uriBrukt.size > 0) {
        throw new Error('R2-credentials mangler, men det finnes media å laste opp. Avbryter.')
      }
      let i = 0
      for (const uri of uriBrukt) {
        i++
        const fsSti = uriTilSti.get(uri)
        const r2sti = r2PathFor(uri)
        const data = await readFile(fsSti)
        if (data.byteLength > MAKS_FILSTORRELSE) {
          throw new Error(`Fil for stor (${data.byteLength} byte): ${fsSti}`)
        }
        const finnes = await r2HeadFinnes(r2sti)
        if (finnes) {
          antR2Hoppet++
        } else {
          const ct = ekstensjonTilContentType(fsSti)
          await r2Upload(r2sti, data, ct)
          antR2Lastet++
        }
        uriTilPublicUrl.set(uri, `${R2_PUBLIC_URL}/${r2sti}`)
        if (i % 5 === 0) console.log(`  R2: ${i}/${uriBrukt.size}…`)
      }
      console.log(`✓ R2: ${antR2Lastet} lastet opp, ${antR2Hoppet} fantes fra før`)
    }

    // 9. Bulk insert klubb_chat
    if (!DRY_RUN && antNyeKlubbChat > 0) {
      const nyeKandidater = finalKandidater.filter(k => !eksisterendeMap.has(k.kilde_ekstern_id))
      const BATCH = 100
      for (let i = 0; i < nyeKandidater.length; i += BATCH) {
        const batch = nyeKandidater.slice(i, i + BATCH)
        const verdier = []
        const params = []
        let p = 1
        for (const k of batch) {
          const bildeUrl = k.bilde_uri ? uriTilPublicUrl.get(k.bilde_uri) ?? null : null
          const videoUrl = k.video_uri ? uriTilPublicUrl.get(k.video_uri) ?? null : null
          // Trim innhold til 500 (DB-constraint). Loggadvarsel hvis trunkert.
          let innhold = k.innhold
          if (innhold && innhold.length > 500) {
            advarsler.push(`Innhold > 500 tegn for ${k.kilde_ekstern_id} — trunkerer`)
            innhold = innhold.slice(0, 500)
          }
          verdier.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, true)`)
          params.push(k.profil_id, innhold, bildeUrl, videoUrl, k.opprettet, k.kilde_ekstern_id)
        }
        const sql = `
          insert into klubb_chat (profil_id, innhold, bilde_url, video_url, opprettet, kilde_ekstern_id, fra_facebook)
          values ${verdier.join(', ')}
          on conflict (kilde_ekstern_id) do nothing
          returning id, kilde_ekstern_id
        `
        const res = await client.query(sql, params)
        for (const r of res.rows) eksisterendeMap.set(r.kilde_ekstern_id, r.id)
      }
      console.log(`✓ Insertet ${antNyeKlubbChat} klubb_chat-rader`)
    }

    // 10. Bygg reaksjons-rader
    /** @type {Array<{melding_id: string, profil_id: string, emoji: string, opprettet: string}>} */
    const reaksjonsRader = []
    for (const k of finalKandidater) {
      if (k.reactions.length === 0) continue
      const meldingId = eksisterendeMap.get(k.kilde_ekstern_id)
      if (!meldingId) {
        // I DRY_RUN finnes ikke nye id-er ennå — kan ikke planlegge eksisterende-sjekk
        // for disse, men vi kan likevel telle dem som "planlagt".
        if (!DRY_RUN) {
          advarsler.push(`Mangler melding_id for reaksjon på ${k.kilde_ekstern_id}`)
          continue
        }
      }
      // Tidsstempel: meldingens opprettet, sett seconds=0/ms=0, +60s
      const dt = new Date(k.opprettet)
      dt.setSeconds(0, 0)
      const reakOpprettet = new Date(dt.getTime() + 60_000).toISOString()
      for (const r of k.reactions) {
        if (!r.profil_id) {
          advarsler.push(`Reaksjon med ukjent aktør "${r.aktor_navn}" på ${k.kilde_ekstern_id}`)
          continue
        }
        reaksjonsRader.push({
          melding_id: meldingId ?? '00000000-0000-0000-0000-000000000000', // placeholder kun i DRY_RUN
          profil_id: r.profil_id,
          emoji: r.emoji,
          opprettet: reakOpprettet,
        })
      }
    }
    console.log(`  reaksjons-rader bygget: ${reaksjonsRader.length}`)

    // 11. Sjekk eksisterende reaksjoner
    if (DRY_RUN) {
      antNyeReaksjoner = reaksjonsRader.length
      antEksisterendeReaksjoner = 0
    } else if (reaksjonsRader.length > 0) {
      // Hent alle eksisterende reaksjoner for de aktuelle melding-id-ene
      const meldingIds = [...new Set(reaksjonsRader.map(r => r.melding_id))]
      const eksRes = await client.query(
        'select melding_id, profil_id, emoji from chat_reaksjoner where melding_id = any($1::uuid[])',
        [meldingIds],
      )
      const eksSet = new Set(eksRes.rows.map(r => `${r.melding_id}|${r.profil_id}|${r.emoji}`))
      const nyeReaksjoner = reaksjonsRader.filter(r =>
        !eksSet.has(`${r.melding_id}|${r.profil_id}|${r.emoji}`),
      )
      antEksisterendeReaksjoner = reaksjonsRader.length - nyeReaksjoner.length

      // Bulk insert
      const BATCH = 100
      for (let i = 0; i < nyeReaksjoner.length; i += BATCH) {
        const batch = nyeReaksjoner.slice(i, i + BATCH)
        const verdier = []
        const params = []
        let p = 1
        for (const r of batch) {
          verdier.push(`($${p++}, $${p++}, $${p++}, $${p++})`)
          params.push(r.melding_id, r.profil_id, r.emoji, r.opprettet)
        }
        const sql = `
          insert into chat_reaksjoner (melding_id, profil_id, emoji, opprettet)
          values ${verdier.join(', ')}
          on conflict (melding_id, profil_id, emoji) do nothing
        `
        await client.query(sql, params)
      }
      antNyeReaksjoner = nyeReaksjoner.length
      console.log(`✓ chat_reaksjoner: ${antNyeReaksjoner} nye, ${antEksisterendeReaksjoner} fantes fra før`)
    }
  } finally {
    await client.end()
  }

  // 12. Skriv rapport
  const rapport = {
    modus: DRY_RUN ? 'DRY_RUN' : 'IMPORT',
    tidspunkt: new Date().toISOString(),
    kilde: chatFil,
    totaler: {
      meldinger_totalt: data.messages.length,
      hoppet_over_unsent: antUnsent,
      hoppet_over_system: antSystem,
      hoppet_over_ukjent_avsender: antManglerAvsender,
      kandidat_rader: kandidater.length,
      rader_droppet_pga_manglende_media_og_innhold: antRaderDroppet,
      rader_til_db: finalKandidater.length,
      klubb_chat_nye: antNyeKlubbChat,
      klubb_chat_eksisterer: antEksisterendeKlubbChat,
      chat_reaksjoner_nye: antNyeReaksjoner,
      chat_reaksjoner_eksisterer: antEksisterendeReaksjoner,
      media_unike_uri: uniqueUris.length,
      media_manglende_uri: manglendeUriEr.size,
      r2_lastet_opp: antR2Lastet,
      r2_hoppet_over: antR2Hoppet,
    },
    advarsler,
  }
  await writeFile(RAPPORT_FIL, JSON.stringify(rapport, null, 2) + '\n', 'utf8')
  console.log(`\n✓ Rapport: ${RAPPORT_FIL}`)

  console.log('\n=== Oppsummering ===')
  for (const [k, v] of Object.entries(rapport.totaler)) {
    console.log(`  ${k}: ${v}`)
  }
  if (advarsler.length > 0) {
    console.log(`\n${advarsler.length} advarsler — se rapport-fil`)
  }
}

kjor().catch(err => {
  console.error('Feil:', err)
  process.exit(1)
})
