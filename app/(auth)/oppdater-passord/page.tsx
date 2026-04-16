'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Ordsky from '@/components/Ordsky'
import Button from '@/components/ui/Button'

const inputStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '1rem',
  fontFamily: 'inherit',
}

export default function OppdaterPassordSide() {
  const [passord, setPassord] = useState('')
  const [bekreft, setBekreft] = useState('')
  const [feil, setFeil] = useState('')
  const [laster, setLaster] = useState(false)
  const [ferdig, setFerdig] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function lagre(e: React.FormEvent) {
    e.preventDefault()
    setFeil('')

    if (passord.length < 6) { setFeil('Passordet må være minst 6 tegn.'); return }
    if (passord !== bekreft) { setFeil('Passordene er ikke like.'); return }

    setLaster(true)
    const { error } = await supabase.auth.updateUser({ password: passord })
    if (error) {
      setFeil(error.message)
      setLaster(false)
      return
    }
    setFerdig(true)
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1500)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="relative w-full px-2 pt-4 pb-2">
        <Ordsky className="w-full" style={{ maxHeight: '160px' }} />
        <div className="text-center mt-14">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            Herreklubben
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Mortensrud Herreklubb
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 pt-8">
        <div className="w-full max-w-sm">
          {ferdig ? (
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Passord oppdatert</p>
              <p style={{ color: 'var(--text-secondary)' }}>Sender deg videre…</p>
            </div>
          ) : (
            <form onSubmit={lagre} className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Sett nytt passord</h2>
              <div>
                <label htmlFor="passord" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nytt passord</label>
                <input id="passord" type="password" value={passord} onChange={(e) => setPassord(e.target.value)} required autoComplete="new-password" style={inputStil} />
              </div>
              <div>
                <label htmlFor="bekreft" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bekreft passord</label>
                <input id="bekreft" type="password" value={bekreft} onChange={(e) => setBekreft(e.target.value)} required autoComplete="new-password" style={inputStil} />
              </div>
              {feil && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{feil}</p>}
              <Button type="submit" fullWidth disabled={laster}>{laster ? 'Lagrer…' : 'Lagre nytt passord'}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
