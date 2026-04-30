'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendChatMentionVarsler } from '@/lib/varsler'

export async function sendMelding(arrangementId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('arrangement_chat')
    .insert({ arrangement_id: arrangementId, profil_id: user.id, innhold: tekst })

  if (error) throw new Error(error.message)

  // @-mention-varsler MÅ awaites — fire-and-forget kuttes av Vercel
  // når server action returnerer (CLAUDE.md: «Bruk aldri after()…
  // Bruk await direkte»). Promise.all internt gjør utsendingen
  // parallell, så latency er kort selv med mange mottakere.
  try {
    await sendChatMentionVarsler(
      { type: 'arrangement', id: arrangementId },
      tekst,
      user.id,
    )
  } catch (err) {
    console.error('mention-varsler feilet:', err)
  }
}

export async function oppdaterMelding(meldingId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('arrangement_chat')
    .update({ innhold: tekst })
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

export async function slettMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('arrangement_chat')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

// ---------- Klubb-chat ----------
// Felles kronologisk tråd for hele klubben. Samme mention-varsling
// som arrangement-chatten, men uten arrangement-referanse.

export async function sendKlubbMelding(innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('klubb_chat')
    .insert({ profil_id: user.id, innhold: tekst })

  if (error) throw new Error(error.message)

  try {
    await sendChatMentionVarsler({ type: 'klubb' }, tekst, user.id)
  } catch (err) {
    console.error('mention-varsler feilet:', err)
  }
}

export async function oppdaterKlubbMelding(meldingId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('klubb_chat')
    .update({ innhold: tekst })
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

export async function slettKlubbMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('klubb_chat')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

// ---------- Poll-chat ----------
// Kommentarer per poll. Speiler arrangement-chat med @mention-varsler.

export async function sendPollMelding(pollId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('poll_chat')
    .insert({ poll_id: pollId, profil_id: user.id, innhold: tekst })

  if (error) throw new Error(error.message)

  try {
    await sendChatMentionVarsler({ type: 'poll', id: pollId }, tekst, user.id)
  } catch (err) {
    console.error('mention-varsler feilet:', err)
  }
}

export async function oppdaterPollMelding(meldingId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('poll_chat')
    .update({ innhold: tekst })
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

export async function slettPollMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('poll_chat')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}

// === Kommentarer på meldinger (#90) =================================
// Speiler poll-varianten. melding_chat-tabellen har trigger som oppdaterer
// meldinger.sist_aktivitet — som driver agenda-sorteringen.

export async function sendMeldingKommentar(meldingId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('melding_chat')
    .insert({ melding_id: meldingId, profil_id: user.id, innhold: tekst })

  if (error) throw new Error(error.message)

  try {
    await sendChatMentionVarsler({ type: 'melding', id: meldingId }, tekst, user.id)
  } catch (err) {
    console.error('mention-varsler feilet:', err)
  }
}

export async function oppdaterMeldingKommentar(kommentarId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('melding_chat')
    .update({ innhold: tekst })
    .eq('id', kommentarId)

  if (error) throw new Error(error.message)
}

export async function slettMeldingKommentar(kommentarId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('melding_chat')
    .delete()
    .eq('id', kommentarId)

  if (error) throw new Error(error.message)
}

// Reaksjoner — samme flyt for arrangement-chat og klubb-chat. melding_id
// peker til id i enten arrangement_chat eller klubb_chat. RLS håndhever at
// brukeren kun kan legge til/fjerne egne reaksjoner.
export async function leggTilReaksjon(meldingId: string, emoji: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('chat_reaksjoner')
    .upsert(
      { melding_id: meldingId, profil_id: user.id, emoji },
      { onConflict: 'melding_id,profil_id,emoji' },
    )

  if (error) throw new Error(error.message)
}

export async function fjernReaksjon(meldingId: string, emoji: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('chat_reaksjoner')
    .delete()
    .eq('melding_id', meldingId)
    .eq('profil_id', user.id)
    .eq('emoji', emoji)

  if (error) throw new Error(error.message)
}
