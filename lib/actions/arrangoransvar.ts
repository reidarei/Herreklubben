'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendVarsel } from '@/lib/varsler'
import { kanAdministrere } from '@/lib/roller'

async function sjekkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')
  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (!kanAdministrere(profil?.rolle)) throw new Error('Ikke admin')
  return supabase
}

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
  const supabase = await sjekkAdmin()
  const purredato = await hentPurredato(data.arrangement_navn, data.aar)

  const { error } = await supabase
    .from('arrangoransvar')
    .insert({
      aar: data.aar,
      arrangement_navn: data.arrangement_navn,
      ansvarlig_id: data.ansvarlig_id,
      purredato,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/arrangoransvar')
}

export async function fjernAnsvarlig(ansvarId: string) {
  const supabase = await sjekkAdmin()

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
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

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

