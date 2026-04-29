'use client'

import { useState, type ReactNode } from 'react'

type Props = {
  tittel: string
  antall?: number
  /** Hvis satt vises som kort hjelpetekst under tittelen mens åpen */
  beskrivelse?: string
  defaultApen?: boolean
  children: ReactNode
}

/**
 * Kollapsbar seksjon for innstillingssiden. Klikk på header-en
 * vipper mellom åpen/lukket. Default lukket — siden er lang og
 * brukeren skal kunne skanne overskriftene først.
 */
export default function KollapsbarSeksjon({
  tittel,
  antall,
  beskrivelse,
  defaultApen = false,
  children,
}: Props) {
  const [apen, setApen] = useState(defaultApen)

  return (
    <section style={{ marginBottom: 18 }}>
      <button
        type="button"
        onClick={() => setApen(v => !v)}
        aria-expanded={apen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '1.6px',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: apen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease-out',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span>{tittel}</span>
        {typeof antall === 'number' && (
          <span style={{ color: 'var(--text-secondary)' }}>{antall}</span>
        )}
        <span style={{ flex: 1, height: '0.5px', background: 'var(--border-subtle)' }} />
      </button>

      {apen && (
        <div style={{ marginTop: 10 }}>
          {beskrivelse && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-tertiary)',
                lineHeight: 1.45,
                margin: '0 0 12px',
              }}
            >
              {beskrivelse}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  )
}
