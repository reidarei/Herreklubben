'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendVarsel } from '@/lib/varsler'
import { redirect } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

// Tegnegrenser for innlegg. Korte nok til å holde feeden lesbar, lange
// nok til å si litt mer enn en tweet. DB håndhever også via check-constraint.
const MIN_TEGN = 1
const MAX_TEGN = 2000

export async function opprettMelding(innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < MIN_TEGN || tekst.length > MAX_TEGN) {
    throw new Error(`Innholdet må være ${MIN_TEGN}–${MAX_TEGN} tegn`)
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data, error } = await supabase
    .from('meldinger')
    .insert({ profil_id: user.id, innhold: tekst })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Klarte ikke å opprette innlegget')

  // Varsle alle aktive (utenom forfatter) om nytt innlegg. Dette er en
  // klubbnyhet — ikke @-mention. type: 'melding-ny' for å holde dedup ren.
  const avsender = await supabase
    .from('profiles')
    .select('navn, visningsnavn')
    .eq('id', user.id)
    .single()

  const avsenderNavn = avsender.data?.visningsnavn ?? avsender.data?.navn ?? 'Noen'
  const utdrag = tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst

  sendVarsel({
    tittel: `${avsenderNavn} skrev`,
    melding: utdrag,
    url: `${BASE_URL}/meldinger/${data.id}`,
    knappTekst: 'Åpne innlegget',
    type: 'melding-ny',
  }).catch(console.error)

  redirect('/')
}

export async function slettMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('meldinger')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

export async function oppdaterMeldingPost(meldingId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < MIN_TEGN || tekst.length > MAX_TEGN) {
    throw new Error(`Innholdet må være ${MIN_TEGN}–${MAX_TEGN} tegn`)
  }
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('meldinger')
    .update({ innhold: tekst })
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

// Reaksjoner på selve innlegget. Egen tabell `melding_reaksjon` for å
// holde dem adskilt fra chat_reaksjoner som er på kommentar-nivå.
export async function leggTilMeldingReaksjon(meldingId: string, emoji: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('melding_reaksjon')
    .upsert(
      { melding_id: meldingId, profil_id: user.id, emoji },
      { onConflict: 'melding_id,profil_id,emoji', ignoreDuplicates: true },
    )

  if (error) throw new Error(error.message)
}

export async function fjernMeldingReaksjon(meldingId: string, emoji: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('melding_reaksjon')
    .delete()
    .eq('melding_id', meldingId)
    .eq('profil_id', user.id)
    .eq('emoji', emoji)

  if (error) throw new Error(error.message)
}
