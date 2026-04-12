import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { sendEpost, arrangementEpostHtml } from '@/lib/epost'
import { formaterDato as fd } from '@/lib/dato'

function formaterDato(iso: string): string {
  return fd(iso, "d. MMMM 'kl.' HH:mm")
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

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

// Hent alle push-subscriptions for en liste med profil-IDer
async function hentPushSubscriptions(profilIder: string[]) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('push_subscriptions')
    .select('profil_id, endpoint, p256dh, auth')
    .in('profil_id', profilIder)
  return data ?? []
}

// Send push + epost til alle aktive medlemmer
async function sendTilAlle({
  pushPayload,
  epostEmne,
  epostTekst,
  arrangementId,
}: {
  pushPayload: { tittel: string; melding: string }
  epostEmne: string
  epostTekst: string
  arrangementId: string
}) {
  const testEpost = await hentTestModus()
  const profiler = await hentProfiler()
  const profilIder = profiler.map(p => p.id)
  const subs = await hentPushSubscriptions(profilIder)

  const url = `${BASE_URL}/arrangementer/${arrangementId}`

  // Send push til alle med aktiv subscription
  await Promise.all(subs.map(s => sendPush(s, { ...pushPayload, url })))

  // Send epost: i test-modus til alle (også de med push), ellers kun de uten push
  const subProfilIder = new Set(subs.map(s => s.profil_id))
  const utenPush = testEpost
    ? profiler
    : profiler.filter(p => !subProfilIder.has(p.id))
  const html = arrangementEpostHtml({
    tittel: epostEmne,
    tekst: epostTekst,
    url,
    knappTekst: 'Se arrangementet',
  })
  await Promise.all(
    utenPush.filter(p => p.epost).map(p => sendEpost({ til: p.epost, emne: epostEmne, html }))
  )
}

// Arrangement oppdatert — sendes til alle umiddelbart, ingen duplikatsjekk
export async function sendOppdatertVarsler({
  arrangementId,
  tittel,
  startTidspunkt,
}: {
  arrangementId: string
  tittel: string
  startTidspunkt: string
}) {
  const dato = formaterDato(startTidspunkt)
  await sendTilAlle({
    pushPayload: { tittel: 'Arrangement oppdatert', melding: `${tittel} — ${dato}` },
    epostEmne: `Oppdatert: ${tittel}`,
    epostTekst: `Arrangementet <strong>${tittel}</strong> (${dato}) er oppdatert. Sjekk detaljene i appen.`,
    arrangementId,
  })
}

// Nytt arrangement opprettet
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

  const dato = formaterDato(startTidspunkt)
  await sendTilAlle({
    pushPayload: { tittel: 'Nytt arrangement', melding: `${tittel} — ${dato}` },
    epostEmne: `Nytt arrangement: ${tittel}`,
    epostTekst: `Det er satt opp et nytt arrangement: <strong>${tittel}</strong><br>${dato}`,
    arrangementId,
  })

  const supabase = createAdminClient()
  await supabase.from('varsler_logg').insert({ arrangement_id: arrangementId, type: 'nytt' })
}

// Påminnelse (7 dager eller 1 dag før)
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

  const supabase = createAdminClient()
  const dager = type === 'paaminne_7' ? 7 : 1

  // Sjekk om allerede sendt
  const { data: logg } = await supabase
    .from('varsler_logg')
    .select('id')
    .eq('arrangement_id', arrangementId)
    .eq('type', type)
    .maybeSingle()
  if (logg) return

  const dato = formaterDato(startTidspunkt)
  const melding = dager === 7
    ? `${tittel} er om 7 dager — ${dato}`
    : `${tittel} er i morgen — ${dato}`

  await sendTilAlle({
    pushPayload: { tittel: `Påminnelse: ${tittel}`, melding },
    epostEmne: `Påminnelse: ${tittel}`,
    epostTekst: melding,
    arrangementId,
  })

  await supabase.from('varsler_logg').insert({ arrangement_id: arrangementId, type })
}

// Purring — send kun til de som ikke har svart
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

  // Sjekk om allerede sendt
  const { data: logg } = await supabase
    .from('varsler_logg')
    .select('id')
    .eq('arrangement_id', arrangementId)
    .eq('type', 'purring')
    .maybeSingle()
  if (logg) return

  // Finn hvem som IKKE har svart
  const { data: paameldinger } = await supabase
    .from('paameldinger')
    .select('profil_id')
    .eq('arrangement_id', arrangementId)

  const harSvart = new Set((paameldinger ?? []).map(p => p.profil_id))

  const profiler = await hentProfiler()
  const utenSvar = profiler.filter(p => !harSvart.has(p.id))
  if (utenSvar.length === 0) return

  const dato = formaterDato(startTidspunkt)
  const profilIder = utenSvar.map(p => p.id)
  const subs = await hentPushSubscriptions(profilIder)
  const url = `${BASE_URL}/arrangementer/${arrangementId}`
  const melding = `${tittel} — ${dato}. Du har ikke svart enda.`

  await Promise.all(subs.map(s => sendPush(s, { tittel: 'Husk å svare!', melding, url })))

  const subProfilIder = new Set(subs.map(s => s.profil_id))
  const utenPush = utenSvar.filter(p => !subProfilIder.has(p.id))
  const html = arrangementEpostHtml({
    tittel: `Husk å svare: ${tittel}`,
    tekst: melding,
    url,
    knappTekst: 'Svar nå',
  })
  await Promise.all(
    utenPush.filter(p => p.epost).map(p => sendEpost({ til: p.epost, emne: `Husk å svare: ${tittel}`, html }))
  )

  await supabase.from('varsler_logg').insert({ arrangement_id: arrangementId, type: 'purring' })
}
