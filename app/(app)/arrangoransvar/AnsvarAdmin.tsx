'use client'

import { useState, useTransition } from 'react'
import { leggTilAnsvarlig, fjernAnsvarlig } from '@/lib/actions/arrangoransvar'

const selectStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.35rem 0.5rem',
  fontSize: '0.8125rem',
  flex: 1,
  minWidth: 0,
  fontFamily: 'inherit',
}

export default function AnsvarAdmin({
  ansvarlige,
  arrangementNavn,
  aar,
  medlemmer,
}: {
  ansvarlige: { ansvarId: string; profilId: string }[]
  arrangementNavn: string
  aar: number
  medlemmer: { id: string; navn: string }[]
}) {
  const [aapen, setAapen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const tildelte = new Set(ansvarlige.map(a => a.profilId))
  const tilgjengelige = medlemmer.filter(m => !tildelte.has(m.id))

  function handleLeggTil(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const profilId = fd.get('ansvarlig_id') as string
    if (!profilId) return
    startTransition(async () => {
      await leggTilAnsvarlig({ aar, arrangement_navn: arrangementNavn, ansvarlig_id: profilId })
    })
    e.currentTarget.reset()
  }

  function handleFjern(ansvarId: string) {
    startTransition(async () => {
      await fjernAnsvarlig(ansvarId)
    })
  }

  if (!aapen) {
    return (
      <button
        onClick={() => setAapen(true)}
        className="text-xs px-2 py-1 rounded-lg shrink-0"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'inherit', cursor: 'pointer' }}
      >
        Endre
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2" style={{ opacity: isPending ? 0.5 : 1 }}>
      {/* Nåværende ansvarlige med fjern-knapp */}
      {ansvarlige.map(a => {
        const navn = medlemmer.find(m => m.id === a.profilId)?.navn ?? '–'
        return (
          <div key={a.ansvarId} className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{navn}</span>
            <button
              type="button"
              onClick={() => handleFjern(a.ansvarId)}
              disabled={isPending}
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--destructive)', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )
      })}

      {/* Legg til ny */}
      {tilgjengelige.length > 0 && (
        <form onSubmit={handleLeggTil} className="flex gap-2 items-center">
          <select name="ansvarlig_id" defaultValue="" style={selectStil}>
            <option value="" disabled>Legg til…</option>
            {tilgjengelige.map(m => <option key={m.id} value={m.id}>{m.navn}</option>)}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="text-xs px-2 py-1 rounded-lg shrink-0"
            style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            +
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => setAapen(false)}
        className="text-xs px-2 py-1 rounded-lg"
        style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
      >
        Ferdig
      </button>
    </div>
  )
}
