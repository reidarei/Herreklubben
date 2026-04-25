'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendVarsel } from '@/lib/varsler'
import { redirect } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

const MIN_TEGN = 1
const MAX_TEGN = 2000

/**
 * Finn eller opprett samtalen mellom innlogget bruker og motpart.
 * Idempotent — bruker unique-constraint på (profil_a, profil_b) der
 * a < b. Returnerer samtaleId eller redirecter til samtalesiden.
 */
export async function aapneSamtale(motpartId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')
  if (motpartId === user.id) throw new Error('Kan ikke åpne samtale med deg selv')

  // Sorter ID-ene så constraint-en (profil_a < profil_b) holder uavhengig
  // av hvem som starter samtalen. Bruker streng-sammenligning siden uuid
  // er strenger i app-laget.
  const [a, b] = user.id < motpartId ? [user.id, motpartId] : [motpartId, user.id]

  // Forsøk å hente eksisterende
  const { data: eksisterende } = await supabase
    .from('samtale')
    .select('id')
    .eq('profil_a', a)
    .eq('profil_b', b)
    .maybeSingle()

  if (eksisterende) {
    redirect(`/samtaler/${eksisterende.id}`)
  }

  // Opprett ny
  const { data: ny, error } = await supabase
    .from('samtale')
    .insert({ profil_a: a, profil_b: b })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  if (!ny) throw new Error('Klarte ikke å opprette samtale')

  redirect(`/samtaler/${ny.id}`)
}

export async function sendPrivatMelding(samtaleId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < MIN_TEGN || tekst.length > MAX_TEGN) {
    throw new Error(`Meldingen må være ${MIN_TEGN}–${MAX_TEGN} tegn`)
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  // RLS sørger for at vi kun kan poste i samtaler vi deltar i
  const { error } = await supabase
    .from('samtale_chat')
    .insert({ samtale_id: samtaleId, profil_id: user.id, innhold: tekst })

  if (error) throw new Error(error.message)

  // Varsle motparten i bakgrunnen — sentral sendVarsel håndterer
  // brukerpreferanser, dedup-policy og logging.
  sendPrivatMeldingVarsel(samtaleId, tekst, user.id).catch(console.error)
}

async function sendPrivatMeldingVarsel(samtaleId: string, tekst: string, avsenderId: string) {
  const supabase = await createServerClient()

  const { data: samtale } = await supabase
    .from('samtale')
    .select('profil_a, profil_b')
    .eq('id', samtaleId)
    .single()

  if (!samtale) return

  const motpartId = samtale.profil_a === avsenderId ? samtale.profil_b : samtale.profil_a

  const { data: avsender } = await supabase
    .from('profiles')
    .select('navn, visningsnavn')
    .eq('id', avsenderId)
    .single()

  const avsenderNavn = avsender?.visningsnavn ?? avsender?.navn ?? 'Noen'
  const utdrag = tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst

  // Hver privatmelding er sin egen — tillatDuplikat: true så samme avsender
  // kan sende flere meldinger uten at de filtreres bort i dedup-laget.
  await sendVarsel({
    mottakere: [motpartId],
    tittel: `${avsenderNavn} skrev`,
    melding: utdrag,
    url: `${BASE_URL}/samtaler/${samtaleId}`,
    knappTekst: 'Åpne samtalen',
    type: 'privat-melding',
    tillatDuplikat: true,
  })
}

/**
 * Marker alle innkomne meldinger i samtalen som lest. Kalles fra
 * samtalesiden ved load. RLS sørger for at man kun kan oppdatere
 * andres meldinger (mottatte) — ikke egne.
 */
export async function markerSamtaleLest(samtaleId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('samtale_chat')
    .update({ lest: true })
    .eq('samtale_id', samtaleId)
    .neq('profil_id', user.id)
    .eq('lest', false)
}

export async function oppdaterPrivatMelding(meldingId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < MIN_TEGN || tekst.length > MAX_TEGN) {
    throw new Error(`Meldingen må være ${MIN_TEGN}–${MAX_TEGN} tegn`)
  }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('samtale_chat')
    .update({ innhold: tekst })
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

export async function slettPrivatMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('samtale_chat')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}
