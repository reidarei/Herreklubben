'use client'

import { useState, useTransition, useEffect } from 'react'
import { settVinnerPaaKaaring, fjernVinnerFraKaaring } from '@/lib/actions/kaaring_vinnere'
import Button from '@/components/ui/Button'

const inputStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
}

interface SetVinnerModalProps {
  aapen: boolean
  setAapen: (aapen: boolean) => void
  malId: string
  aar: number
  medlemmer: { id: string; navn: string }[]
  arrangementer: { id: string; tittel: string; start_tidspunkt: string }[]
  eksisterendeVinner?: {
    profil_id?: string
    arrangement_id?: string
    begrunnelse?: string
  }
}

export default function SetVinnerModal({
  aapen,
  setAapen,
  malId,
  aar,
  medlemmer,
  arrangementer,
  eksisterendeVinner,
}: SetVinnerModalProps) {
  const [type, setType] = useState<'profil' | 'arrangement'>('profil')
  const [id, setId] = useState('')
  const [begrunnelse, setBegrunnelse] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feil, setFeil] = useState('')

  useEffect(() => {
    if (eksisterendeVinner) {
      if (eksisterendeVinner.profil_id) {
        setType('profil')
        setId(eksisterendeVinner.profil_id)
      } else if (eksisterendeVinner.arrangement_id) {
        setType('arrangement')
        setId(eksisterendeVinner.arrangement_id)
      }
      setBegrunnelse(eksisterendeVinner.begrunnelse || '')
    } else {
      setType('profil')
      setId('')
      setBegrunnelse('')
    }
  }, [eksisterendeVinner, aapen])

  useEffect(() => {
    document.body.style.overflow = aapen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aapen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeil('')

    if (!id) {
      setFeil('Du må velge en vinner.')
      return
    }

    startTransition(async () => {
      try {
        await settVinnerPaaKaaring(malId, aar, {
          profil_id: type === 'profil' ? id : undefined,
          arrangement_id: type === 'arrangement' ? id : undefined,
          begrunnelse: begrunnelse || undefined,
        })
        setAapen(false)
      } catch {
        setFeil('Noe gikk galt.')
      }
    })
  }

  function handleFjernVinner() {
    startTransition(async () => {
      try {
        await fjernVinnerFraKaaring(malId, aar)
        setAapen(false)
      } catch {
        setFeil('Noe gikk galt.')
      }
    })
  }

  if (!aapen) return null

  const options = type === 'profil' ? medlemmer : arrangementer
  const labelKey = type === 'profil' ? 'navn' : 'tittel'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg rounded-b-2xl p-6 pb-8 mt-16"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {eksisterendeVinner ? 'Endre vinner' : 'Sett vinner'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Vinner-type</label>
            <select value={type} onChange={e => { setType(e.target.value as 'profil' | 'arrangement'); setId('') }} style={inputStil}>
              <option value="profil">Herr</option>
              <option value="arrangement">Arrangement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Velg vinner</label>
            <select value={id} onChange={e => setId(e.target.value)} style={inputStil}>
              <option value="">— Velg —</option>
              {options.map(o => (
                <option key={o.id} value={o.id}>
                  {(o as any)[labelKey]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Begrunnelse (valgfritt)</label>
            <input
              type="text"
              value={begrunnelse}
              onChange={e => setBegrunnelse(e.target.value)}
              placeholder="f.eks. «Beste påmeldt»"
              style={inputStil}
            />
          </div>

          {feil && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{feil}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setAapen(false)}>Avbryt</Button>
            {eksisterendeVinner && (
              <Button type="button" variant="secondary" fullWidth onClick={handleFjernVinner} disabled={isPending}>Fjern</Button>
            )}
            <Button type="submit" fullWidth disabled={isPending}>{isPending ? 'Lagrer...' : 'Lagre'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
