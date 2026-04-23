'use client'

import { useState, type MouseEvent, type KeyboardEvent } from 'react'
import Avatar from '@/components/ui/Avatar'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'

export type KommentarKortData = {
  id: string
  innhold: string
  opprettet: string
  avsender: {
    navn: string
    bilde_url: string | null
    rolle: string | null
  }
}

function snippet(tekst: string, maks = 90): string {
  const rensket = tekst.replace(/\s+/g, ' ').trim()
  if (rensket.length <= maks) return rensket
  return rensket.slice(0, maks - 1) + '…'
}

function relativTid(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { locale: nb, addSuffix: true })
}

/**
 * Kollapsbar kommentar-seksjon som rendres nederst på arrangement- og poll-
 * kort på agenda. Viser opp til 3 siste kommentarer.
 *
 * Ligger inni en Link (kortet), så toggle og selve seksjonen må
 * preventDefault + stopPropagation for ikke å trigge navigering. Default
 * ekspandert — brukeren kan kollapse for å redusere støy.
 */
export default function KommentarerPaaKort({
  kommentarer,
}: {
  kommentarer: KommentarKortData[]
}) {
  const [apen, setApen] = useState(true)
  if (kommentarer.length === 0) return null

  function toggle(e: MouseEvent<HTMLSpanElement> | KeyboardEvent<HTMLSpanElement>) {
    e.preventDefault()
    e.stopPropagation()
    setApen(v => !v)
  }

  function stopp(e: MouseEvent) {
    // Klikk inni selve listen skal heller ikke navigere kortet — brukeren
    // kan klikke på hele Kommenter-knappen ellers.
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      style={{
        borderTop: '0.5px solid var(--border-subtle)',
        padding: '10px 14px 12px 16px',
      }}
      onClick={stopp}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') toggle(e)
        }}
        aria-expanded={apen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-tertiary)',
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '2px 0',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: apen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease-out',
          }}
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
        {kommentarer.length} {kommentarer.length === 1 ? 'kommentar' : 'kommentarer'}
      </span>

      {apen && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {kommentarer.map(k => (
            <div
              key={k.id}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <Avatar
                name={k.avsender.navn}
                size={18}
                src={k.avsender.bilde_url}
                rolle={k.avsender.rolle}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {k.avsender.navn}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      color: 'var(--text-tertiary)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {relativTid(k.opprettet)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.35,
                  }}
                >
                  {snippet(k.innhold)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
