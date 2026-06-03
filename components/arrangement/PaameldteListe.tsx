'use client'

// PaameldteListe — klikk på avatar-raden åpner modal med alfabetisk navneliste.
// Erstatter inline avatar-rad i arrangementer/[id]/page.tsx (#272).

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'

export type PaameldtPerson = {
  profil_id: string
  status: 'ja' | 'kanskje' | 'nei'
  navn: string
  bilde_url: string | null
  rolle: string | null
}

// Maks antall avatarer som vises i raden. Resten oppsummeres som "+ N til".
const MAKS_I_RAD = 6

export default function PaameldteListe({ paameldinger }: { paameldinger: PaameldtPerson[] }) {
  const [modalAapen, setModalAapen] = useState(false)

  // Filtrér til kun ja-svar, sortér alfabetisk — samme subset som vises i UI.
  const jaListe = [...paameldinger]
    .filter(p => p.status === 'ja')
    .sort((a, b) => a.navn.localeCompare(b.navn, 'nb'))

  // Escape-tast lukker modalen. body-overflow hindrer scroll bak modalen,
  // særlig viktig på iOS hvor scroll-chain lett lekker gjennom overlay.
  useEffect(() => {
    if (!modalAapen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalAapen(false)
    }
    document.addEventListener('keydown', onKey)
    const forrigeOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = forrigeOverflow
    }
  }, [modalAapen])

  if (jaListe.length === 0) return null

  const synligeAvatarer = jaListe.slice(0, MAKS_I_RAD)
  const antallSkjult = jaListe.length - MAKS_I_RAD

  return (
    <>
      {/* Klikk på raden åpner modal — hele flaten er interaktiv */}
      <button
        type="button"
        onClick={() => setModalAapen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          marginBottom: 32,
        }}
      >
        {/* Stablet avatar-rad med negativ margin for overlapp */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {synligeAvatarer.map((p, i) => (
            <div
              key={p.profil_id}
              style={{
                marginLeft: i === 0 ? 0 : -12,
                zIndex: MAKS_I_RAD - i,
                border: '3px solid var(--bg)',
                borderRadius: '50%',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <Avatar name={p.navn} size={44} src={p.bilde_url} rolle={p.rolle} />
            </div>
          ))}
        </div>

        {/* "+ N til" hvis flere enn MAKS_I_RAD er påmeldt */}
        {antallSkjult > 0 && (
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

        {/* Ekstra affordance — synlig oppfordring til å trykke */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: '1px',
            marginLeft: 4,
          }}
        >
          Se alle
        </span>
      </button>

      {/* Modal: alfabetisk liste over alle påmeldte */}
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
          {/* Stopp propagasjon så klikk på selve kortet ikke lukker */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Påmeldte"
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
            }}
          >
            {/* Modal-header */}
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
              }}
            >
              Påmeldt ({jaListe.length})
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
