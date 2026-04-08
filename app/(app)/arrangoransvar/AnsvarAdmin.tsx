'use client'

import { useState, useTransition } from 'react'
import { lagreAnsvar, slettAnsvar } from '@/lib/actions/arrangoransvar'

type Medlem = { id: string; navn: string }

const inputStil = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.875rem',
}

// Foreslåtte navn basert på månedsnavn
const navneforslag = [
  'januar-februar', 'mars-april', 'mai-juni',
  'august-september', 'oktober-november', 'julebord', 'tur'
]

export default function AnsvarAdmin({
  ansvar,
  nytt,
  medlemmer,
}: {
  ansvar?: Record<string, unknown>
  nytt?: { aar: number }
  medlemmer: Medlem[]
}) {
  const [aapen, setAapen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [visSlett, setVisSlett] = useState(false)

  const erNytt = !!nytt

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await lagreAnsvar({
        id: ansvar?.id as string | undefined,
        aar: nytt?.aar ?? (ansvar?.aar as number),
        arrangement_navn: fd.get('arrangement_navn') as string,
        ansvarlig_id: (fd.get('ansvarlig_id') as string) || null,
        purredato: (fd.get('purredato') as string) || null,
      })
      setAapen(false)
    })
  }

  function handleSlett() {
    startTransition(async () => {
      await slettAnsvar(ansvar?.id as string)
      setVisSlett(false)
    })
  }

  if (!aapen) {
    return (
      <button
        onClick={() => setAapen(true)}
        className="text-xs px-2 py-1 rounded-lg shrink-0"
        style={{
          background: erNytt ? 'var(--accent)' : 'var(--bg)',
          border: '1px solid var(--border)',
          color: erNytt ? '#fff' : 'var(--text-secondary)',
          marginTop: erNytt ? '0.75rem' : 0,
          width: erNytt ? '100%' : 'auto',
        }}
      >
        {erNytt ? '+ Legg til ansvar' : 'Rediger'}
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl p-3 mt-2"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: erNytt ? '100%' : 'auto' }}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Arrangement</label>
          <input
            name="arrangement_navn"
            list="navneforslag"
            required
            defaultValue={(ansvar?.arrangement_navn as string) ?? ''}
            style={inputStil}
            placeholder="f.eks. mars-april"
          />
          <datalist id="navneforslag">
            {navneforslag.map(n => <option key={n} value={n} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Ansvarlig</label>
          <select name="ansvarlig_id" defaultValue={(ansvar?.ansvarlig_id as string) ?? ''} style={inputStil}>
            <option value="">— Ikke valgt —</option>
            {medlemmer.map(m => <option key={m.id} value={m.id}>{m.navn}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Purredato (valgfritt)</label>
          <input
            name="purredato"
            type="date"
            defaultValue={(ansvar?.purredato as string) ?? ''}
            style={inputStil}
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => { setAapen(false); setVisSlett(false) }}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Avbryt
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {isPending ? 'Lagrer...' : 'Lagre'}
          </button>
        </div>

        {!erNytt && (
          visSlett ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setVisSlett(false)}
                className="flex-1 py-1.5 rounded-lg text-xs"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Avbryt
              </button>
              <button type="button" onClick={handleSlett} disabled={isPending}
                className="flex-1 py-1.5 rounded-lg text-xs text-white disabled:opacity-50"
                style={{ background: 'var(--destructive-subtle)' }}>
                Slett
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setVisSlett(true)}
              className="w-full py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--destructive)' }}>
              Slett ansvar
            </button>
          )
        )}
      </form>
    </div>
  )
}
