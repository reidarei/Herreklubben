'use client'

import { type CSSProperties } from 'react'
import Icon from '@/components/ui/Icon'

// Sheet-dialog som vises ved opprett av nytt arrangement utenfor årskalenderen,
// eller ved valg av "Annet" i dropdown. Brukeren velger om arrangementet skal
// bruke møte-skjema eller tur-skjema. Valget mapper til Bonusmøte/Bonustur
// i DB — UI-laget skjuler den detaljen.

const knappStil: CSSProperties = {
  flex: 1,
  padding: '24px 16px',
  borderRadius: 20,
  border: '0.5px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)',
  fontSize: 22,
  fontWeight: 500,
  letterSpacing: '-0.3px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  transition: 'transform 120ms ease',
}

const undertekstStil: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
}

export default function NyttDialog({
  onVelg,
  onLukk,
}: {
  onVelg: (stil: 'moete' | 'tur') => void
  onLukk?: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Velg type arrangement"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(6, 6, 8, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onLukk}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg)',
          borderRadius: 24,
          padding: '28px 22px 24px',
          border: '0.5px solid var(--border-strong)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ ...undertekstStil, marginBottom: 6 }}>Nytt arrangement</div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.4px',
              margin: 0,
            }}
          >
            Møte eller tur?
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => onVelg('moete')}
            style={knappStil}
          >
            <Icon name="users" size={28} color="var(--accent)" strokeWidth={1.5} />
            <span>Møte</span>
            <span style={undertekstStil}>Samling</span>
          </button>
          <button
            type="button"
            onClick={() => onVelg('tur')}
            style={knappStil}
          >
            <Icon name="plane" size={28} color="var(--accent)" strokeWidth={1.5} />
            <span>Tur</span>
            <span style={undertekstStil}>Med destinasjon</span>
          </button>
        </div>

        {onLukk && (
          <button
            type="button"
            onClick={onLukk}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Avbryt
          </button>
        )}
      </div>
    </div>
  )
}
