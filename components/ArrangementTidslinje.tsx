'use client'

import Link from 'next/link'
import Image from 'next/image'
import { format, isThisYear, isBefore, isToday, startOfDay } from 'date-fns'
import { nb } from 'date-fns/locale'
import { MapPinIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import SladdetFelt from './SladdetFelt'
import Badge from './ui/Badge'
import type { Json } from '@/lib/supabase/database.types'

type Paamelding = { profil_id: string; status: string; profiles?: { visningsnavn: string | null } | null }

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

type Bursdag = {
  id: string
  visningsnavn: string
  dato: string   // YYYY-MM-DD for the occurrence year
  alder: number
}

type TidslinjeItem =
  | { type: 'arrangement'; data: Arrangement }
  | { type: 'bursdag'; data: Bursdag }

function statusBadge(status: string | undefined, fortid?: boolean) {
  if (status === 'ja') return { label: fortid ? 'Du svarte ja' : 'Påmeldt', variant: 'success' as const }
  if (status === 'kanskje') return { label: fortid ? 'Du svarte kanskje' : 'Kanskje', variant: 'accent' as const }
  if (status === 'nei') return { label: fortid ? 'Du svarte nei' : 'Avmeldt', variant: 'destructive' as const }
  return { label: fortid ? 'Du svarte ikke' : 'Ikke svart', variant: 'neutral' as const }
}

function itemDato(item: TidslinjeItem): Date {
  if (item.type === 'arrangement') return new Date(item.data.start_tidspunkt)
  const [yr, mnd, dag] = item.data.dato.split('-').map(Number)
  return new Date(yr, mnd - 1, dag)
}

function erItemPast(item: TidslinjeItem): boolean {
  // Både arrangementer og bursdager: "past" bare hvis dagen er strengt før i dag.
  // Et arrangement som er i dag forblir under "I dag" helt til midnatt, selv om
  // det startet/sluttet tidligere på dagen.
  return isBefore(startOfDay(itemDato(item)), startOfDay(new Date()))
}

function erItemIdag(item: TidslinjeItem): boolean {
  return isToday(itemDato(item))
}

export default function ArrangementTidslinje({
  arrangementer,
  innloggetBrukerId,
  bursdager = [],
  lastMerKnapp,
}: {
  arrangementer: Arrangement[]
  innloggetBrukerId: string
  bursdager?: Bursdag[]
  lastMerKnapp?: React.ReactNode
}) {
  const alleItems: TidslinjeItem[] = [
    ...arrangementer.map(a => ({ type: 'arrangement' as const, data: a })),
    ...bursdager.map(b => ({ type: 'bursdag' as const, data: b })),
  ]

  const tidligereItems = alleItems
    .filter(item => erItemPast(item))
    .sort((a, b) => itemDato(b).getTime() - itemDato(a).getTime())

  const idagItems = alleItems
    .filter(item => !erItemPast(item) && erItemIdag(item))
    .sort((a, b) => itemDato(a).getTime() - itemDato(b).getTime())

  const kommendeItems = alleItems
    .filter(item => !erItemPast(item) && !erItemIdag(item))
    .sort((a, b) => itemDato(a).getTime() - itemDato(b).getTime())

  function ArrangementKort({ arr, fortid, prioritert, idag }: { arr: Arrangement; fortid?: boolean; prioritert?: boolean; idag?: boolean }) {
    const dato = new Date(arr.start_tidspunkt)
    const minPaamelding = arr.paameldinger.find(p => p.profil_id === innloggetBrukerId)
    const jaListe = arr.paameldinger.filter(p => p.status === 'ja')
    const antallJa = jaListe.length
    const jaNavnListe = jaListe.map(p => p.profiles?.visningsnavn).filter(Boolean).slice(0, 3) as string[]
    const resten = antallJa - jaNavnListe.length
    const erTur = arr.type === 'tur'
    const erSensurert = (felt: string) =>
      (arr.sensurerte_felt as Record<string, boolean> | null)?.[felt] === true
    const status = statusBadge(minPaamelding?.status, fortid)

    return (
      <Link
        href={`/arrangementer/${arr.id}`}
        className="block rounded-2xl overflow-hidden transition-transform duration-100 active:scale-[0.98] relative"
        style={{
          background: 'var(--bg-elevated)',
          border: idag ? '2px solid var(--accent)' : '1px solid var(--border)',
          boxShadow: idag ? '0 0 0 4px var(--accent-subtle), 0 12px 32px rgba(212, 168, 83, 0.22)' : undefined,
          opacity: fortid ? 0.5 : 1,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {idag && (
          <span
            className="absolute top-3 right-3 z-10 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full"
            style={{
              background: 'var(--accent)',
              color: '#0a0a0a',
              letterSpacing: '0.6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
          >
            I dag!
          </span>
        )}
        {/* Hero-bilde */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <Image
            src={arr.bilde_url || '/bakgrunn.jpg'}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority={prioritert}
          />
        </div>

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
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--success)' }}
              />
              {antallJa === 0 ? (
                <span>{fortid ? 'Ingen deltok' : 'Ingen påmeldt ennå'}</span>
              ) : (
                <span>
                  {jaNavnListe.join(', ')}
                  {resten > 0 && ` + ${resten} andre herrer`}
                  {fortid && ' deltok'}
                </span>
              )}
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
      </Link>
    )
  }

  function BursdagNotis({ bursdag, fortid, idag }: { bursdag: Bursdag; fortid?: boolean; idag?: boolean }) {
    const dato = itemDato({ type: 'bursdag', data: bursdag })
    const erPast = isBefore(startOfDay(dato), startOfDay(new Date()))
    const verb = erPast ? 'fylte' : 'fyller'
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: 'var(--bg-elevated)',
          border: idag ? '2px solid var(--accent)' : '1px solid var(--border)',
          boxShadow: idag ? '0 0 0 4px var(--accent-subtle), 0 12px 32px rgba(212, 168, 83, 0.22)' : undefined,
          opacity: fortid ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: '20px', letterSpacing: '-3px', lineHeight: 1 }}>🎂🎂🎂</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {bursdag.visningsnavn} {verb} {bursdag.alder} år
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {format(dato, 'd. MMMM', { locale: nb })}
            {!isThisYear(dato) && ` ${format(dato, 'yyyy')}`}
          </p>
        </div>
      </div>
    )
  }

  function RenderItem({ item, fortid, prioritert, idag }: { item: TidslinjeItem; fortid?: boolean; prioritert?: boolean; idag?: boolean }) {
    if (item.type === 'arrangement') return <ArrangementKort arr={item.data} fortid={fortid} prioritert={prioritert} idag={idag} />
    return <BursdagNotis bursdag={item.data} fortid={fortid} idag={idag} />
  }

  return (
    <div>
      {/* I dag */}
      {idagItems.length > 0 && (
        <>
          <p
            className="font-bold uppercase mb-3 flex items-center gap-2"
            style={{ color: 'var(--accent)', letterSpacing: '1px', fontSize: '13px' }}
          >
            <span>🎉</span> I dag <span>🎉</span>
          </p>
          <div className="space-y-4">
            {idagItems.map((item, i) => (
              <RenderItem key={item.data.id} item={item} prioritert={i === 0} idag />
            ))}
          </div>
        </>
      )}

      {/* Separator */}
      {idagItems.length > 0 && kommendeItems.length > 0 && (
        <div className="my-8" style={{ height: '1px', background: 'var(--border-subtle)' }} />
      )}

      {/* Kommende */}
      {kommendeItems.length > 0 && (
        <>
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}
          >
            Kommende
          </p>
          <div className="space-y-4">
            {kommendeItems.map((item, i) => (
              <RenderItem key={item.data.id} item={item} prioritert={idagItems.length === 0 && i === 0} />
            ))}
          </div>
        </>
      )}

      {/* Last mer-knapp (mellom kommende og tidligere) */}
      {lastMerKnapp && (
        <div className="mt-8">{lastMerKnapp}</div>
      )}

      {/* Separator */}
      {tidligereItems.length > 0 && (idagItems.length > 0 || kommendeItems.length > 0 || lastMerKnapp) && (
        <div className="my-8" style={{ height: '4px', background: 'var(--text-tertiary)', borderRadius: '2px' }} />
      )}

      {/* Tidligere */}
      {tidligereItems.length > 0 && (
        <>
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}
          >
            Tidligere
          </p>
          <div className="space-y-4">
            {tidligereItems.map(item => (
              <RenderItem key={item.data.id} item={item} fortid />
            ))}
          </div>
        </>
      )}

      {idagItems.length === 0 && kommendeItems.length === 0 && tidligereItems.length === 0 && (
        <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
          Ingen arrangementer
        </p>
      )}
    </div>
  )
}
