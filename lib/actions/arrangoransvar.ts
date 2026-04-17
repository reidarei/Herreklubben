'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function sjekkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')
  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')
  return supabase
}

// Slå opp purre_maaned fra arrangementmaler og beregn purredato for gitt år
async function hentPurredato(arrangementNavn: string, aar: number): Promise<string | null> {
  const admin = createAdminClient()
  const { data: mal } = await admin
    .from('arrangementmaler')
    .select('purre_maaned')
    .eq('navn', arrangementNavn)
    .maybeSingle()
  if (!mal?.purre_maaned) return null
  const mm = String(mal.purre_maaned).padStart(2, '0')
  return `${aar}-${mm}-01`
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

// Beholdt for bakoverkompatibilitet med opprettArrangement-kobling
export async function lagreAnsvarlig(data: {
  id?: string
  aar: number
  arrangement_navn: string
  ansvarlig_id: string | null
}) {
  const supabase = await sjekkAdmin()

  if (data.id) {
    const { error } = await supabase
      .from('arrangoransvar')
      .update({ ansvarlig_id: data.ansvarlig_id, oppdatert: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('arrangoransvar')
      .insert({ aar: data.aar, arrangement_navn: data.arrangement_navn, ansvarlig_id: data.ansvarlig_id })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/arrangoransvar')
}
