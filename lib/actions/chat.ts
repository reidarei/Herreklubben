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

export async function slettMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('arrangement_chat')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}
