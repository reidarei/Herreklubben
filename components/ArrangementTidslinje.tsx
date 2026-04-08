'use client'

import Link from 'next/link'
import { format, isThisYear, isPast } from 'date-fns'
import { nb } from 'date-fns/locale'
import { MapPinIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import SladdetFelt from './SladdetFelt'
import Badge from './ui/Badge'
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
  opprettet_av: string | null
  bilde_url?: string | null
  paameldinger: Paamelding[]
}

function statusBadge(status: string | undefined) {
  if (status === 'ja') return { label: 'Påmeldt', variant: 'success' as const }
  if (status === 'kanskje') return { label: 'Kanskje', variant: 'accent' as const }
  if (status === 'nei') return { label: 'Avmeldt', variant: 'destructive' as const }
  return { label: 'Ikke svart', variant: 'neutral' as const }
}

export default function ArrangementTidslinje({
  arrangementer,
  innloggetBrukerId,
}: {
  arrangementer: Arrangement[]
  innloggetBrukerId: string
}) {
  const tidligere = arrangementer.filter(a => isPast(new Date(a.start_tidspunkt)))
  const kommende = arrangementer.filter(a => !isPast(new Date(a.start_tidspunkt)))

  function ArrangementKort({ arr, dempet }: { arr: Arrangement; dempet?: boolean }) {
    const dato = new Date(arr.start_tidspunkt)
    const minPaamelding = arr.paameldinger.find(p => p.profil_id === innloggetBrukerId)
    const antallJa = arr.paameldinger.filter(p => p.status === 'ja').length
    const erTur = arr.type === 'tur'
    const erSensurert = (felt: string) =>
      (arr.sensurerte_felt as Record<string, boolean> | null)?.[felt] === true
    const status = statusBadge(minPaamelding?.status)

    return (
      <Link
        href={`/arrangementer/${arr.id}`}
        className="block rounded-2xl overflow-hidden transition-colors"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          opacity: dempet ? 0.5 : 1,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {/* Hero-bilde */}
        {arr.bilde_url && (
          <img
            src={arr.bilde_url}
            alt=""
            className="w-full object-cover"
            style={{ aspectRatio: '16/9' }}
            loading="lazy"
          />
        )}

        {/* Innhold */}
        <div className="p-5">
          {/* Meta: type + dato */}
          <div className="flex items-center gap-2 mb-1.5" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Badge variant="accent">{erTur ? 'Tur' : 'Møte'}</Badge>
            <span>
              {format(dato, 'd. MMM', { locale: nb })}
              {!isThisYear(dato) && ` ${format(dato, 'yyyy')}`}
              {' kl. '}
              {format(dato, 'HH:mm')}
            </span>
          </div>

          {/* Tittel */}
          <h2
            className="font-semibold mb-1"
            style={{ fontSize: '17px', letterSpacing: '-0.2px', color: 'var(--text-primary)' }}
          >
            {arr.tittel}
          </h2>

          {/* Sted */}
          {arr.oppmoetested && (
            <div className="flex items-center gap-1.5" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              <MapPinIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {arr.oppmoetested}
            </div>
          )}

          {/* Destinasjon (kun tur) */}
          {erTur && arr.destinasjon && (
            <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              <PaperAirplaneIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {erSensurert('destinasjon') ? <SladdetFelt /> : arr.destinasjon}
            </div>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between mt-3.5 pt-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-1.5" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--success)' }}
              />
              {antallJa} kommer
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div>
      {/* Kommende */}
      {kommende.length > 0 && (
        <>
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}
          >
            Kommende
          </p>
          <div className="space-y-4">
            {kommende.map(arr => (
              <ArrangementKort key={arr.id} arr={arr} />
            ))}
          </div>
        </>
      )}

      {/* Separator */}
      {tidligere.length > 0 && kommende.length > 0 && (
        <div className="my-8" style={{ height: '1px', background: 'var(--border-subtle)' }} />
      )}

      {/* Tidligere */}
      {tidligere.length > 0 && (
        <>
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}
          >
            Tidligere
          </p>
          <div className="space-y-4">
            {tidligere.map(arr => (
              <ArrangementKort key={arr.id} arr={arr} dempet />
            ))}
          </div>
        </>
      )}

      {kommende.length === 0 && tidligere.length === 0 && (
        <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
          Ingen arrangementer
        </p>
      )}
    </div>
  )
}
