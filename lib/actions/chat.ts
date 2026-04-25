'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVarsel } from '@/lib/varsler'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

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

  // Send varsler til @-nevnte profiler (i bakgrunnen, ikke blokker chat)
  sendMentionVarsler(arrangementId, tekst, user.id).catch(console.error)
}

async function sendMentionVarsler(arrangementId: string, tekst: string, avsenderId: string) {
  const mentionPattern = /@([\wæøåÆØÅ][\w æøåÆØÅ-]*)/g
  const mentions = [...tekst.matchAll(mentionPattern)].map(m => m[1].trim().toLowerCase())
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
        return mentions.some(m =>
          p.navn?.toLowerCase().includes(m) ||
          p.visningsnavn?.toLowerCase().includes(m)
        )
      })

  if (nevnte.length === 0) return

  const avsender = profiler.find(p => p.id === avsenderId)
  const avsenderNavn = avsender?.visningsnavn ?? avsender?.navn ?? 'Noen'

  const { data: arr } = await admin
    .from('arrangementer')
    .select('tittel')
    .eq('id', arrangementId)
    .single()

  const arrTittel = arr?.tittel ?? 'et arrangement'

  await sendVarsel({
    mottakere: nevnte.map(p => p.id),
    tittel: `Chat: ${arrTittel}`,
    melding: `${avsenderNavn}: ${tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst}`,
    url: `${BASE_URL}/arrangementer/${arrangementId}`,
    knappTekst: 'Åpne chatten',
    type: 'mention',
    tillatDuplikat: true,
  })
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

  sendKlubbMentionVarsler(tekst, user.id).catch(console.error)
}

async function sendKlubbMentionVarsler(tekst: string, avsenderId: string) {
  const mentionPattern = /@([\wæøåÆØÅ][\w æøåÆØÅ-]*)/g
  const mentions = [...tekst.matchAll(mentionPattern)].map(m => m[1].trim().toLowerCase())
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
        return mentions.some(m =>
          p.navn?.toLowerCase().includes(m) ||
          p.visningsnavn?.toLowerCase().includes(m)
        )
      })

  if (nevnte.length === 0) return

  const avsender = profiler.find(p => p.id === avsenderId)
  const avsenderNavn = avsender?.visningsnavn ?? avsender?.navn ?? 'Noen'

  await sendVarsel({
    mottakere: nevnte.map(p => p.id),
    tittel: 'Klubbchat',
    melding: `${avsenderNavn}: ${tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst}`,
    url: `${BASE_URL}/chat`,
    knappTekst: 'Åpne chatten',
    type: 'mention',
    tillatDuplikat: true,
  })
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

  sendPollMentionVarsler(pollId, tekst, user.id).catch(console.error)
}

async function sendPollMentionVarsler(pollId: string, tekst: string, avsenderId: string) {
  const mentionPattern = /@([\wæøåÆØÅ][\w æøåÆØÅ-]*)/g
  const mentions = [...tekst.matchAll(mentionPattern)].map(m => m[1].trim().toLowerCase())
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
        return mentions.some(m =>
          p.navn?.toLowerCase().includes(m) ||
          p.visningsnavn?.toLowerCase().includes(m)
        )
      })

  if (nevnte.length === 0) return

  const avsender = profiler.find(p => p.id === avsenderId)
  const avsenderNavn = avsender?.visningsnavn ?? avsender?.navn ?? 'Noen'

  const { data: poll } = await admin
    .from('poll')
    .select('spoersmaal')
    .eq('id', pollId)
    .single()

  const pollTittel = poll?.spoersmaal ?? 'en avstemming'

  await sendVarsel({
    mottakere: nevnte.map(p => p.id),
    tittel: `Kommentar: ${pollTittel}`,
    melding: `${avsenderNavn}: ${tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst}`,
    url: `${BASE_URL}/poll/${pollId}`,
    knappTekst: 'Åpne avstemmingen',
    type: 'mention',
    tillatDuplikat: true,
  })
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

  sendMeldingMentionVarsler(meldingId, tekst, user.id).catch(console.error)
}

async function sendMeldingMentionVarsler(meldingId: string, tekst: string, avsenderId: string) {
  const mentionPattern = /@([\wæøåÆØÅ][\w æøåÆØÅ-]*)/g
  const mentions = [...tekst.matchAll(mentionPattern)].map(m => m[1].trim().toLowerCase())
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
        return mentions.some(m =>
          p.navn?.toLowerCase().includes(m) ||
          p.visningsnavn?.toLowerCase().includes(m)
        )
      })

  if (nevnte.length === 0) return

  const avsender = profiler.find(p => p.id === avsenderId)
  const avsenderNavn = avsender?.visningsnavn ?? avsender?.navn ?? 'Noen'

  await sendVarsel({
    mottakere: nevnte.map(p => p.id),
    tittel: `Kommentar i innlegg`,
    melding: `${avsenderNavn}: ${tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst}`,
    url: `${BASE_URL}/meldinger/${meldingId}`,
    knappTekst: 'Åpne innlegget',
    type: 'mention',
    tillatDuplikat: true,
  })
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
