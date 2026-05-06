'use client'

import { useEffect, useState, useRef } from 'react'
import Icon from '@/components/ui/Icon'

// Fullskjerm-galleri for album. Pil-knapper, swipe, tastatur og X for å lukke.
// Krysser mellom bilder uten å unmounte hele overlayet — det gir en stabil
// følelse selv om bildene tar tid å laste.
//
// Touch-håndtering: vi måler horisontalt drag og bytter bilde hvis terskelen
// er passert. Vertikal scroll fanges ikke (bildet fyller skjermen).
export default function AlbumLightbox({
  bilder,
  startIndex,
  onLukk,
}: {
  bilder: { id: string; bilde_url: string }[]
  startIndex: number
  onLukk: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef(0)

  function neste() {
    setIndex(i => (i + 1) % bilder.length)
  }
  function forrige() {
    setIndex(i => (i - 1 + bilder.length) % bilder.length)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onLukk()
      else if (e.key === 'ArrowRight') neste()
      else if (e.key === 'ArrowLeft') forrige()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bilder.length])

  function onTouchStart(e: React.TouchEvent) {
    dragStartX.current = e.touches[0].clientX
    dragDeltaX.current = 0
  }
  function onTouchMove(e: React.TouchEvent) {
    if (dragStartX.current === null) return
    dragDeltaX.current = e.touches[0].clientX - dragStartX.current
  }
  function onTouchEnd() {
    const TERSKEL = 50
    if (Math.abs(dragDeltaX.current) > TERSKEL) {
      if (dragDeltaX.current < 0) neste()
      else forrige()
    }
    dragStartX.current = null
    dragDeltaX.current = 0
  }

  const aktiv = bilder[index]
  if (!aktiv) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bilde i full skjerm"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.94)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Bilde — klikk midt på lukker, klikk på pil-soner navigerer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={aktiv.bilde_url}
        alt=""
        style={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          objectFit: 'contain',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Lukk-knapp */}
      <button
        type="button"
        onClick={onLukk}
        aria-label="Lukk"
        style={{
          position: 'absolute',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 16,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.12)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Icon name="x" size={20} color="currentColor" strokeWidth={2.5} />
      </button>

      {/* Teller */}
      {bilder.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 'max(24px, calc(env(safe-area-inset-top) + 8px))',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '1.4px',
            fontWeight: 600,
          }}
        >
          {index + 1} / {bilder.length}
        </div>
      )}

      {/* Pil-knapper (synlig på desktop, swipe brukes på mobil) */}
      {bilder.length > 1 && (
        <>
          <button
            type="button"
            onClick={forrige}
            aria-label="Forrige bilde"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ display: 'flex', transform: 'rotate(180deg)' }}>
              <Icon name="chevron" size={22} color="currentColor" strokeWidth={2.5} />
            </span>
          </button>
          <button
            type="button"
            onClick={neste}
            aria-label="Neste bilde"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Icon name="chevron" size={22} color="currentColor" strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  )
}
