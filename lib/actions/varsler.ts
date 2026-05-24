'use server'

import { revalidatePath } from 'next/cache'
import { ensureInnlogget } from '@/lib/auth'

/**
 * Marker alle uleste varsler for innlogget bruker som lest.
 * RLS sørger for at vi kun rører egne rader.
 *
 * Revaliderer med 'layout' fordi ulest-prikken på profil-avataren rendres
 * fra (app)/layout.tsx (TopHeader). Uten 'layout' ville bare page-nivået
 * revaliderts — TopHeader beholdt cached `ulestVarsler=true` og brukeren
 * måtte pull-down for å oppdatere prikken. Se #218.
 */
export async function markerAlleVarslerLest() {
  const { supabase, user } = await ensureInnlogget()

  const { error } = await supabase
    .from('varsel_logg')
    .update({ lest: true })
    .eq('profil_id', user.id)
    .eq('lest', false)

  if (error) throw new Error(error.message)
  revalidatePath('/profil', 'layout')
}
