'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { opprettMelding } from '@/lib/actions/meldinger'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'

const inputStil: CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  outline: 'none',
  padding: 0,
  resize: 'none',
  minHeight: 180,
}

const MAX_TEGN = 2000

export default function NyMeldingSkjema() {
  const [innhold, setInnhold] = useState('')
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handlePubliser() {
    setFeil('')
    if (!innhold.trim()) {
      setFeil('Skriv noe før du publiserer.')
      return
    }
    startTransition(async () => {
      try {
        await opprettMelding(innhold)
      } catch (err) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'digest' in err &&
          typeof (err as Record<string, unknown>).digest === 'string' &&
          ((err as Record<string, unknown>).digest as string).startsWith('NEXT_REDIRECT')
        ) {
          throw err
        }
        setFeil(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
      }
    })
  }

  const tegnIgjen = MAX_TEGN - innhold.length

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <SkjemaBar
        overtittel="Ny"
        tittel={innhold.slice(0, 40) || 'Melding'}
        onAvbryt={() => router.back()}
        onLagre={handlePubliser}
        lagreLabel="Publiser"
        laster={isPending}
      />

      <SkjemaSeksjon label="Hva vil du dele?">
        <div style={{ padding: '10px 4px' }}>
          <textarea
            value={innhold}
            onChange={e => setInnhold(e.target.value.slice(0, MAX_TEGN))}
            placeholder="Skriv her…"
            style={inputStil}
          />
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-tertiary)',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              marginTop: 8,
              textAlign: 'right',
            }}
          >
            {tegnIgjen} tegn igjen
          </div>
        </div>
      </SkjemaSeksjon>

      {feil && (
        <div
          style={{
            color: 'var(--danger)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            padding: '12px 4px',
          }}
        >
          {feil}
        </div>
      )}
    </div>
  )
}
