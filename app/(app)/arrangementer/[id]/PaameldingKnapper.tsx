'use client'

import { useTransition } from 'react'
import { oppdaterPaamelding } from '@/lib/actions/paameldinger'

const valg = [
  { status: 'ja', label: 'Ja', ikon: '✓', aktiv: 'var(--gronn)' },
  { status: 'kanskje', label: 'Kanskje', ikon: '?', aktiv: 'rgba(193,127,36,0.7)' },
  { status: 'nei', label: 'Nei', ikon: '✗', aktiv: '#7f1d1d' },
] as const

export default function PaameldingKnapper({
  arrangementId,
  minStatus,
}: {
  arrangementId: string
  minStatus?: 'ja' | 'nei' | 'kanskje'
}) {
  const [isPending, startTransition] = useTransition()

  function velg(status: 'ja' | 'nei' | 'kanskje') {
    startTransition(async () => {
      await oppdaterPaamelding(arrangementId, status)
    })
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--tekst-dempet)' }}>
        Kommer du?
      </p>
      <div className="flex gap-2">
        {valg.map(({ status, label, ikon, aktiv }) => {
          const erAktiv = minStatus === status
          return (
            <button
              key={status}
              onClick={() => velg(status)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
              style={{
                background: erAktiv ? aktiv : 'var(--bakgrunn)',
                border: `1px solid ${erAktiv ? aktiv : 'var(--border)'}`,
                color: erAktiv ? '#fff' : 'var(--tekst-dempet)',
              }}
            >
              {ikon} {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
