'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function oppdaterEgenProfil(data: { navn: string; telefon: string }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('profiles')
    .update({ navn: data.navn, telefon: data.telefon || null, oppdatert: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profil')
  revalidatePath('/klubbinfo/medlemmer')
}

export async function oppdaterMedlemAdmin(id: string, data: { navn: string; telefon: string; rolle: string; aktiv: boolean }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

  // Bruk service-role for å oppdatere profiles (RLS tillater admin å oppdatere andres)
  const { error } = await supabase
    .from('profiles')
    .update({ navn: data.navn, telefon: data.telefon || null, rolle: data.rolle, aktiv: data.aktiv, oppdatert: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/klubbinfo/medlemmer')
}
