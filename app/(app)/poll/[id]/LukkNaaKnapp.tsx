'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { lukkKaaringspollNaa } from '@/lib/actions/kaaringspoll'

export default function LukkNaaKnapp({ pollId }: { pollId: string }) {
  const [isPending, startTransition] = useTransition()
  const [feil, setFeil] = useState<string | null>(null)
  const router = useRouter()

  function handleLukk() {
    if (!confirm('Vil du lukke kåringen nå? Dette kan ikke angres.')) return
    setFeil(null)
    startTransition(async () => {
      try {
        await lukkKaaringspollNaa(pollId)
        router.refresh()
      } catch (err) {
        setFeil(err instanceof Error ? err.message : 'Kunne ikke lukke kåringen')
      }
    })
  }

  return (
    <div style={{ marginTop: 24 }}>
      <button
        type="button"
        onClick={handleLukk}
        disabled={isPending}
        style={{
          display: 'block',
          width: '100%',
          padding: '14px 0',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 999,
          color: 'var(--danger)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 500,
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Lukker…' : 'Lukk kåringen nå'}
      </button>
      {feil && (
        <p
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--danger)',
            textAlign: 'center',
          }}
        >
          {feil}
        </p>
      )}
    </div>
  )
}
