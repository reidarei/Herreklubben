import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import { TrophyIcon } from '@heroicons/react/24/outline'
import NyKaaringKnapp from './NyKaaringKnapp'
import KaaringKort from './KaaringKort'

export default async function Kaaringer() {
  const [supabase, profil] = await Promise.all([
    createServerClient(),
    getProfil(),
  ])

  const erAdmin = profil?.rolle === 'admin'

  const [{ data: kaaringer }, { data: medlemmer }, { data: arrangementer }] = await Promise.all([
    supabase
      .from('kaaringer')
      .select(`
        id, aar, kategori,
        kaaring_vinnere (
          id, begrunnelse,
          profil_id, profiles (navn),
          arrangement_id, arrangementer (tittel)
        )
      `)
      .order('aar', { ascending: false })
      .order('opprettet', { ascending: true }),
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

  const perAar: Record<number, typeof kaaringer> = {}
  for (const k of kaaringer ?? []) {
    if (!perAar[k.aar]) perAar[k.aar] = []
    perAar[k.aar]!.push(k)
  }
  const aar = Object.keys(perAar).map(Number).sort((a, b) => b - a)

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Kåringer</h1>
        {erAdmin && (
          <NyKaaringKnapp
            medlemmer={medlemmer ?? []}
            arrangementer={arrangementer ?? []}
          />
        )}
      </div>

      {aar.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <TrophyIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-medium">Ingen kåringer ennå</p>
          {erAdmin && <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Trykk «+ Ny» for å legge inn</p>}
        </div>
      ) : (
        <div className="space-y-8">
          {aar.map(a => (
            <div key={a}>
              <h2
                className="text-sm font-semibold mb-3 pb-2 flex items-center gap-2"
                style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <TrophyIcon className="w-4 h-4" />
                {a}
              </h2>
              <div className="space-y-3">
                {perAar[a]!.map(k => (
                  <KaaringKort
                    key={k.id}
                    kaaring={k}
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
