import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { sendEpost, arrangementEpostHtml } from '@/lib/epost'
import { formaterDato, FORMAT_DATO_KLOKKE } from '@/lib/dato'

const formaterDatoKlokke = (iso: string) => formaterDato(iso, FORMAT_DATO_KLOKKE)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

// Sikkerhetsvakt: hvis BASE_URL peker til localhost, betyr det at vi kjører
// i dev og sannsynligvis mot prod-databasen. Push-varsler med lokal URL
// lander som ubrukelige lenker på ekte mobiler (bruker må restarte PWA
// for å komme videre). Refuser å sende push/epost i dette tilfellet
// med mindre utvikleren eksplisitt overstyrer med ALLOW_LOCAL_NOTIFICATIONS.
//
// Dette er en «belte og seler»-sjekk utover test_modus i varsel_innstillinger
// — fordi test_modus er admin-konfig som kan glemmes ved utvikling.
const ER_LOKAL_BASE =
  BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1')
const TILLAT_LOKAL = process.env.ALLOW_LOCAL_NOTIFICATIONS === 'true'
// Unit-tester må kunne verifisere send-logikken uten å slå på miljøflagget.
// Vitest setter VITEST=true automatisk.
const ER_UNIT_TEST = !!process.env.VITEST
const BLOKKER_UTSENDING = ER_LOKAL_BASE && !TILLAT_LOKAL && !ER_UNIT_TEST

// Mapping fra type (slik den lagres i varsel_logg) til noekkel
// (slik den ligger i varsel_innstillinger). Historisk har de fått
// litt forskjellige navn; mapping holder det fra å bli rotete.
function typeTilNoekkel(type: string): string {
  if (type === 'paaminne_7') return 'paaminnelse_7d'
  if (type === 'paaminne_1') return 'paaminnelse_1d'
  if (type === 'purring') return 'purring_aktiv'
  return type
}

// Sjekk om en varseltype er aktivert i admin-innstillinger
async function erVarselAktiv(noekkel: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('varsel_innstillinger')
    .select('aktiv')
    .eq('noekkel', noekkel)
    .maybeSingle()
  return data?.aktiv ?? true
}

// Eksportert variant for sendVarsel-flyten — bruker mapping og en
// snill default (true) hvis nøkkelen mangler.
async function erTypeAktiv(type: string): Promise<boolean> {
  return erVarselAktiv(typeTilNoekkel(type))
}

// Sjekk om test-modus er aktiv — returnerer test-epost eller null
async function hentTestModus(): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('varsel_innstillinger')
    .select('aktiv, beskrivelse')
    .eq('noekkel', 'test_modus')
    .maybeSingle()
  if (data?.aktiv && data.beskrivelse) return data.beskrivelse
  return null
}

// Hent alle aktive profiler (i test-modus: kun profilen med test-eposten)
async function hentProfiler() {
  const supabase = createAdminClient()
  const testEpost = await hentTestModus()

  const query = supabase.from('profiles').select('id, navn, epost').eq('aktiv', true)
  if (testEpost) query.eq('epost', testEpost)
  const { data } = await query
  return data ?? []
}

// Hent varselpreferanser for alle profiler
async function hentVarselPreferanser(profilIder: string[]) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('varsel_preferanser')
    .select('profil_id, push_aktiv, epost_aktiv')
    .in('profil_id', profilIder)
  const map = new Map<string, { push_aktiv: boolean; epost_aktiv: boolean }>()
  for (const p of data ?? []) map.set(p.profil_id, p)
  return map
}

// Hent alle push-subscriptions for en liste med profil-IDer
async function hentPushSubscriptions(profilIder: string[]) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('push_subscriptions')
    .select('profil_id, endpoint, p256dh, auth')
    .in('profil_id', profilIder)
  return data ?? []
}

// ─── SENTRAL VARSLINGSFUNKSJON ───────────────────────────────────────────────

