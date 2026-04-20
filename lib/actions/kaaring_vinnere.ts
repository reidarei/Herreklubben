'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { kanAdministrere } from '@/lib/roller'

async function sjekkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')
  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (!kanAdministrere(profil?.rolle)) throw new Error('Ikke admin')
}

interface VinnerData {
  profil_id?: string
  arrangement_id?: string
  begrunnelse?: string
}

export async function settVinnerPaaKaaring(malId: string, aar: number, vinner: VinnerData) {
  await sjekkAdmin()
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const admin = createAdminClient()

  // Check if vinner already exists for this mal_id and aar
  const { data: eksisterende } = await admin
    .from('kaaring_vinnere')
    .select('id')
    .eq('mal_id', malId)
    .eq('aar', aar)
    .single()

  if (eksisterende) {
    // Update existing
    const { error } = await admin
      .from('kaaring_vinnere')
      .update({
        profil_id: vinner.profil_id || null,
        arrangement_id: vinner.arrangement_id || null,
        begrunnelse: vinner.begrunnelse || null,
        oppdatert: new Date().toISOString()
      })
      .eq('mal_id', malId)
      .eq('aar', aar)
    if (error) throw new Error(error.message)
  } else {
    // Create new
    const { error } = await admin
      .from('kaaring_vinnere')
      .insert({
        mal_id: malId,
        aar,
        profil_id: vinner.profil_id || null,
        arrangement_id: vinner.arrangement_id || null,
        begrunnelse: vinner.begrunnelse || null,
        opprettet_av: user.id
      })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/kaaringer')
  revalidatePath('/innstillinger')
}

export async function fjernVinnerFraKaaring(malId: string, aar: number) {
  await sjekkAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('kaaring_vinnere')
    .delete()
    .eq('mal_id', malId)
    .eq('aar', aar)

  if (error) throw new Error(error.message)
  revalidatePath('/kaaringer')
  revalidatePath('/innstillinger')
}
