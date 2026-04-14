'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function oppdaterEgenProfil(data: { navn: string; visningsnavn: string; telefon: string; fodselsdato?: string }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('profiles')
    .update({ navn: data.navn, visningsnavn: data.visningsnavn || data.navn, telefon: data.telefon || null, fodselsdato: data.fodselsdato || null, oppdatert: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profil')
  revalidatePath('/klubbinfo/medlemmer')
}

export async function oppdaterMedlemAdmin(id: string, data: { navn: string; visningsnavn: string; telefon: string; rolle: string; aktiv: boolean; fodselsdato?: string }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

  // Bruk service-role for å oppdatere profiles (RLS tillater admin å oppdatere andres)
  const { error } = await supabase
    .from('profiles')
    .update({ navn: data.navn, visningsnavn: data.visningsnavn || data.navn, telefon: data.telefon || null, fodselsdato: data.fodselsdato || null, rolle: data.rolle, aktiv: data.aktiv, oppdatert: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/klubbinfo/medlemmer')
}

export async function slettMedlem(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')
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