export async function sendVarsel({
  mottakere,
  tittel,
  melding,
  url,
  knappTekst = 'Åpne i appen',
  type,
  arrangementId,
  tillatDuplikat = false,
}: {
  mottakere?: string[]
  tittel: string
  melding: string
  url?: string
  knappTekst?: string
  type: string
  arrangementId?: string
  tillatDuplikat?: boolean
}) {
  // Dev-guard: Blokker utsending fra lokal dev-server mot prod-DB.
  // Vi returnerer tidlig uten å skrive varsel_logg — det er bedre å ikke
  // forurense loggen med "late som"-rader. Logg til konsoll slik at
  // utvikleren ser hva som skjedde.
  if (BLOKKER_UTSENDING) {
    console.warn(
      `[varsler] BLOKKERT: BASE_URL='${BASE_URL}' ser lokal ut. ` +
      `Varselet '${tittel}' (type=${type}) ble IKKE sendt. ` +
      `Sett NEXT_PUBLIC_BASE_URL til prod-URL eller ALLOW_LOCAL_NOTIFICATIONS=true for å overstyre.`
    )
    return
  }

  // 0. Sjekk admin-kontrollpanelet — admin kan slå av en hel varseltype
  // sentralt. Manglende nøkkel teller som «aktiv» (default true).
  if (!(await erTypeAktiv(type))) {
    console.log(`[varsler] Type '${type}' er deaktivert i admin-innstillinger — varsel ikke sendt`)
    return
  }

  const supabase = createAdminClient()

  // 1. Dedup-sjekk
  if (!tillatDuplikat && arrangementId) {
    const { data: eksisterende } = await supabase
      .from('varsel_logg')
      .select('id')
      .eq('type', type)
      .eq('arrangement_id', arrangementId)
      .limit(1)
    if (eksisterende && eksisterende.length > 0) return
  }

  // 2. Testmodus
  const testEpost = await hentTestModus()

  // 3. Løs opp mottakere + dedupliser
  let profiler: { id: string; navn: string | null; epost: string | null }[]
  if (mottakere) {
    const unikeIder = [...new Set(mottakere)]
    const { data } = await supabase
      .from('profiles')
      .select('id, navn, epost')
      .in('id', unikeIder)
      .eq('aktiv', true)
    profiler = data ?? []
  } else {
    profiler = await hentProfiler()
  }

  // I testmodus: filtrer til kun testprofilen
  if (testEpost) {
    profiler = profiler.filter(p => p.epost === testEpost)
  }

  if (profiler.length === 0) return

  // 4. Hent preferanser + push-subscriptions
  const profilIder = profiler.map(p => p.id)
  const [subs, prefs] = await Promise.all([
    hentPushSubscriptions(profilIder),
    hentVarselPreferanser(profilIder),
  ])

  const subsByProfil = new Map<string, typeof subs>()
  for (const s of subs) {
    const arr = subsByProfil.get(s.profil_id) ?? []
    arr.push(s)
    subsByProfil.set(s.profil_id, arr)
  }

  // 5. For hver mottaker: bestem kanal, send, logg
  for (const profil of profiler) {
    const pref = prefs.get(profil.id)
    const pushAktiv = pref ? pref.push_aktiv : false
    const epostAktiv = pref ? pref.epost_aktiv : true
    const profilSubs = subsByProfil.get(profil.id) ?? []

    // Insert i varsel_logg først (for å få ID til URL)
    const kanPush = pushAktiv && profilSubs.length > 0
    const kanEpost = epostAktiv && !!profil.epost
    const kanal = kanPush && kanEpost ? 'begge' : kanPush ? 'push' : kanEpost ? 'epost' : null

    if (!kanal) continue // Ingen kanal aktiv

    const { data: loggRad } = await supabase
      .from('varsel_logg')
      .insert({
        profil_id: profil.id,
        tittel,
        melding,
        type,
        kanal,
        url: url ?? null,
        arrangement_id: arrangementId ?? null,
      })
      .select('id')
      .single()

    // URL: bruk oppgitt url, eller fall tilbake til varsel-detaljsiden
    const varselUrl = url ?? (loggRad ? `${BASE_URL}/varsler/${loggRad.id}` : BASE_URL)

    // Send push
    if (kanPush) {
      await Promise.all(profilSubs.map(s =>
        sendPush(s, { tittel, melding, url: varselUrl })
      ))
    }

    // Send epost
    if (kanEpost) {
      const html = arrangementEpostHtml({ tittel, tekst: melding, url: varselUrl, knappTekst })
      await sendEpost({ til: profil.epost!, emne: tittel, html })
    }
  }
}

// ─── WRAPPER-FUNKSJONER ─────────────────────────────────────────────────────

