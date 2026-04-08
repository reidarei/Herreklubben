import { createServerClient } from '@/lib/supabase/server'
import NyttArrangementSkjema from './NyttArrangementSkjema'

export default async function NyttArrangement() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Hent uoppfylte arrangøransvar for denne brukeren
  const { data: ansvar } = await supabase
    .from('arrangoransvar')
    .select('id, arrangement_navn, aar')
    .eq('ansvarlig_id', user!.id)
    .is('arrangement_id', null)
    .order('aar', { ascending: false })

  return (
    <div className="max-w-lg mx-auto px-4 pt-10">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tekst)' }}>Nytt arrangement</h1>
      <NyttArrangementSkjema uoppfyltAnsvar={ansvar ?? []} />
    </div>
  )
}
