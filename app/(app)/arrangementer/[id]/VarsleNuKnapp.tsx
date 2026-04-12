'use client'

import { useState } from 'react'
import { varslOmArrangement } from '@/lib/actions/arrangementer'
import Button from '@/components/ui/Button'

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

  return (
    <Button
      onClick={handleVarsle}
      disabled={status === 'sender'}
      variant={status === 'ok' ? 'primary' : status === 'feil' ? 'destructive' : 'secondary'}
      className="text-sm"
    >
      {status === 'sender' ? 'Sender...' : status === 'ok' ? '✓ Varslet' : status === 'feil' ? '✗ Feil' : 'Varsle om oppdatering'}
    </Button>
  )
}
