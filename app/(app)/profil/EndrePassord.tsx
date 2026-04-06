'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function EndrePassord() {
  const [aapen, setAapen] = useState(false)
  const [passord, setPassord] = useState('')
  const [bekreft, setBekreft] = useState('')
  const [status, setStatus] = useState<'idle' | 'lagrer' | 'ok' | 'feil'>('idle')
  const [feilmelding, setFeilmelding] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeilmelding('')

    if (passord.length < 6) {
      setFeilmelding('Passordet må være minst 6 tegn')
      return
    }
    if (passord !== bekreft) {
      setFeilmelding('Passordene er ikke like')
      return
    }

    setStatus('lagrer')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passord })

    if (error) {
      setFeilmelding(error.message)
      setStatus('feil')
    } else {
      setStatus('ok')
      setPassord('')
      setBekreft('')
      setTimeout(() => {
        setAapen(false)
        setStatus('idle')
      }, 2000)
    }
  }

  if (!aapen) {
    return (
      <button
        onClick={() => setAapen(true)}
        className="w-full text-left text-sm px-4 py-3 rounded-xl mt-4"
        style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}
      >
        🔑 Endre passord
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-4 mt-4 space-y-3" style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--tekst)' }}>Endre passord</p>

      <input
        type="password"
        placeholder="Nytt passord"
        value={passord}
        onChange={e => setPassord(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--bakgrunn)', border: '1px solid var(--border)', color: 'var(--tekst)' }}
      />
      <input
        type="password"
        placeholder="Bekreft nytt passord"
        value={bekreft}
        onChange={e => setBekreft(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--bakgrunn)', border: '1px solid var(--border)', color: 'var(--tekst)' }}
      />

      {feilmelding && (
        <p className="text-xs" style={{ color: '#f87171' }}>{feilmelding}</p>
      )}

      {status === 'ok' && (
        <p className="text-xs" style={{ color: 'var(--gronn-lys)' }}>Passord oppdatert!</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === 'lagrer'}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--aksent)', color: '#fff', opacity: status === 'lagrer' ? 0.5 : 1 }}
        >
          {status === 'lagrer' ? 'Lagrer…' : 'Lagre'}
        </button>
        <button
          type="button"
          onClick={() => { setAapen(false); setPassord(''); setBekreft(''); setFeilmelding(''); setStatus('idle') }}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ color: 'var(--tekst-dempet)' }}
        >
          Avbryt
        </button>
      </div>
    </form>
  )
}
