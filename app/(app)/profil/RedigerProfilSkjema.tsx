'use client'

import { useState, useTransition } from 'react'
import { oppdaterEgenProfil } from '@/lib/actions/profil'

const inputStil = {
  background: 'var(--bakgrunn-kort)',
  border: '1px solid var(--border)',
  color: 'var(--tekst)',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '1rem',
}

export default function RedigerProfilSkjema({
  navn, epost, telefon, rolle,
}: {
  navn: string; epost: string; telefon: string; rolle: string
}) {
  const [redigerer, setRedigerer] = useState(false)
  const [lagret, setLagret] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await oppdaterEgenProfil({
        navn: fd.get('navn') as string,
        telefon: fd.get('telefon') as string,
      })
      setRedigerer(false)
      setLagret(true)
      setTimeout(() => setLagret(false), 3000)
    })
  }

  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
      {!redigerer ? (
        <>
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--tekst-dempet)' }}>Navn</p>
              <p className="font-medium">{navn}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--tekst-dempet)' }}>E-post</p>
              <p className="font-medium">{epost}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--tekst-dempet)' }}>Telefon</p>
              <p className="font-medium">{telefon || '–'}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--tekst-dempet)' }}>Rolle</p>
              <p className="font-medium capitalize">{rolle}</p>
            </div>
          </div>
          <button
            onClick={() => setRedigerer(true)}
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--bakgrunn)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}
          >
            {lagret ? '✓ Lagret' : 'Rediger'}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--tekst-dempet)' }}>Navn</label>
            <input name="navn" type="text" required defaultValue={navn} style={inputStil} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--tekst-dempet)' }}>Telefon</label>
            <input name="telefon" type="tel" defaultValue={telefon} style={inputStil} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setRedigerer(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--bakgrunn)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}>
              Avbryt
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--aksent)' }}>
              {isPending ? 'Lagrer...' : 'Lagre'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
