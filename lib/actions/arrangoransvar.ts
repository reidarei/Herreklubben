'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lagreAnsvarlig(data: {
  id?: string
  aar: number
  arrangement_navn: string
  ansvarlig_id: string | null
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

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
