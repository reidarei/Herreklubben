import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import TidslinjeWrapper from './TidslinjeWrapper'
import Link from 'next/link'
import { subMonths } from 'date-fns'
import { CalendarIcon } from '@heroicons/react/24/outline'

export default async function Forside() {
  const [user, supabase] = await Promise.all([
    getInnloggetBruker(),
    createServerClient(),
  ])

  const toMndSiden = subMonths(new Date(), 2)

  const [{ data: arrangementer }, { data: profilerMedBursdag }] = await Promise.all([
    supabase
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
        <TidslinjeWrapper
          arrangementer={arrangementer}
          profilerMedBursdag={profilerMedBursdag ?? []}
          innloggetBrukerId={user!.id}
        />
      )}
    </div>
  )
}
