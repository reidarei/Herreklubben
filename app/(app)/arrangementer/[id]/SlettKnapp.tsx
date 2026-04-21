'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { slettArrangement } from '@/lib/actions/arrangementer'

const labelStil: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--text-tertiary)',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontWeight: 600,
}

export default function SlettKnapp({ arrangementId }: { arrangementId: string }) {
  const [visBekreft, setVisBekreft] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSlett() {
    startTransition(async () => {
      await slettArrangement(arrangementId)
    })
  }

  return (
    <section style={{ marginTop: 32, marginBottom: 20 }}>
      <div style={labelStil}>
        <span>Faresone</span>
        <span style={{ flex: 1, height: '0.5px', background: 'var(--border-subtle)' }} />
      </div>

      {!visBekreft ? (
        <button
          type="button"
          onClick={() => setVisBekreft(true)}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: 999,
            background: 'color-mix(in srgb, #d97a6c 12%, transparent)',
            border: '1px solid color-mix(in srgb, #d97a6c 45%, transparent)',
            color: '#d97a6c',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          Slett arrangement
        </button>
      ) : (
        <div
          style={{
            padding: '18px 18px 16px',
            borderRadius: 18,
            border: '1px solid color-mix(in srgb, #d97a6c 35%, transparent)',
            background: 'color-mix(in srgb, #d97a6c 8%, transparent)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              margin: '0 0 14px',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Er du sikker? Arrangementet og alle påmeldinger slettes. Dette kan ikke angres.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setVisBekreft(false)}
              disabled={isPending}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleSlett}
              disabled={isPending}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 999,
                border: 'none',
                background: '#d97a6c',
                color: '#0a0a0a',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'Sletter…' : 'Ja, slett'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
