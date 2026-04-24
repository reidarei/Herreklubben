'use client'

import { useState, useTransition, type MouseEvent, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import { sendMelding, sendPollMelding } from '@/lib/actions/chat'
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

export type KommentarScope =
  | { type: 'arrangement'; id: string }
  | { type: 'poll'; id: string }

function snippet(tekst: string, maks = 90): string {
  const rensket = tekst.replace(/\s+/g, ' ').trim()
  if (rensket.length <= maks) return rensket
  return rensket.slice(0, maks - 1) + '…'
}

function relativTid(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { locale: nb, addSuffix: true })
}

/**
 * Kollapsbar kommentar-seksjon på arrangement- og pollkort. Viser opp til 3
 * siste kommentarer og har et inline input-felt under dem for å legge til
 * ny kommentar uten å navigere bort fra agenda.
 *
 * Alle klikk og tastatur-hendelser må stoppe propagasjon — ellers trigger
 * den ytre Link-wrapperen navigering til detaljsiden. Default ekspandert.
 */
export default function KommentarerPaaKort({
  kommentarer,
  scope,
}: {
  kommentarer: KommentarKortData[]
  scope: KommentarScope
}) {
  const [apen, setApen] = useState(true)
  const [tekst, setTekst] = useState('')
  const [sender, startTransition] = useTransition()
  const router = useRouter()

  function toggle(e: MouseEvent<HTMLSpanElement> | KeyboardEvent<HTMLSpanElement>) {
    e.preventDefault()
    e.stopPropagation()
    setApen(v => !v)
  }

  function stopp(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleSend(e?: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLInputElement>) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const melding = tekst.trim()
    if (!melding || sender) return
    setTekst('')

    startTransition(async () => {
      try {
        if (scope.type === 'arrangement') {
          await sendMelding(scope.id, melding)
        } else {
          await sendPollMelding(scope.id, melding)
        }
        router.refresh()
      } catch {
        // Gjenopprett tekst ved feil så brukeren ikke mister det de skrev
        setTekst(melding)
      }
    })
  }

  return (
    <div
      style={{
        borderTop: '0.5px solid var(--border-subtle)',
        padding: '10px 14px 12px 16px',
      }}
      onClick={stopp}
    >
      {/* Toggle-header vises kun hvis det er kommentarer å skjule */}
      {kommentarer.length > 0 && (
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
      )}

      {/* Kommentar-liste — kun synlig når ekspandert */}
      {apen && kommentarer.length > 0 && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {kommentarer.map(k => (
            <div key={k.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
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

      {/* Inline kommentar-input — alltid synlig når seksjonen er åpen (eller
          når det ikke er kommentarer ennå) */}
      {(apen || kommentarer.length === 0) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: kommentarer.length > 0 ? 10 : 0,
            padding: '6px 6px 6px 12px',
            border: '0.5px solid var(--border)',
            borderRadius: 999,
            background: 'var(--bg-elevated)',
          }}
          onClick={stopp}
        >
          <input
            type="text"
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            onClick={stopp}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSend(e)
              }
            }}
            placeholder="Skriv en kommentar…"
            maxLength={500}
            enterKeyHint="send"
            autoComplete="off"
            disabled={sender}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!tekst.trim() || sender}
            aria-label="Send kommentar"
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--accent)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !tekst.trim() || sender ? 'default' : 'pointer',
              opacity: !tekst.trim() || sender ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            <Icon name="arrowRight" size={12} color="#0a0a0a" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}
