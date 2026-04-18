import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import { TrophyIcon } from '@heroicons/react/24/outline'
import KaaringKort from './KaaringKort'
import SectionLabel from '@/components/ui/SectionLabel'
import { norskAar } from '@/lib/dato'

export default async function Kaaringer() {
  const [supabase, profil] = await Promise.all([
    createServerClient(),
    getProfil(),
  ])

  const erAdmin = profil?.rolle === 'admin'
  const gjeldende_aar = norskAar()

  const [{ data: maler }, { data: vinnere }, { data: medlemmer }, { data: arrangementer }] = await Promise.all([
    supabase
      .from('kaaringmaler')
      .select('id, navn, rekkefolge')
      .order('rekkefolge'),
    supabase
      .from('kaaring_vinnere')
      .select(`
        id, mal_id, aar, begrunnelse,
        profil_id, profiles (navn),
        arrangement_id, arrangementer (tittel)
      `)
      .order('aar', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, navn')
      .eq('aktiv', true)
      .order('navn'),
    supabase
      .from('arrangementer')
      .select('id, tittel, start_tidspunkt')
      .order('start_tidspunkt', { ascending: false }),
  ])

  const vinnerePrMal: Record<string, Record<number, any>> = {}
  for (const v of vinnere ?? []) {
    const key = `${v.mal_id}`
    if (!vinnerePrMal[key]) vinnerePrMal[key] = {}
    vinnerePrMal[key][v.aar] = v
  }

  const aar_set = new Set<number>()
  for (const v of vinnere ?? []) {
    aar_set.add(v.aar)
  }
  for (let y = 2015; y <= gjeldende_aar; y++) {
    aar_set.add(y)
  }
  const aar = Array.from(aar_set).sort((a, b) => b - a)

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <h1
        className="mb-8 leading-tight"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '38px',
          fontWeight: 400,
          color: 'var(--text-primary)',
        }}
      >
        Hall of Fame
      </h1>

      {!maler || maler.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <TrophyIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-medium">Ingen kåringer definert</p>
          {erAdmin && <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Gå til Innstillinger for å legge inn</p>}
        </div>
      ) : (
        <div className="space-y-10">
          {aar.map(a => (
            <div key={a}>
              <div className="flex items-center gap-3 mb-4">
                <TrophyIcon className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    color: 'var(--accent)',
                  }}
                >
                  {a}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              </div>
              <div className="space-y-3">
                {maler.map(mal => (
                  <KaaringKort
                    key={`${mal.id}-${a}`}
                    mal={mal}
                    aar={a}
                    vinner={vinnerePrMal[mal.id]?.[a]}
                    erAdmin={erAdmin}
                    medlemmer={medlemmer ?? []}
                    arrangementer={arrangementer ?? []}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
