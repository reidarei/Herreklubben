import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import ArrangementTidslinje from '@/components/ArrangementTidslinje'
import Link from 'next/link'
import { subMonths } from 'date-fns'

export default async function Forside() {
  const [user, supabase] = await Promise.all([
    getInnloggetBruker(),
    createServerClient(),
  ])

  const toMndSiden = subMonths(new Date(), 2).toISOString()

  const { data: arrangementer } = await supabase
    .from('arrangementer')
    .select(`
      id, type, tittel, beskrivelse, start_tidspunkt, slutt_tidspunkt,
      oppmoetested, destinasjon, pris_per_person, sensurerte_felt,
      opprettet_av,
      paameldinger (profil_id, status)
    `)
    .gte('start_tidspunkt', toMndSiden)
    .order('start_tidspunkt', { ascending: true })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--tekst)' }}>Arrangementer</h1>
        <Link
          href="/arrangementer/ny"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--aksent)', color: '#fff' }}
        >
          <span className="text-lg leading-none">+</span> Nytt
        </Link>
      </div>

      {!arrangementer || arrangementer.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--tekst-dempet)' }}>
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium">Ingen arrangementer ennå</p>
          <p className="text-sm mt-1">Trykk «+ Nytt» for å legge inn et</p>
        </div>
      ) : (
        <ArrangementTidslinje
          arrangementer={arrangementer}
          innloggetBrukerId={user!.id}
        />
      )}
    </div>
  )
}
