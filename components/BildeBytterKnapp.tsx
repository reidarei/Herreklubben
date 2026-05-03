'use client'

import { useRef, useState } from 'react'
import { komprimer, genererFilnavn, type BildeKategori } from '@/lib/bilde-utils'
import { lastOppBilde } from '@/lib/actions/bilde-opplasting'

// Enkelt "Bytt bilde"-kontroll som åpner mobilens galleri direkte,
// laster opp til R2 og kaller onBildeUrl med den nye public-URLen.
// Viser ingen forhåndsvisning selv — forelderen viser det aktive bildet.
//
// Eldre `bucket`-prop er beholdt for bakoverkompatibilitet og mappes til
// riktig R2-kategori. Nye callsites bør sende `kategori` direkte.
export default function BildeBytterKnapp({
  onBildeUrl,
  label = 'Bytt bilde',
  bucket,
  kategori,
  style,
}: {
  onBildeUrl: (url: string) => void
  label?: string
  /** Eldre prop. Bruk `kategori` i nye callsites. */
  bucket?: 'arrangement-bilder' | 'melding-bilder'
  /** R2-kategori. Default: 'arrangementer' (eller utledet fra bucket). */
  kategori?: BildeKategori
  style?: React.CSSProperties
}) {
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const valgtKategori: BildeKategori =
    kategori ?? (bucket === 'melding-bilder' ? 'meldinger' : 'arrangementer')

  async function handleFil(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return
    setFeil('')
    setLaster(true)

    try {
      const komprimert = await komprimer(fil)
      const filnavn = genererFilnavn(komprimert)

      const fd = new FormData()
      fd.append('fil', komprimert)
      fd.append('filnavn', filnavn)
      fd.append('kategori', valgtKategori)

      const { url } = await lastOppBilde(fd)
      onBildeUrl(url)
    } catch (err) {
      setFeil(err instanceof Error ? err.message : 'Opplasting feilet')
    } finally {
      setLaster(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={laster}
        style={{
          background: 'rgba(10,10,12,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--text-primary)',
          border: '0.5px solid var(--border)',
          padding: '7px 14px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          cursor: laster ? 'wait' : 'pointer',
          opacity: laster ? 0.7 : 1,
          ...style,
        }}
      >
        {laster ? 'Laster opp…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFil}
      />
      {feil && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--danger, #d97a6c)',
            marginTop: 6,
            fontFamily: 'var(--font-body)',
          }}
        >
          {feil}
        </p>
      )}
    </>
  )
}
