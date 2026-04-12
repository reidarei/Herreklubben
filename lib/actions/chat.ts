'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { sendEpost, arrangementEpostHtml } from '@/lib/epost'

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
  // Finn alle @mentions i teksten
  const mentionPattern = /@([\wæøåÆØÅ][\w æøåÆØÅ-]*)/g
  const mentions = [...tekst.matchAll(mentionPattern)].map(m => m[1].trim().toLowerCase())
  if (mentions.length === 0) return

  const admin = createAdminClient()

  // Hent alle aktive profiler
  const { data: profiler } = await admin
    .from('profiles')
    .select('id, navn, visningsnavn, epost')
    .eq('aktiv', true)

  if (!profiler) return

  // Match mentions mot navn eller visningsnavn (case-insensitive)
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

  // Hent avsendernavn
  const avsender = profiler.find(p => p.id === avsenderId)
  const avsenderNavn = avsender?.visningsnavn ?? avsender?.navn ?? 'Noen'

  // Hent arrangement-tittel
  const { data: arr } = await admin
    .from('arrangementer')
    .select('tittel')
    .eq('id', arrangementId)
    .single()

  const tittel = arr?.tittel ?? 'et arrangement'
  const url = `${BASE_URL}/arrangementer/${arrangementId}`
  const melding = `${avsenderNavn}: ${tekst.length > 80 ? tekst.slice(0, 77) + '...' : tekst}`

  // Send push
  const profilIder = nevnte.map(p => p.id)
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('profil_id, endpoint, p256dh, auth')
    .in('profil_id', profilIder)

  if (subs) {
    await Promise.all(subs.map(s =>
      sendPush(s, { tittel: `Chat: ${tittel}`, melding, url })
    ))
  }

  // Send epost til de uten push
  const subIds = new Set((subs ?? []).map(s => s.profil_id))
  const utenPush = nevnte.filter(p => !subIds.has(p.id) && p.epost)
  if (utenPush.length > 0) {
    const html = arrangementEpostHtml({
      tittel: `Nevnt i chat: ${tittel}`,
      tekst: melding,
      url,
      knappTekst: 'Åpne chatten',
    })
    await Promise.all(
      utenPush.map(p => sendEpost({ til: p.epost!, emne: `${avsenderNavn} nevnte deg i chatten`, html }))
    )
  }
}

export async function slettMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('arrangement_chat')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}
