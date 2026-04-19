'use client'

import { useState, useTransition } from 'react'
import { purreAnsvarlig } from '@/lib/actions/arrangoransvar'

export default function PurreKnapp({ ansvarId }: { ansvarId: string }) {
  const [isPending, startTransition] = useTransition()
  const [sendt, setSendt] = useState(false)
  const [feil, setFeil] = useState('')

  function handleKlikk() {
    if (sendt || isPending) return
    setFeil('')
    startTransition(async () => {
      try {
        await purreAnsvarlig(ansvarId)
        setSendt(true)
      } catch (err) {
        setFeil(err instanceof Error ? err.message : 'Kunne ikke purre')
      }
    })
  }

  const label = sendt ? 'Purret' : isPending ? 'Sender…' : 'Purre'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
      <button
        type="button"
        onClick={handleKlikk}
        disabled={sendt || isPending}
        style={{
          padding: '6px 12px',
          borderRadius: 999,
          background: sendt ? 'transparent' : 'var(--accent-soft)',
          border: `0.5px solid ${sendt ? 'var(--border)' : 'var(--accent)'}`,
          color: sendt ? 'var(--text-tertiary)' : 'var(--accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          cursor: sendt || isPending ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
      {feil && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            color: 'var(--danger)',
          }}
        >
          {feil}
        </span>
      )}
    </div>
  )
}
