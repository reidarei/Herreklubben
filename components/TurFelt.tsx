'use client'

import React from 'react'

export default function TurFelt({
  felt,
  label,
  type = 'text',
  hemmelig,
  onToggle,
  defaultValue,
  inputStil,
}: {
  felt: string
  label: string
  type?: string
  hemmelig: boolean
  onToggle: () => void
  defaultValue?: string | number
  inputStil: React.CSSProperties
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--tekst-dempet)', marginBottom: '0.375rem' }}>
        {label}
      </label>

      {/* Valg: skriv inn eller hemmelig */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => hemmelig && onToggle()}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            background: !hemmelig ? 'var(--aksent)' : 'var(--bakgrunn-kort)',
            border: `1px solid ${!hemmelig ? 'var(--aksent)' : 'var(--border)'}`,
            color: !hemmelig ? '#fff' : 'var(--tekst-dempet)',
          }}
        >
          Oppgi
        </button>
        <button
          type="button"
          onClick={() => !hemmelig && onToggle()}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          style={{
            background: hemmelig ? '#1a0a0a' : 'var(--bakgrunn-kort)',
            border: `1px solid ${hemmelig ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`,
            color: hemmelig ? '#ccc' : 'var(--tekst-dempet)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              background: '#000',
              width: '3.5rem',
              height: '0.75em',
              borderRadius: '1px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          />
          Hemmelig
        </button>
      </div>

      {/* Input vises kun når ikke hemmelig */}
      {!hemmelig && (
        <input
          name={felt}
          type={type}
          min={type === 'number' ? 0 : undefined}
          defaultValue={defaultValue}
          style={inputStil}
        />
      )}
    </div>
  )
}
