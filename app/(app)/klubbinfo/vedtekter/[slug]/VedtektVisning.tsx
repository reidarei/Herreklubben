'use client'

import { useState, useTransition } from 'react'
import MarkdownVisning from '@/components/MarkdownVisning'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { oppdaterVedtekt } from '@/lib/actions/vedtekter'

const inputStil = {
  background: 'var(--bakgrunn)',
  border: '1px solid var(--border)',
  color: 'var(--tekst)',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '0.875rem',
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
            style={{ ...inputStil, resize: 'vertical', fontFamily: 'monospace' }}
          />
          <div style={{ background: 'rgba(193,127,36,0.08)', border: '1px solid rgba(193,127,36,0.2)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--aksent-lys)' }}>
              Endringen må hjemles i et gyldig vedtak
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--tekst-dempet)' }}>Vedtaksdato</label>
                <input type="date" value={vedtaksdato} onChange={e => setVedtaksdato(e.target.value)} style={inputStil} required />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--tekst-dempet)' }}>Hva ble endret og hvorfor</label>
                <textarea
                  value={endringsnotat}
                  onChange={e => setEndringsnotat(e.target.value)}
                  rows={3}
                  style={{ ...inputStil, resize: 'vertical' }}
                  required
                  placeholder="Beskriv endringen og hjemmelsgrunnlaget..."
                />
              </div>
            </div>
          </div>
          {feil && <p className="text-sm" style={{ color: '#f87171' }}>{feil}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setRedigerer(false); setInnhold(vedtekt.innhold) }}
              className="flex-1 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}>
              Avbryt
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
              style={{ background: 'var(--aksent)' }}>
              {isPending ? 'Lagrer...' : 'Lagre'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Markdown-innhold */}
          <div className="mb-6">
            <MarkdownVisning innhold={innhold} />
          </div>

          <p className="text-xs mb-4" style={{ color: 'var(--tekst-dempet)' }}>
            Sist oppdatert: {format(new Date(vedtekt.oppdatert), 'd. MMMM yyyy', { locale: nb })}
          </p>

          {erAdmin && (
            <button onClick={() => setRedigerer(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold mb-4"
              style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}>
              Rediger
            </button>
          )}

          {/* Endringshistorikk */}
          {versjoner.length > 0 && (
            <div>
              <button onClick={() => setVisHistorikk(!visHistorikk)}
                className="text-xs w-full text-left py-2" style={{ color: 'var(--tekst-dempet)' }}>
                {visHistorikk ? '▲' : '▼'} Endringshistorikk ({versjoner.length})
              </button>
              {visHistorikk && (
                <div className="space-y-2 mt-2">
                  {versjoner.map(v => (
                    <div key={v.id} className="rounded-lg px-3 py-2" style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--tekst)' }}>
                        {format(new Date(v.vedtaksdato), 'd. MMMM yyyy', { locale: nb })} — {(v.profiles as { navn: string } | null)?.navn}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--tekst-dempet)' }}>{v.endringsnotat}</p>
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
