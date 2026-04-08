'use client'

import { useTransition } from 'react'
import { oppdaterVarselInnstilling } from '@/app/(app)/innstillinger/actions'

export default function VarselToggle({
  noekkel,
  aktiv,
  beskrivelse,
}: {
  noekkel: string
  aktiv: boolean
  beskrivelse: string
}) {
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(() => oppdaterVarselInnstilling(noekkel, !aktiv))
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs" style={{ color: 'var(--tekst-dempet)' }}>{beskrivelse}</span>
      <button
        onClick={toggle}
        disabled={isPending}
        className="relative shrink-0 rounded-full transition-colors disabled:opacity-50"
        style={{
          width: 40,
          height: 22,
          background: aktiv ? 'var(--aksent)' : 'var(--border)',
        }}
      >
        <span
          className="block rounded-full bg-white transition-transform"
          style={{
            width: 16,
            height: 16,
            margin: 3,
            transform: aktiv ? 'translateX(18px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}
