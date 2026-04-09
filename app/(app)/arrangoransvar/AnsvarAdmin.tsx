'use client'

import { useState, useTransition } from 'react'
import { lagreAnsvarlig } from '@/lib/actions/arrangoransvar'

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
  ansvarId,
  arrangementNavn,
  aar,
  ansvarligId,
  medlemmer,
}: {
  ansvarId?: string
  arrangementNavn: string
  aar: number
  ansvarligId?: string | null
  medlemmer: { id: string; navn: string }[]
}) {
  const [aapen, setAapen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await lagreAnsvarlig({
        id: ansvarId,
        aar,
        arrangement_navn: arrangementNavn,
        ansvarlig_id: (fd.get('ansvarlig_id') as string) || null,
      })
      setAapen(false)
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
    <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-2">
      <select name="ansvarlig_id" defaultValue={ansvarligId ?? ''} style={selectStil}>
        <option value="">— Ingen —</option>
        {medlemmer.map(m => <option key={m.id} value={m.id}>{m.navn}</option>)}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="text-xs px-2 py-1 rounded-lg shrink-0"
        style={{ background: 'var(--accent)', color: '#fff', opacity: isPending ? 0.5 : 1, fontFamily: 'inherit', cursor: 'pointer' }}
      >
        {isPending ? '…' : 'OK'}
      </button>
      <button
        type="button"
        onClick={() => setAapen(false)}
        className="text-xs px-2 py-1 rounded-lg shrink-0"
        style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
      >
        ✕
      </button>
    </form>
  )
}
