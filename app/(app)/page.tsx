import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import ArrangementTidslinje from '@/components/ArrangementTidslinje'
import Link from 'next/link'
import { subMonths, addMonths } from 'date-fns'
import { CalendarIcon } from '@heroicons/react/24/outline'

const MAKS_FREM = 48

export default async function Forside({
  searchParams,
}: {
  searchParams: Promise<{ frem?: string }>
}) {
  const { frem: fremStr } = await searchParams
  const frem = Math.min(Math.max(parseInt(fremStr ?? '12', 10) || 12, 12), MAKS_FREM)

  const [user, supabase] = await Promise.all([
    getInnloggetBruker(),
    createServerClient(),
  ])

  const now = new Date()
  const toMndSiden = subMonths(now, 2)
  const ettArFrem = addMonths(now, frem)

  const [{ data: arrangementer }, { data: profilMedBursdag }] = await Promise.all([supabase
    .from('arrangementer')
    .select(`
      id, type, tittel, beskrivelse, start_tidspunkt, slutt_tidspunkt,
      oppmoetested, destinasjon, pris_per_person, sensurerte_felt,
      opprettet_av, bilde_url,
      paameldinger (profil_id, status, profiles (visningsnavn))
    `)
    .gte('start_tidspunkt', toMndSiden.toISOString())
    .order('start_tidspunkt', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, visningsnavn, fodselsdato')
      .eq('aktiv', true)
      .not('fodselsdato', 'is', null),
  ])

  const bursdager = (profilMedBursdag ?? []).flatMap(p => {
    if (!p.fodselsdato) return []
    const [fodselsaar, mnd, dag] = p.fodselsdato.split('-').map(Number)
    const items: { id: string; visningsnavn: string; dato: string; alder: number }[] = []
    for (const yr of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
      const bdag = new Date(yr, mnd - 1, dag)
      if (bdag >= toMndSiden && bdag <= ettArFrem) {
        items.push({
          id: `bursdag-${p.id}-${yr}`,
          visningsnavn: p.visningsnavn,
          dato: `${yr}-${String(mnd).padStart(2, '0')}-${String(dag).padStart(2, '0')}`,
          alder: yr - fodselsaar,
        })
      }
    }
    return items
  })

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Arrangementer
        </h1>
        <Link
          href="/arrangementer/ny"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
        >
          <span className="text-lg leading-none">+</span> Nytt
        </Link>
      </div>

      {!arrangementer || arrangementer.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <CalendarIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-medium">Ingen arrangementer ennå</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Trykk «+ Nytt» for å legge inn et
          </p>
        </div>
      ) : (
        <>
          <ArrangementTidslinje
            arrangementer={arrangementer}
            innloggetBrukerId={user!.id}
            bursdager={bursdager}
          />
          {frem < MAKS_FREM && (
            <div className="text-center mt-8">
              <Link
                href={`/?frem=${frem + 12}`}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', textDecoration: 'none' }}
              >
                Last mer
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
