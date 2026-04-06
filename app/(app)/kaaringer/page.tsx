import { createServerClient } from '@/lib/supabase/server'
import NyKaaringKnapp from './NyKaaringKnapp'
import KaaringKort from './KaaringKort'

export default async function Kaaringer() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user!.id).single()
  const erAdmin = profil?.rolle === 'admin'

  const { data: kaaringer } = await supabase
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
    .order('opprettet', { ascending: true })

  const { data: medlemmer } = await supabase
    .from('profiles')
    .select('id, navn')
    .eq('aktiv', true)
    .order('navn')

  const { data: arrangementer } = await supabase
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt')
    .order('start_tidspunkt', { ascending: false })

  // Grupper per år
  const perAar: Record<number, typeof kaaringer> = {}
  for (const k of kaaringer ?? []) {
    if (!perAar[k.aar]) perAar[k.aar] = []
    perAar[k.aar]!.push(k)
  }
  const aar = Object.keys(perAar).map(Number).sort((a, b) => b - a)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--tekst)' }}>Kåringer</h1>
        {erAdmin && (
          <NyKaaringKnapp
            medlemmer={medlemmer ?? []}
            arrangementer={arrangementer ?? []}
          />
        )}
      </div>

      {aar.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--tekst-dempet)' }}>
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">Ingen kåringer ennå</p>
          {erAdmin && <p className="text-sm mt-1">Trykk «+ Ny» for å legge inn</p>}
        </div>
      ) : (
        <div className="space-y-8">
          {aar.map(a => (
            <div key={a}>
              <h2 className="text-base font-semibold mb-3 pb-2" style={{ color: 'var(--aksent-lys)', borderBottom: '1px solid var(--border)' }}>
                🏆 {a}
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
