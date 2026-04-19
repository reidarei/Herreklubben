'use client'

import { useState } from 'react'
import { varslOmArrangement } from '@/lib/actions/arrangementer'

export default function VarsleNuKnapp({ arrangementId }: { arrangementId: string }) {
  const [status, setStatus] = useState<'idle' | 'sender' | 'ok' | 'feil'>('idle')

  async function handleVarsle() {
    setStatus('sender')
    try {
      await varslOmArrangement(arrangementId)
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('feil')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const tekst =
    status === 'sender'
      ? 'Sender…'
      : status === 'ok'
      ? 'Varslet'
      : status === 'feil'
      ? 'Feil'
      : 'Varsle'

  return (
    <button
      onClick={handleVarsle}
      disabled={status === 'sender'}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        background: 'rgba(10,10,12,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '0.5px solid var(--border)',
        color:
          status === 'ok'
            ? 'var(--success)'
            : status === 'feil'
            ? 'var(--danger)'
            : 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 500,
        cursor: status === 'sender' ? 'default' : 'pointer',
        opacity: status === 'sender' ? 0.6 : 1,
      }}
    >
      {tekst}
    </button>
  )
}
