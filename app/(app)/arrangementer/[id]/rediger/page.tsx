import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import RedigerSkjema from './RedigerSkjema'

export default async function RedigerArrangement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: arr } = await supabase
    .from('arrangementer')
    .select('*')
    .eq('id', id)
    .single()

  if (!arr) notFound()

  const { data: profil } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user!.id)
    .single()

  const erAdmin = profil?.rolle === 'admin'
  const kanRedigere = arr.opprettet_av === user!.id || erAdmin

  if (!kanRedigere) redirect(`/arrangementer/${id}`)

  return (
    <div className="max-w-lg mx-auto px-4 pt-10">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tekst)' }}>Rediger arrangement</h1>
      <RedigerSkjema arrangement={arr} />
    </div>
  )
}
