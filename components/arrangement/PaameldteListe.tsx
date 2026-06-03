'use client'

// PaameldteListe — viser avatar-rad over påmeldte (status=ja).
// Hver avatar er en <Link> direkte til medlemsprofilen. Ved siden av står en
// «Vis liste»-knapp som åpner modal med komplett alfabetisk liste — alltid
// tilgjengelig uavhengig av antall påmeldte (#280). Tidligere ble knappen
// kun rendret ved overflow, men det skjulte navnelisten på små arrangementer.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'

export type PaameldtPerson = {
  profil_id: string
  navn: string
  bilde_url: string | null
  rolle: string | null
}

// Maks antall avatarer som vises i raden. Resten oppsummeres som "+ N til" og
// trigger modal-modus. Holdes lokal — vurdert flyttet til lib/konstanter.ts, men
// brukes kun her og er tett knyttet til layout-valg i denne komponenten.
const MAKS_I_RAD = 6

export default function PaameldteListe({ paameldinger }: { paameldinger: PaameldtPerson[] }) {
  const [modalAapen, setModalAapen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Intl.Collator er raskere enn localeCompare i loop og gir konsistent sortering
  // på tvers av kall. Sekundær-sort på profil_id sikrer stabil rekkefølge ved like navn.
  const collator = useMemo(() => new Intl.Collator('nb'), [])
  const jaListe = useMemo(() => {
    return [...paameldinger].sort((a, b) => {
      const cmp = collator.compare(a.navn, b.navn)
      return cmp !== 0 ? cmp : a.profil_id.localeCompare(b.profil_id)
    })
  }, [paameldinger, collator])

  // Escape-tast lukker modalen. body-overflow hindrer scroll bak modalen,
  // særlig viktig på iOS hvor scroll-chain lett lekker gjennom overlay.
  // Fokus flyttes inn i dialogen ved åpning og tilbake til triggeren ved lukking,
  // i tråd med WAI-ARIA modal-mønster.
  useEffect(() => {
    if (!modalAapen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalAapen(false)
    }
    document.addEventListener('keydown', onKey)
    const forrigeOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Lagre forrige fokus og flytt fokus til dialogen
    triggerRef.current = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = forrigeOverflow
      // Returnér fokus til triggeren (typisk knappen som åpnet modalen)
      triggerRef.current?.focus?.()
    }
  }, [modalAapen])

  if (jaListe.length === 0) return null

  const synligeAvatarer = jaListe.slice(0, MAKS_I_RAD)
  const antallSkjult = jaListe.length - MAKS_I_RAD
  const harOverflow = antallSkjult > 0

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 32,
        }}
      >
        {/* Avatar-rad: per-avatar Link til medlemsprofil. */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {synligeAvatarer.map((p, i) => (
            <Link
              key={p.profil_id}
              href={`/klubbinfo/medlemmer/${p.profil_id}`}
              aria-label={p.navn}
              style={{
                display: 'block',
                textDecoration: 'none',
                marginLeft: i === 0 ? 0 : -12,
                zIndex: MAKS_I_RAD - i,
                border: '3px solid var(--bg)',
                borderRadius: '50%',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <Avatar name={p.navn} size={44} src={p.bilde_url} rolle={p.rolle} />
            </Link>
          ))}
        </div>

        {/* «+ N til»-pill kun ved overflow. */}
        {harOverflow && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            + {antallSkjult} til
          </span>
        )}

        {/* «Vis liste»-knapp alltid synlig — uavhengig av antall (#280). */}
        <button
          type="button"
          onClick={() => setModalAapen(true)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            background: 'transparent',
            border: '0.5px solid var(--border)',
            borderRadius: 999,
            padding: '8px 14px',
            cursor: 'pointer',
            minHeight: 36,
            marginLeft: 4,
          }}
        >
          Vis liste
        </button>
      </div>

      {/* Modal: alfabetisk liste over alle påmeldte. Alltid tilgjengelig via «Vis liste». */}
      {modalAapen && (
        // Backdrop — klikk utenfor kortet lukker modalen
        <div
          onClick={() => setModalAapen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          {/* Stopp propagasjon så klikk på selve kortet ikke lukker. tabIndex=-1
              gjør at .focus() kan flyttes hit programmatisk uten å gjøre kortet tab-bart. */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Påmeldte"
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              maxHeight: '80vh',
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              outline: 'none',
            }}
          >
            {/* Modal-header med eksplisitt Lukk-knapp.
                Escape og klikk-utenfor lukker også, men en synlig knapp er nødvendig
                for tastaturbrukere og touch-brukere som ikke kjenner gesten. */}
            <div
              style={{
                padding: '18px 20px 14px',
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '-0.2px',
                color: 'var(--text-primary)',
                borderBottom: '0.5px solid var(--border-subtle)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ flex: 1 }}>Påmeldt ({jaListe.length})</span>
              <button
                type="button"
                onClick={() => setModalAapen(false)}
                aria-label="Lukk"
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M4 4l10 10M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollbar liste */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {jaListe.map((p, i) => (
                <Link
                  key={p.profil_id}
                  href={`/klubbinfo/medlemmer/${p.profil_id}`}
                  onClick={() => setModalAapen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    textDecoration: 'none',
                    // Skillelinje mellom rader: 0.5px border-subtle (ikke første rad)
                    borderTop: i > 0 ? '0.5px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <Avatar name={p.navn} size={40} src={p.bilde_url} rolle={p.rolle} />
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-body)',
                      fontSize: 15,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p.navn}
                  </span>
                  {/* Chevron som visuell affordance for at raden er klikkbar */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
                  >
                    <path
                      d="M6 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