export async function sendNyttArrangementVarsler({
  arrangementId,
  tittel,
  startTidspunkt,
}: {
  arrangementId: string
  tittel: string
  startTidspunkt: string
}) {
  if (!(await erVarselAktiv('nytt_arrangement'))) return
  const dato = formaterDatoKlokke(startTidspunkt)
  await sendVarsel({
    tittel: 'Nytt arrangement',
    melding: `${tittel} — ${dato}`,
    url: `${BASE_URL}/arrangementer/${arrangementId}`,
    type: 'nytt_arrangement',
    arrangementId,
  })
}

export async function sendOppdatertVarsler({
  arrangementId,
  tittel,
  startTidspunkt,
}: {
  arrangementId: string
  tittel: string
  startTidspunkt: string
}) {
  const dato = formaterDatoKlokke(startTidspunkt)
  await sendVarsel({
    tittel: 'Arrangement oppdatert',
    melding: `${tittel} — ${dato}`,
    url: `${BASE_URL}/arrangementer/${arrangementId}`,
    type: 'oppdatert',
    arrangementId,
    tillatDuplikat: true,
  })
}

export async function sendPaaminneVarsler({
  arrangementId,
  tittel,
  startTidspunkt,
  type,
}: {
  arrangementId: string
  tittel: string
  startTidspunkt: string
  type: 'paaminne_7' | 'paaminne_1'
}) {
  const noekkel = type === 'paaminne_7' ? 'paaminnelse_7d' : 'paaminnelse_1d'
  if (!(await erVarselAktiv(noekkel))) return
  const dato = formaterDatoKlokke(startTidspunkt)
  const dager = type === 'paaminne_7' ? 7 : 1
  await sendVarsel({
    tittel: `Påminnelse: ${tittel}`,
    melding: dager === 7 ? `${tittel} er om 7 dager — ${dato}` : `${tittel} er i morgen — ${dato}`,
    url: `${BASE_URL}/arrangementer/${arrangementId}`,
    type,
    arrangementId,
  })
}

export async function sendArrangorPurringVarsler({
  ansvarligId,
  arrangementNavn,
  aar,
}: {
  ansvarligId: string
  arrangementNavn: string
  aar: number
}) {
  if (!(await erVarselAktiv('arrangor_purring'))) return
  await sendVarsel({
    mottakere: [ansvarligId],
    tittel: 'Husk arrangøransvaret ditt!',
    melding: `Du er ansvarlig for å arrangere ${arrangementNavn} i ${aar}. Fint om du legger inn arrangementet!`,
    url: `${BASE_URL}/arrangementer/nytt`,
    knappTekst: 'Opprett arrangement',
    type: 'arrangor_purring',
    tillatDuplikat: false,
  })
}

export async function sendNyPollVarsler({
  pollId,
  spoersmaal,
  svarfrist,
}: {
  pollId: string
  spoersmaal: string
  svarfrist: string
}) {
  if (!(await erVarselAktiv('ny_poll'))) return
  const frist = formaterDatoKlokke(svarfrist)
  await sendVarsel({
    tittel: 'Ny avstemming',
    melding: `${spoersmaal} — svarfrist ${frist}`,
    url: `${BASE_URL}/poll/${pollId}`,
    knappTekst: 'Stem nå',
    type: 'ny_poll',
    // Hver poll er unik — ingen dedup-behov. sendVarsel bruker arrangementId
    // for dedup, men vår pollId peker ikke dit. Sett tillatDuplikat for å
    // unngå at den uansett tolker vår context feil.
    tillatDuplikat: true,
  })
}

export async function sendPurringVarsler({
  arrangementId,
  tittel,
  startTidspunkt,
}: {
  arrangementId: string
  tittel: string
  startTidspunkt: string
}) {
  if (!(await erVarselAktiv('purring_aktiv'))) return

  const supabase = createAdminClient()

  const { data: paameldinger } = await supabase
    .from('paameldinger')
    .select('profil_id')
    .eq('arrangement_id', arrangementId)

  const harSvart = new Set((paameldinger ?? []).map(p => p.profil_id))

  const profiler = await hentProfiler()
  const utenSvar = profiler.filter(p => !harSvart.has(p.id))
  if (utenSvar.length === 0) return

  const dato = formaterDatoKlokke(startTidspunkt)
  await sendVarsel({
    mottakere: utenSvar.map(p => p.id),
    tittel: 'Husk å svare!',
    melding: `${tittel} — ${dato}. Du har ikke svart enda.`,
    url: `${BASE_URL}/arrangementer/${arrangementId}`,
    knappTekst: 'Svar nå',
    type: 'purring',
    arrangementId,
  })
}

