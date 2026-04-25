'use client'

import { useState } from 'react'
import PassInfoSkjema from './PassInfoSkjema'
import { formaterDato } from '@/lib/dato'

type Props = {
  nummer: string | null
  utloper: string | null // YYYY-MM-DD
}

function sladdet(nummer: string): string {
  const siste4 = nummer.slice(-4)
  return '••••• ' + siste4
}

/**
 * Pass-info på profilsiden. Viser dashed-border kort med oppfordring
 * når tom; vis kompakt rad med sladdet nummer + utløp når fylt.
 * Kun eier ser dette (RLS i DB håndhever).
 */
export default function PassInfoKort({ nummer, utloper }: Props) {
  const [redigerer, setRedigerer] = useState(false)
  const harData = nummer && utloper

  if (redigerer) {
    return (
      <div
        style={{
          padding: '14px 16px',
          background: 'var(--bg-elevated)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--accent)',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Pass-info
        </div>
        <PassInfoSkjema
          initialNummer={nummer ?? ''}
          initialUtloper={utloper ?? ''}
          onAvbryt={() => setRedigerer(false)}
        />
      </div>
    )
  }

  if (!harData) {
    return (
      <button
        type="button"
        onClick={() => setRedigerer(true)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '14px 16px',
          background: 'transparent',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-card)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Pass-info — fyll ut her
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          Slik slipper reiseansvarlig å mase når en tur skal bookes. Bare du ser
          det — ingen andre får tilgang før du eventuelt godkjenner det via
          generalsekretæren.
        </div>
      </button>
    )
  }

  return (
    <div
      style={{
        padding: '14px 16px',
        background: 'var(--bg-elevated)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--accent)',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Pass-info
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--text-primary)',
            letterSpacing: '0.5px',
          }}
        >
          {sladdet(nummer!)} · gyldig til {formaterDato(`${utloper}T12:00:00Z`, 'd. MMM yyyy')}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setRedigerer(true)}
        style={{
          padding: '8px 14px',
          background: 'transparent',
          border: '0.5px solid var(--border)',
          borderRadius: 999,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Endre
      </button>
    </div>
  )
}
