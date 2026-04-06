'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lagreAnsvar(data: {
  id?: string
  aar: number
  arrangement_navn: string
  ansvarlig_id: string | null
  purredato: string | null
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

  if (data.id) {
    const { error } = await supabase
      .from('arrangoransvar')
      .update({
        arrangement_navn: data.arrangement_navn,
        ansvarlig_id: data.ansvarlig_id,
        purredato: data.purredato,
        oppdatert: new Date().toISOString(),
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('arrangoransvar')
      .insert({
        aar: data.aar,
        arrangement_navn: data.arrangement_navn,
        ansvarlig_id: data.ansvarlig_id,
        purredato: data.purredato,
      })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/arrangoransvar')
}

export async function slettAnsvar(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

  const { error } = await supabase.from('arrangoransvar').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/arrangoransvar')
}
