'use client'

import { useState } from 'react'
import Image from 'next/image'
import BildeLightbox from '@/components/ui/BildeLightbox'

export type AlbumBildeDetalj = {
  id: string
  bilde_url: string
  thumb_url: string | null
  bredde: number | null
  hoyde: number | null
}

// Grid med 3 kolonner. Klikk på en thumb åpner lightbox med fullt bilde.
// Per-bilde-kommentarer kommer i fase 2 — derfor ingen interaksjon utover
// vis-i-fullskjerm her.
export default function AlbumDetalj({ bilder }: { bilder: AlbumBildeDetalj[] }) {
  const [aktiv, setAktiv] = useState<string | null>(null)

  if (bilder.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 'var(--radius-card)',
          border: '0.5px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: 13,
        }}
      >
        Ingen bilder i albumet ennå.
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
        }}
      >
        {bilder.map(b => (
          <button
            key={b.id}
            type="button"
            onClick={() => setAktiv(b.bilde_url)}
            style={{
              position: 'relative',
              aspectRatio: '1 / 1',
              border: 'none',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 6,
              cursor: 'zoom-in',
              background: 'var(--bg-elevated)',
            }}
          >
            <Image
              src={b.thumb_url ?? b.bilde_url}
              alt=""
              fill
              sizes="(max-width: 480px) 33vw, 160px"
              style={{ objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>

      {aktiv && <BildeLightbox src={aktiv} onLukk={() => setAktiv(null)} />}
    </>
  )
}
