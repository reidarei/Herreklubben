'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import KommentarerPaaKort, { type KommentarKortData } from '@/components/agenda/KommentarerPaaKort'
import MeldingReaksjoner, { type ReaksjonGruppe } from '@/components/agenda/MeldingReaksjoner'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'

export type MeldingKortData = {
  id: string
  innhold: string
  opprettet: string
  sist_aktivitet: string
  forfatter: {
    id: string
    navn: string
    bilde_url: string | null
    rolle: string | null
  }
  reaksjoner: ReaksjonGruppe[]
  antallKommentarer: number
  /** Visuell dempning når kortet ligger i Tidligere-seksjonen */
  tidligere: boolean
}

function relativTid(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { locale: nb, addSuffix: true })
}

// 350 ms vinner kappløpet mot iOS sin innebygde link-preview (~500 ms).
// Hadde vi ligget på 500 ms ville Safari-menyen kunne dukke opp først.
const LONG_PRESS_MS = 350

type Props = {
  melding: MeldingKortData
  brukerId: string
  kommentarer?: KommentarKortData[]
}

/**
 * Fjerde type element på agendaen — innlegg à la Facebook-status.
 * Plasseres øverst på agenda i 7 dager (eller så lenge det er aktivitet
 * de siste 2 dagene). Etter det faller den ned i Tidligere-seksjonen
 * sortert på sist_aktivitet. Se lib/agenda-sortering.ts for regelverket.
 *
 * Long-press på selve innlegget åpner reaksjons-picker — samme mønster
 * som chat-bobler bruker. Vanlig click navigerer til detaljsiden.
 */
export default function MeldingKort({ melding, brukerId, kommentarer = [] }: Props) {
  const [pickerApen, setPickerApen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  function startLongPress() {
    if (melding.tidligere) return
    longPressFired.current = false
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      setPickerApen(true)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(15)
      }
    }, LONG_PRESS_MS)
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleLinkClick(e: React.MouseEvent) {
    // Hvis long-press fikk åpnet picker, hindre at samme tap navigerer
    if (longPressFired.current) {
      e.preventDefault()
      e.stopPropagation()
      longPressFired.current = false
    }
  }

  // iOS sin link-preview trigges på selve <a>-tagen — touch-callout
  // settes derfor på Link. Vi unngår user-select: none på Link siden
  // det vil blokkere tekst-seleksjon i kommentar-inputen lenger nede.
  return (
    <Link
      href={`/meldinger/${melding.id}`}
      onClick={handleLinkClick}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        WebkitTouchCallout: 'none',
      }}
    >
      <Card
        padding={false}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          opacity: melding.tidligere ? 0.62 : 1,
          borderRadius: 'var(--radius-card)',
        }}
      >
        <div
          onTouchStart={startLongPress}
          onTouchEnd={clearLongPress}
          onTouchMove={clearLongPress}
          onTouchCancel={clearLongPress}
          onMouseDown={startLongPress}
          onMouseUp={clearLongPress}
          onMouseLeave={clearLongPress}
          style={{
            padding: '10px 14px',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          {/* Forfatter-rad */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Avatar
              name={melding.forfatter.navn}
              size={26}
              src={melding.forfatter.bilde_url}
              rolle={melding.forfatter.rolle}
            />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {melding.forfatter.navn}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                }}
              >
                {relativTid(melding.opprettet)}
              </span>
            </div>
          </div>

          {/* Innhold */}
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              marginBottom:
                !melding.tidligere && (melding.reaksjoner.length > 0 || pickerApen) ? 8 : 0,
            }}
          >
            {melding.innhold}
          </div>

          {/* Reaksjons-rad — vises kun hvis det finnes reaksjoner eller
              picker er åpen. Picker styres av long-press over. */}
          {!melding.tidligere && (
            <MeldingReaksjoner
              meldingId={melding.id}
              brukerId={brukerId}
              reaksjoner={melding.reaksjoner}
              pickerApen={pickerApen}
              lukkPicker={() => setPickerApen(false)}
            />
          )}
        </div>

        {/* Kommentarer — kun på levende meldinger */}
        {!melding.tidligere && (
          <KommentarerPaaKort
            kommentarer={kommentarer}
            scope={{ type: 'melding', id: melding.id }}
          />
        )}
      </Card>
    </Link>
  )
}
