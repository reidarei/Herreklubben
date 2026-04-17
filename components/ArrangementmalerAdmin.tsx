'use client'

import { useState, useTransition } from 'react'
import { leggTilMal, oppdaterMal, slettMal } from '@/lib/actions/arrangementmaler'

type Mal = { id: string; navn: string; rekkefølge: number; purredato: string | null }

// Konverter purredato (2000-MM-DD) til visningsdato med inneværende år for date-input
function tilInputDato(purredato: string | null): string {
  if (!purredato) return ''
  const md = purredato.slice(5) // "MM-DD"
  return `${new Date().getFullYear()}-${md}`
}

// Konverter date-input (YYYY-MM-DD) til lagringsdato med år 2000
function tilLagringsdato(inputDato: string): string {
  return `2000-${inputDato.slice(5)}`
}

const inputStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.35rem 0.6rem',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  flex: 1,
  minWidth: 0,
}

const datoStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.35rem 0.4rem',
  fontSize: '0.75rem',
  fontFamily: 'inherit',
  width: '8.5rem',
}

function MalRad({ mal }: { mal: Mal }) {
  const [redigerer, setRedigerer] = useState(false)
  const [bekrefterSlett, setBekrefterSlett] = useState(false)
  const [navn, setNavn] = useState(mal.navn)
  const [purredato, setPurredato] = useState(mal.purredato)
  const [isPending, startTransition] = useTransition()

  function handleLagre() {
    if (!navn.trim()) return
    startTransition(async () => {
      await oppdaterMal(mal.id, navn, purredato)
      setRedigerer(false)
    })
  }

  function handleSlett() {
    startTransition(async () => {
      await slettMal(mal.id)
    })
  }

  function handleDatoEndring(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    const ny = val ? tilLagringsdato(val) : null
    setPurredato(ny)
    if (!redigerer) {
      startTransition(async () => {
        await oppdaterMal(mal.id, mal.navn, ny)
      })
    }
  }

  function handleFjernDato() {
    setPurredato(null)
    startTransition(async () => {
      await oppdaterMal(mal.id, redigerer ? navn : mal.navn, null)
    })
  }

  const datoInput = (
    <div className="flex items-center gap-1 shrink-0">
      <input
        type="date"
        value={tilInputDato(purredato)}
        onChange={handleDatoEndring}
        disabled={isPending}
        style={{ ...datoStil, opacity: isPending ? 0.5 : 1 }}
      />
      {purredato && (
        <button onClick={handleFjernDato} disabled={isPending} className="text-xs px-1 py-0.5 rounded"
          style={{ color: 'var(--text-secondary)', background: 'none', fontFamily: 'inherit', cursor: 'pointer', border: 'none', fontSize: '1rem', lineHeight: 1 }}
          title="Fjern purredato">
          ✕
        </button>
      )}
    </div>
  )

  if (redigerer) {
    return (
      <div className="flex gap-2 items-center py-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <input
          value={navn}
          onChange={e => setNavn(e.target.value)}
          style={inputStil}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleLagre(); if (e.key === 'Escape') setRedigerer(false) }}
        />
        {datoInput}
        <button onClick={handleLagre} disabled={isPending} className="text-xs px-2 py-1 rounded-lg shrink-0"
          style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: isPending ? 0.5 : 1 }}>
          {isPending ? '…' : 'OK'}
        </button>
        <button onClick={() => { setNavn(mal.navn); setPurredato(mal.purredato); setRedigerer(false) }} className="text-xs px-2 py-1 rounded-lg shrink-0"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2 py-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <p className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>{mal.navn}</p>
      <div className="flex gap-1 items-center shrink-0">
        {datoInput}
        {bekrefterSlett ? (
          <>
            <button onClick={handleSlett} disabled={isPending} className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'var(--destructive)', color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: isPending ? 0.5 : 1 }}>
              Slett
            </button>
            <button onClick={() => setBekrefterSlett(false)} className="text-xs px-2 py-1 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              Nei
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setRedigerer(true)} className="text-xs px-2 py-1 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              Rediger
            </button>
            <button onClick={() => setBekrefterSlett(true)} className="text-xs px-2 py-1 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--destructive)', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              Slett
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function NyMalForm() {
  const [navn, setNavn] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleLeggTil() {
    if (!navn.trim()) return
    startTransition(async () => {
      await leggTilMal(navn)
      setNavn('')
    })
  }

  return (
    <div className="flex gap-2 items-center pt-3 mt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <input
        value={navn}
        onChange={e => setNavn(e.target.value)}
        placeholder="Nytt arrangement…"
        style={inputStil}
        onKeyDown={e => { if (e.key === 'Enter') handleLeggTil() }}
      />
      <button onClick={handleLeggTil} disabled={isPending || !navn.trim()} className="text-xs px-2 py-1 rounded-lg shrink-0"
        style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: (isPending || !navn.trim()) ? 0.5 : 1 }}>
        {isPending ? '…' : '+ Legg til'}
      </button>
    </div>
  )
}

export default function ArrangementmalerAdmin({ maler }: { maler: Mal[] }) {
  return (
    <div>
      {maler.map(mal => <MalRad key={mal.id} mal={mal} />)}
      <NyMalForm />
    </div>
  )
}
