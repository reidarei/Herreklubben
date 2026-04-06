import { createServerClient } from '@/lib/supabase/server'
import LoggUtKnapp from './LoggUtKnapp'
import RedigerProfilSkjema from './RedigerProfilSkjema'
import PushAbonnement from '@/components/PushAbonnement'

export default async function Profil() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profil } = await supabase
    .from('profiles')
    .select('navn, epost, telefon, rolle')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tekst)' }}>Profil</h1>

      <RedigerProfilSkjema
        navn={profil?.navn ?? ''}
        epost={profil?.epost ?? ''}
        telefon={profil?.telefon ?? ''}
        rolle={profil?.rolle ?? 'medlem'}
      />

      <PushAbonnement />

      <div className="mt-6">
        <LoggUtKnapp />
      </div>
    </div>
  )
}
