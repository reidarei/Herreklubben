'use server'

import { createServerClient } from '@/lib/supabase/server'
import { ensureInnlogget } from '@/lib/auth'
import { sendVarsel } from '@/lib/varsler'
import { redirect } from 'next/navigation'
import { BASE_URL } from '@/lib/config'
import { INNLEGG_MAKS_LENGDE, INNLEGG_MIN_LENGDE, MELDING_MAKS_BILDER } from '@/lib/konstanter'

export async function opprettMelding(input: { innhold: string; bilde_urls?: string[] }) {
  const tekst = input.innhold.trim()
  const bilder = (input.bilde_urls ?? []).slice(0, MELDING_MAKS_BILDER)

  // Minst enten tekst eller ett bilde kreves — tom melding er ikke nyttig.
  if (bilder.length === 0 && (tekst.length < INNLEGG_MIN_LENGDE || tekst.length > INNLEGG_MAKS_LENGDE)) {
    throw new Error(`Innholdet må være ${INNLEGG_MIN_LENGDE}–${INNLEGG_MAKS_LENGDE} tegn`)
  }
  if (bilder.length > 0 && tekst.length > INNLEGG_MAKS_LENGDE) {
    throw new Error(`Innholdet kan maks være ${INNLEGG_MAKS_LENGDE} tegn`)
  }

  const { supabase, user } = await ensureInnlogget()

  const { data, error } = await supabase
    .from('meldinger')
    .insert({
      profil_id: user.id,
      // Null-innhold er OK når bildet bærer innlegget
      innhold: tekst || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Klarte ikke å opprette innlegget')

  // Sett inn bilder i melding_bilder. Hvis dette feiler, slett meldingen
  // slik at vi ikke etterlater en tom rad i feeden (best-effort cleanup).
  if (bilder.length > 0) {
    const bildeRader = bilder.map((url, i) => ({
      melding_id: data.id,
      bilde_url: url,
      rekkefoelge: i,
    }))
    const { error: bildeErr } = await supabase
      .from('melding_bilder')
      .insert(bildeRader)

    if (bildeErr) {
      // Compensating delete — vi vil ikke ha en tom melding uten bilder
      await supabase.from('meldinger').delete().eq('id', data.id)
      throw new Error(`Bildeopplasting feilet: ${bildeErr.message}`)
    }
  }

  // Varsle alle aktive (utenom forfatter) om nytt innlegg.
  const avsender = await supabase
    .from('profiles')
    .select('navn, visningsnavn')
    .eq('id', user.id)
    .single()

  const avsenderNavn = avsender.data?.visningsnavn ?? avsender.data?.navn ?? 'Noen'
  // Hvis meldingen kun er bilder vises et standardutdrag i stedet for tekst
  const utdrag = tekst
    ? (tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst)
    : '[delte bilde]'

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

// Slett ett bilde fra en melding. RLS på melding_bilder kontrollerer hvem
// som får lov (eier via meldinger FK eller admin, og ikke FB-importert —
// se mig. 085). R2-objektet orphanes — dette er bevisst akseptert for
// enkelhetens skyld. Issue #174.
export async function slettMeldingBilde(bildeId: string) {
  const { supabase } = await ensureInnlogget()
  const { error } = await supabase
    .from('melding_bilder')
    .delete()
    .eq('id', bildeId)

  if (error) throw new Error(error.message)
}

export async function oppdaterMeldingPost(meldingId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < INNLEGG_MIN_LENGDE || tekst.length > INNLEGG_MAKS_LENGDE) {
    throw new Error(`Innholdet må være ${INNLEGG_MIN_LENGDE}–${INNLEGG_MAKS_LENGDE} tegn`)
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
