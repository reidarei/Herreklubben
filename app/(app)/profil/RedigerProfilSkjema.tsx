'use client'

import { useState, useTransition } from 'react'
import { oppdaterEgenProfil } from '@/lib/actions/profil'
import Card from '@/components/ui/Card'
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
    <Card className="mb-4">
      {!redigerer ? (
        <>
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>Navn</p>
              <p className="font-medium">{navn}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>E-post</p>
              <p className="font-medium">{epost}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>Telefon</p>
              <p className="font-medium">{telefon || '–'}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>Rolle</p>
              <p className="font-medium capitalize">{rolle}</p>
            </div>
          </div>
          <Button variant="secondary" fullWidth onClick={() => setRedigerer(true)}>
            {lagret ? '✓ Lagret' : 'Rediger'}
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Navn</label>
            <input name="navn" type="text" required defaultValue={navn} style={inputStil} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Telefon</label>
            <input name="telefon" type="tel" defaultValue={telefon} style={inputStil} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => setRedigerer(false)}>Avbryt</Button>
            <Button type="submit" fullWidth disabled={isPending}>{isPending ? 'Lagrer...' : 'Lagre'}</Button>
          </div>
        </form>
      )}
    </Card>
  )
}
