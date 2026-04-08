'use client'

import { useState, useTransition } from 'react'
import { opprettKaaring } from '@/lib/actions/kaaringer'
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

type Vinner = { type: 'profil' | 'arrangement'; id: string; begrunnelse: string }

export default function NyKaaringKnapp({
  medlemmer,
  arrangementer,
}: {
  medlemmer: { id: string; navn: string }[]
  arrangementer: { id: string; tittel: string; start_tidspunkt: string }[]
}) {
  const [aapen, setAapen] = useState(false)
  const [aar, setAar] = useState(new Date().getFullYear())
  const [kategori, setKategori] = useState('')
  const [vinnere, setVinnere] = useState<Vinner[]>([{ type: 'profil', id: '', begrunnelse: '' }])
  const [isPending, startTransition] = useTransition()
  const [feil, setFeil] = useState('')

  function leggTilVinner() {
    setVinnere(v => [...v, { type: 'profil', id: '', begrunnelse: '' }])
  }

  function fjernVinner(i: number) {
    setVinnere(v => v.filter((_, idx) => idx !== i))
  }

  function oppdaterVinner(i: number, felt: keyof Vinner, verdi: string) {
    setVinnere(v => v.map((vinner, idx) => idx === i ? { ...vinner, [felt]: verdi } : vinner))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeil('')
    if (vinnere.some(v => !v.id)) { setFeil('Alle vinnere må ha en verdi.'); return }

    startTransition(async () => {
      try {
        await opprettKaaring({
          aar,
          kategori,
          vinnere: vinnere.map(v => ({
            profil_id: v.type === 'profil' ? v.id : undefined,
            arrangement_id: v.type === 'arrangement' ? v.id : undefined,
            begrunnelse: v.begrunnelse || undefined,
          })),
        })
        setAapen(false)
        setKategori('')
        setVinnere([{ type: 'profil', id: '', begrunnelse: '' }])
      } catch {
        setFeil('Noe gikk galt.')
      }
    })
  }

  if (!aapen) {
    return (
      <Button onClick={() => setAapen(true)}>+ Ny</Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg rounded-b-2xl p-6 pb-8 mt-16"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Ny kåring</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>År</label>
              <input type="number" value={aar} onChange={e => setAar(Number(e.target.value))} style={inputStil} />
            </div>
            <div className="flex-[3]">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Kategori</label>
              <input type="text" value={kategori} onChange={e => setKategori(e.target.value)} required placeholder="f.eks. Årets herre" style={inputStil} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Vinner(e)</label>
            <div className="space-y-3">
              {vinnere.map((v, i) => (
                <div key={i} className="rounded-2xl p-3 space-y-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex gap-2">
                    <select value={v.type} onChange={e => oppdaterVinner(i, 'type', e.target.value)} style={{ ...inputStil, flex: 1 }}>
                      <option value="profil">Herr</option>
                      <option value="arrangement">Arrangement</option>
                    </select>
                    {vinnere.length > 1 && (
                      <button type="button" onClick={() => fjernVinner(i)} className="px-2 rounded-xl text-xs"
                        style={{ color: 'var(--destructive)', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <select value={v.id} onChange={e => oppdaterVinner(i, 'id', e.target.value)} style={inputStil}>
                    <option value="">— Velg —</option>
                    {v.type === 'profil'
                      ? medlemmer.map(m => <option key={m.id} value={m.id}>{m.navn}</option>)
                      : arrangementer.map(a => <option key={a.id} value={a.id}>{a.tittel}</option>)
                    }
                  </select>
                  <input type="text" value={v.begrunnelse} onChange={e => oppdaterVinner(i, 'begrunnelse', e.target.value)} placeholder="Begrunnelse (valgfritt)" style={inputStil} />
                </div>
              ))}
            </div>
            <button type="button" onClick={leggTilVinner} className="mt-2 text-xs w-full py-2 rounded-xl"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Legg til vinner
            </button>
          </div>

          {feil && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{feil}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setAapen(false)}>Avbryt</Button>
            <Button type="submit" fullWidth disabled={isPending}>{isPending ? 'Lagrer...' : 'Lagre'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
