'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendVarsel } from '@/lib/varsler'
import { ensureAdmin, ensureInnlogget } from '@/lib/auth'

// Slå opp purredato fra arrangementmaler og sett riktig år
async function hentPurredato(arrangementNavn: string, aar: number): Promise<string | null> {
  const admin = createAdminClient()
  const { data: mal } = await admin
    .from('arrangementmaler')
    .select('purredato')
    .eq('navn', arrangementNavn)
    .maybeSingle()
  if (!mal?.purredato) return null
  // purredato lagres med år 2000, bytt til riktig år
  return `${aar}-${mal.purredato.slice(5)}`
}

export async function leggTilAnsvarlig(data: {
  aar: number
  arrangement_navn: string
  ansvarlig_id: string
}) {
  const { supabase } = await ensureAdmin()
  const purredato = await hentPurredato(data.arrangement_navn, data.aar)

  // Arv arrangement_id fra eventuell søsken-rad. Hvis noen andre allerede
  // har opprettet og koblet arrangementet for samme (aar, arrangement_navn),
  // skal den nye ansvarlige også regnes som oppfylt — ellers dukker den
  // opp som et eget «ikke arrangert»-utkast på agendaen.
  const { data: sosken } = await supabase
    .from('arrangoransvar')
    .select('arrangement_id')
    .eq('aar', data.aar)
    .eq('arrangement_navn', data.arrangement_navn)
    .not('arrangement_id', 'is', null)
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from('arrangoransvar')
    .insert({
      aar: data.aar,
      arrangement_navn: data.arrangement_navn,
      ansvarlig_id: data.ansvarlig_id,
      purredato,
      arrangement_id: sosken?.arrangement_id ?? null,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/arrangoransvar')
  revalidatePath('/')
}

export async function fjernAnsvarlig(ansvarId: string) {
  const { supabase } = await ensureAdmin()

  const { error } = await supabase
    .from('arrangoransvar')
    .delete()
    .eq('id', ansvarId)

  if (error) throw new Error(error.message)
  revalidatePath('/arrangoransvar')
}

// Purre ansvarlig — kalles av et vanlig medlem. Sender varsel via sendVarsel
// (som respekterer push_aktiv/epost_aktiv). Dedup unngår purre-spam.
export async function purreAnsvarlig(ansvarId: string) {
  const { user } = await ensureInnlogget()
  const admin = createAdminClient()
  const { data: ansvar } = await admin
    .from('arrangoransvar')
    .select('id, aar, arrangement_navn, ansvarlig_id, arrangement_id')
    .eq('id', ansvarId)
    .maybeSingle()

  if (!ansvar) throw new Error('Fant ikke ansvar')
  if (!ansvar.ansvarlig_id) throw new Error('Ingen ansvarlig å purre på')
  if (ansvar.arrangement_id) throw new Error('Arrangementet er allerede lagt inn')

  const { data: purrer } = await admin
    .from('profiles')
    .select('navn, visningsnavn')
    .eq('id', user.id)
    .single()

  const fraNavn = purrer?.visningsnavn || purrer?.navn || 'En gutt'

  await sendVarsel({
    mottakere: [ansvar.ansvarlig_id],
    tittel: `Purring: ${ansvar.arrangement_navn}`,
    melding: `${fraNavn} purrer deg på ${ansvar.arrangement_navn} ${ansvar.aar}. Få arrangementet inn i kalenderen.`,
    url: '/arrangoransvar',
    knappTekst: 'Åpne arrangøransvar',
    type: 'purring_ansvar',
    tillatDuplikat: true,
  })
}

