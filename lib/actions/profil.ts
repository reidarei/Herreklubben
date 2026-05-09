'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureAdmin, ensureInnlogget } from '@/lib/auth'
import { naa } from '@/lib/dato'
import { normaliserTelefon } from '@/lib/telefon'

export async function oppdaterEgenProfil(data: { navn: string; visningsnavn: string; telefon: string; fodselsdato?: string; bilde_url?: string | null }) {
  const { supabase, user } = await ensureInnlogget()

  const navn = data.navn.trim()
  if (!navn) throw new Error('Navn kan ikke være tomt')
  const visningsnavn = (data.visningsnavn?.trim() || navn)

  const oppdatering: Record<string, unknown> = {
    navn,
    visningsnavn,
    telefon: normaliserTelefon(data.telefon),
    fodselsdato: data.fodselsdato || null,
    oppdatert: naa(),
  }
  if (data.bilde_url !== undefined) oppdatering.bilde_url = data.bilde_url

  const { error } = await supabase
    .from('profiles')
    .update(oppdatering)
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profil')
  revalidatePath('/klubbinfo/medlemmer')
}

export async function oppdaterMedlemAdmin(id: string, data: { navn: string; visningsnavn: string; telefon: string; rolle: string; aktiv: boolean; fodselsdato?: string }) {
  const { supabase } = await ensureAdmin()

  const navn = data.navn.trim()
  if (!navn) throw new Error('Navn kan ikke være tomt')
  const visningsnavn = (data.visningsnavn?.trim() || navn)

  // Bruk service-role for å oppdatere profiles (RLS tillater admin å oppdatere andres)
  const { error } = await supabase
    .from('profiles')
    .update({ navn, visningsnavn, telefon: normaliserTelefon(data.telefon), fodselsdato: data.fodselsdato || null, rolle: data.rolle, aktiv: data.aktiv, oppdatert: naa() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/klubbinfo/medlemmer')
}

export async function slettMedlem(id: string) {
  const { user } = await ensureAdmin()
  if (id === user.id) throw new Error('Kan ikke slette seg selv')

  const admin = createAdminClient()

  // Slett avhengige rader før auth-bruker slettes
  await admin.from('paameldinger').delete().eq('profil_id', id)
  await admin.from('push_subscriptions').delete().eq('profil_id', id)
  await admin.from('arrangoransvar').update({ ansvarlig_id: null }).eq('ansvarlig_id', id)

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw new Error(error.message)

  revalidatePath('/klubbinfo/medlemmer')
  redirect('/klubbinfo/medlemmer')
}
