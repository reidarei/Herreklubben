'use client'

import { useState, useTransition } from 'react'
import MarkdownVisning from '@/components/MarkdownVisning'
import { formaterDato } from '@/lib/dato'
import { oppdaterVedtekt } from '@/lib/actions/vedtekter'
import Button from '@/components/ui/Button'

const inputStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
}

type Versjon = {
  id: string
  vedtaksdato: string
  endringsnotat: string
  opprettet: string
  profiles: { navn: string } | null
}

export default function VedtektVisning({
  vedtekt,
  erAdmin,
  versjoner,
}: {
  vedtekt: { slug: string; tittel: string; innhold: string; oppdatert: string }
  erAdmin: boolean
  versjoner: Versjon[]
}) {
  const [redigerer, setRedigerer] = useState(false)
  const [innhold, setInnhold] = useState(vedtekt.innhold)
  const [vedtaksdato, setVedtaksdato] = useState('')
  const [endringsnotat, setEndringsnotat] = useState('')
  const [visHistorikk, setVisHistorikk] = useState(false)
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleLagre(e: React.FormEvent) {
    e.preventDefault()
    if (!vedtaksdato || !endringsnotat) { setFeil('Fyll inn vedtaksdato og endringsnotat.'); return }
    setFeil('')
    startTransition(async () => {
      await oppdaterVedtekt({ slug: vedtekt.slug, nyttInnhold: innhold, vedtaksdato, endringsnotat })
      setRedigerer(false)
      setVedtaksdato('')
      setEndringsnotat('')
    })
  }

  return (
    <>
      {redigerer ? (
        <form onSubmit={handleLagre} className="space-y-4">
          <textarea
            value={innhold}
            onChange={e => setInnhold(e.target.value)}
            rows={16}
            style={{ ...inputStil, resize: 'vertical' as const, fontFamily: 'monospace' }}
          />
          <div className="rounded-2xl p-4" style={{ background: 'var(--accent-subtle)', border: '1px solid rgba(212,168,83,0.2)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>
              Endringen må hjemles i et gyldig vedtak
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Vedtaksdato</label>
                <input type="date" value={vedtaksdato} onChange={e => setVedtaksdato(e.target.value)} style={inputStil} required />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Hva ble endret og hvorfor</label>
                <textarea
                  value={endringsnotat}
                  onChange={e => setEndringsnotat(e.target.value)}
                  rows={3}
                  style={{ ...inputStil, resize: 'vertical' as const }}
                  required
                  placeholder="Beskriv endringen og hjemmelsgrunnlaget..."
                />
              </div>
            </div>
          </div>
          {feil && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{feil}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setRedigerer(false); setInnhold(vedtekt.innhold) }}>Avbryt</Button>
            <Button type="submit" fullWidth disabled={isPending}>{isPending ? 'Lagrer...' : 'Lagre'}</Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-6">
            <MarkdownVisning innhold={innhold} />
          </div>

          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Sist oppdatert: {formaterDato(vedtekt.oppdatert, 'd. MMMM yyyy')}
          </p>

          {erAdmin && (
            <Button variant="secondary" fullWidth onClick={() => setRedigerer(true)} className="mb-4">Rediger</Button>
          )}

          {versjoner.length > 0 && (
            <div>
              <button onClick={() => setVisHistorikk(!visHistorikk)}
                className="text-xs w-full text-left py-2" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {visHistorikk ? '▲' : '▼'} Endringshistorikk ({versjoner.length})
              </button>
              {visHistorikk && (
                <div className="space-y-2 mt-2">
                  {versjoner.map(v => (
                    <div key={v.id} className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formaterDato(v.vedtaksdato, 'd. MMMM yyyy')} — {v.profiles?.navn}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{v.endringsnotat}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
