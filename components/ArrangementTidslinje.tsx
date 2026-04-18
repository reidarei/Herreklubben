'use client'

import Link from 'next/link'
import Image from 'next/image'
import { isBefore } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { formaterDato, norskDag, norskDatoNaa } from '@/lib/dato'
import { MapPinIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import SladdetFelt from './SladdetFelt'
import Pill from './ui/Pill'
import SectionLabel from './ui/SectionLabel'
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
  profilId: string
  visningsnavn: string
  dato: string
  alder: number
}

type IkkePlanlagt = {
  id: string
  arrangementNavn: string
  ansvarlige: string[]
  estimertDato: string
}

type TidslinjeItem =
  | { type: 'arrangement'; data: Arrangement }
  | { type: 'bursdag'; data: Bursdag }
  | { type: 'ikke-planlagt'; data: IkkePlanlagt }

function statusPill(status: string | undefined, fortid?: boolean) {
  if (status === 'ja') return { label: fortid ? 'Var med' : 'Påmeldt', variant: 'success' as const }
  if (status === 'kanskje') return { label: 'Kanskje', variant: 'accent' as const }
  if (status === 'nei') return { label: fortid ? 'Nei' : 'Avmeldt', variant: 'danger' as const }
  return { label: 'Ikke svart', variant: 'muted' as const }
}

function itemDag(item: TidslinjeItem): Date {
  if (item.type === 'arrangement') return norskDag(item.data.start_tidspunkt)
  if (item.type === 'ikke-planlagt') return norskDag(item.data.estimertDato)
  const [yr, mnd, dag] = item.data.dato.split('-').map(Number)
  return new Date(yr, mnd - 1, dag)
}

function erItemPast(item: TidslinjeItem): boolean {
  return isBefore(itemDag(item), norskDatoNaa())
}

function erItemIdag(item: TidslinjeItem): boolean {
  return itemDag(item).getTime() === norskDatoNaa().getTime()
}

function AvatarSirkel({ navn, size = 22 }: { navn: string; size?: number }) {
  const initial = navn.charAt(0).toUpperCase()
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: 'var(--bg-elevated-2)',
        border: '1px solid var(--glass-border)',
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.45,
        color: 'var(--accent-muted)',
      }}
    >
      {initial}
    </span>
  )
}

function DeltakerAvatarer({ navnliste, maks = 5 }: { navnliste: string[]; maks?: number }) {
  const vis = navnliste.slice(0, maks)
  const resten = navnliste.length - maks

  return (
    <div className="flex items-center" style={{ gap: '2px' }}>
      {vis.map((navn, i) => (
        <AvatarSirkel key={i} navn={navn} />
      ))}
      {resten > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full shrink-0 text-[10px] font-medium"
          style={{
            width: 22,
            height: 22,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
          }}
        >
          +{resten}
        </span>
      )}
    </div>
  )
}

