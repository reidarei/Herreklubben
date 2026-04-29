'use client'

import { useState, type ReactNode } from 'react'

type Props = {
  tittel: string
  /** Vises alltid — også når kortet er kollapset. Kort sammendrag av status. */
  oppsummering?: ReactNode
  /** Liten markering til høyre (f.eks. ulest-antall). Vises alltid. */
  badge?: ReactNode
  /** Hvis satt vises beskrivelsen som hjelpetekst når åpent. */
  beskrivelse?: string
  /** Hvis true er kortet ikke kollapsbart — children rendres alltid. */
  alltidAapen?: boolean
  defaultApen?: boolean
  children: ReactNode
}

/**
 * Kort på innstillinger-siden. Header-raden er alltid synlig med
 * tittel og kort oppsummering. Klikk for å ekspandere full visning.
 * Kort med `alltidAapen` har ingen toggle og rendrer children direkte.
 */
export default function InnstillingsKort({
  tittel,
  oppsummering,
  badge,
  beskrivelse,
  alltidAapen = false,
  defaultApen = false,
  children,
}: Props) {
  const [apen, setApen] = useState(defaultApen)
  const erAapen = alltidAapen || apen

  const headerInnhold = (
    <>
      {!alltidAapen && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: erAapen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease-out',
            flexShrink: 0,
            color: 'var(--text-tertiary)',
          }}
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}
        >
          {tittel}
        </div>
        {oppsummering && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.6px',
              marginTop: 3,
            }}
          >
            {oppsummering}
          </div>
        )}
      </div>

      {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
    </>
  )

  return (
    <div
      style={{
        marginBottom: 12,
        borderRadius: 12,
        border: '0.5px solid var(--border)',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
      }}
    >
      {alltidAapen ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
          }}
        >
          {headerInnhold}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setApen(v => !v)}
          aria-expanded={apen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {headerInnhold}
        </button>
      )}

      {erAapen && (
        <div
          style={{
            padding: alltidAapen ? '0 16px 14px' : '4px 16px 16px',
            borderTop: alltidAapen ? 'none' : '0.5px solid var(--border-subtle)',
          }}
        >
          {beskrivelse && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-tertiary)',
                lineHeight: 1.45,
                margin: '12px 0 14px',
              }}
            >
              {beskrivelse}
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
