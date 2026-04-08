import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import LoggUtKnapp from './LoggUtKnapp'
import RedigerProfilSkjema from './RedigerProfilSkjema'
import EndrePassord from './EndrePassord'
import PushAbonnement from '@/components/PushAbonnement'
import Link from 'next/link'

export default async function Profil() {
  const [supabase, user] = await Promise.all([createServerClient(), getInnloggetBruker()])

  const [{ data: profil }, { data: ansvar }] = await Promise.all([
    supabase.from('profiles').select('navn, epost, telefon, rolle').eq('id', user!.id).single(),
    supabase.from('arrangoransvar')
      .select('id, aar, arrangement_navn, arrangementer (id)')
      .eq('ansvarlig_id', user!.id)
      .gte('aar', new Date().getFullYear())
      .order('aar'),
  ])

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tekst)' }}>Profil</h1>

      <RedigerProfilSkjema
        navn={profil?.navn ?? ''}
        epost={profil?.epost ?? ''}
        telefon={profil?.telefon ?? ''}
        rolle={profil?.rolle ?? 'medlem'}
      />

      {ansvar && ansvar.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--aksent-lys)' }}>Dine arrangøransvar</p>
          <div className="space-y-2">
            {ansvar.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl px-4 py-2.5"
                style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--tekst)' }}>{a.arrangement_navn}</p>
                  <p className="text-xs" style={{ color: 'var(--tekst-dempet)' }}>{a.aar}</p>
                </div>
                {a.arrangementer ? (
                  <Link href={`/arrangementer/${a.arrangementer.id}`}
                    className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(82,183,136,0.15)', color: 'var(--gronn-lys)' }}>
                    Lagt inn ✓
                  </Link>
                ) : (
                  <Link href="/arrangementer/ny"
                    className="text-xs px-3 py-1 rounded-lg font-semibold"
                    style={{ background: 'var(--aksent)', color: '#fff' }}>
                    Legg inn
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <EndrePassord />

      <PushAbonnement />

      <div className="mt-6">
        <LoggUtKnapp />
      </div>
    </div>
  )
}
