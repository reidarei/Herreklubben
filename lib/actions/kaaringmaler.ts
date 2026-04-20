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

export async function leggTilKaaringMal(navn: string) {
  await sjekkAdmin()
  const admin = createAdminClient()
  const { data: max } = await admin.from('kaaringmaler').select('rekkefolge').order('rekkefolge', { ascending: false }).limit(1).single()
  const { error } = await admin.from('kaaringmaler').insert({ navn: navn.trim(), rekkefolge: (max?.rekkefolge ?? 0) + 1 })
  if (error) throw new Error(error.message)
  revalidatePath('/innstillinger')
  revalidatePath('/kaaringer')
}

export async function oppdaterKaaringMal(id: string, navn: string) {
  await sjekkAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('kaaringmaler').update({ navn: navn.trim() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/innstillinger')
  revalidatePath('/kaaringer')
}

export async function slettKaaringMal(id: string) {
  await sjekkAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('kaaringmaler').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/innstillinger')
  revalidatePath('/kaaringer')
}