export default function ArrangementTidslinje({
  arrangementer,
  innloggetBrukerId,
  bursdager = [],
  ikkePlanlagt = [],
  lastMerKnapp,
}: {
  arrangementer: Arrangement[]
  innloggetBrukerId: string
  bursdager?: Bursdag[]
  ikkePlanlagt?: IkkePlanlagt[]
  lastMerKnapp?: React.ReactNode
}) {
  const alleItems: TidslinjeItem[] = [
    ...arrangementer.map(a => ({ type: 'arrangement' as const, data: a })),
    ...bursdager.map(b => ({ type: 'bursdag' as const, data: b })),
    ...ikkePlanlagt.map(p => ({ type: 'ikke-planlagt' as const, data: p })),
  ]

  const iAar = formaterDato(new Date().toISOString(), 'yyyy')

  const tidligereItems = alleItems
    .filter(item => erItemPast(item))
    .sort((a, b) => itemDag(b).getTime() - itemDag(a).getTime())

  const idagItems = alleItems
    .filter(item => !erItemPast(item) && erItemIdag(item))
    .sort((a, b) => itemDag(a).getTime() - itemDag(b).getTime())

  const kommendeItems = alleItems
    .filter(item => !erItemPast(item) && !erItemIdag(item))
    .sort((a, b) => itemDag(a).getTime() - itemDag(b).getTime())

  function ArrangementKort({ arr, fortid, prioritert, idag }: { arr: Arrangement; fortid?: boolean; prioritert?: boolean; idag?: boolean }) {
    const iso = arr.start_tidspunkt
    const minPaamelding = arr.paameldinger.find(p => p.profil_id === innloggetBrukerId)
    const jaListe = arr.paameldinger.filter(p => p.status === 'ja')
    const jaNavnListe = jaListe.map(p => p.profiles?.visningsnavn).filter(Boolean) as string[]
    const erTur = arr.type === 'tur'
    const erSensurert = (felt: string) =>
      (arr.sensurerte_felt as Record<string, boolean> | null)?.[felt] === true
    const status = statusPill(minPaamelding?.status, fortid)

    return (
      <Link
        href={`/arrangementer/${arr.id}`}
        className="block overflow-hidden transition-transform duration-100 active:scale-[0.98] relative"
        style={{
          background: 'var(--glass-bg)',
          border: idag ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
          borderRadius: 'var(--radius)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          opacity: fortid ? 0.5 : 1,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {idag && (
          <Pill variant="accent" className="absolute top-3 right-3 z-10">
            I kveld
          </Pill>
        )}

        {/* Hero-bilde */}
        {arr.bilde_url && (
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <Image
              src={arr.bilde_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              priority={prioritert}
            />
          </div>
        )}

        {/* Innhold */}
        <div className="flex gap-4 p-4">
          {/* Dato-blokk */}
          <div className="flex flex-col items-center shrink-0" style={{ minWidth: '44px' }}>
            <span
              className="text-[11px] uppercase font-medium"
              style={{
                fontFamily: 'var(--font-mono)',
                color: idag ? 'var(--accent)' : 'var(--text-tertiary)',
                letterSpacing: '0.05em',
              }}
            >
              {formaterDato(iso, 'MMM')}
            </span>
            <span
              className="leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                color: idag ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              {formaterDato(iso, 'd')}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Pill variant="muted" size="small">{erTur ? 'Tur' : 'Møte'}</Pill>
              <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                kl. {formaterDato(iso, 'HH:mm')}
              </span>
            </div>

            <h2
              className="mb-1 leading-snug"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 400,
                color: 'var(--text-primary)',
              }}
            >
              {arr.tittel}
            </h2>

            {arr.oppmoetested && (
              <div className="flex items-center gap-1.5 mb-0.5" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <MapPinIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                {arr.oppmoetested}
              </div>
            )}

            {erTur && arr.destinasjon && (
              <div className="flex items-center gap-1.5" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <PaperAirplaneIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                {erSensurert('destinasjon') ? <SladdetFelt /> : arr.destinasjon}
              </div>
            )}

            {/* Deltakere + status */}
            <div className="flex items-center justify-between mt-3">
              {jaNavnListe.length > 0 ? (
                <DeltakerAvatarer navnliste={jaNavnListe} />
              ) : (
                <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  {fortid ? 'Ingen deltok' : 'Ingen påmeldt'}
                </span>
              )}
              <Pill variant={status.variant} size="small">{status.label}</Pill>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  function bursdagEmojier(navn: string): string {
    const emojier = ['🎂', '🎁', '🎉', '🥳', '🍾', '🎊', '🌟', '🥂', '🍻', '🍸', '💎', '🍺', '👏', '🎈', '🪅', '🎆', '🎇', '🧁', '🎀', '💐', '🪩', '🎶']
    let h = 0x811c9dc5
    for (let i = 0; i < navn.length; i++) { h ^= navn.charCodeAt(i); h = Math.imul(h, 0x01000193) }
    const a = (h >>> 0) % emojier.length
    let b = ((h >>> 8) ^ (h >>> 16)) % (emojier.length - 1)
    if (b >= a) b++
    let c = ((h >>> 4) ^ (h >>> 12)) % (emojier.length - 2)
    if (c >= Math.min(a, b)) c++
    if (c >= Math.max(a, b)) c++
    return emojier[a] + emojier[b] + emojier[c]
  }

  function BursdagNotis({ bursdag, fortid, idag }: { bursdag: Bursdag; fortid?: boolean; idag?: boolean }) {
    const dag = itemDag({ type: 'bursdag', data: bursdag })
    const erPast = isBefore(dag, norskDatoNaa())
    const verb = erPast ? 'fylte' : 'fyller'
    return (
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'var(--glass-bg)',
          border: idag ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
          borderRadius: 'var(--radius)',
          opacity: fortid ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: '20px', letterSpacing: '-3px', lineHeight: 1 }}>{bursdagEmojier(bursdag.visningsnavn)}</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            <Link href={`/klubbinfo/medlemmer/${bursdag.profilId}`} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'var(--accent)' }}>
              {bursdag.visningsnavn}
            </Link>
            {' '}{verb} {bursdag.alder} år
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {formaterDato(bursdag.dato, 'd. MMMM')}
            {formaterDato(bursdag.dato, 'yyyy') !== iAar && ` ${formaterDato(bursdag.dato, 'yyyy')}`}
          </p>
        </div>
      </div>
    )
  }

  function IkkePlanlagtKort({ data, fortid }: { data: IkkePlanlagt; fortid?: boolean }) {
    return (
      <Link
        href="/arrangoransvar"
        className="block overflow-hidden"
        style={{
          background: 'transparent',
          border: '1.5px dashed var(--border)',
          borderRadius: 'var(--radius)',
          opacity: fortid ? 0.4 : 0.7,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div className="px-5 py-5 flex items-center gap-4">
          <span
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: '44px',
              height: '44px',
              background: 'var(--glass-bg)',
              border: '1.5px dashed var(--border)',
              fontFamily: 'var(--font-display)',
              color: 'var(--text-tertiary)',
              fontSize: '22px',
            }}
          >
            ?
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
              {data.arrangementNavn}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Ikke planlagt ennå
            </p>
            {data.ansvarlige.length > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Ansvarlig{data.ansvarlige.length > 1 ? 'e' : ''}: {data.ansvarlige.join(', ')}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  function RenderItem({ item, fortid, prioritert, idag }: { item: TidslinjeItem; fortid?: boolean; prioritert?: boolean; idag?: boolean }) {
    if (item.type === 'arrangement') return <ArrangementKort arr={item.data} fortid={fortid} prioritert={prioritert} idag={idag} />
    if (item.type === 'ikke-planlagt') return <IkkePlanlagtKort data={item.data} fortid={fortid} />
    return <BursdagNotis bursdag={item.data} fortid={fortid} idag={idag} />
  }

  return (
    <div>
      {/* I dag */}
      {idagItems.length > 0 && (
        <>
          <SectionLabel>I kveld</SectionLabel>
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
          <SectionLabel>Kommende</SectionLabel>
          <div className="space-y-4">
            {kommendeItems.map((item, i) => (
              <RenderItem key={item.data.id} item={item} prioritert={idagItems.length === 0 && i === 0} />
            ))}
          </div>
        </>
      )}

      {lastMerKnapp && (
        <div className="mt-8">{lastMerKnapp}</div>
      )}

      {/* Send inn forslag */}
      <div className="mt-8 pt-8 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Savner du noe i appen?
        </p>
        <Link
          href="/bli-utvikler"
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 font-semibold"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            textDecoration: 'none',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          Send inn forslag
        </Link>
      </div>

      {/* Separator */}
      {tidligereItems.length > 0 && (idagItems.length > 0 || kommendeItems.length > 0 || lastMerKnapp) && (
        <div className="my-8" style={{ height: '1px', background: 'var(--border-subtle)' }} />
      )}

      {/* Tidligere */}
      {tidligereItems.length > 0 && (
        <>
          <SectionLabel>Tidligere</SectionLabel>
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
