'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function opprettKaaring(data: {
  aar: number
  kategori: string
  vinnere: Array<{ profil_id?: string; arrangement_id?: string; begrunnelse?: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

  const { data: kaaring, error } = await supabase
    .from('kaaringer')
    .insert({ aar: data.aar, kategori: data.kategori, opprettet_av: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  const vinnere = data.vinnere.map(v => ({
    kaaring_id: kaaring.id,
    profil_id: v.profil_id || null,
    arrangement_id: v.arrangement_id || null,
    begrunnelse: v.begrunnelse || null,
  }))

  const { error: e2 } = await supabase.from('kaaring_vinnere').insert(vinnere)
  if (e2) throw new Error(e2.message)

  revalidatePath('/kaaringer')
}

export async function slettKaaring(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

  const { error } = await supabase.from('kaaringer').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/kaaringer')
}