// ─── @-MENTION I CHAT ───────────────────────────────────────────────────────
// Sentralisert mention-handler for alle chat-scopes. Tidligere lå det
// fire nesten-identiske kopier i lib/actions/chat.ts; en regex-bug
// (28. april 2026) traff alle fire steder fordi de var kopiert. Holdes
// her sammen med øvrig varsling for å forhindre repetisjon.

export type MentionScope =
  | { type: 'arrangement'; id: string }
  | { type: 'klubb' }
  | { type: 'poll'; id: string }
  | { type: 'melding'; id: string }

// Regex stopper ved space — `@alle andre` matches som `'alle'`, ikke
// `'alle andre'`. Flerords-navn håndteres fortsatt riktig fordi
// matching-funksjonen bruker `.includes()` på fullt profilnavn:
// `@Reidar` treffer «Reidar Eik Haavik», og `@Reidar Haavik` treffer
// også (etternavnet blir bare vanlig tekst i meldingen).
const MENTION_REGEX = /@([\wæøåÆØÅ-]+)/g

function utdrag(tekst: string, maks = 80): string {
  return tekst.length > maks ? tekst.slice(0, maks - 3) + '...' : tekst
}

async function hentScopeInnhold(
  scope: MentionScope,
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ tittel: string; url: string; knappTekst: string }> {
  if (scope.type === 'klubb') {
    return {
      tittel: 'Klubbchat',
      url: `${BASE_URL}/chat`,
      knappTekst: 'Åpne chatten',
    }
  }
  if (scope.type === 'arrangement') {
    const { data } = await admin
      .from('arrangementer')
      .select('tittel')
      .eq('id', scope.id)
      .single()
    return {
      tittel: `Chat: ${data?.tittel ?? 'et arrangement'}`,
      url: `${BASE_URL}/arrangementer/${scope.id}`,
      knappTekst: 'Åpne chatten',
    }
  }
  if (scope.type === 'poll') {
    const { data } = await admin
      .from('poll')
      .select('spoersmaal')
      .eq('id', scope.id)
      .single()
    return {
      tittel: `Kommentar: ${data?.spoersmaal ?? 'en avstemming'}`,
      url: `${BASE_URL}/poll/${scope.id}`,
      knappTekst: 'Åpne avstemmingen',
    }
  }
  // melding
  return {
    tittel: 'Kommentar i innlegg',
    url: `${BASE_URL}/meldinger/${scope.id}`,
    knappTekst: 'Åpne innlegget',
  }
}

export async function sendChatMentionVarsler(
  scope: MentionScope,
  tekst: string,
  avsenderId: string,
) {
  const mentions = [...tekst.matchAll(MENTION_REGEX)].map(m =>
    m[1].trim().toLowerCase(),
  )
  if (mentions.length === 0) return

  const admin = createAdminClient()

  const { data: profiler } = await admin
    .from('profiles')
    .select('id, navn, visningsnavn, epost')
    .eq('aktiv', true)
  if (!profiler) return

  const erAlle = mentions.includes('alle')
  const nevnte = erAlle
    ? profiler.filter(p => p.id !== avsenderId)
    : profiler.filter(p => {
        if (p.id === avsenderId) return false
        return mentions.some(
          m =>
            p.navn?.toLowerCase().includes(m) ||
            p.visningsnavn?.toLowerCase().includes(m),
        )
      })
  if (nevnte.length === 0) return

  const avsender = profiler.find(p => p.id === avsenderId)
  const avsenderNavn = avsender?.visningsnavn ?? avsender?.navn ?? 'Noen'

  const innhold = await hentScopeInnhold(scope, admin)

  await sendVarsel({
    mottakere: nevnte.map(p => p.id),
    tittel: innhold.tittel,
    melding: `${avsenderNavn}: ${utdrag(tekst)}`,
    url: innhold.url,
    knappTekst: innhold.knappTekst,
    type: 'mention',
    tillatDuplikat: true,
  })
}
