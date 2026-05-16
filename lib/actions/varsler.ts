'use server'

import { revalidatePath } from 'next/cache'
import { ensureInnlogget } from '@/lib/auth'

/**
 * Marker alle uleste varsler for innlogget bruker som lest.
 * RLS sørger for at vi kun rører egne rader.
 */
export async function markerAlleVarslerLest() {
  const { supabase, user } = await ensureInnlogget()

  const { error } = await supabase
    .from('varsel_logg')
    .update({ lest: true })
    .eq('profil_id', user.id)
    .eq('lest', false)

  if (error) throw new Error(error.message)
  revalidatePath('/profil')
}
