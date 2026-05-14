'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { opprettMelding } from '@/lib/actions/meldinger'
import { lastOppBilde, slettBilde } from '@/lib/actions/bilde-opplasting'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'
import { komprimer, genererFilnavn } from '@/lib/bilde-utils'
import { INNLEGG_MAKS_LENGDE, MELDING_MAKS_BILDER } from '@/lib/konstanter'

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

type BildeStatus = 'klar' | 'laster' | 'feil'

type BildeItem = {
  fil: File
  // Lokal blob-URL for forhåndsvisning — revokeres ved opprydding
  previewUrl: string
  status: BildeStatus
}

export default function NyMeldingSkjema() {
  const [innhold, setInnhold] = useState('')
  const [bilder, setBilder] = useState<BildeItem[]>([])
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Sentralt register over aktive blob-URL-er. Bruker ref + Set fordi
  // cleanup-funksjonen i useEffect ellers lukker over et tomt snapshot
  // av `bilder` (deps=[]). Settet holder seg "levende" mellom rendere.
  const blobUrlerRef = useRef<Set<string>>(new Set())

  // Revokér alle gjenværende blob-URL-er ved unmount
  useEffect(() => {
    const settet = blobUrlerRef.current
    return () => {
      settet.forEach(url => URL.revokeObjectURL(url))
      settet.clear()
    }
  }, [])

  function fjernBilde(idx: number) {
    setBilder(prev => {
      const url = prev[idx].previewUrl
      URL.revokeObjectURL(url)
      blobUrlerRef.current.delete(url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  function handleFilvalg(e: React.ChangeEvent<HTMLInputElement>) {
    const valgte = Array.from(e.target.files ?? [])
    // Ta kun så mange som gjenstår til cap
    const maks = MELDING_MAKS_BILDER - bilder.length
    const nye = valgte.slice(0, maks).map(fil => {
      const previewUrl = URL.createObjectURL(fil)
      blobUrlerRef.current.add(previewUrl)
      return {
        fil,
        previewUrl,
        status: 'klar' as BildeStatus,
      }
    })
    setBilder(prev => [...prev, ...nye])
    // Nullstill input så samme fil kan legges til på nytt etter fjerning
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handlePubliser() {
    setFeil('')
    const harTekst = innhold.trim().length > 0
    const harBilder = bilder.length > 0

    if (!harTekst && !harBilder) {
      setFeil('Skriv noe eller legg til et bilde før du publiserer.')
      return
    }

    // Heves ut av try-blokken slik at catch faktisk når URL-ene som
    // allerede er lastet opp før feilen oppstod.
    const opplastede: string[] = []

    startTransition(async () => {
      try {
        // Last opp bilder SEKVENSIELT for å spare iOS-minne (Canvas API er
        // single-threaded og multiple parallelle kanvasoperasjoner kan krasje
        // på eldre iPhones med lite RAM).
        for (const bilde of bilder) {
          setBilder(prev => prev.map(b =>
            b.previewUrl === bilde.previewUrl ? { ...b, status: 'laster' } : b,
          ))
          const komprimert = await komprimer(bilde.fil)
          const fd = new FormData()
          fd.append('fil', komprimert)
          fd.append('filnavn', genererFilnavn(komprimert))
          fd.append('kategori', 'meldinger')
          const res = await lastOppBilde(fd)
          opplastede.push(res.url)
        }

        await opprettMelding({ innhold, bilde_urls: opplastede })
      } catch (err) {
        // NEXT_REDIRECT er ikke en ekte feil — la Next.js håndtere redirect
        if (
          typeof err === 'object' &&
          err !== null &&
          'digest' in err &&
          typeof (err as Record<string, unknown>).digest === 'string' &&
          ((err as Record<string, unknown>).digest as string).startsWith('NEXT_REDIRECT')
        ) {
          throw err
        }

        // Compensating delete: slett allerede opplastede bilder fra R2 slik at
        // vi ikke etterlater orphan-objekter hvis opprettMelding kaster. Feil
        // her ignores — orphan-rydding er best-effort. allSettled gjør at én
        // mislykket slett ikke avbryter resten.
        if (opplastede.length > 0) {
          await Promise.allSettled(opplastede.map(url => slettBilde(url)))
        }
        setFeil(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
        setBilder(prev => prev.map(b => ({ ...b, status: 'klar' })))
      }
    })
  }

  const tegnIgjen = INNLEGG_MAKS_LENGDE - innhold.length
  const kanLeggeTilFlere = bilder.length < MELDING_MAKS_BILDER

  return (
    <div style={{ padding: '0 20px 20px' }}>
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
            onChange={e => setInnhold(e.target.value.slice(0, INNLEGG_MAKS_LENGDE))}
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

      <SkjemaSeksjon label={`Bilder (valgfritt, maks ${MELDING_MAKS_BILDER})`}>
        <div style={{ padding: '10px 4px' }}>
          {/* Miniatyrer med X-knapp */}
          {bilder.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {bilder.map((bilde, idx) => (
                <div key={bilde.previewUrl} style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1/1',
                      borderRadius: 'var(--radius-card)',
                      overflow: 'hidden',
                      opacity: bilde.status === 'laster' ? 0.5 : 1,
                    }}
                  >
                    <Image
                      src={bilde.previewUrl}
                      alt={`Bilde ${idx + 1}`}
                      fill
                      unoptimized
                      style={{ objectFit: 'cover' }}
                      sizes="33vw"
                    />
                  </div>
                  {bilde.status === 'laster' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Laster…
                    </div>
                  )}
                  {/* X-knapp for å fjerne bildet */}
                  <button
                    type="button"
                    onClick={() => fjernBilde(idx)}
                    disabled={isPending}
                    aria-label="Fjern bilde"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)',
                      border: 'none',
                      color: 'white',
                      fontSize: 13,
                      lineHeight: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Fil-input — hidden, trigges av knapp nedenfor */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilvalg}
            disabled={isPending || !kanLeggeTilFlere}
            style={{ display: 'none' }}
          />

          {kanLeggeTilFlere && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              style={{
                padding: '7px 14px',
                background: 'transparent',
                border: '0.5px solid var(--border)',
                borderRadius: 999,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {bilder.length === 0 ? 'Legg til bilder' : `Legg til flere (${bilder.length}/${MELDING_MAKS_BILDER})`}
            </button>
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
