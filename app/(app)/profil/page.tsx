import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import LoggUtKnapp from './LoggUtKnapp'
import RedigerProfilSkjema from './RedigerProfilSkjema'
import PushAbonnement from '@/components/PushAbonnement'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

export default async function Profil() {
  const [supabase, user] = await Promise.all([createServerClient(), getInnloggetBruker()])

  const [{ data: profil }, { data: ansvar }] = await Promise.all([
    supabase.from('profiles').select('navn, visningsnavn, epost, telefon, rolle').eq('id', user!.id).single(),
    supabase.from('arrangoransvar')
      .select('id, aar, arrangement_navn, arrangementer (id)')
      .eq('ansvarlig_id', user!.id)
      .gte('aar', new Date().getFullYear())
      .order('aar'),
  ])

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Profil</h1>

      <RedigerProfilSkjema
        navn={profil?.navn ?? ''}
        visningsnavn={profil?.visningsnavn ?? ''}
        epost={profil?.epost ?? ''}
        telefon={profil?.telefon ?? ''}
        rolle={profil?.rolle ?? 'medlem'}
      />

      {ansvar && ansvar.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>Dine arrangøransvar</p>
          <div className="space-y-2">
            {ansvar.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl px-5 py-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.arrangement_navn}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.aar}</p>
                </div>
                {a.arrangementer ? (
                  <Link href={`/arrangementer/${a.arrangementer.id}`}>
                    <Badge variant="success">Lagt inn</Badge>
                  </Link>
                ) : (
                  <Link href="/arrangementer/ny"
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                    style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}>
                    Legg inn
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <PushAbonnement />

      <div className="mt-6">
        <LoggUtKnapp />
      </div>
    </div>
  )
}
