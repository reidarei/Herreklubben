'use client'

import { useEffect, useMemo, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { opprettMelding } from '@/lib/actions/meldinger'
import { lastOppBilde } from '@/lib/actions/bilde-opplasting'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'
import BildeBytterKnapp from '@/components/BildeBytterKnapp'
import { genererFilnavn } from '@/lib/bilde-utils'

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
  const [bildeFil, setBildeFil] = useState<File | null>(null)
  const previewUrl = useMemo(
    () => (bildeFil ? URL.createObjectURL(bildeFil) : null),
    [bildeFil],
  )
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])
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
        // Last opp bilde til R2 først hvis valgt
        let bildeUrl: string | null = null
        if (bildeFil) {
          const fd = new FormData()
          fd.append('fil', bildeFil)
          fd.append('filnavn', genererFilnavn(bildeFil))
          fd.append('kategori', 'meldinger')
          const res = await lastOppBilde(fd)
          bildeUrl = res.url
        }

        await opprettMelding({ innhold, bilde_url: bildeUrl })
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

      <SkjemaSeksjon label="Bilde (valgfritt)">
        <div style={{ padding: '10px 4px' }}>
          {previewUrl ? (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <Image
                  src={previewUrl}
                  alt="Forhåndsvisning"
                  fill
                  unoptimized
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <BildeBytterKnapp
                  onBildeFil={setBildeFil}
                  label="Bytt bilde"
                />
                <button
                  type="button"
                  onClick={() => setBildeFil(null)}
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    border: '0.5px solid var(--border)',
                    borderRadius: 999,
                    color: 'var(--danger)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Fjern bilde
                </button>
              </div>
            </div>
          ) : (
            <BildeBytterKnapp
              onBildeFil={setBildeFil}
              label="Legg til bilde"
            />
          )}
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
