'use client'

import { useEffect } from 'react'

// Enkel fullskjerm-visning av et bilde. Klikk hvor som helst eller Escape
// lukker visningen.
export default function BildeLightbox({
  src,
  onLukk,
}: {
  src: string
  onLukk: () => void
}) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onLukk()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onLukk])

  return (
    <div
      onClick={onLukk}
      role="dialog"
      aria-label="Bilde i full skjerm"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          objectFit: 'contain',
          borderRadius: 4,
        }}
      />
    </div>
  )
}
