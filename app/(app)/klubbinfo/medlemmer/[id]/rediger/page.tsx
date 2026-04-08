import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import { notFound, redirect } from 'next/navigation'
import RedigerMedlemSkjema from './RedigerMedlemSkjema'

export default async function RedigerMedlem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])
  if (profil?.rolle !== 'admin') redirect('/klubbinfo/medlemmer')

  const { data: medlem } = await supabase
    .from('profiles')
    .select('id, navn, epost, telefon, rolle, aktiv')
    .eq('id', id)
    .single()

  if (!medlem) notFound()

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Rediger medlem</h1>
      <RedigerMedlemSkjema medlem={medlem} />
    </div>
  )
}
