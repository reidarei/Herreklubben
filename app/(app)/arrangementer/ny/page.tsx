import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import NyttArrangementSkjema from './NyttArrangementSkjema'

export default async function NyttArrangement() {
  const [supabase, user] = await Promise.all([createServerClient(), getInnloggetBruker()])

  // Hent uoppfylte arrangøransvar for denne brukeren
  const { data: ansvar } = await supabase
    .from('arrangoransvar')
    .select('id, arrangement_navn, aar')
    .eq('ansvarlig_id', user!.id)
    .is('arrangement_id', null)
    .order('aar', { ascending: false })

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Nytt arrangement</h1>
      <NyttArrangementSkjema uoppfyltAnsvar={ansvar ?? []} />
    </div>
  )
}
