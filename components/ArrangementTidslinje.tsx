'use client'

import Link from 'next/link'
import { format, isThisYear, isPast } from 'date-fns'
import { nb } from 'date-fns/locale'
import SladdetFelt from './SladdetFelt'
import type { Json } from '@/lib/supabase/database.types'

type Paamelding = { profil_id: string; status: string }

type Arrangement = {
  id: string
  type: string
  tittel: string
  beskrivelse: string | null
  start_tidspunkt: string
  slutt_tidspunkt: string | null
  oppmoetested: string | null
  destinasjon: string | null
  pris_per_person: number | null
  sensurerte_felt: Json
  opprettet_av: string
  paameldinger: Paamelding[]
}

function statusFarge(status: string | undefined) {
  if (status === 'ja') return 'var(--gronn-lys)'
  if (status === 'kanskje') return 'var(--aksent-lys)'
  if (status === 'nei') return '#f87171'
  return 'var(--tekst-dempet)'
}

function statusTekst(status: string | undefined) {
  if (status === 'ja') return 'Ja'
  if (status === 'kanskje') return 'Kanskje'
  if (status === 'nei') return 'Nei'
  return 'Ikke svart'
}

export default function ArrangementTidslinje({
  arrangementer,
  innloggetBrukerId,
}: {
  arrangementer: Arrangement[]
  innloggetBrukerId: string
}) {
  const nu = new Date()
  const tidligere = arrangementer.filter(a => isPast(new Date(a.start_tidspunkt)))
  const kommende = arrangementer.filter(a => !isPast(new Date(a.start_tidspunkt)))

  function ArrangementKort({ arr, dempet }: { arr: Arrangement; dempet?: boolean }) {
    const dato = new Date(arr.start_tidspunkt)
    const minPaamelding = arr.paameldinger.find(p => p.profil_id === innloggetBrukerId)
    const antallJa = arr.paameldinger.filter(p => p.status === 'ja').length
    const antallKanskje = arr.paameldinger.filter(p => p.status === 'kanskje').length
    const erTur = arr.type === 'tur'
    const erSensurert = (felt: string) =>
      (arr.sensurerte_felt as Record<string, boolean> | null)?.[felt] === true

    return (
      <div className="flex gap-4" style={{ opacity: dempet ? 0.5 : 1 }}>
        {/* Dato + node */}
        <div className="flex flex-col items-center" style={{ minWidth: '40px' }}>
          <div className="text-xs font-bold text-center leading-tight" style={{ color: dempet ? 'var(--tekst-dempet)' : 'var(--aksent)' }}>
            <div>{format(dato, 'd', { locale: nb })}</div>
            <div className="uppercase">{format(dato, 'MMM', { locale: nb })}</div>
          </div>
          <div
            className="mt-1.5 w-3 h-3 rounded-full border-2 z-10"
            style={{
              background: 'var(--bakgrunn)',
              borderColor: dempet ? 'var(--border)' : (minPaamelding?.status === 'ja' ? 'var(--gronn-lys)' : 'var(--aksent)'),
            }}
          />
        </div>

        {/* Kort */}
        <Link
          href={`/arrangementer/${arr.id}`}
          className="flex-1 rounded-xl p-4 transition-colors mb-0.5"
          style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full mr-2"
                style={{
                  background: erTur ? 'rgba(193,127,36,0.15)' : 'rgba(45,106,79,0.15)',
                  color: erTur ? 'var(--aksent-lys)' : 'var(--gronn-lys)',
                }}
              >
                {erTur ? 'Tur' : 'Møte'}
              </span>
              <span className="text-xs" style={{ color: 'var(--tekst-dempet)' }}>
                {format(dato, 'HH:mm')}
                {!isThisYear(dato) && ` · ${format(dato, 'yyyy')}`}
              </span>
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: statusFarge(minPaamelding?.status) }}>
              {statusTekst(minPaamelding?.status)}
            </span>
          </div>

          <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--tekst)' }}>{arr.tittel}</h2>

          {arr.oppmoetested && (
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>📍 {arr.oppmoetested}</p>
          )}

          {erTur && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--tekst-dempet)' }}>
              ✈️{' '}
              {erSensurert('destinasjon')
                ? <SladdetFelt />
                : arr.destinasjon ?? '–'}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--gronn-lys)' }}>✓ {antallJa} ja</span>
            {antallKanskje > 0 && (
              <span className="text-xs" style={{ color: 'var(--aksent-lys)' }}>? {antallKanskje} kanskje</span>
            )}
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Tidslinje-linje */}
      <div className="absolute left-10 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }} />

      <div className="space-y-6">
        {/* Tidligere arrangementer */}
        {tidligere.map(arr => (
          <ArrangementKort key={arr.id} arr={arr} dempet />
        ))}

        {/* I dag-markør */}
        {tidligere.length > 0 && kommende.length > 0 && (
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center" style={{ minWidth: '40px' }}>
              <div className="w-4 h-4 rounded-full z-10" style={{ background: 'var(--aksent)', boxShadow: '0 0 8px var(--aksent)' }} />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(193,127,36,0.15)', color: 'var(--aksent-lys)' }}>
              I dag — {format(nu, "d. MMMM", { locale: nb })}
            </span>
          </div>
        )}

        {/* Kommende arrangementer */}
        {kommende.map(arr => (
          <ArrangementKort key={arr.id} arr={arr} />
        ))}

        {kommende.length === 0 && (
          <div className="flex gap-4">
            <div style={{ minWidth: '40px' }} />
            <p className="text-sm py-4" style={{ color: 'var(--tekst-dempet)' }}>Ingen kommende arrangementer</p>
          </div>
        )}

        {/* Ikonet markerer bunnen av tidslinjen — bare toppen synes */}
        <div style={{ overflow: 'hidden', height: 160, marginTop: '2rem', position: 'relative' }}>
          <img
            src="/icon-512.png"
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </div>
    </div>
  )
}
