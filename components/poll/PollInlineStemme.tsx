'use client'

import { useState, useTransition, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { stemPaaPoll } from '@/lib/actions/poll'

type Valg = { id: string; tekst: string }

type Props = {
  pollId: string
  flervalg: boolean
  valg: Valg[]
  mineStemmer: string[]
}

/**
 * Kompakte stemmeknapper brukt inline på PollKort. Rendres som grid med
 * én kolonne per alternativ — ser best ut med 2–3 alternativer.
 *
 * Fordi knappene ligger inni en Link (hele kortet navigerer til /poll/[id]),
 * må klikk kalle både preventDefault og stopPropagation for ikke å trigge
 * navigering. Vi bruker optimistisk UI: oppdater state umiddelbart og
 * rull tilbake hvis server feiler.
 */
export default function PollInlineStemme({ pollId, flervalg, valg, mineStemmer }: Props) {
  const [optimistisk, setOptimistisk] = useState<string[]>(mineStemmer)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleStem(valgId: string, e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (isPending) return

    const erValgt = optimistisk.includes(valgId)
    let nye: string[]
    if (flervalg) {
      nye = erValgt ? optimistisk.filter(v => v !== valgId) : [...optimistisk, valgId]
    } else {
      // Enkeltvalg: tap på samme alternativ er no-op (stemPaaPoll krever ≥1)
      if (erValgt) return
      nye = [valgId]
    }

    // Hvis flervalg resulterer i 0 stemmer, oppdater lokalt men ikke kall
    // server (den krever ≥1). Brukeren kan velge noe annet eller gå til
    // detaljsiden for å angre helt.
    setOptimistisk(nye)
    if (nye.length === 0) return

    startTransition(async () => {
      try {
        await stemPaaPoll(pollId, nye)
        router.refresh()
      } catch {
        // Rull tilbake ved server-feil
        setOptimistisk(mineStemmer)
      }
    })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${valg.length}, 1fr)`,
        gap: 8,
      }}
    >
      {valg.map(v => {
        const valgt = optimistisk.includes(v.id)
        return (
          <button
            key={v.id}
            type="button"
            onClick={e => handleStem(v.id, e)}
            disabled={isPending}
            style={{
              padding: '12px 8px',
              borderRadius: 14,
              background: valgt ? 'var(--accent)' : 'transparent',
              border: valgt ? 'none' : '1px solid var(--border)',
              color: valgt ? '#0a0a0a' : 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: valgt ? 600 : 500,
              letterSpacing: '0.1px',
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              transition: 'background 120ms, border-color 120ms',
              textAlign: 'center',
              minHeight: 42,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {v.tekst}
          </button>
        )
      })}
    </div>
  )
}
