'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { kanAdministrere } from '@/lib/roller'

export async function oppdaterVedtekt(data: {
  slug: string
  nyttInnhold: string
  vedtaksdato: string
  endringsnotat: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (!kanAdministrere(profil?.rolle)) throw new Error('Ikke admin')

  // Hent gjeldende innhold for å versjonere det
  const { data: vedtekt } = await supabase
    .from('vedtekter')
    .select('id, innhold')
    .eq('slug', data.slug)
    .single()

  if (!vedtekt) throw new Error('Vedtekt ikke funnet')

  // Lagre gammel versjon
  await supabase.from('vedtekter_versjoner').insert({
    vedtekt_id: vedtekt.id,
    innhold: vedtekt.innhold,
    vedtaksdato: data.vedtaksdato,
    endringsnotat: data.endringsnotat,
    endret_av: user.id,
  })

  // Oppdater gjeldende innhold
  await supabase
    .from('vedtekter')
    .update({ innhold: data.nyttInnhold, oppdatert: new Date().toISOString() })
    .eq('slug', data.slug)

  revalidatePath(`/klubbinfo/vedtekter/${data.slug}`)
}
