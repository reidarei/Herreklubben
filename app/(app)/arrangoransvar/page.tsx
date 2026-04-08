import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import AnsvarAdmin from './AnsvarAdmin'

export default async function Arrangoransvar() {
  const supabase = await createServerClient()
  const user = await getInnloggetBruker()

  const profil = await getProfil()
  const erAdmin = profil?.rolle === 'admin'

  const innevaerendeAar = new Date().getFullYear()
  const visAar = [innevaerendeAar, innevaerendeAar + 1]

  const { data: ansvar } = await supabase
    .from('arrangoransvar')
    .select(`
      id, aar, arrangement_navn, purredato,
      ansvarlig_id,
      profiles (id, navn),
      arrangementer (id, tittel, start_tidspunkt)
    `)
    .in('aar', visAar)
    .order('aar')
    .order('opprettet')

  const { data: medlemmer } = await supabase
    .from('profiles')
    .select('id, navn')
    .eq('aktiv', true)
    .order('navn')

  // Grupper per år
  const perAar: Record<number, typeof ansvar> = {}
  for (const a of ansvar ?? []) {
    if (!perAar[a.aar]) perAar[a.aar] = []
    perAar[a.aar]!.push(a)
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/klubbinfo" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ChevronLeftIcon className="w-4 h-4" /> Tilbake
          </Link>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Arrangøransvar</h1>
        </div>
      </div>

      {visAar.map(aar => (
        <div key={aar} className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--accent)' }}>{aar}</h2>

          {!perAar[aar] || perAar[aar]!.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingen ansvar registrert for {aar}.</p>
          ) : (
            <div className="space-y-2">
              {perAar[aar]!.map(a => {
                const erMitt = a.ansvarlig_id === user!.id
                const harArrangement = !!a.arrangementer
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      background: erMitt ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      border: `1px solid ${erMitt ? 'rgba(193,127,36,0.3)' : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: erMitt ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {a.arrangement_navn}
                          {erMitt && <span className="ml-2 text-xs" style={{ color: 'var(--accent)' }}>← deg</span>}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {a.profiles?.navn ?? <span style={{ color: 'var(--destructive)' }}>Ingen ansvarlig</span>}
                        </p>
                        {harArrangement ? (
                          <Link
                            href={`/arrangementer/${a.arrangementer?.id}`}
                            className="text-xs mt-1 inline-block"
                            style={{ color: 'var(--success)' }}
                          >
                            ✓ Lagt inn
                          </Link>
                        ) : (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Ikke lagt inn ennå</p>
                        )}
                      </div>
                      {erAdmin && (
                        <AnsvarAdmin ansvar={a} medlemmer={medlemmer ?? []} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {erAdmin && (
            <AnsvarAdmin
              nytt={{ aar }}
              medlemmer={medlemmer ?? []}
            />
          )}
        </div>
      ))}
    </div>
  )
}
