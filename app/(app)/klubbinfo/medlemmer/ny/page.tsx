'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

const inputStil = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '1rem',
}

export default function NyttMedlem() {
  const [navn, setNavn] = useState('')
  const [epost, setEpost] = useState('')
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const [opprettet, setOpprettet] = useState<{ passord: string } | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLaster(true)
    setFeil('')

    const res = await fetch('/api/admin/opprett-medlem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ navn, epost }),
    })

    const data = await res.json()
    setLaster(false)

    if (!res.ok) {
      setFeil(data.feil ?? 'Noe gikk galt')
    } else {
      setOpprettet({ passord: data.passord })
    }
  }

  if (opprettet) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-6">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <p className="font-semibold text-lg mb-2" style={{ color: 'var(--success)' }}>✓ Medlem opprettet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Send dette til {navn}:
          </p>
          <div className="rounded-xl p-3 mb-4 space-y-1" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>E-post: <span className="font-mono">{epost}</span></p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Passord: <span className="font-mono font-bold">{opprettet.passord}</span></p>
          </div>
          <button
            onClick={() => router.push('/klubbinfo/medlemmer')}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            Tilbake til medlemslisten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeftIcon className="w-4 h-4" /> Tilbake
        </button>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Nytt medlem</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Navn</label>
          <input type="text" value={navn} onChange={e => setNavn(e.target.value)} required style={inputStil} />
        </div>
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>E-post</label>
          <input type="email" value={epost} onChange={e => setEpost(e.target.value)} required style={inputStil} />
        </div>
        {feil && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{feil}</p>}
        <button
          type="submit"
          disabled={laster}
          className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {laster ? 'Oppretter...' : 'Opprett medlem'}
        </button>
      </form>
    </div>
  )
}
