'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Ordsky from '@/components/Ordsky'

export default function LoginSide() {
  const [epost, setEpost] = useState('')
  const [passord, setPassord] = useState('')
  const [feil, setFeil] = useState('')
  const [laster, setLaster] = useState(false)
  const [glemtPassord, setGlemtPassord] = useState(false)
  const [tilbakestiltSendt, setTilbakestiltSendt] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function loggInn(e: React.FormEvent) {
    e.preventDefault()
    setLaster(true)
    setFeil('')
    const { error } = await supabase.auth.signInWithPassword({ email: epost, password: passord })
    if (error) {
      setFeil('Feil e-post eller passord.')
      setLaster(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function sendTilbakestilling(e: React.FormEvent) {
    e.preventDefault()
    setLaster(true)
    setFeil('')
    const { error } = await supabase.auth.resetPasswordForEmail(epost, {
      redirectTo: `${window.location.origin}/oppdater-passord`,
    })
    if (error) {
      setFeil('Klarte ikke sende e-post. Prøv igjen.')
    } else {
      setTilbakestiltSendt(true)
    }
    setLaster(false)
  }

  if (tilbakestiltSendt) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--bakgrunn)' }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Sjekk e-posten</p>
          <p style={{ color: 'var(--tekst-dempet)' }}>Vi har sendt en lenke til {epost}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bakgrunn)' }}>
      {/* Toppbanner med ordsky */}
      <div className="relative w-full px-2 pt-4 pb-2">
        <Ordsky className="w-full" style={{ maxHeight: '160px' }} />
        <div className="text-center mt-14">
          <h1 className="text-lg font-bold tracking-wide" style={{ color: 'var(--aksent-lys)' }}>
            Mortensrud Herreklubb
          </h1>
        </div>
      </div>

      {/* Skjema */}
      <div className="flex-1 flex items-start justify-center px-6 pt-8">
        <div className="w-full max-w-sm">
          {glemtPassord ? (
            <form onSubmit={sendTilbakestilling} className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Glemt passord</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--tekst-dempet)' }}>
                Skriv inn e-posten din, så sender vi deg en lenke for å sette nytt passord.
              </p>
              <div>
                <label htmlFor="epost" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tekst-dempet)' }}>
                  E-post
                </label>
                <input
                  id="epost"
                  type="email"
                  value={epost}
                  onChange={(e) => setEpost(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-3 text-base focus:outline-none"
                  style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst)' }}
                />
              </div>
              {feil && <p className="text-sm" style={{ color: '#f87171' }}>{feil}</p>}
              <button
                type="submit"
                disabled={laster}
                className="w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--aksent)' }}
              >
                {laster ? 'Sender...' : 'Send lenke'}
              </button>
              <button type="button" onClick={() => setGlemtPassord(false)} className="w-full text-sm underline" style={{ color: 'var(--tekst-dempet)' }}>
                Tilbake til innlogging
              </button>
            </form>
          ) : (
            <form onSubmit={loggInn} className="space-y-4">
              <div>
                <label htmlFor="epost" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tekst-dempet)' }}>
                  E-post
                </label>
                <input
                  id="epost"
                  type="email"
                  value={epost}
                  onChange={(e) => setEpost(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg px-4 py-3 text-base focus:outline-none"
                  style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst)' }}
                />
              </div>
              <div>
                <label htmlFor="passord" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tekst-dempet)' }}>
                  Passord
                </label>
                <input
                  id="passord"
                  type="password"
                  value={passord}
                  onChange={(e) => setPassord(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg px-4 py-3 text-base focus:outline-none"
                  style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst)' }}
                />
              </div>
              {feil && <p className="text-sm" style={{ color: '#f87171' }}>{feil}</p>}
              <button
                type="submit"
                disabled={laster}
                className="w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-50 mt-2"
                style={{ background: 'var(--aksent)' }}
              >
                {laster ? 'Logger inn...' : 'Logg inn'}
              </button>
              <button type="button" onClick={() => setGlemtPassord(true)} className="w-full text-sm underline pt-1" style={{ color: 'var(--tekst-dempet)' }}>
                Glemt passord?
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
