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
}

export async function leggTilMal(navn: string) {
  await sjekkAdmin()
  const admin = createAdminClient()
  const { data: max } = await admin.from('arrangementmaler').select('*').order('rekkefølge', { ascending: false }).limit(1).single()
  const { error } = await admin.from('arrangementmaler').insert({ navn: navn.trim(), rekkefølge: (max?.rekkefølge ?? 0) + 1 })
  if (error) throw new Error(error.message)
  revalidatePath('/innstillinger')
  revalidatePath('/arrangoransvar')
}

export async function oppdaterMal(id: string, navn: string, purredato?: string | null) {
  await sjekkAdmin()
  const admin = createAdminClient()
  const oppdatering: Record<string, unknown> = { navn: navn.trim() }
  if (purredato !== undefined) oppdatering.purredato = purredato
  const { error } = await admin.from('arrangementmaler').update(oppdatering).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/innstillinger')
  revalidatePath('/arrangoransvar')
}

export async function slettMal(id: string) {
  await sjekkAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('arrangementmaler').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/innstillinger')
  revalidatePath('/arrangoransvar')
}
