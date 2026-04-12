import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import TidslinjeWrapper from './TidslinjeWrapper'
import Link from 'next/link'
import { subMonths } from 'date-fns'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { norskAar } from '@/lib/dato'

// Returnerer [måned, dag] for omtrentlig midtpunkt av perioden
function estimertDatoFraNavn(navn: string): [number, number] {
  const lower = navn.toLowerCase()
  const maaneder: [string, number][] = [
    ['januar', 1], ['februar', 2], ['mars', 3], ['april', 4],
    ['mai', 5], ['juni', 6], ['juli', 7], ['august', 8],
    ['september', 9], ['oktober', 10], ['november', 11], ['desember', 12],
    ['jule', 12],
  ]
  const funnet: number[] = []
  for (const [m, num] of maaneder) {
    if (lower.includes(m) && !funnet.includes(num)) funnet.push(num)
  }
  if (funnet.length === 0) return [6, 15]
  if (funnet.length === 1) return [funnet[0], 15]
  // To måneder: midtpunktet er ca. 1. i den siste måneden
  return [funnet[funnet.length - 1], 1]
}

export default async function Forside() {
  const [user, supabase] = await Promise.all([
    getInnloggetBruker(),
    createServerClient(),
  ])

  const toMndSiden = subMonths(new Date(), 3)
  const aar = norskAar()

  const [{ data: arrangementer }, { data: profilerMedBursdag }, { data: ansvar }, { count: pushCount }] = await Promise.all([
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
    supabase
      .from('arrangoransvar')
      .select('arrangement_navn, ansvarlig_id, profiles (visningsnavn)')
      .eq('aar', aar)
      .is('arrangement_id', null),
    supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('profil_id', user!.id),
  ])

  // Grupper uplanlagte arrangementer etter navn
  const uplanlagteMap = new Map<string, string[]>()
  for (const a of ansvar ?? []) {
    const navn = a.arrangement_navn
    if (!uplanlagteMap.has(navn)) uplanlagteMap.set(navn, [])
    const profNavn = (a.profiles as { visningsnavn: string | null } | null)?.visningsnavn
    if (profNavn) uplanlagteMap.get(navn)!.push(profNavn)
  }

  const ikkePlanlagt = [...uplanlagteMap.entries()].map(([navn, ansvarlige]) => ({
    id: `uplanlagt-${aar}-${navn}`,
    arrangementNavn: navn,
    ansvarlige,
    estimertDato: (() => { const [m, d] = estimertDatoFraNavn(navn); return `${aar}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00Z` })(),
  }))

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

      {pushCount === 0 && (
        <Link
          href="/innstillinger"
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm"
          style={{
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '18px' }}>🔔</span>
          <span>Skru på push-varsler så du ikke går glipp av noe</span>
        </Link>
      )}

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
          ikkePlanlagt={ikkePlanlagt}
        />
      )}
    </div>
  )
}
