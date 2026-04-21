'use client'

// TypeVelger — dropdown som lister alle uoppfylte arrangement-maler
// (unike (aar, arrangement_navn)-kombinasjoner fra arrangoransvar-tabellen
// hvor arrangement_id er null og det finnes tildelte ansvarlige).
// Alltid et "Annet"-valg nederst for fritt arrangement uten ansvar-kobling.
//
// Sortering: (aar asc, purredato asc nulls last), "Annet" alltid sist.

import type { CSSProperties } from 'react'

export type MalValg = {
  // Stabilt nøkkel for React-rendering og seleksjon: `${arrangement_navn}::${aar ?? ''}`
  key: string
  mal_navn: string // 'Mai-juni møte' | ... | 'Annet'
  aar: number | null // null for "Annet"
  type: 'moete' | 'tur' | null // null for "Annet" — brukeren må velge
  purredato: string | null // 'YYYY-MM-DD' med riktig år (ikke mal-dato med år 2000)
  ansvarlige: string[] // navn, kun for visning/tooltip
}

export const ANNET_KEY = 'Annet::'

export function byggAnnetValg(): MalValg {
  return {
    key: ANNET_KEY,
    mal_navn: 'Annet',
    aar: null,
    type: null,
    purredato: null,
    ansvarlige: [],
  }
}

type Props = {
  valg: MalValg[]
  valgtKey: string
  onValg: (v: MalValg) => void
}

const monoLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9.5,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  marginBottom: 4,
}

const inputStil: CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  outline: 'none',
  padding: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
}

export default function TypeVelger({ valg, valgtKey, onValg }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = valg.find(x => x.key === e.target.value)
    if (v) onValg(v)
  }

  return (
    <div>
      <div style={monoLabel}>Arrangement</div>
      <select value={valgtKey} onChange={handleChange} style={inputStil}>
        {valg.map(v => (
          <option key={v.key} value={v.key}>
            {v.mal_navn}
            {v.aar != null ? ` (${v.aar})` : ''}
            {v.ansvarlige.length > 0 ? ` — ${v.ansvarlige.join(', ')}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
