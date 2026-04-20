import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { notFound, redirect } from 'next/navigation'
import RedigerSkjema from './RedigerSkjema'
import { kanAdministrere } from '@/lib/roller'

export default async function RedigerArrangement({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, user, profil] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
  ])

  const { data: arr } = await supabase
    .from('arrangementer')
    .select('*')
    .eq('id', id)
    .single()

  if (!arr) notFound()

  const erAdmin = kanAdministrere(profil?.rolle)
  const kanRedigere = arr.opprettet_av === user!.id || erAdmin

  if (!kanRedigere) redirect(`/arrangementer/${id}`)

  return (
    <RedigerSkjema
      arrangement={{
        ...arr,
        sensurerte_felt: (arr.sensurerte_felt as Record<string, boolean> | null) ?? null,
      }}
    />
  )
}
