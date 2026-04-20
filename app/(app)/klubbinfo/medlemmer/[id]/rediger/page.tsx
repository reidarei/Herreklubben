import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import { notFound, redirect } from 'next/navigation'
import RedigerMedlemSkjema from './RedigerMedlemSkjema'
import { kanAdministrere } from '@/lib/roller'

export default async function RedigerMedlem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])
  if (!kanAdministrere(profil?.rolle)) redirect('/klubbinfo/medlemmer')

  const { data: medlem } = await supabase
    .from('profiles')
    .select('id, navn, visningsnavn, epost, telefon, rolle, aktiv, fodselsdato')
    .eq('id', id)
    .single()

  if (!medlem) notFound()

  return <RedigerMedlemSkjema medlem={medlem} />
}
