'use client'

import Link from 'next/link'
import Image from 'next/image'
import { format, isThisYear, isPast, isBefore, isToday, startOfDay } from 'date-fns'
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

function statusBadge(status: string | undefined) {
  if (status === 'ja') return { label: 'Påmeldt', variant: 'success' as const }
  if (status === 'kanskje') return { label: 'Kanskje', variant: 'accent' as const }
  if (status === 'nei') return { label: 'Avmeldt', variant: 'destructive' as const }
  return { label: 'Ikke svart', variant: 'neutral' as const }
}

function itemDato(item: TidslinjeItem): Date {
  if (item.type === 'arrangement') return new Date(item.data.start_tidspunkt)
  const [yr, mnd, dag] = item.data.dato.split('-').map(Number)
  return new Date(yr, mnd - 1, dag)
}

function erItemPast(item: TidslinjeItem): boolean {
  if (item.type === 'arrangement') return isPast(new Date(item.data.start_tidspunkt))
  // Bursdager: "past" bare hvis dagen er strengt før i dag
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
    .sort((a, b) => itemDato(a).getTime() - itemDato(b).getTime())

  const idagItems = alleItems
    .filter(item => !erItemPast(item) && erItemIdag(item))
    .sort((a, b) => itemDato(a).getTime() - itemDato(b).getTime())

  const kommendeItems = alleItems
    .filter(item => !erItemPast(item) && !erItemIdag(item))
    .sort((a, b) => itemDato(a).getTime() - itemDato(b).getTime())

  function ArrangementKort({ arr, dempet, prioritert }: { arr: Arrangement; dempet?: boolean; prioritert?: boolean }) {
    const dato = new Date(arr.start_tidspunkt)
    const minPaamelding = arr.paameldinger.find(p => p.profil_id === innloggetBrukerId)
    const jaListe = arr.paameldinger.filter(p => p.status === 'ja')
    const antallJa = jaListe.length
    const jaNavnListe = jaListe.map(p => p.profiles?.visningsnavn).filter(Boolean).slice(0, 3) as string[]
    const resten = antallJa - jaNavnListe.length
    const erTur = arr.type === 'tur'
    const erSensurert = (felt: string) =>
      (arr.sensurerte_felt as Record<string, boolean> | null)?.[felt] === true
    const status = statusBadge(minPaamelding?.status)

    return (
      <Link
        href={`/arrangementer/${arr.id}`}
        className="block rounded-2xl overflow-hidden transition-transform duration-100 active:scale-[0.98]"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          opacity: dempet ? 0.5 : 1,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
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
                <span>Ingen påmeldt ennå</span>
              ) : (
                <span>
                  {jaNavnListe.join(', ')}
                  {resten > 0 && ` + ${resten} andre herrer`}
                </span>
              )}
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
      </Link>
    )
  }

  function BursdagNotis({ bursdag, dempet }: { bursdag: Bursdag; dempet?: boolean }) {
    const dato = itemDato({ type: 'bursdag', data: bursdag })
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          opacity: dempet ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: '20px', letterSpacing: '-3px', lineHeight: 1 }}>🎂🎂🎂</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {bursdag.visningsnavn} fyller {bursdag.alder} år
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {format(dato, 'd. MMMM', { locale: nb })}
            {!isThisYear(dato) && ` ${format(dato, 'yyyy')}`}
          </p>
        </div>
      </div>
    )
  }

  function RenderItem({ item, dempet, prioritert }: { item: TidslinjeItem; dempet?: boolean; prioritert?: boolean }) {
    if (item.type === 'arrangement') return <ArrangementKort arr={item.data} dempet={dempet} prioritert={prioritert} />
    return <BursdagNotis bursdag={item.data} dempet={dempet} />
  }

  return (
    <div>
      {/* I dag */}
      {idagItems.length > 0 && (
        <>
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}
          >
            I dag
          </p>
          <div className="space-y-4">
            {idagItems.map((item, i) => (
              <RenderItem key={item.data.id} item={item} prioritert={i === 0} />
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
        <div className="my-8" style={{ height: '1px', background: 'var(--border-subtle)' }} />
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
              <RenderItem key={item.data.id} item={item} dempet />
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
